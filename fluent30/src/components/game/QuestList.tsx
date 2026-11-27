"use client";
import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, todayKey } from "@/lib/db";
import { CHEST_REWARD, DEFAULT_GAME, claimQuest, dailyQuests } from "@/lib/game";
import { useSettings } from "@/hooks/useSettings";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { Panel, cx, toast } from "@/components/ui";
import { CoinIcon } from "./Coin";

/** Daily quests with claimable coin rewards and a bonus chest. */
export function QuestList() {
  const t = useT();
  const s = useSettings();
  const status = useStatus();
  const day = useLiveQuery(() => getDb().activity.get(todayKey()), []);
  const game = useLiveQuery(async () => (await getDb().game.get("me")) ?? DEFAULT_GAME, []);
  const [pop, setPop] = useState<string | null>(null);
  if (!game || !s.loaded) return <div className="h-48 animate-pulse rounded-2xl bg-surface-2" />;

  const quests = dailyQuests(day, s.dailyNewWords, !!status?.ai);
  const claimed = game.claimed[todayKey()] ?? [];
  const allDone = quests.every((q) => claimed.includes(q.id));

  const claim = async (id: string, reward: number) => {
    await claimQuest(id, reward);
    setPop(id);
    setTimeout(() => setPop(null), 900);
    toast(t(`+${reward} pièces !`, `+${reward} coins!`));
  };

  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{t("Quêtes du jour", "Daily quests")}</h2>
        <span className="text-xs text-muted">{t("Nouvelles quêtes demain", "New quests tomorrow")}</span>
      </div>
      <ul className="space-y-2.5">
        {quests.map((q) => {
          const done = q.progress >= q.target;
          const isClaimed = claimed.includes(q.id);
          const pct = Math.round((q.progress / q.target) * 100);
          return (
            <li key={q.id} className={cx("relative flex items-center gap-3 rounded-xl border p-2.5 transition", isClaimed ? "border-line opacity-60" : done ? "border-sun-400 bg-sun-100/50 dark:bg-sun-500/10" : "border-line")}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-xl">{isClaimed ? "✅" : q.emoji}</span>
              <Link href={q.href} className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{s.immersion ? q.en : q.fr}</span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"><span className={cx("block h-full rounded-full", done ? "bg-sun-500" : "bg-ink-500")} style={{ width: `${pct}%` }} /></span>
                  <span className="text-xs tabular-nums text-muted">{q.id === "time" ? `${Math.floor(q.progress / 60)}/${q.target / 60} min` : `${q.progress}/${q.target}`}</span>
                </span>
              </Link>
              {isClaimed ? (
                <span className="text-xs font-medium text-muted">{t("Récupéré", "Claimed")}</span>
              ) : done ? (
                <button onClick={() => claim(q.id, q.reward)} className="flex items-center gap-1 rounded-xl bg-sun-400 px-3 py-2 text-sm font-bold text-amber-900 shadow-sm transition active:scale-95">
                  +{q.reward} <CoinIcon size={16} />
                </button>
              ) : (
                <span className="flex items-center gap-1 text-sm font-semibold text-muted">{q.reward}<CoinIcon size={15} /></span>
              )}
              {pop === q.id && <span className="coin-pop pointer-events-none absolute right-6 top-0 text-lg">🪙</span>}
            </li>
          );
        })}
      </ul>
      <button
        disabled={!quests.every((q) => q.progress >= q.target) || claimed.includes("chest") || !allDone}
        onClick={() => claim("chest", CHEST_REWARD)}
        className={cx("mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-semibold transition", claimed.includes("chest") ? "border-line text-muted" : allDone ? "animate-pulse border-sun-500 bg-sun-100 text-amber-900 dark:bg-sun-500/20 dark:text-sun-100" : "border-line text-muted")}
      >
        🎁 {claimed.includes("chest") ? t("Coffre ouvert — à demain !", "Chest opened — see you tomorrow!") : allDone ? t(`Ouvrir le coffre (+${CHEST_REWARD})`, `Open the chest (+${CHEST_REWARD})`) : t(`Coffre bonus : termine les 4 quêtes (+${CHEST_REWARD})`, `Bonus chest: finish all 4 quests (+${CHEST_REWARD})`)}
      </button>
    </Panel>
  );
}
