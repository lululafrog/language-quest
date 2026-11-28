"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Panel, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { elapsedSince, reportAnswer, type MissedItem } from "@/lib/games/engine";
import type { PoolItem } from "@/lib/pool";
import { speak } from "@/lib/speech";
import { shuffle } from "@/lib/text";
import { GameHeader, type FinishPayload } from "./common";
import { WordFeedback } from "./WordFeedback";
import { firstFr } from "./PairsGame";

function scramble(word: string): string[] {
  const letters = [...word];
  if (letters.length < 2) return letters;
  for (let k = 0; k < 10; k++) {
    const s = shuffle(letters);
    if (s.join("") !== word) return s;
  }
  return letters.reverse();
}

export function ScrambleGame({ gameId, words, onFinish }: { gameId: string; words: PoolItem[]; onFinish: (p: FinishPayload) => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const w = words[i];
  const target = w?.en.toLowerCase() ?? "";
  const tiles = useMemo(() => scramble(target).map((c, k) => ({ c, k })), [target]);
  const [picked, setPicked] = useState<number[]>([]);
  const [hints, setHints] = useState(0);
  const [state, setState] = useState<"play" | "ok" | "fail">("play");
  const [score, setScore] = useState(0);
  const missed = useRef<MissedItem[]>([]);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, [i]);
  const built = picked.map((k) => tiles[k].c).join("");

  function place(next: number[], hintsUsed: number) {
    setPicked(next);
    const b = next.map((k) => tiles[k].c).join("");
    if (b.length !== target.length || b !== target) return;
    setState("ok");
    speak(w.en);
    // Using hints gives half credit; more than one hint counts as a miss for the SRS.
    const credit = hintsUsed === 0 ? 1 : hintsUsed === 1 ? 0.5 : 0;
    setScore((s) => s + credit);
    if (credit < 1) missed.current.push({ en: w.en, fr: w.fr, cardId: w.cardId });
    void reportAnswer({ correct: true, hint: hintsUsed > 0, cardId: w.cardId, skill: "production", word: w, gameId, ms: elapsedSince(startedAt.current), typed: true });
  }

  function hint() {
    // Put the correct next letter in place.
    const pos = [...built].findIndex((c, k) => c !== target[k]);
    const keep = pos === -1 ? picked : picked.slice(0, pos);
    const used = new Set(keep);
    const need = target[keep.length];
    const k = tiles.find((tl) => !used.has(tl.k) && tl.c === need)?.k;
    if (k === undefined) return;
    setHints(hints + 1);
    place([...keep, k], hints + 1);
  }

  function giveUp() {
    setState("fail");
    missed.current.push({ en: w.en, fr: w.fr, cardId: w.cardId });
    void reportAnswer({ correct: false, cardId: w.cardId, skill: "production", word: w, gameId, mistake: { id: `spelling:${target}`, type: "spelling", label: w.en, detail: w.fr } });
    speak(w.en);
  }

  function next() {
    if (i + 1 >= words.length) return onFinish({ score: Math.round(score), total: words.length, missed: missed.current });
    setI(i + 1);
    setPicked([]);
    setHints(0);
    setState("play");
  }

  if (!w) return null;
  const wrongFull = built.length === target.length && built !== target;
  return (
    <div>
      <GameHeader gameId={gameId} progress={(i + (state !== "play" ? 1 : 0)) / words.length} right={<span className="text-sm text-muted">{i + 1}/{words.length}</span>} />
      <Panel className="text-center">
        <p className="text-sm text-muted">{t("Remets les lettres dans l'ordre", "Unscramble the letters")}</p>
        <p className="mt-1 text-lg font-semibold">{firstFr(w.fr)}</p>
        <div className={cx("my-5 flex min-h-12 flex-wrap justify-center gap-1.5", wrongFull && "animate-shake")}>
          {[...target].map((_, k) => {
            const tk = picked[k];
            return (
              <button
                key={k}
                onClick={() => state === "play" && tk !== undefined && setPicked(picked.slice(0, k))}
                className={cx("flex h-12 w-10 items-center justify-center rounded-lg border-2 text-xl font-semibold uppercase", tk === undefined ? "border-dashed border-line" : state === "ok" ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : wrongFull ? "border-coral-400" : "border-ink-400 bg-ink-50 dark:bg-ink-900/40")}
              >
                {state === "fail" ? target[k] : tk !== undefined ? tiles[tk].c : ""}
              </button>
            );
          })}
        </div>
        {state === "play" ? (
          <>
            <div className="flex flex-wrap justify-center gap-2">
              {tiles.map((tl) => (
                <button key={tl.k} disabled={picked.includes(tl.k)} onClick={() => place([...picked, tl.k], hints)} className="h-12 w-12 rounded-xl bg-surface-2 text-xl font-semibold uppercase shadow-sm transition hover:bg-ink-100 disabled:opacity-20 dark:hover:bg-ink-900">
                  {tl.c}
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPicked([])}>{t("Effacer", "Clear")}</Button>
              <Button variant="secondary" size="sm" onClick={hint}>💡 {t("Indice", "Hint")}</Button>
              <Button variant="ghost" size="sm" onClick={giveUp}>{t("Abandonner", "Give up")}</Button>
            </div>
          </>
        ) : (
          <div className="animate-fade space-y-3">
            <WordFeedback item={w} verdict={state === "fail" ? "wrong" : hints > 0 ? "close" : "exact"} reason={state === "fail" ? t("Retiens son orthographe : il reviendra plus tard.", "Remember the spelling.") : t("Trouvé avec un indice : il reviendra bientôt.", "Found with a hint.")} />
            <Button className="w-full" onClick={next} autoFocus>{i + 1 >= words.length ? t("Voir le résultat", "See results") : t("Suivant", "Next")}</Button>
          </div>
        )}
      </Panel>
    </div>
  );
}
