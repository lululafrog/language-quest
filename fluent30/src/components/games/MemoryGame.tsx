"use client";
import { useMemo, useRef, useState } from "react";
import { Badge, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { reportAnswer, type MissedItem } from "@/lib/games/engine";
import type { PoolItem } from "@/lib/pool";
import { speak } from "@/lib/speech";
import { shuffle } from "@/lib/text";
import { GameHeader, type FinishPayload } from "./common";
import { firstFr } from "./PairsGame";

type Tile = { id: string; pair: string; text: string; lang: "en" | "fr" };

export function MemoryGame({ gameId, items, onFinish }: { gameId: string; items: { key: string; en: string; fr: string; cardId?: string }[]; onFinish: (p: FinishPayload) => void }) {
  const t = useT();
  const tiles = useMemo<Tile[]>(() => shuffle(items.flatMap((i) => [{ id: `${i.key}:en`, pair: i.key, text: i.en, lang: "en" as const }, { id: `${i.key}:fr`, pair: i.key, text: firstFr(i.fr), lang: "fr" as const }])), [items]);
  const [open, setOpen] = useState<string[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const seen = useRef<Map<string, number>>(new Map()); // pair -> times both tiles were seen without matching
  const missed = useRef<Map<string, MissedItem>>(new Map());

  function flip(id: string) {
    if (open.length >= 2 || open.includes(id)) return;
    const tl = tiles.find((x) => x.id === id)!;
    if (found.has(tl.pair)) return;
    if (tl.lang === "en") speak(tl.text);
    const nextOpen = [...open, id];
    setOpen(nextOpen);
    if (nextOpen.length < 2) return;
    const [a, b] = nextOpen.map((x) => tiles.find((y) => y.id === x)!);
    const nMoves = moves + 1;
    setMoves(nMoves);
    if (a.pair === b.pair) {
      const f = new Set(found).add(a.pair);
      setFound(f);
      const it = items.find((i) => i.key === a.pair)!;
      setTimeout(() => speak(it.en), 300);
      // the memory game also tests where cards are: a pair found late counts as "with difficulty", never as a miss
      void reportAnswer({ correct: true, approximate: missed.current.has(a.pair), cardId: it.cardId, word: "weakness" in it ? (it as PoolItem) : undefined, gameId });
      setOpen([]);
      if (f.size === items.length)
        setTimeout(
          () =>
            onFinish({
              score: items.length - missed.current.size,
              total: items.length,
              missed: [...missed.current.values()],
              extra: t(`${nMoves} coups (minimum possible : ${items.length}).`, `${nMoves} moves (minimum: ${items.length}).`),
            }),
          600,
        );
    } else {
      // A pair counts as "missed" when its halves were seen several times without being matched.
      for (const x of [a, b]) {
        const n = (seen.current.get(x.pair) ?? 0) + 1;
        seen.current.set(x.pair, n);
        if (n >= 3 && !missed.current.has(x.pair)) {
          const it = items.find((i) => i.key === x.pair)!;
          missed.current.set(x.pair, { en: it.en, fr: it.fr, cardId: it.cardId });
        }
      }
      setTimeout(() => setOpen([]), 900);
    }
  }

  const cols = tiles.length > 12 ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3 sm:grid-cols-4";
  return (
    <div>
      <GameHeader gameId={gameId} progress={found.size / Math.max(1, items.length)} right={<Badge tone="gray">{moves} {t("coups", "moves")}</Badge>} />
      <p className="mb-3 text-sm text-muted">{t("Retourne deux cartes : un mot anglais et sa traduction forment une paire.", "Flip two cards: an English word and its translation make a pair.")}</p>
      <div className={cx("grid gap-2.5", cols)}>
        {tiles.map((tl) => {
          const isOpen = open.includes(tl.id) || found.has(tl.pair);
          return (
            <button
              key={tl.id}
              className="flip aspect-[3/4] w-full"
              onClick={() => flip(tl.id)}
              aria-label={isOpen ? tl.text : t("Carte cachée", "Hidden card")}
            >
              <div className={cx("flip-inner relative h-full w-full", isOpen && "flipped")}>
                <div className="flip-face absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-ink-500 to-ink-700 text-2xl text-white/80 shadow-sm">✦</div>
                <div className={cx("flip-face flip-back absolute inset-0 flex items-center justify-center rounded-xl border p-1.5 text-center text-sm font-semibold", found.has(tl.pair) ? "border-mint-400 bg-mint-100 text-mint-600 dark:bg-mint-600/20 dark:text-mint-400" : tl.lang === "en" ? "border-ink-300 bg-surface" : "border-coral-400 bg-surface")}>
                  <span className="break-words">{tl.text}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
