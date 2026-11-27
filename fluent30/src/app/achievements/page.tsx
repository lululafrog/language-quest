"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { ACHIEVEMENTS, collectStats } from "@/lib/achievements";
import { gentleStreak } from "@/lib/goals";
import { GoalsCard } from "@/components/game/GoalsCard";
import { TrophyBadge } from "@/components/game/TrophyBadge";
import { PageHeader, Panel, ProgressBar, cx } from "@/components/ui";
import { CoinIcon } from "@/components/game/Coin";

export default function AchievementsPage() {
  const data = useLiveQuery(async () => {
    const db = getDb();
    const [records, days] = await Promise.all([db.achievements.toArray(), db.activity.toArray()]);
    const stats = await collectStats(gentleStreak(days).streak);
    return { unlocked: new Map(records.map((r) => [r.id, r.unlockedAt])), stats };
  }, []);
  if (!data) return <div className="h-96 animate-pulse rounded-3xl bg-surface-2" />;
  const count = ACHIEVEMENTS.filter((a) => data.unlocked.has(a.id)).length;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Trophées & objectifs" subtitle={`${count}/${ACHIEVEMENTS.length} trophées débloqués`} back="/profile" />
      <GoalsCard />
      <Panel className="bg-gradient-to-b from-[#3B2A1A] to-[#2A1D12] !text-white">
        <h2 className="mb-3 font-semibold text-sun-400">Vitrine à trophées</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const at = data.unlocked.get(a.id);
            const p = a.check(data.stats);
            return (
              <div key={a.id} className={cx("rounded-2xl p-2 text-center", at ? "bg-white/10" : "bg-black/20")}>
                <TrophyBadge a={a} locked={!at} className="mx-auto w-16" />
                <p className="mt-1 text-[12px] font-semibold leading-tight">{a.fr}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-white/60">{a.descFr}</p>
                {at ? (
                  <p className="mt-1 text-[10px] text-mint-400">Débloqué le {new Date(at).toLocaleDateString("fr-FR")}</p>
                ) : (
                  <>
                    <ProgressBar value={Math.min(p.value, p.target)} max={p.target} className="mt-1.5 bg-white/10" tone="sun" />
                    <p className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-white/60">{Math.min(p.value, p.target).toLocaleString("fr-FR")}/{p.target.toLocaleString("fr-FR")} · +{a.coins}<CoinIcon size={10} /></p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
