"use client";
// Atomic pronunciation questions + a runner that sequences them.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getPrefs, listenOnce, recognitionErrorFr, recognitionSupported, speak, stopSpeaking } from "@/lib/speech";
import { normalize, speechSimilarity } from "@/lib/text";
import { useT } from "@/hooks/useT";
import { Button, ProgressBar, SpeakButton, cx } from "@/components/ui";
import type { PronPair, SortItem, TapItem } from "@/lib/data/pronunciation";

export type Answer = boolean | null; // null = not scored (e.g. self-assessment)

function ListenBig({ text, rate, label }: { text: string; rate?: number; label: string }) {
  return (
    <button
      type="button"
      onClick={() => speak(text, { rate })}
      className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-ink-600 text-white shadow-lg shadow-ink-600/30 transition active:scale-95"
      aria-label={label}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5L6 9H2v6h4l5 4V5z" /></svg>
    </button>
  );
}

/** Minimal-pair discrimination: hear one word, choose which one. */
export function PairQuestion({ pair, target, flip, onAnswer }: { pair: PronPair; target: "a" | "b"; flip?: boolean; onAnswer: (ok: boolean) => void }) {
  const t = useT();
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const word = target === "a" ? pair.a : pair.b;
  const order = flip ? (["b", "a"] as const) : (["a", "b"] as const);
  useEffect(() => {
    const id = setTimeout(() => speak(word, { rate: 0.85 }), 250);
    return () => clearTimeout(id);
  }, [word]);
  return (
    <div className="text-center">
      <p className="mb-4 text-sm text-muted">{t("Qu'avez-vous entendu ?", "What did you hear?")}</p>
      <ListenBig text={word} rate={0.85} label={t("Réécouter", "Replay")} />
      <button onClick={() => speak(word, { rate: 0.6 })} className="mt-2 text-sm text-ink-600 underline dark:text-ink-300">{t("Plus lentement", "Slower")}</button>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {order.map((k) => {
          const w = k === "a" ? pair.a : pair.b;
          const ipa = k === "a" ? pair.ipaA : pair.ipaB;
          const fr = k === "a" ? pair.frA : pair.frB;
          const correct = k === target;
          return (
            <button
              key={k}
              disabled={!!picked}
              onClick={() => {
                setPicked(k);
                onAnswer(correct);
              }}
              className={cx(
                "rounded-2xl border p-4 transition",
                !picked ? "border-line bg-surface hover:border-ink-300" : correct ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : k === picked ? "animate-shake border-coral-500 bg-coral-100 dark:bg-coral-600/20" : "border-line opacity-60",
              )}
            >
              <span className="block text-xl font-semibold">{w}</span>
              {picked && <span className="mt-1 block font-mono text-xs text-muted">{ipa}</span>}
              {picked && fr && <span className="block text-xs text-muted">{fr}</span>}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="mt-3 flex justify-center gap-2">
          <SpeakButton text={pair.a} label={pair.a} size={15} />
          <SpeakButton text={pair.b} label={pair.b} size={15} />
        </div>
      )}
    </div>
  );
}

/** Tap the stressed syllable / silent letter / main stressed word. */
export function TapQuestion({ item, prompt, onAnswer, letters }: { item: TapItem; prompt: string; onAnswer: (ok: boolean) => void; letters?: boolean }) {
  const t = useT();
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="text-center">
      <p className="mb-2 text-sm text-muted">{prompt}</p>
      {item.fr && <p className="mb-1 text-sm text-muted">{item.fr}</p>}
      <div className={cx("my-4 flex flex-wrap items-center justify-center", letters ? "gap-1" : "gap-1.5")}>
        {item.parts.map((p, i) => {
          const correct = i === item.answer;
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                onAnswer(correct);
                speak(item.word, { rate: 0.8 });
              }}
              className={cx(
                "rounded-xl border px-3 py-3 text-xl font-semibold transition",
                letters && "min-w-11",
                picked === null ? "border-line bg-surface hover:border-ink-300" : correct ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : i === picked ? "animate-shake border-coral-500 bg-coral-100 dark:bg-coral-600/20" : "border-line opacity-60",
                picked !== null && correct && !letters && "uppercase",
              )}
            >
              {p}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className="text-sm text-muted">
          {item.ipa && <span className="font-mono">{item.ipa} · </span>}
          <SpeakButton text={item.word} label={t("Réécouter", "Replay")} size={15} />
        </p>
      )}
    </div>
  );
}

/** Sort an item into a category (-ed / -s endings, intonation). */
export function SortQuestion({ item, categories, prompt, onAnswer }: { item: SortItem; categories: { id: string; label: string; ipa?: string }[]; prompt: string; onAnswer: (ok: boolean) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="text-center">
      <p className="mb-3 text-sm text-muted">{prompt}</p>
      <div className="flex items-center justify-center gap-2">
        <p className="text-2xl font-semibold">{item.text}</p>
        <SpeakButton text={item.text} />
      </div>
      {picked && item.ipa && <p className="mt-1 font-mono text-sm text-muted">{item.ipa}</p>}
      <div className={cx("mt-5 grid gap-2", categories.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {categories.map((c) => {
          const correct = c.id === item.cat;
          return (
            <button
              key={c.id}
              disabled={!!picked}
              onClick={() => {
                setPicked(c.id);
                onAnswer(correct);
              }}
              className={cx(
                "rounded-2xl border px-2 py-3 transition",
                !picked ? "border-line bg-surface hover:border-ink-300" : correct ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : c.id === picked ? "animate-shake border-coral-500 bg-coral-100 dark:bg-coral-600/20" : "border-line opacity-60",
              )}
            >
              <span className="block text-lg font-semibold">{c.label}</span>
              {c.ipa && <span className="block text-xs text-muted">{c.ipa}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Say a word or sentence; the browser's speech recognition gives indicative feedback. */
export function SpeakQuestion({ text, ipa, rival, onAnswer }: { text: string; ipa?: string; rival?: string; onAnswer: (ok: Answer) => void }) {
  const t = useT();
  const [supported] = useState(() => recognitionSupported());
  const [state, setState] = useState<"idle" | "listening" | "done">("idle");
  const [heard, setHeard] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ ok: boolean; words: { word: string; ok: boolean }[]; heardRival: boolean } | null>(null);
  const stopRef = useRef<() => void>(() => {});
  const isWord = !/\s/.test(text.trim());

  const start = async () => {
    stopSpeaking();
    setError("");
    setInterim("");
    setState("listening");
    const lang = getPrefs().accent?.startsWith("en") ? getPrefs().accent : "en-GB";
    const { promise, stop } = listenOnce(lang, setInterim);
    stopRef.current = stop;
    try {
      const r = await promise;
      const alts = r.alternatives.map((a) => normalize(a));
      const target = normalize(text);
      let ok: boolean;
      let heardRival = false;
      let words: { word: string; ok: boolean }[];
      if (isWord) {
        const found = alts.some((a) => a.split(" ").includes(target));
        heardRival = !!rival && normalize(alts[0] ?? "").split(" ").includes(normalize(rival));
        ok = found && !heardRival;
        words = [{ word: text, ok }];
      } else {
        const best = r.alternatives.map((a) => speechSimilarity(a, text)).sort((x, y) => y.score - x.score)[0];
        ok = best.score >= 0.8;
        words = best.words;
      }
      setHeard(r.transcript);
      setResult({ ok, words, heardRival });
      setState("done");
      onAnswer(ok);
    } catch (e) {
      setError(recognitionErrorFr(e));
      setState("idle");
    }
  };

  return (
    <div className="text-center">
      <p className="mb-2 text-sm text-muted">{isWord ? t("Prononcez ce mot", "Say this word") : t("Lisez cette phrase à voix haute", "Read this sentence aloud")}</p>
      <div className="flex items-center justify-center gap-2">
        <p className={cx("font-semibold", isWord ? "text-3xl" : "text-xl")}>
          {result && !isWord ? result.words.map((w, i) => <span key={i} className={cx("mr-1.5", w.ok ? "text-mint-600" : "text-coral-600 underline decoration-wavy")}>{w.word}</span>) : text}
        </p>
        <SpeakButton text={text} />
      </div>
      {ipa && <p className="mt-1 font-mono text-sm text-muted">{ipa}</p>}

      {supported ? (
        <div className="mt-5">
          {state !== "listening" ? (
            <Button size="lg" onClick={start} disabled={state === "done"} className="min-w-44">🎙️ {t("Parler", "Speak")}</Button>
          ) : (
            <Button size="lg" variant="danger" onClick={() => stopRef.current()} className="min-w-44 animate-pulse">⏹ {t("J'ai fini", "Done")}</Button>
          )}
          {state === "listening" && interim && <p className="mt-2 text-sm italic text-muted">{interim}</p>}
          {error && <p className="mt-2 text-sm text-coral-600">{error}</p>}
          {result && (
            <div className={cx("mt-4 rounded-xl p-3 text-sm", result.ok ? "bg-mint-100 text-mint-600 dark:bg-mint-600/15" : "bg-coral-100 text-coral-600 dark:bg-coral-600/15")}>
              <p className="font-medium">{result.ok ? t("✓ Bien reconnu !", "✓ Recognised!") : result.heardRival ? t(`J'ai plutôt entendu « ${rival} ». Réessayez en exagérant la différence.`, `I heard “${rival}”.`) : t("Pas tout à fait reconnu.", "Not quite recognised.")}</p>
              <p className="mt-1 text-xs opacity-80">{t("Entendu :", "Heard:")} « {heard || "—"} »</p>
            </div>
          )}
          <p className="mt-3 text-xs text-muted">{t("Retour indicatif : la reconnaissance vocale du navigateur n'est pas un phonéticien.", "Indicative feedback only.")}</p>
        </div>
      ) : (
        <div className="mt-5 rounded-xl bg-surface-2 p-3 text-sm">
          <p className="text-muted">{t("La reconnaissance vocale n'est pas disponible dans ce navigateur (essayez Chrome ou Safari). Écoutez le modèle, répétez à voix haute, puis évaluez-vous honnêtement :", "Speech recognition unavailable. Listen, repeat aloud and rate yourself:")}</p>
          {state !== "done" ? (
            <div className="mt-3 flex justify-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { setState("done"); onAnswer(null); }}>{t("À retravailler", "Needs work")}</Button>
              <Button size="sm" onClick={() => { setState("done"); onAnswer(null); }}>{t("J'y arrive", "I can do it")}</Button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">{t("Auto-évaluation notée (non comptée dans le score).", "Self-assessment (not scored).")}</p>
          )}
        </div>
      )}
    </div>
  );
}

export interface RunnerItem {
  key: string;
  lesson?: string;
  render: (onAnswer: (a: Answer) => void) => ReactNode;
}

/** Sequences questions, collects answers and shows a "Next" button after each one. */
export function Runner({ items, onFinish }: { items: RunnerItem[]; onFinish: (answers: { key: string; lesson?: string; answer: Answer }[]) => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<{ key: string; lesson?: string; answer: Answer }[]>([]);
  const [answered, setAnswered] = useState(false);
  const item = items[i];
  if (!item) return null;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span>{i + 1} / {items.length}</span>
      </div>
      <ProgressBar value={i} max={items.length} className="mb-4" />
      <div key={item.key} className="animate-pop rounded-2xl border border-line bg-surface p-5">
        {item.render((a) => {
          if (answered) return;
          setAnswered(true);
          setAnswers((xs) => [...xs, { key: item.key, lesson: item.lesson, answer: a }]);
        })}
      </div>
      {answered && (
        <Button
          className="mt-4 w-full"
          size="lg"
          onClick={() => {
            stopSpeaking();
            setAnswered(false);
            if (i + 1 >= items.length) onFinish(answers);
            else setI(i + 1);
          }}
        >
          {i + 1 >= items.length ? t("Voir le résultat", "See results") : t("Suivant", "Next")}
        </Button>
      )}
    </div>
  );
}
