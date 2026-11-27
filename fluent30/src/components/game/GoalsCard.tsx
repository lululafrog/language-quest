"use client";
// Weekly/monthly reading goals with progress rings and a forgiving streak.
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { DEFAULT_READING_GOALS, gentleMessage, gentleStreak, goalsProgress } from "@/lib/goals";
import { useSettings } from "@/hooks/useSettings";
import { Panel, Ring } from "@/components/ui";

export function GoalsCard({ compact }: { compact?: boolean }) {
  const s = useSettings();
  const goals = s.readingGoals ?? DEFAULT_READING_GOALS;
  const data = useLiveQuery(async () => {
    const [p, days] = await Promise.all([goalsProgress(goals), getDb().activity.toArray()]);
    return { p, streak: gentleStreak(days) };
  }, [goals.minutesPerWeek, goals.wordsPerWeek, goals.booksPerMonth]);
  if (!data) return <div className="h-40 animate-pulse rounded-3xl bg-surface-2" />;
  const { p, streak } = data;
  const rings = [
    { label: "min cette semaine", value: p.minutes, target: goals.minutesPerWeek, tone: "#6a55f2" },
    { label: "mots lus / semaine", value: p.words, target: goals.wordsPerWeek, tone: "#2fbf9a" },
    { label: "livres ce mois-ci", value: p.books, target: goals.booksPerMonth, tone: "#ff7a6b" },
  ];
  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Mes objectifs</h2>
        {!compact && <Link href="/settings#objectifs" className="text-sm text-ink-600 dark:text-ink-300">Modifier</Link>}
        {compact && <Link href="/achievements" className="text-sm text-ink-600 dark:text-ink-300">Trophées</Link>}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {rings.map((r) => (
          <div key={r.label} className="flex flex-col items-center">
            <Ring value={Math.min(r.value, r.target)} max={r.target} size={74} stroke={8} tone={r.tone}>
              <span className="text-sm font-bold tabular-nums">{r.value >= 1000 ? `${(r.value / 1000).toFixed(1)}k` : r.value}</span>
            </Ring>
            <p className="mt-1 text-[11px] leading-tight text-muted">/ {r.target >= 1000 ? `${r.target / 1000}k` : r.target} {r.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2 text-sm">
        <span className="text-lg">🔥</span>
        <span className="flex-1">{gentleMessage(p, streak)}</span>
      </div>
      <p className="mt-2 text-xs text-muted">Série : {streak.streak} jour{streak.streak > 1 ? "s" : ""}{streak.jokersUsed ? ` · ${streak.jokersUsed} joker${streak.jokersUsed > 1 ? "s" : ""} utilisé${streak.jokersUsed > 1 ? "s" : ""}` : ""} — un jour manqué par semaine est couvert automatiquement.</p>
    </Panel>
  );
}
