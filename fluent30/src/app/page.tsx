"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { computeOverview, formatDuration } from "@/lib/progress";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { Badge, LinkButton, Panel, ProgressBar, Ring, StatTile, cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import { getDb, todayKey } from "@/lib/db";
import { GRAMMAR_TOTAL } from "@/lib/catalog";
import { getGame, levelFromXp, levelTitle } from "@/lib/game";
import { Tourist } from "@/components/avatar/Tourist";
import { Coins } from "@/components/game/Coin";
import { QuestList } from "@/components/game/QuestList";
import { GoalsCard } from "@/components/game/GoalsCard";

export default function Dashboard() {
  const s = useSettings();
  const t = useT();
  const o = useLiveQuery(() => computeOverview(), []);
  const session = useLiveQuery(() => getDb().sessions.get(todayKey()), []);
  const game = useLiveQuery(() => getGame(), []);

  if (!o || !s.loaded || !game) return <DashboardSkeleton />;
  const totalXp = o.days.reduce((a, d) => a + (d.xp ?? 0), 0);
  const lv = levelFromXp(totalXp);

  const hour = new Date().getHours();
  const hello = hour < 5 ? t("Bonsoir", "Good evening") : hour < 12 ? t("Bonjour", "Good morning") : hour < 18 ? t("Bon après-midi", "Good afternoon") : t("Bonsoir", "Good evening");
  const sessionDone = session ? session.steps.filter((x) => x.done).length : 0;
  const sessionTotal = session?.steps.length ?? 0;

  return (
    <div className="space-y-5">
      {/* Hero: the tourist, level and coins */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-600 via-ink-700 to-ink-900 p-4 text-white shadow-lg shadow-ink-900/20 sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-coral-500/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-mint-400/20 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <Link href="/shop" className="w-28 shrink-0 overflow-hidden rounded-2xl ring-4 ring-white/15 transition hover:scale-[1.02] sm:w-32" aria-label={t("Habiller mon touriste", "Dress my tourist")}>
            <Tourist equipped={game.equipped} appearance={game.appearance} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/75">{hello}{s.displayName ? `, ${s.displayName}` : ""} 👋</p>
            <p className="mt-0.5 text-xl font-bold leading-tight sm:text-2xl">{t("Niveau", "Level")} {lv.level} · {levelTitle(lv.level)}</p>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-gradient-to-r from-sun-400 to-coral-400 transition-all duration-700" style={{ width: `${Math.round((lv.current / lv.needed) * 100)}%` }} />
            </div>
            <p className="mt-1 text-xs text-white/70">{lv.current}/{lv.needed} XP · {t("+100 pièces au prochain niveau", "+100 coins next level")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link href="/shop"><Coins amount={game.coins} /></Link>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-sm font-bold"><Icon name="flame" size={16} className={o.streak > 0 ? "text-coral-400" : "text-white/60"} />{o.streak} {t("j", "d")}</span>
              <Link href="/shop" className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink-700 transition hover:bg-ink-50">🛍️ {t("Boutique", "Shop")}</Link>
            </div>
          </div>
        </div>
      </section>

      <Link href="/basics" className="card-shadow flex items-center gap-3 rounded-3xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] p-4 text-white transition active:scale-[0.99]">
        <span className="text-3xl">🧱</span>
        <span className="min-w-0 flex-1"><span className="block font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{t("Les bases", "The basics")}</span><span className="block text-xs text-white/85">{t("Nombres, heure, jours, émotions, règles essentielles", "Numbers, time, days, emotions, key rules")}</span></span>
        <span className="text-white/80">›</span>
      </Link>

      {/* Quick add: my own words */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/around" className="card-shadow flex items-center gap-3 rounded-3xl bg-gradient-to-br from-mint-400 to-mint-600 p-4 text-white transition active:scale-[0.98]">
          <span className="text-3xl">👀</span>
          <span className="min-w-0"><span className="block font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{t("Autour de moi", "Around me")}</span><span className="block text-xs text-white/85">{t("Nomme ce que tu vois", "Name what you see")}</span></span>
        </Link>
        <Link href="/cards/add" className="card-shadow flex items-center gap-3 rounded-3xl border border-line/70 bg-surface p-4 transition active:scale-[0.98]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ink-600 text-2xl font-bold text-white">+</span>
          <span className="min-w-0"><span className="block font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{t("Ajouter un mot", "Add a word")}</span><span className="block text-xs text-muted">{t("Mot, phrase, capture", "Word, sentence, screenshot")}</span></span>
        </Link>
      </div>

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

      <QuestList />

      <GoalsCard compact />

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
