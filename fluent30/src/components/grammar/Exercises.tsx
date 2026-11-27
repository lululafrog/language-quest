"use client";
import { useMemo, useState } from "react";
import type { GrammarExercise } from "@/lib/data/grammar";
import { Button, ProgressBar, SpeakButton, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { shuffle } from "@/lib/text";

/** Strict-but-fair comparison for grammar answers: case, spacing, apostrophes and final punctuation ignored. */
function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[.!?,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function expandContractions(s: string) {
  return s
    .replace(/\bcan't\b/g, "cannot")
    .replace(/\bwon't\b/g, "will not")
    .replace(/n't\b/g, " not")
    .replace(/'re\b/g, " are")
    .replace(/'ve\b/g, " have")
    .replace(/'ll\b/g, " will")
    .replace(/'m\b/g, " am")
    .replace(/\s+/g, " ")
    .trim();
}
export function sameAnswer(input: string, accepted: string[]) {
  const a = norm(input);
  if (!a) return false;
  return accepted.some((x) => {
    const b = norm(x);
    return a === b || expandContractions(a) === expandContractions(b);
  });
}

function tokens(s: string) {
  return s.split(/\s+/).filter(Boolean);
}
function bare(w: string) {
  return w.toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
}

/** Word indexes covered by `wrong` inside `sentence`. */
function wrongSpan(sentence: string, wrong: string): [number, number] {
  const sw = tokens(sentence).map(bare);
  const ww = tokens(wrong).map(bare);
  for (let i = 0; i + ww.length <= sw.length; i++) {
    if (ww.every((w, k) => sw[i + k] === w)) return [i, i + ww.length - 1];
  }
  return [-1, -1];
}

export interface ExerciseOutcome {
  correct: boolean;
}

function Feedback({ ok, explanation, correctText, onNext, last }: { ok: boolean; explanation: string; correctText?: string; onNext: () => void; last: boolean }) {
  const t = useT();
  return (
    <div className={cx("mt-4 animate-slide-up rounded-2xl border p-4", ok ? "border-mint-400/60 bg-mint-100/60 dark:bg-mint-600/10" : "border-coral-400/60 bg-coral-100/60 dark:bg-coral-600/10")}>
      <p className={cx("font-semibold", ok ? "text-mint-600 dark:text-mint-400" : "text-coral-600 dark:text-coral-400")}>{ok ? t("Bonne réponse !", "Correct!") : t("Pas tout à fait", "Not quite")}</p>
      {!ok && correctText && (
        <p className="mt-1 text-[15px]">
          {t("Réponse : ", "Answer: ")}
          <span className="font-semibold">{correctText}</span>
        </p>
      )}
      <p className="mt-1 text-sm text-muted">{explanation}</p>
      <Button className="mt-3 w-full" onClick={onNext} autoFocus>
        {last ? t("Voir le résultat", "See results") : t("Continuer", "Continue")}
      </Button>
    </div>
  );
}

function ExerciseView({ ex, onAnswered, onNext, last }: { ex: GrammarExercise; onAnswered: (ok: boolean) => void; onNext: () => void; last: boolean }) {
  const t = useT();
  const [done, setDone] = useState<null | boolean>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [order, setOrder] = useState<number[]>([]);
  const [tapped, setTapped] = useState<number | null>(null);
  const reorderTokens = useMemo(() => (ex.type === "reorder" ? tokens(ex.answer) : []), [ex]);
  const reorderBank = useMemo(() => {
    if (ex.type !== "reorder") return [];
    let s = shuffle(reorderTokens.map((_, i) => i));
    for (let k = 0; k < 5 && s.every((v, i) => v === i) && s.length > 1; k++) s = shuffle(s);
    return s;
  }, [ex, reorderTokens]);

  const finish = (ok: boolean) => {
    setDone(ok);
    onAnswered(ok);
  };

  let body: React.ReactNode = null;
  let correctText: string | undefined;

  if (ex.type === "mcq" || ex.type === "tense") {
    correctText = ex.answer;
    body = (
      <>
        <p className="text-lg font-medium leading-snug">{ex.type === "mcq" ? ex.prompt : ex.sentence}</p>
        {ex.type === "mcq" && ex.promptFr && <p className="mt-1 text-sm text-muted">{ex.promptFr}</p>}
        {ex.type === "tense" && <p className="mt-1 text-sm text-muted">{t("Quelle forme convient ?", "Which form fits?")}</p>}
        <div className="mt-4 grid gap-2">
          {ex.options.map((o) => {
            const isAns = o === ex.answer;
            const state = done === null ? "" : isAns ? "border-mint-500 bg-mint-100/70 dark:bg-mint-600/15" : picked === o ? "border-coral-500 bg-coral-100/70 dark:bg-coral-600/15" : "opacity-60";
            return (
              <button
                key={o}
                disabled={done !== null}
                onClick={() => {
                  setPicked(o);
                  finish(isAns);
                }}
                className={cx("rounded-xl border border-line bg-surface px-4 py-3 text-left text-[15px] transition hover:border-ink-300", state)}
              >
                {o}
              </button>
            );
          })}
        </div>
      </>
    );
  } else if (ex.type === "fill") {
    correctText = ex.answer[0];
    const [before, after] = ex.sentence.split("___");
    body = (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (done === null && text.trim()) finish(sameAnswer(text, ex.answer));
        }}
      >
        <p className="text-sm text-muted">{t("Complète la phrase", "Fill in the gap")}{ex.hint ? ` — ${ex.hint}` : ""}</p>
        <p className="mt-3 text-lg leading-relaxed">
          {before}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={done !== null}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label={t("Réponse", "Answer")}
            className={cx(
              "mx-1 inline-block w-40 rounded-lg border-b-2 bg-surface-2 px-2 py-0.5 text-center font-medium outline-none focus:border-ink-500",
              done === null ? "border-ink-300" : done ? "border-mint-500 text-mint-600" : "border-coral-500 text-coral-600",
            )}
          />
          {after}
        </p>
        {done === null && (
          <Button type="submit" className="mt-4 w-full" disabled={!text.trim()}>
            {t("Vérifier", "Check")}
          </Button>
        )}
      </form>
    );
  } else if (ex.type === "reorder") {
    correctText = ex.answer;
    const built = order.map((i) => reorderTokens[i]).join(" ");
    body = (
      <>
        <p className="text-sm text-muted">{t("Remets les mots dans l'ordre", "Put the words in order")}</p>
        <p className="mt-1 font-medium">{ex.translationFr}</p>
        <div className={cx("mt-3 flex min-h-14 flex-wrap gap-2 rounded-xl border-2 border-dashed p-2", done === null ? "border-line" : done ? "border-mint-500" : "border-coral-500")}>
          {order.map((i, k) => (
            <button key={`${i}-${k}`} disabled={done !== null} onClick={() => setOrder(order.filter((_, j) => j !== k))} className="animate-pop rounded-lg bg-ink-600 px-3 py-1.5 text-[15px] font-medium text-white">
              {reorderTokens[i]}
            </button>
          ))}
          {!order.length && <span className="self-center px-2 text-sm text-muted">{t("Touche les mots ci-dessous", "Tap the words below")}</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {reorderBank.map((i) =>
            order.includes(i) ? (
              <span key={i} className="rounded-lg border border-transparent bg-surface-2 px-3 py-1.5 text-[15px] text-transparent">{reorderTokens[i]}</span>
            ) : (
              <button key={i} disabled={done !== null} onClick={() => setOrder([...order, i])} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[15px] font-medium hover:border-ink-300">
                {reorderTokens[i]}
              </button>
            ),
          )}
        </div>
        {done === null && (
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setOrder([])} disabled={!order.length}>
              {t("Effacer", "Clear")}
            </Button>
            <Button className="flex-1" disabled={order.length !== reorderTokens.length} onClick={() => finish(norm(built) === norm(ex.answer))}>
              {t("Vérifier", "Check")}
            </Button>
          </div>
        )}
        {done !== null && (
          <div className="mt-2 flex items-center gap-1 text-sm">
            <SpeakButton text={ex.answer} size={16} />
            <span className="text-muted">{ex.answer}</span>
          </div>
        )}
      </>
    );
  } else if (ex.type === "error") {
    const words = tokens(ex.sentence);
    const [a, b] = wrongSpan(ex.sentence, ex.wrong);
    correctText = `${ex.wrong} → ${ex.correct}`;
    body = (
      <>
        <p className="text-sm text-muted">{t("Touche le mot ou groupe de mots incorrect", "Tap the incorrect word(s)")}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-lg">
          {words.map((w, i) => {
            const inSpan = i >= a && i <= b;
            const state = done === null ? "" : inSpan ? "bg-coral-100 text-coral-600 line-through decoration-2 dark:bg-coral-600/20" : tapped === i ? "bg-surface-2" : "";
            return (
              <button
                key={i}
                disabled={done !== null}
                onClick={() => {
                  setTapped(i);
                  finish(inSpan);
                }}
                className={cx("rounded-lg px-1.5 py-0.5 transition hover:bg-ink-50 dark:hover:bg-ink-900/60", state, tapped === i && done === false && !inSpan && "ring-2 ring-coral-400")}
              >
                {w}
              </button>
            );
          })}
        </div>
        {done !== null && (
          <p className="mt-3 text-[15px]">
            ✅ <span className="font-semibold text-mint-600 dark:text-mint-400">{ex.correct}</span>
          </p>
        )}
      </>
    );
  }

  return (
    <div>
      {body}
      {done !== null && <Feedback ok={done} explanation={ex.explanation} correctText={ex.type === "error" ? undefined : correctText} onNext={onNext} last={last} />}
    </div>
  );
}

/** Runs a list of exercises and reports the results. */
export function ExerciseRunner({ exercises, onFinish }: { exercises: GrammarExercise[]; onFinish: (results: boolean[]) => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const ex = exercises[i];
  const last = i === exercises.length - 1;
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={i + (results.length > i ? 1 : 0)} max={exercises.length} />
        <span className="shrink-0 text-xs tabular-nums text-muted">
          {i + 1}/{exercises.length}
        </span>
      </div>
      <div key={i} className="animate-fade rounded-2xl border border-line bg-surface p-5">
        <ExerciseView
          ex={ex}
          last={last}
          onAnswered={(ok) => setResults((r) => [...r.slice(0, i), ok])}
          onNext={() => {
            if (last) onFinish(results);
            else setI(i + 1);
          }}
        />
      </div>
      <p className="mt-3 text-center text-xs text-muted">{t("Prends ton temps : la précision compte plus que la vitesse.", "Take your time: accuracy matters more than speed.")}</p>
    </div>
  );
}
