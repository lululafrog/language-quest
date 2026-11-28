"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, Panel, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { elapsedSince, reportAnswer, type Level, type MissedItem } from "@/lib/games/engine";
import type { PoolItem } from "@/lib/pool";
import { speak } from "@/lib/speech";
import { GameHeader, type FinishPayload } from "./common";
import { WordFeedback } from "./WordFeedback";
import { firstFr } from "./PairsGame";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const LIVES = 7;

export function HangmanGame({ gameId, words, level, onFinish }: { gameId: string; words: PoolItem[]; level: Level; onFinish: (p: FinishPayload) => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(() => new Set(level === 1 ? [words[0]?.en[0]?.toLowerCase() ?? ""] : []));
  const [solved, setSolved] = useState(0);
  const missed = useRef<MissedItem[]>([]);
  const startedAt = useRef(0);
  const w = words[i];
  useEffect(() => {
    startedAt.current = Date.now();
  }, [i]);
  const word = w?.en.toLowerCase() ?? "";
  const errors = [...guessed].filter((g) => g && !word.includes(g)).length;
  const won = !!word && [...word].every((c) => !/[a-z]/.test(c) || guessed.has(c));
  const lost = errors >= LIVES;
  const over = won || lost;

  const guess = useCallback(
    (c: string) => {
      if (over || guessed.has(c) || !w) return;
      const g = new Set(guessed).add(c);
      setGuessed(g);
      const nowWon = [...word].every((ch) => !/[a-z]/.test(ch) || g.has(ch));
      const nowLost = [...g].filter((x) => x && !word.includes(x)).length >= LIVES;
      if (!nowWon && !nowLost) return;
      speak(w.en);
      if (nowWon) setSolved((s) => s + 1);
      else missed.current.push({ en: w.en, fr: w.fr, cardId: w.cardId });
      const errs = [...g].filter((x) => x && !word.includes(x)).length;
      // found with many wrong letters = found with difficulty → the word goes to review
      void reportAnswer({ correct: nowWon, approximate: nowWon && errs > 2, cardId: w.cardId, skill: "production", word: w, gameId, ms: elapsedSince(startedAt.current), typed: true, mistake: { id: `spelling:${word}`, type: "spelling", label: w.en, detail: w.fr } });
    },
    [over, guessed, w, word, gameId],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[a-z]$/i.test(e.key) && !e.metaKey && !e.ctrlKey) guess(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guess]);

  function next() {
    if (i + 1 >= words.length) return onFinish({ score: solved, total: words.length, missed: missed.current });
    const nw = words[i + 1];
    setI(i + 1);
    setGuessed(new Set(level === 1 ? [nw.en[0].toLowerCase()] : []));
  }

  if (!w) return null;
  return (
    <div>
      <GameHeader gameId={gameId} progress={(i + (over ? 1 : 0)) / words.length} right={<span className="text-sm text-muted">{i + 1}/{words.length}</span>} />
      <Panel className="text-center">
        <div className="flex items-center justify-between">
          <Badge tone="gray">{w.pos ?? "word"}</Badge>
          <Badge tone={LIVES - errors <= 2 ? "coral" : "ink"}>❤ {LIVES - errors}</Badge>
        </div>
        <Gallows errors={errors} />
        <p className="text-sm text-muted">{t("Indice", "Hint")} : <span className="font-medium text-fg">{firstFr(w.fr)}</span></p>
        <div className="my-5 flex flex-wrap justify-center gap-1.5" aria-live="polite">
          {[...word].map((c, k) =>
            /[a-z]/.test(c) ? (
              <span key={k} className={cx("flex h-11 w-8 items-end justify-center border-b-2 pb-1 text-2xl font-semibold uppercase", over && !guessed.has(c) ? "border-coral-400 text-coral-500" : "border-fg")}>
                {guessed.has(c) || over ? c : ""}
              </span>
            ) : (
              <span key={k} className="w-3 text-2xl">{c}</span>
            ),
          )}
        </div>
        {over ? (
          <div className="animate-fade space-y-3">
            <WordFeedback item={w} verdict={won ? (errors > 2 ? "close" : "exact") : "wrong"} reason={won ? t(`Trouvé avec ${errors} erreurs : il reviendra bientôt.`, `Found with ${errors} mistakes.`) : t("Plus de vies : retiens son orthographe, il reviendra plus tard.", "Out of lives: it will come back later.")} />
            <Button className="w-full" onClick={next} autoFocus>
              {i + 1 >= words.length ? t("Voir le résultat", "See results") : t("Mot suivant", "Next word")}
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {ROWS.map((r) => (
              <div key={r} className="flex justify-center gap-1">
                {[...r].map((c) => {
                  const used = guessed.has(c);
                  const good = used && word.includes(c);
                  return (
                    <button key={c} onClick={() => guess(c)} disabled={used} className={cx("h-11 w-[9%] max-w-10 rounded-lg text-base font-semibold uppercase transition", !used && "bg-surface-2 hover:bg-ink-100 dark:hover:bg-ink-900", good && "bg-mint-500 text-white", used && !good && "bg-line text-muted opacity-50")}>
                      {c}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Gallows({ errors }: { errors: number }) {
  const parts = [
    <circle key="h" cx="140" cy="62" r="13" />, <line key="b" x1="140" y1="75" x2="140" y2="115" />, <line key="la" x1="140" y1="85" x2="122" y2="100" />,
    <line key="ra" x1="140" y1="85" x2="158" y2="100" />, <line key="ll" x1="140" y1="115" x2="125" y2="138" />, <line key="rl" x1="140" y1="115" x2="155" y2="138" />,
    <line key="r" x1="140" y1="30" x2="140" y2="49" />,
  ];
  return (
    <svg viewBox="0 0 200 160" className="mx-auto my-2 h-36 w-44 stroke-ink-700 dark:stroke-ink-200" fill="none" strokeWidth="4" strokeLinecap="round" aria-hidden>
      <line x1="30" y1="150" x2="110" y2="150" className="stroke-line" />
      <line x1="60" y1="150" x2="60" y2="30" className="stroke-line" />
      <line x1="60" y1="30" x2="140" y2="30" className="stroke-line" />
      {parts.slice(0, errors).map((p) => p)}
    </svg>
  );
}
