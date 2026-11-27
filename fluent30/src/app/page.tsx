"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { computeOverview, formatDuration } from "@/lib/progress";
import { useSettings } from "@/hooks/useSettings";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { LinkButton, ListGroup, ListRow, Panel, ProgressBar, SectionHeader, Segmented, cx } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";
import { getDb, saveSettings, todayKey } from "@/lib/db";
import { getGame } from "@/lib/game";
import * as sessionLib from "@/lib/session";
import { lastStartedLesson, nextPathLesson } from "@/lib/curriculum/progress";
import { Tourist } from "@/components/avatar/Tourist";
import { CoinIcon } from "@/components/game/Coin";
import type { Settings } from "@/lib/types";

type PlanStep = { id: string; kind: string; minutes: number; title: string; subtitle?: string; href: string; done: boolean };
type PlanOpts = { aiAvailable: boolean; dailyNewWords: number; immersion: boolean };
// buildDailyPlan (curriculum-aware) is optional: fall back to the classic session builder.
const planLib = sessionLib as unknown as {
  buildDailyPlan?: (minutes: number, opts: PlanOpts) => Promise<{ steps: PlanStep[] }>;
  buildSession: (minutes: number, opts: PlanOpts) => Promise<{ steps: PlanStep[] }>;
  markStep: (id: string, done: boolean) => Promise<void>;
};

const KIND_ICON: Record<string, IconName> = {
  review: "review", new: "sparkle", grammar: "grammar", game: "game", reading: "book", conversation: "chat",
  listening: "headphones", verbs: "verbs", lesson: "course", course: "course", sheet: "sheet", pronunciation: "mic", theme: "globe",
};
const DURATIONS: Settings["sessionMinutes"][] = [5, 10, 15, 20, 30];

export default function Home() {
  const s = useSettings();
  const t = useT();
  const status = useStatus();
  const o = useLiveQuery(() => computeOverview(), []);
  const game = useLiveQuery(() => getGame(), []);
  const stored = useLiveQuery(async () => (await getDb().sessions.get(todayKey())) ?? null, []);
  const lesson = useLiveQuery(async () => (await lastStartedLesson()) ?? (await nextPathLesson(s.pathLevel ?? "A1")) ?? null, [s.pathLevel]);
  const [plan, setPlan] = useState<PlanStep[] | null>(null);
  const [building, setBuilding] = useState(false);
  const [requested, setRequested] = useState(false);

  const opts: PlanOpts | null = status && s.loaded ? { aiAvailable: status.ai, dailyNewWords: s.dailyNewWords, immersion: s.immersion } : null;

  const build = async (minutes: number) => {
    if (!opts) return;
    setBuilding(true);
    try {
      const fn = planLib.buildDailyPlan ?? planLib.buildSession;
      const res = await fn(minutes, opts);
      setPlan(res.steps);
    } finally {
      setBuilding(false);
    }
  };

  // Build today's plan once: always with buildDailyPlan (its "done" flags are live), otherwise only if none stored.
  useEffect(() => {
    if (requested || !opts || stored === undefined) return;
    if (!planLib.buildDailyPlan && stored && stored.minutes === s.sessionMinutes) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off plan generation
    setRequested(true);
    void build(s.sessionMinutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested, opts, stored, s.sessionMinutes]);

  // Auto-complete steps whose goal is objectively met (classic session only).
  useEffect(() => {
    if (!stored || !o || planLib.buildDailyPlan) return;
    for (const step of stored.steps) {
      if (step.done) continue;
      if (step.kind === "review" && o.dueNow === 0 && o.days.find((d) => d.date === todayKey())?.reviews) void planLib.markStep(step.id, true);
      if (step.kind === "new" && o.newToday >= s.dailyNewWords) void planLib.markStep(step.id, true);
    }
  }, [stored, o, s.dailyNewWords]);

  if (!o || !s.loaded || !game) return <HomeSkeleton />;

  // Stored session is live (done toggles); a returned plan wins when it is the curriculum-aware one.
  const steps: PlanStep[] = (planLib.buildDailyPlan ? plan : stored?.steps ?? plan) ?? [];
  const done = steps.filter((x) => x.done).length;
  const next = steps.find((x) => !x.done);
  const started = done > 0;

  const hour = new Date().getHours();
  const hello = hour < 5 || hour >= 18 ? t("Bonsoir", "Good evening") : hour < 12 ? t("Bonjour", "Good morning") : t("Bon après-midi", "Good afternoon");
  const todayMin = Math.round(o.todaySeconds / 60);

  const changeLength = async (m: Settings["sessionMinutes"]) => {
    await saveSettings({ sessionMinutes: m });
    await build(m);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Greeting */}
      <header className="mb-6 flex items-center gap-3">
        <Link href="/profile" className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-ink-50 ring-1 ring-line dark:bg-ink-900/60" aria-label={t("Mon profil", "My profile")}>
          <Tourist equipped={game.equipped} appearance={game.appearance} portrait animate={false} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{hello}{s.displayName ? `, ${s.displayName}` : ""}</p>
          <h1 className="t-title truncate">{started && next ? t("On continue ?", "Shall we go on?") : next ? t("Prêt pour aujourd'hui ?", "Ready for today?") : steps.length ? t("Belle journée d'anglais", "Great English day") : t("Ton anglais, chaque jour", "Your English, every day")}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-sm font-semibold tabular-nums" title={t("Série de jours", "Day streak")}>
            <Icon name="flame" size={16} className={o.streak > 0 ? "text-coral-500" : "text-muted"} />
            {o.streak}
          </span>
          <Link href="/shop" className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-sm font-semibold tabular-nums" title={t("Pièces", "Coins")}>
            <CoinIcon size={16} />
            {game.coins}
          </Link>
        </div>
      </header>

      {!s.onboarded && (
        <Panel tone="highlight" className="mb-5">
          <p className="font-semibold">{t("Bienvenue sur Fluent30", "Welcome to Fluent30")}</p>
          <p className="mt-1 text-sm text-muted">{t("2 minutes pour régler ton niveau, ton temps par jour et tes centres d'intérêt.", "2 minutes to set your level, daily time and interests.")}</p>
          <LinkButton href="/onboarding" className="mt-4">{t("Personnaliser mon parcours", "Personalise my path")}</LinkButton>
        </Panel>
      )}

      {/* Daily plan — the one hero of the screen */}
      <section className="rounded-3xl bg-ink-700 p-5 text-white shadow-lg shadow-ink-900/15 dark:bg-ink-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{t("Ton programme du jour", "Today's plan")}</p>
            <p className="mt-1 text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {steps.length && !next ? t("Programme terminé. Bravo !", "Plan complete. Well done!") : t(`${s.sessionMinutes} minutes, ${steps.length || "—"} étapes`, `${s.sessionMinutes} minutes, ${steps.length || "—"} steps`)}
            </p>
          </div>
          {steps.length > 0 && <span className="rounded-full bg-white/10 px-2.5 py-1 text-sm font-semibold tabular-nums">{done}/{steps.length}</span>}
        </div>

        <Segmented<Settings["sessionMinutes"]>
          className="mt-4 flex w-full bg-white/10 [&>button]:flex-1 [&>button[aria-checked=false]]:text-white/75"
          value={s.sessionMinutes}
          onChange={changeLength}
          options={DURATIONS.map((m) => ({ value: m, label: `${m} min` }))}
        />

        {building && !steps.length ? (
          <div className="mt-4 h-32 animate-pulse rounded-2xl bg-white/10" />
        ) : (
          <ol className={cx("mt-4 space-y-1", building && "opacity-60")}>
            {steps.map((step) => (
              <li key={step.id} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                <button
                  onClick={() => planLib.markStep(step.id, !step.done)}
                  disabled={!stored}
                  aria-label={step.done ? t("Marquer comme non fait", "Mark as not done") : t("Marquer comme fait", "Mark as done")}
                  className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border", step.done ? "border-mint-400 bg-mint-400 text-ink-900" : "border-white/30 text-white/70")}
                >
                  {step.done ? <Icon name="check" size={15} strokeWidth={2.5} /> : <Icon name={KIND_ICON[step.kind] ?? "play"} size={15} />}
                </button>
                <Link href={step.href} className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="min-w-0 flex-1">
                    <span className={cx("block truncate text-[15px]", step.done && "text-white/50 line-through")}>{step.title}</span>
                    {step.subtitle && <span className="block truncate text-xs text-white/55">{step.subtitle}</span>}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-white/55">{step.minutes} min</span>
                </Link>
              </li>
            ))}
          </ol>
        )}

        {next ? (
          <Link href={next.href} className="mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-ink-800 transition hover:bg-ink-50">
            {started ? t("Continuer", "Continue") : t("Commencer", "Start")}
            <Icon name="arrow" size={18} />
          </Link>
        ) : steps.length ? (
          <button onClick={() => build(s.sessionMinutes)} className="mt-4 h-11 w-full rounded-2xl border border-white/25 text-sm font-medium text-white/90 hover:bg-white/10">
            {t("Générer un programme bonus", "Generate a bonus plan")}
          </button>
        ) : null}
      </section>

      {/* Resume */}
      <SectionHeader title={t("Reprendre", "Pick up")} />
      <ListGroup>
        {lesson ? (
          <ListRow href={`/cours/${lesson.id}`} icon={<Icon name="course" size={20} />} title={lesson.title} subtitle={t(`Cours ${lesson.level} · ${lesson.minutes} min`, `Course ${lesson.level} · ${lesson.minutes} min`)} />
        ) : (
          <ListRow href="/cours" icon={<Icon name="course" size={20} />} title={t("Le parcours A1 → C1", "The A1 → C1 path")} subtitle={t("Choisis ta prochaine leçon", "Pick your next lesson")} />
        )}
        <ListRow
          href="/review"
          tone={o.dueNow ? "coral" : "mint"}
          icon={<Icon name="review" size={20} />}
          title={o.dueNow ? t(`${o.dueNow} mots à réviser`, `${o.dueNow} words to review`) : t("Aucun mot à réviser", "No words to review")}
          subtitle={o.dueToday > o.dueNow ? t(`${o.dueToday} au total aujourd'hui`, `${o.dueToday} in total today`) : o.dueNow ? t("Prêts maintenant", "Ready now") : t("Tu es à jour", "You're up to date")}
        />
        {o.currentBook ? (
          <ListRow href={`/library/read/${o.currentBook.id}`} tone="sun" icon={<Icon name="book" size={20} />} title={o.currentBook.title} subtitle={t(`Reprendre ta lecture · ${Math.round(o.currentBook.progress * 100)} %`, `Resume reading · ${Math.round(o.currentBook.progress * 100)}%`)} />
        ) : (
          <ListRow href="/library" tone="sun" icon={<Icon name="book" size={20} />} title={t("Choisir un livre", "Choose a book")} subtitle={t("Des histoires adaptées à ton niveau", "Stories matched to your level")} />
        )}
      </ListGroup>

      {/* Daily goal */}
      <SectionHeader title={t("Objectif du jour", "Today's goal")} />
      <div className="grid grid-cols-2 gap-3">
        <Panel className="p-4">
          <p className="text-xs text-muted">{t("Nouveaux mots", "New words")}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{o.newToday}<span className="text-sm font-normal text-muted"> / {s.dailyNewWords}</span></p>
          <ProgressBar value={o.newToday} max={s.dailyNewWords} tone="mint" className="mt-2" />
        </Panel>
        <Panel className="p-4">
          <p className="text-xs text-muted">{t("Temps d'anglais", "English time")}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{todayMin}<span className="text-sm font-normal text-muted"> / {s.sessionMinutes} min</span></p>
          <ProgressBar value={todayMin} max={s.sessionMinutes} tone="ink" className="mt-2" />
        </Panel>
      </div>

      {/* Week */}
      <SectionHeader title={t("Ta semaine", "Your week")} subtitle={t(`${formatDuration(o.weekSeconds, s.immersion)} cette semaine`, `${formatDuration(o.weekSeconds, true)} this week`)} action={<Link href="/stats" className="text-sm font-medium text-ink-600 dark:text-ink-300">{t("Détails", "Details")}</Link>} />
      <WeekBars days={o.days} goalMinutes={s.sessionMinutes} />
    </div>
  );
}

function WeekBars({ days, goalMinutes }: { days: { date: string; seconds: number }[]; goalMinutes: number }) {
  const map = new Map(days.map((d) => [d.date, d.seconds]));
  const items = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = todayKey(d);
    return { key, label: d.toLocaleDateString(undefined, { weekday: "narrow" }), min: Math.round((map.get(key) ?? 0) / 60), today: i === 6 };
  });
  const max = Math.max(goalMinutes, ...items.map((i) => i.min), 1);
  return (
    <Panel>
      <div className="relative flex h-28 items-end gap-2.5">
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `calc(${goalMinutes / max} * 6rem + 1.25rem)` }} />
        {items.map((i) => (
          <div key={i.key} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-24 w-full items-end">
              <div className={cx("w-full rounded-lg transition-all", i.min >= goalMinutes ? "bg-mint-500" : i.min > 0 ? "bg-ink-400" : "bg-surface-2")} style={{ height: `${Math.max(6, (i.min / max) * 100)}%` }} title={`${i.min} min`} />
            </div>
            <span className={cx("text-[11px]", i.today ? "font-semibold text-fg" : "text-muted")}>{i.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="h-12 w-56 animate-pulse rounded-2xl bg-surface-2" />
      <div className="h-72 animate-pulse rounded-3xl bg-surface-2" />
      <div className="h-40 animate-pulse rounded-3xl bg-surface-2" />
    </div>
  );
}
