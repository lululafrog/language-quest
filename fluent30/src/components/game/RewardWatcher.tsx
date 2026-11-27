"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LEVEL_REWARD, levelTitle, settleRewards } from "@/lib/game";
import { useT } from "@/hooks/useT";
import { toast } from "@/components/ui";
import { Tourist } from "@/components/avatar/Tourist";
import { CoinIcon } from "./Coin";
import type { GameState } from "@/lib/types";

/** Pays level-up / streak rewards and celebrates them. */
export function RewardWatcher() {
  const path = usePathname();
  const t = useT();
  const [levelUp, setLevelUp] = useState<{ level: number; count: number; game: GameState } | null>(null);
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  useEffect(() => {
    // Rewards are paid exactly once, so their celebration must always be shown (no "alive" guard).
    const run = async () => {
      const r = await settleRewards();
      const t = tRef.current;
      if (r.levelUps.length) setLevelUp({ level: r.levelUps[r.levelUps.length - 1], count: r.levelUps.length, game: r.game });
      if (r.streak) toast(t(`🔥 ${r.streak.days} jours d'affilée ! +${r.streak.coins} pièces`, `🔥 ${r.streak.days}-day streak! +${r.streak.coins} coins`));
    };
    void run();
    const iv = setInterval(run, 20000);
    return () => clearInterval(iv);
  }, [path]);

  if (!levelUp) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade bg-ink-950/60 backdrop-blur-sm" onClick={() => setLevelUp(null)} />
      <Confetti />
      <div className="relative w-full max-w-sm animate-pop rounded-3xl bg-surface p-6 text-center shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-ink-600 dark:text-ink-300">{t("Niveau supérieur !", "Level up!")}</p>
        <p className="mt-1 text-5xl font-black tracking-tight">{levelUp.level}</p>
        <p className="mt-1 font-medium">{levelTitle(levelUp.level)}</p>
        <div className="mx-auto mt-4 w-40 overflow-hidden rounded-2xl"><Tourist equipped={levelUp.game.equipped} /></div>
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sun-100 px-4 py-2 text-lg font-bold text-amber-800 dark:bg-sun-500/20 dark:text-sun-100">+{LEVEL_REWARD * levelUp.count} <CoinIcon size={20} /></p>
        <div className="mt-5 flex gap-2">
          <button onClick={() => setLevelUp(null)} className="h-11 flex-1 rounded-xl border border-line font-medium">{t("Continuer", "Continue")}</button>
          <Link href="/shop" onClick={() => setLevelUp(null)} className="flex h-11 flex-1 items-center justify-center rounded-xl bg-ink-600 font-medium text-white">{t("Boutique", "Shop")} 🛍️</Link>
        </div>
      </div>
    </div>
  );
}

export function Confetti({ count = 40 }: { count?: number }) {
  const colors = ["#6a55f2", "#ff7a6b", "#5fd3b5", "#ffd166", "#ff8fb1"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 10) * 0.12}s`, animationDuration: `${2.2 + (i % 5) * 0.35}s`, transform: `rotate(${i * 29}deg)` }}
        />
      ))}
    </div>
  );
}
