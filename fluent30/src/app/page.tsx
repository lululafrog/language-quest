"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { computeOverview, formatDuration } from "@/lib/progress";
import { useSettings } from "@/hooks/useSettings";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { LinkButton, ListGroup, ListRow, Panel, SectionHeader, Segmented, cx } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";
import { saveSettings, todayKey } from "@/lib/db";
import { getGame } from "@/lib/game";
import { buildDailyPlan, getTodayPlan, markStep, refreshPlanProgress, type PlanMinutes } from "@/lib/session";
import { lastStartedLesson, nextPathLesson } from "@/lib/curriculum/progress";
import { Tourist } from "@/components/avatar/Tourist";
import { CoinIcon } from "@/components/game/Coin";

const KIND_ICON: Record<string, IconName> = {
  review: "review", "new-words": "sparkle", lesson: "course", "lesson-review": "course", practice: "game", reading: "book",
  listening: "headphones", conversation: "chat",
};
const KIND_LABEL: Record<string, string> = {
  review: "Révision", "new-words": "Nouveaux mots", lesson: "Nouveau cours", "lesson-review": "Révision de cours", practice: "Pratique ciblée",
  reading: "Lecture", listening: "Écoute", conversation: "Conversation",
};
const DURATIONS: PlanMinutes[] = [5, 10, 15, 20, 30];
const DAY = 86_400_000;

export default function Home() {
  const s = useSettings();
  const t = useT();
  const status = useStatus();
  const o = useLiveQuery(() => computeOverview(), []);
  const game = useLiveQuery(() => getGame(), []);
  const plan = useLiveQuery(async () => (await getTodayPlan()) ?? null, []);
  const lesson = useLiveQuery(async () => (await lastStartedLesson()) ?? (await nextPathLesson(s.pathLevel ?? "A1")) ?? null, [s.pathLevel]);
  const [building, setBuilding] = useState(false);
  const [requested, setRequested] = useState(false);

  const build = async (minutes: PlanMinutes, force = false) => {
    setBuilding(true);
    try {
      await buildDailyPlan(minutes, { aiAvailable: status?.ai, dailyNewWords: s.dailyNewWords, immersion: s.immersion, force });
    } finally {
      setBuilding(false);
    }
  };

  // Today's plan: build it once if missing, otherwise just refresh the objectively-done steps.
  useEffect(() => {
    if (requested || !s.loaded || plan === undefined) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off plan generation
    setRequested(true);
    if (plan) void refreshPlanProgress();
    else void build(s.sessionMinutes as PlanMinutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested, s.loaded, plan]);

  if (!o || !s.loaded || !game) return <HomeSkeleton />;

  const steps = plan?.steps ?? [];
  const done = steps.filter((x) => x.done).length;
  const main = steps.find((x) => !x.done);
  const others = steps.filter((x) => x !== main);

  const hour = new Date().getHours();
  const hello = hour < 5 || hour >= 18 ? t("Bonsoir", "Good evening") : hour < 12 ? t("Bonjour", "Good morning") : t("Bon après-midi", "Good afternoon");

  // Welcome back after ≥ 3 days away (never a guilt message).
  const today = todayKey();
  const lastActive = o.days.filter((d) => d.date !== today && (d.seconds > 0 || d.reviews > 0)).map((d) => d.date).sort().pop();
  const awayDays = lastActive ? Math.floor((new Date(today).getTime() - new Date(lastActive).getTime()) / DAY) : 0;
  const todayActive = (o.days.find((d) => d.date === today)?.seconds ?? 0) > 0;
  const welcomeBack = awayDays >= 3 && !todayActive;

  const changeLength = async (m: PlanMinutes) => {
    await saveSettings({ sessionMinutes: m });
    await build(m, true);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Greeting */}
      <header className="mb-6 flex items-center gap-3">
        <Link href="/profile" className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-sun-100 ring-1 ring-line dark:bg-ink-900/60" aria-label={t("Mon univers", "My world")}>
          <Tourist equipped={game.equipped} appearance={game.appearance} portrait animate={false} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{hello}{s.displayName ? `, ${s.displayName}` : ""}</p>
          <h1 className="t-title truncate">{main ? (done ? t("On continue ?", "Shall we go on?") : t("Où va-t-on aujourd'hui ?", "Where to today?")) : steps.length ? t("Belle journée d'anglais", "Great English day") : t("Ton anglais, ton aventure", "Your English, your adventure")}</h1>
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
          <p className="font-semibold">{t("Bienvenue dans ton aventure", "Welcome to your adventure")}</p>
          <p className="mt-1 text-sm text-muted">{t("2 minutes pour régler ton niveau, ton temps par jour et ton personnage.", "2 minutes to set your level, daily time and character.")}</p>
          <LinkButton href="/onboarding" className="mt-4">{t("Préparer mon voyage", "Prepare my trip")}</LinkButton>
        </Panel>
      )}

      {welcomeBack && (
        <Panel tone="subtle" className="mb-5 flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint-100 text-mint-600 dark:bg-mint-600/20 dark:text-mint-300"><Icon name="heart" size={18} /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("Content de te revoir !", "Good to see you again!")}</p>
            <p className="mt-0.5 text-sm text-muted">{t("Rien n'est perdu : tes mots et ta progression t'attendent. On reprend doucement avec 5 minutes ?", "Nothing is lost: your words and progress are waiting. Restart gently with 5 minutes?")}</p>
            {s.sessionMinutes !== 5 && (
              <button onClick={() => changeLength(5)} className="mt-2 text-sm font-semibold text-ink-600 hover:underline dark:text-ink-300">{t("Reprendre en douceur (5 min)", "Gentle restart (5 min)")}</button>
            )}
          </div>
        </Panel>
      )}

      {/* The main activity — the one hero of the screen */}
      <section className="relative overflow-hidden rounded-3xl bg-ink-700 p-5 text-white shadow-lg shadow-ink-900/15 dark:bg-ink-800">
        <svg className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 text-white/[0.07]" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="5 6" />
          <path d="M50 14 58 50 50 86 42 50Z" fill="currentColor" />
        </svg>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
          {main ? t("Activité principale", "Main activity") : t("Ton programme du jour", "Today's plan")}
          {steps.length > 0 && <span className="ml-2 tabular-nums text-white/45">{done}/{steps.length}</span>}
        </p>
        {building && !steps.length ? (
          <div className="mt-3 h-24 animate-pulse rounded-2xl bg-white/10" />
        ) : main ? (
          <>
            <div className="mt-3 flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10"><Icon name={KIND_ICON[main.kind] ?? "play"} size={22} /></span>
              <div className="min-w-0">
                <p className="text-[13px] text-white/65">{KIND_LABEL[main.kind] ?? ""} · {main.minutes} min</p>
                <p className="text-xl font-semibold leading-snug" style={{ fontFamily: "var(--font-display)" }}>{main.title}</p>
                {main.subtitle && <p className="mt-0.5 text-sm text-white/65">{main.subtitle}</p>}
              </div>
            </div>
            <Link href={main.href} className="mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-ink-800 transition hover:bg-sun-50">
              {done ? t("Continuer", "Continue") : t("Commencer", "Start")}
              <Icon name="arrow" size={18} />
            </Link>
          </>
        ) : steps.length ? (
          <>
            <p className="mt-2 text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{t("Programme terminé. Bravo !", "Plan complete. Well done!")}</p>
            <button onClick={() => build(s.sessionMinutes as PlanMinutes, true)} className="mt-4 h-11 w-full rounded-2xl border border-white/25 text-sm font-medium text-white/90 hover:bg-white/10">
              {t("Un programme bonus ?", "A bonus plan?")}
            </button>
          </>
        ) : (
          <p className="mt-2 text-white/70">{t("Préparation de ton programme…", "Preparing your plan…")}</p>
        )}
      </section>

      {/* Optional activities of the plan */}
      {others.length > 0 && (
        <div className="mt-3 rounded-3xl border border-line/70 bg-surface p-2 card-shadow">
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("Aussi au programme", "Also on the plan")}</p>
          <ol className={cx(building && "opacity-60")}>
            {others.map((step) => (
              <li key={step.id} className="flex items-center gap-3 rounded-2xl px-2 py-1.5">
                <button
                  onClick={() => markStep(step.id, !step.done)}
                  aria-label={step.done ? t("Marquer comme non fait", "Mark as not done") : t("Marquer comme fait", "Mark as done")}
                  className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border", step.done ? "border-mint-500 bg-mint-500 text-white" : "border-line text-muted")}
                >
                  {step.done ? <Icon name="check" size={15} strokeWidth={2.5} /> : <Icon name={KIND_ICON[step.kind] ?? "play"} size={15} />}
                </button>
                <Link href={step.href} className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="min-w-0 flex-1">
                    <span className={cx("block truncate text-[15px]", step.done && "text-muted line-through")}>{step.title}</span>
                    {step.subtitle && <span className="block truncate text-xs text-muted">{step.subtitle}</span>}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">{step.minutes} min</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <span className="shrink-0 text-xs text-muted">{t("Temps aujourd'hui", "Time today")}</span>
        <Segmented<PlanMinutes>
          className="flex flex-1 [&>button]:flex-1"
          value={(s.sessionMinutes === 60 ? 30 : s.sessionMinutes) as PlanMinutes}
          onChange={changeLength}
          options={DURATIONS.map((m) => ({ value: m, label: `${m}′` }))}
        />
      </div>

      {/* Real life import */}
      <Link href="/practice/real-life" className="mt-5 flex items-center gap-3 rounded-3xl border border-dashed border-sun-500/50 bg-sun-50 p-4 transition hover:border-sun-500 dark:bg-sun-500/10">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun-100 text-sun-700 dark:bg-sun-500/20 dark:text-sun-300"><Icon name="camera" size={22} /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("Importer de la vraie vie", "Import from real life")}</span>
          <span className="block text-sm text-muted">{t("Une capture, un message, un menu, une phrase entendue…", "A screenshot, a message, a menu, a phrase you heard…")}</span>
        </span>
        <Icon name="plus" size={20} className="text-sun-700 dark:text-sun-300" />
      </Link>

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
