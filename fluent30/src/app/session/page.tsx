"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, saveSettings, todayKey } from "@/lib/db";
import { buildSession, markStep } from "@/lib/session";
import { computeOverview } from "@/lib/progress";
import { useSettings } from "@/hooks/useSettings";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { Button, PageHeader, Panel, ProgressBar, Segmented, cx } from "@/components/ui";
import type { Settings } from "@/lib/types";

const ICONS: Record<string, string> = { review: "🔁", new: "✨", grammar: "✍️", game: "🎮", reading: "📖", conversation: "💬", listening: "🎧", verbs: "⚡" };

export default function SessionPage() {
  const t = useT();
  const s = useSettings();
  const status = useStatus();
  const session = useLiveQuery(async () => (await getDb().sessions.get(todayKey())) ?? null, []);
  const overview = useLiveQuery(() => computeOverview(), []);
  const [building, setBuilding] = useState(false);

  // Build today's plan the first time the page is opened.
  const needsBuild = session === null;
  useEffect(() => {
    if (needsBuild && status && s.loaded && !building) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off plan generation
      setBuilding(true);
      void buildSession(s.sessionMinutes, { aiAvailable: status.ai, dailyNewWords: s.dailyNewWords, immersion: s.immersion }).finally(() => setBuilding(false));
    }
  }, [needsBuild, status, s.loaded, s.sessionMinutes, s.dailyNewWords, s.immersion, building]);

  // Auto-complete steps whose goal is objectively met.
  useEffect(() => {
    if (!session || !overview) return;
    for (const step of session.steps) {
      if (step.done) continue;
      if (step.kind === "review" && overview.dueNow === 0 && overview.days.find((d) => d.date === todayKey())?.reviews) void markStep(step.id, true);
      if (step.kind === "new" && overview.newToday >= s.dailyNewWords) void markStep(step.id, true);
    }
  }, [session, overview, s.dailyNewWords]);

  const changeLength = async (m: Settings["sessionMinutes"]) => {
    await saveSettings({ sessionMinutes: m });
    setBuilding(true);
    await buildSession(m, { aiAvailable: !!status?.ai, dailyNewWords: s.dailyNewWords, immersion: s.immersion });
    setBuilding(false);
  };

  const done = session?.steps.filter((x) => x.done).length ?? 0;
  const total = session?.steps.length ?? 0;
  const nextStep = session?.steps.find((x) => !x.done);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t("Séance du jour", "Today's session")} subtitle={t("Programme généré selon tes révisions, tes difficultés et ton objectif.", "Plan generated from your reviews, difficulties and goal.")} back="/" />
      <Segmented<Settings["sessionMinutes"]>
        className="mb-4"
        value={s.sessionMinutes}
        onChange={changeLength}
        options={[5, 10, 15, 30, 60].map((m) => ({ value: m as Settings["sessionMinutes"], label: `${m} min` }))}
      />
      {!session || building ? (
        <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
      ) : (
        <>
          <Panel className="mb-4">
            <div className="flex items-center justify-between text-sm"><span className="text-muted">{t("Progression", "Progress")}</span><span className="tabular-nums">{done}/{total}</span></div>
            <ProgressBar value={done} max={total} tone="mint" className="mt-2" />
            {nextStep ? (
              <Link href={nextStep.href} className="mt-4 flex h-12 items-center justify-center rounded-xl bg-ink-600 font-medium text-white hover:bg-ink-700">{t("Activité suivante :", "Next:")} {nextStep.title.split(" · ")[0]} →</Link>
            ) : (
              <p className="mt-4 text-center font-medium text-mint-600">{t("Séance terminée ! À demain 👋", "Session complete! See you tomorrow 👋")}</p>
            )}
          </Panel>
          <ol className="space-y-2">
            {session.steps.map((step, i) => (
              <li key={step.id} className={cx("flex items-center gap-3 rounded-2xl border border-line bg-surface p-3", step.done && "opacity-60")}>
                <button onClick={() => markStep(step.id, !step.done)} aria-label={step.done ? t("Marquer comme non fait", "Mark as not done") : t("Marquer comme fait", "Mark as done")} className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm", step.done ? "border-mint-500 bg-mint-500 text-white" : "border-line")}>
                  {step.done ? "✓" : i + 1}
                </button>
                <Link href={step.href} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="text-xl">{ICONS[step.kind]}</span>
                  <span className="min-w-0 flex-1">
                    <span className={cx("block truncate font-medium", step.done && "line-through")}>{step.title}</span>
                    <span className="text-xs text-muted">{step.minutes} min</span>
                  </span>
                  <span className="text-muted">›</span>
                </Link>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => changeLength(s.sessionMinutes)}>{t("Régénérer le programme", "Regenerate plan")}</Button>
          </div>
        </>
      )}
    </div>
  );
}
