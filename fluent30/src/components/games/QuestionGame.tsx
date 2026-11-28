"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, EmptyState, LinkButton, Panel, SpeakButton, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { reportAnswer, type MissedItem } from "@/lib/games/engine";
import type { Question } from "@/lib/games/builders";
import { speak } from "@/lib/speech";
import { checkAnswer, normalize, shuffle } from "@/lib/text";
import { ChoiceButton, GameHeader, Notice, compareSentence, type FinishPayload } from "./common";
import { WhyBox } from "./WhyBox";
import { WordFeedback, whyWrong } from "./WordFeedback";

type Verdict = "exact" | "close" | "wrong";

/** Insert a second chance for a missed word a few questions later (not counted in the score). */
function withRetry(list: Question[], idx: number, q: Question): Question[] {
  if (q.retry || !q.word || list.some((x) => x.retry && x.id === `${q.id}:again`)) return list;
  const again: Question = { ...q, id: `${q.id}:again`, retry: true, choices: q.choices ? shuffle(q.choices) : undefined };
  const at = Math.min(list.length, idx + 4);
  return [...list.slice(0, at), again, ...list.slice(at)];
}

export function QuestionGame({ gameId, questions: initial, notice, timeLimit, onFinish }: { gameId: string; questions: Question[]; notice?: string; timeLimit?: number; onFinish: (p: FinishPayload) => void }) {
  const t = useT();
  const [questions, setQuestions] = useState(initial);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [given, setGiven] = useState("");
  const [hintsShown, setHintsShown] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const missed = useRef<MissedItem[]>([]);
  const [left, setLeft] = useState(timeLimit ?? 0);
  const done = useRef(false);
  const shownAt = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const q = questions[idx];
  const firstTry = questions.filter((x) => !x.retry).length;

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
    shownAt.current = Date.now();
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
    const ms = Date.now() - shownAt.current;
    setVerdict(v);
    setGiven(answer);
    let newScore = score;
    if (!q.retry) {
      newScore = score + (ok ? 1 : 0);
      if (ok) setScore(newScore);
      else {
        setWrong((w) => w + 1);
        missed.current.push(q.missed);
      }
      scoreRef.current = { score: newScore, answered: scoreRef.current.answered + 1 };
    }
    setStreak((s) => (ok && v === "exact" && !hintsShown ? s + 1 : 0));
    void reportAnswer({
      correct: ok, cardId: q.cardId, skill: q.skill, mistake: q.mistake,
      word: q.word, gameId, approximate: v === "close", hint: hintsShown > 0, ms, typed: q.kind === "type", retry: q.retry,
    });
    // a missed (or helped) word comes back later in the same game
    if (!timeLimit && q.word && (!ok || v === "close" || hintsShown > 0)) setQuestions((list) => withRetry(list, idx, q));
    if (q.answerLang === "en" && ok) speak(q.accepted[0]);
    if (timeLimit) setTimeout(() => next(newScore), ok ? 550 : 1300);
  }

  function next(currentScore = score) {
    if (idx + 1 >= questions.length) return end(currentScore, scoreRef.current.answered);
    setIdx((i) => i + 1);
    setPicked(null);
    setTyped("");
    setGiven("");
    setVerdict(null);
    setHintsShown(0);
  }

  const answered = idx + (verdict ? 1 : 0);
  const reason =
    verdict && verdict !== "exact" && q.word
      ? verdict === "close"
        ? `Presque : on écrit « ${q.accepted[0]} ».`
        : whyWrong({ word: q.word, given, answerLang: q.answerLang, meaningOfGiven: q.kind === "choice" ? q.meanings?.[given] : undefined, correct: q.display })
      : undefined;
  const cheer = streak >= 5 ? t("🔥 5 d'affilée !", "🔥 5 in a row!") : streak >= 3 ? t("🔥 3 d'affilée", "🔥 3 in a row") : null;

  return (
    <div>
      <GameHeader
        gameId={gameId}
        progress={timeLimit ? left / timeLimit : Math.min(1, answered / questions.length)}
        right={
          <div className="flex items-center gap-2">
            {timeLimit ? <Badge tone={left <= 10 ? "coral" : "ink"}>⏱ {left}s</Badge> : <span className="text-sm text-muted tabular-nums">{Math.min(idx + 1, questions.length)}/{questions.length}</span>}
            <Badge tone="mint">✓ {score}</Badge>
            {wrong > 0 && <Badge tone="coral">✗ {wrong}</Badge>}
          </div>
        }
      />
      {notice && idx === 0 && <Notice>{notice}</Notice>}

      <Panel key={q.id + idx} className="animate-slide-up">
        <div className="flex items-center justify-between gap-2">
          {q.prompt.label && <p className="text-sm font-medium text-muted">{q.prompt.label}</p>}
          {q.retry && <Badge tone="sun">🔁 {t("Deuxième chance", "Second chance")}</Badge>}
        </div>
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

        {q.hints && hintsShown > 0 && (
          <ul className="mt-3 space-y-1">
            {q.hints.slice(0, hintsShown).map((h) => (
              <li key={h} className="animate-fade rounded-lg bg-surface-2 px-3 py-1.5 text-sm">{h}</li>
            ))}
          </ul>
        )}

        <div className="mt-5">
          {q.kind === "choice" ? (
            <div className={cx("grid gap-2", q.choices!.length === 2 ? "grid-cols-2" : "sm:grid-cols-2")}>
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
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" className="flex-1" disabled={!typed.trim()}>
                    {t("Vérifier", "Check")}
                  </Button>
                  {q.hints && hintsShown < q.hints.length && (
                    <Button type="button" variant="secondary" onClick={() => setHintsShown((h) => h + 1)}>
                      💡 {t("Indice", "Hint")}
                    </Button>
                  )}
                  <Button type="button" variant="ghost" onClick={() => submit("")}>
                    {t("Je ne sais pas", "I don't know")}
                  </Button>
                </div>
              )}
            </form>
          )}
        </div>

        {verdict && q.word && !timeLimit && (
          <div className="mt-4">
            {cheer && verdict === "exact" && <p className="mb-2 animate-pop text-center text-sm font-semibold text-coral-600">{cheer}</p>}
            <WordFeedback item={q.word} verdict={verdict} reason={reason} />
            {verdict === "exact" && hintsShown > 0 && <p className="mt-1 text-xs text-muted">{t("Trouvé avec un indice : il reviendra bientôt.", "Found with a hint: it will come back soon.")}</p>}
          </div>
        )}
        {verdict && (!q.word || timeLimit) && (
          <div className={cx("mt-4 animate-fade rounded-xl p-3 text-sm", verdict === "wrong" ? "bg-coral-100/70 dark:bg-coral-600/15" : verdict === "close" ? "bg-sun-100/70 dark:bg-sun-500/15" : "bg-mint-100/70 dark:bg-mint-600/15")}>
            <p className="font-semibold">
              {verdict === "exact" ? t("✓ Correct !", "✓ Correct!") : verdict === "close" ? t("≈ Presque ! Attention à l'orthographe.", "≈ Almost! Watch the spelling.") : t("✗ La bonne réponse :", "✗ The right answer:")}
            </p>
            {verdict !== "exact" && <p className="mt-1 text-base font-medium">{q.display}</p>}
            {verdict === "exact" && q.display !== q.accepted[0] && <p className="mt-1 text-muted">{q.display}</p>}
            {verdict === "exact" ? q.explanation && <p className="mt-1 text-muted">{q.explanation}</p> : <WhyBox item={q} />}
          </div>
        )}
        {verdict && !timeLimit && (
          <Button className="mt-4 w-full" onClick={() => next()} autoFocus>
            {idx + 1 >= questions.length ? t("Voir le résultat", "See results") : t("Continuer", "Continue")}
          </Button>
        )}
      </Panel>
      {!timeLimit && firstTry !== questions.length && <p className="mt-2 text-center text-xs text-muted">{t("Les mots ratés reviennent une deuxième fois dans la partie.", "Missed words come back once more in the game.")}</p>}
    </div>
  );
}
