"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Panel, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { elapsedSince, reportAnswer, type MissedItem } from "@/lib/games/engine";
import { speak } from "@/lib/speech";
import { shuffle, splitAlternatives } from "@/lib/text";
import { GameHeader, Notice, type FinishPayload } from "./common";
import { WordFeedback } from "./WordFeedback";
import type { PoolItem } from "@/lib/pool";

export interface PairItem {
  key: string;
  left: string; // text or image data URL
  leftEmoji?: string;
  leftIsImage?: boolean;
  right: string;
  en: string;
  fr: string;
  cardId?: string;
  word?: PoolItem;
}

export function PairsGame({ gameId, items, notice, onFinish }: { gameId: string; items: PairItem[]; notice?: string; onFinish: (p: FinishPayload) => void }) {
  const t = useT();
  const left = useMemo(() => shuffle(items), [items]);
  const right = useMemo(() => shuffle(items), [items]);
  const [selL, setSelL] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [bad, setBad] = useState<{ l: string; r: string } | null>(null);
  const missed = useRef<Map<string, MissedItem>>(new Map());
  const since = useRef(0);
  const [last, setLast] = useState<{ it: PairItem; ok: boolean; other?: PairItem } | null>(null);
  useEffect(() => {
    since.current = Date.now();
  }, []);

  function pickRight(key: string) {
    if (bad || !selL) return;
    const it = items.find((i) => i.key === selL)!;
    if (selL === key) {
      const m = new Set(matched).add(selL);
      setMatched(m);
      speak(it.en);
      if (!missed.current.has(selL)) void reportAnswer({ correct: true, cardId: it.cardId, word: it.word, gameId, ms: elapsedSince(since.current) });
      since.current += elapsedSince(since.current);
      setLast({ it, ok: true });
      setSelL(null);
      if (m.size === items.length) setTimeout(() => onFinish({ score: items.length - missed.current.size, total: items.length, missed: [...missed.current.values()] }), 500);
    } else {
      setBad({ l: selL, r: key });
      if (!missed.current.has(selL)) {
        missed.current.set(selL, { en: it.en, fr: it.fr, cardId: it.cardId });
        void reportAnswer({ correct: false, cardId: it.cardId, word: it.word, gameId, mistake: { id: `vocab:${it.en.toLowerCase()}`, type: "vocab", label: it.en, detail: it.fr } });
      }
      const other = items.find((i) => i.key === key);
      setLast({ it, ok: false, other });
      setTimeout(() => {
        setBad(null);
        setSelL(null);
      }, 650);
    }
  }

  const tile = (active: boolean, isMatched: boolean, isBad: boolean) =>
    cx(
      "flex min-h-14 w-full items-center justify-center rounded-xl border px-3 py-2 text-center text-[15px] font-medium transition",
      isMatched && "pointer-events-none scale-95 border-mint-400 bg-mint-100 text-mint-600 opacity-60 dark:bg-mint-600/20",
      isBad && "animate-shake border-coral-500 bg-coral-100 dark:bg-coral-600/20",
      active && !isBad && "border-ink-500 bg-ink-50 ring-2 ring-ink-300 dark:bg-ink-900/50",
      !active && !isMatched && !isBad && "border-line bg-surface hover:border-ink-300",
    );

  return (
    <div>
      <GameHeader gameId={gameId} progress={matched.size / Math.max(1, items.length)} right={<span className="text-sm text-muted">{matched.size}/{items.length}</span>} />
      {notice && <Notice>{notice}</Notice>}
      <p className="mb-3 text-sm text-muted">{t("Touche un élément à gauche, puis sa correspondance à droite.", "Tap an item on the left, then its match on the right.")}</p>
      <Panel>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            {left.map((it) => (
              <button key={it.key} className={tile(selL === it.key, matched.has(it.key), bad?.l === it.key)} onClick={() => !bad && setSelL(it.key)}>
                {it.leftIsImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.left} alt={t("illustration", "picture")} className="h-20 w-20 rounded-lg object-cover" />
                ) : it.leftEmoji ? (
                  <span className="text-4xl">{it.leftEmoji}</span>
                ) : (
                  it.left
                )}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {right.map((it) => (
              <button key={it.key} className={cx(tile(bad?.r === it.key, matched.has(it.key), bad?.r === it.key), it.leftIsImage || it.leftEmoji ? "min-h-24" : "")} onClick={() => pickRight(it.key)}>
                {it.right}
              </button>
            ))}
          </div>
        </div>
      </Panel>
      {last?.it.word && (
        <div className="mt-3" key={last.it.key + String(last.ok)}>
          <WordFeedback
            compact={last.ok}
            item={last.it.word}
            verdict={last.ok ? "exact" : "wrong"}
            reason={!last.ok && last.other ? t(`« ${last.other.right} » correspond à « ${last.other.left.startsWith("data:") ? last.other.en : last.other.left} », pas à ce mot.`, `"${last.other.right}" goes with another item.`) : undefined}
          />
        </div>
      )}
    </div>
  );
}

export const firstFr = (fr: string) => splitAlternatives(fr)[0] ?? fr;
