"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, EmptyState, LinkButton, Panel, SpeakButton, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { reportAnswer, type MissedItem } from "@/lib/games/engine";
import type { Question } from "@/lib/games/builders";
import { speak } from "@/lib/speech";
import { checkAnswer, normalize } from "@/lib/text";
import { ChoiceButton, GameHeader, Notice, compareSentence, type FinishPayload } from "./common";

type Verdict = "exact" | "close" | "wrong";

export function QuestionGame({ gameId, questions, notice, timeLimit, onFinish }: { gameId: string; questions: Question[]; notice?: string; timeLimit?: number; onFinish: (p: FinishPayload) => void }) {
  const t = useT();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const missed = useRef<MissedItem[]>([]);
  const [left, setLeft] = useState(timeLimit ?? 0);
  const done = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = questions[idx];

  const end = useCallback(
    (finalScore: number, answered: number) => {
      if (done.current) return;
      done.current = true;
      const wrongCount = answered - finalScore;
      onFinish({
        score: finalScore,
        total: Math.max(answered, 1),
        missed: missed.current,
        extra: timeLimit ? t(`Points de précision : ${finalScore * 10 - wrongCount * 5} (bonne réponse +10, erreur −5)`, `Accuracy points: ${finalScore * 10 - wrongCount * 5} (+10 correct, −5 mistake)`) : undefined,
      });
    },
    [onFinish, timeLimit, t],
  );

  // Countdown for the timed quiz.
  const scoreRef = useRef({ score: 0, answered: 0 });
  useEffect(() => {
    if (!timeLimit) return;
    const iv = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(iv);
          end(scoreRef.current.score, scoreRef.current.answered);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [timeLimit, end]);

  useEffect(() => {
    if (q?.prompt.autoSpeak && q.prompt.speak) speak(q.prompt.speak);
    if (q?.kind === "type") setTimeout(() => inputRef.current?.focus(), 50);
  }, [q]);

  if (!q) {
    return (
      <div>
        <GameHeader gameId={gameId} />
        <EmptyState icon="📭" title={t("Pas assez de contenu pour ce jeu", "Not enough content for this game")}>
          {t("Ajoute quelques mots à tes flashcards pour commencer.", "Add a few words to your flashcards to start.")}
          <div className="mt-4">
            <LinkButton href="/learn">{t("Découvrir des mots", "Learn words")}</LinkButton>
          </div>
        </EmptyState>
      </div>
    );
  }

  function judge(answer: string): Verdict {
    if (q.kind === "choice") return q.accepted.some((a) => normalize(a) === normalize(answer)) ? "exact" : "wrong";
    if (q.sentence) {
      const r = q.accepted.map((a) => compareSentence(answer, a));
      return r.includes("exact") ? "exact" : r.includes("close") ? "close" : "wrong";
    }
    return checkAnswer(answer, q.accepted);
  }

  function submit(answer: string) {
    if (verdict || done.current) return;
    const v = judge(answer);
    const ok = v !== "wrong";
    setVerdict(v);
    const newScore = score + (ok ? 1 : 0);
    if (ok) setScore(newScore);
    else {
      setWrong((w) => w + 1);
      missed.current.push(q.missed);
    }
    scoreRef.current = { score: newScore, answered: idx + 1 };
    void reportAnswer({ correct: ok, cardId: q.cardId, skill: q.skill, mistake: q.mistake });
    if (q.answerLang === "en" && ok) speak(q.accepted[0]);
    if (timeLimit) setTimeout(() => next(newScore), ok ? 550 : 1300);
  }

  function next(currentScore = score) {
    if (idx + 1 >= questions.length) return end(currentScore, idx + 1);
    setIdx((i) => i + 1);
    setPicked(null);
    setTyped("");
    setVerdict(null);
  }

  const answered = idx + (verdict ? 1 : 0);

  return (
    <div>
      <GameHeader
        gameId={gameId}
        progress={timeLimit ? left / timeLimit : answered / questions.length}
        right={
          <div className="flex items-center gap-2">
            {timeLimit ? <Badge tone={left <= 10 ? "coral" : "ink"}>⏱ {left}s</Badge> : <span className="text-sm text-muted tabular-nums">{idx + 1}/{questions.length}</span>}
            <Badge tone="mint">✓ {score}</Badge>
            {wrong > 0 && <Badge tone="coral">✗ {wrong}</Badge>}
          </div>
        }
      />
      {notice && idx === 0 && <Notice>{notice}</Notice>}

      <Panel key={q.id + idx} className="animate-slide-up">
        {q.prompt.label && <p className="text-sm font-medium text-muted">{q.prompt.label}</p>}
        {q.prompt.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.prompt.image} alt={t("Illustration à identifier", "Picture to identify")} className="mx-auto my-3 h-44 w-44 rounded-2xl object-cover" />
        )}
        {q.prompt.emoji && <div className="my-3 text-center text-7xl" aria-label={t("Image à identifier", "Picture to identify")}>{q.prompt.emoji}</div>}
        {q.prompt.text && !q.prompt.hideText && (
          <div className="mt-1 flex items-start gap-1">
            <p className="flex-1 text-2xl font-semibold leading-snug">{q.prompt.text}</p>
            {q.prompt.speak && <SpeakButton text={q.prompt.speak} />}
          </div>
        )}
        {q.prompt.hideText && q.prompt.speak && (
          <div className="my-4 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => speak(q.prompt.speak!)}>🔊 {t("Réécouter", "Replay")}</Button>
            <Button variant="outline" onClick={() => speak(q.prompt.speak!, { rate: 0.65 })}>🐢 {t("Lentement", "Slowly")}</Button>
          </div>
        )}
        {q.prompt.sub && <p className="mt-1 text-sm text-muted">{q.prompt.sub}</p>}

        <div className="mt-5">
          {q.kind === "choice" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {q.choices!.map((c) => {
                const isRight = q.accepted.some((a) => normalize(a) === normalize(c));
                const state = verdict ? (isRight ? "correct" : picked === c ? "wrong" : "dim") : undefined;
                return (
                  <ChoiceButton
                    key={c}
                    state={state}
                    disabled={!!verdict}
                    onClick={() => {
                      setPicked(c);
                      submit(c);
                    }}
                  >
                    {c}
                  </ChoiceButton>
                );
              })}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (verdict) next();
                else if (typed.trim()) submit(typed);
              }}
              className="space-y-3"
            >
              <input
                ref={inputRef}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                readOnly={!!verdict}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                lang={q.answerLang ?? "en"}
                placeholder={q.answerLang === "fr" ? t("Ta réponse en français…", "Your answer in French…") : t("Ta réponse en anglais…", "Your answer in English…")}
                className={cx(
                  "h-12 w-full rounded-xl border bg-surface px-4 text-lg outline-none transition focus:border-ink-400",
                  verdict === "exact" && "border-mint-500",
                  verdict === "close" && "border-sun-500",
                  verdict === "wrong" && "animate-shake border-coral-500",
                  !verdict && "border-line",
                )}
              />
              {!verdict && (
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={!typed.trim()}>
                    {t("Vérifier", "Check")}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => submit("")}>
                    {t("Je ne sais pas", "I don't know")}
                  </Button>
                </div>
              )}
            </form>
          )}
        </div>

        {verdict && (
          <div className={cx("mt-4 animate-fade rounded-xl p-3 text-sm", verdict === "wrong" ? "bg-coral-100/70 dark:bg-coral-600/15" : verdict === "close" ? "bg-sun-100/70 dark:bg-sun-500/15" : "bg-mint-100/70 dark:bg-mint-600/15")}>
            <p className="font-semibold">
              {verdict === "exact" ? t("✓ Correct !", "✓ Correct!") : verdict === "close" ? t("≈ Presque ! Attention à l'orthographe.", "≈ Almost! Watch the spelling.") : t("✗ La bonne réponse :", "✗ The right answer:")}
            </p>
            {verdict !== "exact" && <p className="mt-1 text-base font-medium">{q.display}</p>}
            {verdict === "exact" && q.display !== q.accepted[0] && <p className="mt-1 text-muted">{q.display}</p>}
            {q.explanation && <p className="mt-1 text-muted">{q.explanation}</p>}
          </div>
        )}
        {verdict && !timeLimit && (
          <Button className="mt-4 w-full" onClick={() => next()} autoFocus>
            {idx + 1 >= questions.length ? t("Voir le résultat", "See results") : t("Continuer", "Continue")}
          </Button>
        )}
      </Panel>
    </div>
  );
}
