"use client";
import { useMemo, useRef, useState } from "react";
import { Button, Panel, SpeakButton, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { reportAnswer, type MissedItem } from "@/lib/games/engine";
import { speak } from "@/lib/speech";
import { shuffle } from "@/lib/text";
import { GameHeader, type FinishPayload } from "./common";

export interface BuildSentence {
  key: string;
  en: string;
  fr: string;
  cardId?: string;
}

function tokens(s: string): { words: string[]; end: string } {
  const m = s.trim().match(/^(.*?)([.?!]*)$/)!;
  return { words: m[1].split(/\s+/).filter(Boolean), end: m[2] };
}
const norm = (w: string) => w.toLowerCase().replace(/[,;:"]/g, "");

export function BuilderGame({ gameId, sentences, onFinish }: { gameId: string; sentences: BuildSentence[]; onFinish: (p: FinishPayload) => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const s = sentences[i];
  const { words, end } = useMemo(() => tokens(s?.en ?? ""), [s]);
  const bank = useMemo(() => {
    const base = words.map((w, k) => ({ w, k }));
    for (let n = 0; n < 8; n++) {
      const sh = shuffle(base);
      if (sh.map((x) => x.w).join(" ") !== words.join(" ")) return sh;
    }
    return [...base].reverse();
  }, [words]);
  const [picked, setPicked] = useState<number[]>([]);
  const [state, setState] = useState<"play" | "ok" | "wrong">("play");
  const [tries, setTries] = useState(0);
  const [score, setScore] = useState(0);
  const missed = useRef<MissedItem[]>([]);

  function check() {
    const built = picked.map((k) => norm(words[k]));
    const ok = built.join(" ") === words.map(norm).join(" ");
    if (ok) {
      setState("ok");
      speak(s.en);
      if (tries === 0) setScore((x) => x + 1);
      else missed.current.push({ en: s.en, fr: s.fr, cardId: s.cardId });
      void reportAnswer({ correct: tries === 0, cardId: s.cardId, skill: "production" });
    } else {
      setTries((x) => x + 1);
      if (tries >= 1) {
        setState("wrong");
        missed.current.push({ en: s.en, fr: s.fr, cardId: s.cardId });
        void reportAnswer({ correct: false, cardId: s.cardId, skill: "production", mistake: { id: "grammar:word-order", type: "grammar", label: "Ordre des mots", detail: s.fr, example: s.en } });
        speak(s.en);
      } else {
        // Keep the correct beginning, drop the rest.
        const okPrefix = picked.findIndex((k, idx) => norm(words[k]) !== norm(words[idx]));
        setPicked(okPrefix === -1 ? picked : picked.slice(0, okPrefix));
      }
    }
  }

  function next() {
    if (i + 1 >= sentences.length) return onFinish({ score, total: sentences.length, missed: missed.current });
    setI(i + 1);
    setPicked([]);
    setTries(0);
    setState("play");
  }

  if (!s) return null;
  return (
    <div>
      <GameHeader gameId={gameId} progress={(i + (state !== "play" ? 1 : 0)) / sentences.length} right={<span className="text-sm text-muted">{i + 1}/{sentences.length}</span>} />
      <Panel>
        <p className="text-sm text-muted">{t("Traduis en remettant les mots dans l'ordre", "Translate by ordering the words")}</p>
        <p className="mt-1 text-lg font-semibold">{s.fr}</p>
        <div className={cx("my-4 flex min-h-[3.5rem] flex-wrap items-center gap-1.5 rounded-xl border-2 border-dashed p-2", state === "ok" ? "border-mint-400" : state === "wrong" ? "border-coral-400" : tries > 0 ? "border-sun-400" : "border-line")}>
          {picked.map((k, idx) => (
            <button key={k} onClick={() => state === "play" && setPicked(picked.filter((_, j) => j !== idx))} className="animate-pop rounded-lg bg-ink-600 px-3 py-1.5 font-medium text-white">
              {words[k]}
            </button>
          ))}
          {picked.length === words.length && end && <span className="text-lg font-semibold">{end}</span>}
        </div>
        {tries === 1 && state === "play" && <p className="mb-2 text-sm text-amber-700 dark:text-sun-400">{t("Pas tout à fait — le début correct a été conservé. Dernier essai !", "Not quite — the correct start was kept. Last try!")}</p>}
        {state === "play" ? (
          <>
            <div className="flex flex-wrap gap-1.5">
              {bank.map(({ w, k }) => (
                <button key={k} disabled={picked.includes(k)} onClick={() => setPicked([...picked, k])} className="rounded-lg border border-line bg-surface px-3 py-1.5 font-medium transition hover:border-ink-300 disabled:opacity-20">
                  {w}
                </button>
              ))}
            </div>
            <Button className="mt-5 w-full" disabled={picked.length !== words.length} onClick={check}>{t("Vérifier", "Check")}</Button>
          </>
        ) : (
          <div className="animate-fade space-y-3">
            <p className={cx("font-semibold", state === "ok" ? "text-mint-600" : "text-coral-600")}>{state === "ok" ? t("✓ Correct !", "✓ Correct!") : t("La bonne phrase :", "The right sentence:")}</p>
            <div className="flex items-center gap-1 text-lg font-medium">
              {s.en} <SpeakButton text={s.en} />
            </div>
            <Button className="w-full" onClick={next} autoFocus>{i + 1 >= sentences.length ? t("Voir le résultat", "See results") : t("Suivant", "Next")}</Button>
          </div>
        )}
      </Panel>
    </div>
  );
}
