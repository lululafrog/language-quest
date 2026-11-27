"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { computeOverview, formatDuration } from "@/lib/progress";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { Badge, LinkButton, Panel, ProgressBar, Ring, StatTile, cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/AppShell";
import { getDb, todayKey } from "@/lib/db";
import { GRAMMAR_TOTAL } from "@/lib/catalog";

export default function Dashboard() {
  const s = useSettings();
  const t = useT();
  const o = useLiveQuery(() => computeOverview(), []);
  const session = useLiveQuery(() => getDb().sessions.get(todayKey()), []);

  if (!o || !s.loaded) return <DashboardSkeleton />;

  const hour = new Date().getHours();
  const hello = hour < 5 ? t("Bonsoir", "Good evening") : hour < 12 ? t("Bonjour", "Good morning") : hour < 18 ? t("Bon après-midi", "Good afternoon") : t("Bonsoir", "Good evening");
  const sessionDone = session ? session.steps.filter((x) => x.done).length : 0;
  const sessionTotal = session?.steps.length ?? 0;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="md:hidden"><Logo size={34} /></span>
          <div>
            <p className="text-sm text-muted">{hello}{s.displayName ? `, ${s.displayName}` : ""} 👋</p>
            <h1 className="text-2xl font-semibold tracking-tight">{t("Ton anglais aujourd'hui", "Your English today")}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold" title={t("Jours consécutifs", "Day streak")}>
          <Icon name="flame" size={18} className={o.streak > 0 ? "text-coral-500" : "text-muted"} />
          <span className="tabular-nums">{o.streak}</span>
        </div>
      </header>

      {!s.onboarded && (
        <Panel className="border-ink-200 bg-gradient-to-br from-ink-600 to-ink-800 text-white">
          <p className="text-lg font-semibold">{t("Bienvenue sur Fluent30 !", "Welcome to Fluent30!")}</p>
          <p className="mt-1 text-sm text-white/80">{t("2 minutes pour personnaliser ton parcours : objectifs, centres d'intérêt et test de niveau facultatif (pour ne pas réapprendre ce que tu sais déjà).", "2 minutes to personalise your path: goals, interests and an optional placement test.")}</p>
          <LinkButton href="/onboarding" variant="secondary" className="mt-4 bg-white text-ink-800 hover:bg-ink-50">{t("Commencer", "Get started")}</LinkButton>
        </Panel>
      )}

      {/* Daily session */}
      <Panel className="relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-ink-100 opacity-60 dark:bg-ink-900/40" />
        <div className="relative flex items-center gap-4">
          <Ring value={sessionDone} max={Math.max(1, sessionTotal)} size={76} tone="#6a55f2">
            <div>
              <div className="text-lg font-semibold leading-none">{s.sessionMinutes}</div>
              <div className="text-[10px] uppercase text-muted">min</div>
            </div>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-600 dark:text-ink-300">{t("Séance du jour", "Today's session")}</p>
            <p className="mt-0.5 font-semibold">
              {sessionTotal && sessionDone === sessionTotal
                ? t("Séance terminée, bravo ! 🎉", "Session complete, well done! 🎉")
                : sessionTotal
                  ? t(`${sessionDone}/${sessionTotal} activités faites`, `${sessionDone}/${sessionTotal} activities done`)
                  : t("Un programme adapté à tes besoins", "A plan tailored to you")}
            </p>
            <p className="text-sm text-muted">{t("Révisions, nouveaux mots, grammaire, jeux, lecture, conversation.", "Reviews, new words, grammar, games, reading, conversation.")}</p>
          </div>
        </div>
        <LinkButton href="/session" className="relative mt-4 w-full sm:w-auto">{sessionTotal && sessionDone < sessionTotal ? t("Continuer la séance", "Continue session") : t("Lancer la séance", "Start session")}</LinkButton>
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/learn" className="rounded-2xl border border-line bg-surface p-4 transition hover:border-ink-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">{t("Nouveaux mots", "New words")}</span>
            <Icon name="sparkle" size={18} className="text-sun-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{o.newToday}<span className="text-base font-normal text-muted">/{s.dailyNewWords}</span></div>
          <ProgressBar value={o.newToday} max={s.dailyNewWords} tone="sun" className="mt-2" />
          <p className="mt-1.5 text-xs text-muted">{o.newToday >= s.dailyNewWords ? t("Objectif atteint — tu peux continuer !", "Goal reached — keep going!") : t("Objectif quotidien", "Daily goal")}</p>
        </Link>
        <Link href="/review" className="rounded-2xl border border-line bg-surface p-4 transition hover:border-ink-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">{t("À réviser", "To review")}</span>
            <Icon name="review" size={18} className="text-ink-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{o.dueNow}</div>
          <p className="mt-3 text-xs text-muted">{o.dueToday > o.dueNow ? t(`${o.dueToday} au total aujourd'hui`, `${o.dueToday} in total today`) : o.dueNow ? t("Prêtes maintenant", "Ready now") : t("Rien en attente 👌", "All caught up 👌")}</p>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon="🧠" label={t("Mémorisés", "Memorised")} value={o.memorized} sub={t(`${o.learning} en cours`, `${o.learning} learning`)} href="/stats" />
        <StatTile icon="⚡" label={t("Verbes maîtrisés", "Verbs mastered")} value={o.verbsMastered} sub={t(`${o.verbsStudied} étudiés`, `${o.verbsStudied} studied`)} href="/verbs" />
        <StatTile icon="✍️" label={t("Grammaire", "Grammar")} value={`${o.grammarDone}/${GRAMMAR_TOTAL || "—"}`} sub={t("leçons validées", "lessons passed")} href="/grammar" />
        <StatTile icon="⏱️" label={t("Temps", "Time")} value={formatDuration(o.todaySeconds, s.immersion)} sub={t(`${formatDuration(o.weekSeconds)} cette semaine`, `${formatDuration(o.weekSeconds, true)} this week`)} href="/stats" />
      </div>

      <WeekBars days={o.days} goalMinutes={s.sessionMinutes} t={t} />

      <div className="grid gap-3 md:grid-cols-2">
        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{t("Erreurs récurrentes", "Recurring mistakes")}</h2>
            <Link href="/stats#mistakes" className="text-sm text-ink-600 dark:text-ink-300">{t("Tout voir", "See all")}</Link>
          </div>
          {o.topMistakes.length ? (
            <ul className="space-y-2">
              {o.topMistakes.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate"><Badge tone={m.type === "grammar" ? "ink" : m.type === "vocab" ? "coral" : "sun"} className="mr-2">{m.type === "grammar" ? t("grammaire", "grammar") : m.type === "vocab" ? t("vocabulaire", "vocabulary") : m.type}</Badge>{m.label}{m.detail ? <span className="text-muted"> — {m.detail}</span> : null}</span>
                  <span className="shrink-0 tabular-nums text-muted">×{m.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t("Aucune erreur récurrente pour l'instant. Elles apparaîtront ici pour être retravaillées en priorité.", "No recurring mistakes yet.")}</p>
          )}
        </Panel>
        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{t("Lecture en cours", "Currently reading")}</h2>
            <Link href="/library" className="text-sm text-ink-600 dark:text-ink-300">{t("Bibliothèque", "Library")}</Link>
          </div>
          {o.currentBook ? (
            <Link href={`/library/read/${o.currentBook.id}`} className="flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-surface-2">
              <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-ink-500 to-coral-500 text-lg text-white">📖</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{o.currentBook.title}</p>
                <ProgressBar value={o.currentBook.progress} className="mt-2" tone="mint" />
                <p className="mt-1 text-xs text-muted">{Math.round(o.currentBook.progress * 100)} % · {t("Reprendre la lecture", "Resume reading")}</p>
              </div>
            </Link>
          ) : (
            <p className="text-sm text-muted">{t("Aucun livre en cours. Choisis une histoire adaptée à ton niveau ou importe un EPUB.", "No book in progress yet.")}</p>
          )}
        </Panel>
      </div>

      {!s.placementDone && s.onboarded && (
        <Panel className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">{t("Test de niveau (facultatif)", "Placement test (optional)")}</p>
            <p className="text-sm text-muted">{t("Repère les mots que tu connais déjà pour ne pas les réapprendre.", "Skip the words you already know.")}</p>
          </div>
          <LinkButton href="/tests/placement" variant="outline">{t("Faire le test", "Take it")}</LinkButton>
        </Panel>
      )}
    </div>
  );
}

function WeekBars({ days, goalMinutes, t }: { days: { date: string; seconds: number }[]; goalMinutes: number; t: (fr: string, en: string) => string }) {
  const map = new Map(days.map((d) => [d.date, d.seconds]));
  const items = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = todayKey(d);
    return { key, label: d.toLocaleDateString(undefined, { weekday: "narrow" }), min: Math.round((map.get(key) ?? 0) / 60) };
  });
  const max = Math.max(goalMinutes, ...items.map((i) => i.min), 1);
  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{t("7 derniers jours", "Last 7 days")}</h2>
        <span className="text-xs text-muted">{t(`objectif ${goalMinutes} min/jour`, `goal ${goalMinutes} min/day`)}</span>
      </div>
      <div className="relative flex h-28 items-end gap-2">
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ink-300/70" style={{ bottom: `${(goalMinutes / max) * 100}%` }} />
        {items.map((i) => (
          <div key={i.key} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-24 w-full items-end">
              <div className={cx("w-full rounded-t-lg transition-all", i.min >= goalMinutes ? "bg-mint-500" : i.min > 0 ? "bg-ink-400" : "bg-surface-2")} style={{ height: `${Math.max(4, (i.min / max) * 100)}%` }} title={`${i.min} min`} />
            </div>
            <span className="text-[11px] text-muted">{i.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
      ))}
    </div>
  );
}
