"use client";
// Vocabulary dashboard: what the learner has discovered, mastered and must review — by level, by theme, over time.
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useState } from "react";
import { Badge, LinkButton, PageHeader, Panel, ProgressBar, cx } from "@/components/ui";
import { LevelIndicator } from "@/components/games/ModePicker";
import { useT } from "@/hooks/useT";
import { getDb, todayKey } from "@/lib/db";
import { computeStreak } from "@/lib/track";
import { CEFR_LEVELS, STATUS_INFO, STATUS_ORDER, type LevelEstimate, type WordStatus } from "@/lib/vocab/core";
import { levelOverview, vocabDashboard, type VocabDashboard } from "@/lib/vocab/engine";
import { THEME_GROUPS, lexiconCountByLevel } from "@/lib/vocab/words";
import { gameById } from "@/lib/games/registry";

const STATUS_BG: Record<WordStatus, string> = {
  new: "bg-line",
  learning: "bg-ink-400",
  review: "bg-coral-500",
  good: "bg-mint-400",
  durable: "bg-mint-600",
};

const WHERE: Record<string, string> = { mission: "Missions", verbs: "Verbes", exercise: "Exercices", game: "Jeux", reader: "Livres" };
const whereLabel = (w: string) => gameById(w)?.titleFr ?? WHERE[w] ?? w;
const fmtDate = (ms: number) => new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

function nextReviewLabel(ms?: number) {
  if (!ms) return "—";
  const d = Math.round((ms - Date.now()) / 86_400_000);
  if (d <= 0) return "aujourd'hui";
  if (d === 1) return "demain";
  if (d < 31) return `dans ${d} j`;
  return fmtDate(ms);
}

export default function VocabProgress() {
  const t = useT();
  const [data, setData] = useState<VocabDashboard | null>(null);
  const [est, setEst] = useState<LevelEstimate | null>(null);
  const [filter, setFilter] = useState<WordStatus | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const activity = useLiveQuery(() => getDb().activity.toArray(), []);
  const cardsCount = useLiveQuery(() => getDb().cards.count(), []);
  const logsCount = useLiveQuery(() => getDb().reviewLogs.count(), []);

  useEffect(() => {
    vocabDashboard().then(setData);
    levelOverview().then(setEst);
  }, [cardsCount, logsCount]);

  const lexCount = useMemo(() => lexiconCountByLevel(), []);
  const streak = activity ? computeStreak(activity) : 0;

  // mastered words over the last 30 days (daily snapshots, carried forward on days without activity)
  const history = useMemo(() => {
    if (!activity) return [];
    const by = new Map(activity.filter((a) => a.masteredWords !== undefined).map((a) => [a.date, a.masteredWords!]));
    const out: { date: string; v: number | null }[] = [];
    let lastV: number | null = null;
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = todayKey(d);
      if (by.has(k)) lastV = by.get(k)!;
      out.push({ date: k, v: lastV });
    }
    return out;
  }, [activity]);

  if (!data)
    return (
      <div>
        <PageHeader title={t("Mes progrès de vocabulaire", "My vocabulary progress")} back="/games" />
        <p className="py-10 text-center text-muted">…</p>
      </div>
    );

  const c = data.counts;
  const today = data.today;
  const todayMsg =
    today.learned || today.reviewed
      ? t(
          `Aujourd'hui, tu as appris ${today.learned} nouveau${today.learned > 1 ? "x" : ""} mot${today.learned > 1 ? "s" : ""} et révisé ${today.reviewed} mot${today.reviewed > 1 ? "s" : ""}.`,
          `Today you learned ${today.learned} new words and reviewed ${today.reviewed}.`,
        )
      : c.review > 0
        ? t(`${c.review} mots t'attendent pour une petite révision aujourd'hui.`, `${c.review} words are waiting for a review.`)
        : t("Une partie de 3 minutes suffit pour apprendre tes premiers mots du jour.", "A 3-minute game is enough to learn today's first words.");
  const shown = data.words
    .filter((w) => filter === "all" || w.status === filter)
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || (a.nextReview ?? Infinity) - (b.nextReview ?? Infinity));
  const maxHist = Math.max(1, ...history.map((h) => h.v ?? 0));

  return (
    <div className="space-y-4">
      <PageHeader title={t("Mes progrès de vocabulaire", "My vocabulary progress")} back="/games" action={streak > 0 ? <Badge tone="coral">🔥 {streak} {t("j", "d")}</Badge> : undefined} />

      <Panel className="bg-gradient-to-br from-sun-100 to-surface dark:from-sun-500/15">
        <p className="text-lg font-semibold leading-snug">{todayMsg}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <LinkButton href="/games/mcq?mode=review" size="sm">🔁 {t("Réviser maintenant", "Review now")}</LinkButton>
          <LinkButton href="/games/pairs?mode=new" size="sm" variant="secondary">✨ {t("Nouveaux mots", "New words")}</LinkButton>
        </div>
      </Panel>

      {est && <LevelIndicator est={est} />}

      <div className="grid grid-cols-3 gap-2">
        {[
          { v: c.total, l: t("découverts", "discovered"), tone: "" },
          { v: c.mastered, l: t("maîtrisés", "mastered"), tone: "text-mint-600" },
          { v: c.review, l: t("à réviser", "to review"), tone: "text-coral-600" },
        ].map((x) => (
          <Panel key={x.l} className="p-3 text-center">
            <div className={cx("text-2xl font-semibold tabular-nums", x.tone)}>{x.v}</div>
            <div className="text-xs text-muted">{x.l}</div>
          </Panel>
        ))}
      </div>

      {c.total > 0 && (
        <Panel>
          <h2 className="mb-2 font-semibold">{t("Où en sont tes mots", "Where your words are")}</h2>
          <div className="flex h-3 overflow-hidden rounded-full" role="img" aria-label={STATUS_ORDER.map((s) => `${STATUS_INFO[s].label} : ${c[s]}`).join(", ")}>
            {STATUS_ORDER.map((s) => (c[s] ? <div key={s} className={STATUS_BG[s]} style={{ width: `${(c[s] / c.total) * 100}%` }} /> : null))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
            {STATUS_ORDER.map((s) => (
              <li key={s} className="flex items-center gap-2">
                <span className={cx("h-2.5 w-2.5 shrink-0 rounded-full", STATUS_BG[s])} />
                <span className="flex-1 truncate">{STATUS_INFO[s].label}</span>
                <span className="tabular-nums text-muted">{c[s]}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel>
        <h2 className="font-semibold">{t("Progression par niveau", "Progress by level")}</h2>
        <p className="mb-3 text-xs text-muted">{t("Mots bien maîtrisés / mots du niveau dans la base de l'application.", "Well-mastered words / words of that level in the app.")}</p>
        <ul className="space-y-2.5">
          {CEFR_LEVELS.map((l) => (
            <li key={l}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold">{l}</span>
                <span className="text-xs text-muted tabular-nums">
                  {data.byLevel[l].mastered} / {lexCount[l]} · {data.byLevel[l].words} {t("découverts", "discovered")}
                </span>
              </div>
              <ProgressBar value={data.byLevel[l].mastered} max={Math.max(1, lexCount[l])} tone="mint" className="mt-1" />
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <h2 className="mb-3 font-semibold">{t("Progression par thème", "Progress by theme")}</h2>
        <ul className="space-y-2.5">
          {THEME_GROUPS.map((g) => {
            const th = data.byTheme.find((x) => x.id === g.id)!;
            return (
              <li key={g.id}>
                <div className="flex items-baseline justify-between text-sm">
                  <Link href={`/games/mcq?mode=new&theme=${g.id}`} className="hover:underline">{g.emoji} {g.fr}</Link>
                  <span className="text-xs text-muted tabular-nums">{th.mastered} / {th.words}</span>
                </div>
                <ProgressBar value={th.mastered} max={Math.max(1, th.words)} tone="ink" className="mt-1" />
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel>
        <h2 className="font-semibold">{t("Évolution des mots maîtrisés", "Mastered words over time")}</h2>
        <p className="mb-3 text-xs text-muted">{t("30 derniers jours (relevé quotidien à partir de ton premier passage ici).", "Last 30 days.")}</p>
        {history.some((h) => h.v !== null) ? (
          <div className="flex h-24 items-end gap-[3px]" role="img" aria-label={t(`Mots maîtrisés aujourd'hui : ${c.mastered}`, `Mastered today: ${c.mastered}`)}>
            {history.map((h) => (
              <div key={h.date} title={`${h.date} : ${h.v ?? "—"}`} className={cx("flex-1 rounded-t-sm", h.v === null ? "bg-line/50" : "bg-mint-500")} style={{ height: `${h.v === null ? 4 : Math.max(4, (h.v / maxHist) * 100)}%` }} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{t("Le graphique se remplit au fil des jours.", "The chart fills up day by day.")}</p>
        )}
      </Panel>

      <Panel>
        <h2 className="font-semibold">{t("Mon vocabulaire", "My vocabulary")}</h2>
        <p className="mb-3 text-xs text-muted">{t("Une seule fiche par mot, quel que soit l'endroit où tu l'as rencontré (jeux, livres, cours, photos…).", "One entry per word, wherever you met it.")}</p>
        <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
          {(["all", ...STATUS_ORDER] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={cx("shrink-0 rounded-full border px-3 py-1 text-xs font-medium", filter === s ? "border-ink-600 bg-ink-600 text-white" : "border-line text-muted")}>
              {s === "all" ? t(`Tous (${c.total})`, `All (${c.total})`) : `${STATUS_INFO[s].short} (${c[s]})`}
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">{t("Aucun mot ici pour l'instant.", "No words here yet.")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {shown.slice(0, 200).map((w) => (
              <li key={w.card.id}>
                <button className="flex w-full items-center gap-2 py-2.5 text-left" onClick={() => setOpen(open === w.card.id ? null : w.card.id)} aria-expanded={open === w.card.id}>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{w.card.term}</span>
                    <span className="ml-2 text-sm text-muted">{w.card.fr.split(/[,;]/)[0]}</span>
                  </div>
                  <Badge tone="gray">{w.level}</Badge>
                  <Badge tone={STATUS_INFO[w.status].tone}>{STATUS_INFO[w.status].short}</Badge>
                </button>
                {open === w.card.id && (
                  <dl className="mb-3 grid animate-fade grid-cols-2 gap-x-3 gap-y-1 rounded-xl bg-surface-2 p-3 text-xs">
                    <dt className="text-muted">{t("Traduction", "Translation")}</dt><dd>{w.card.fr}</dd>
                    <dt className="text-muted">{t("Niveau", "Level")}</dt><dd>{w.level}</dd>
                    <dt className="text-muted">{t("Thème", "Theme")}</dt><dd>{THEME_GROUPS.find((g) => w.card.themes.some((x) => g.themes.includes(x)))?.fr ?? w.card.themes[0] ?? "—"}</dd>
                    <dt className="text-muted">{t("Découvert le", "Discovered")}</dt><dd>{fmtDate(w.card.createdAt)}</dd>
                    <dt className="text-muted">{t("Bonnes réponses", "Correct")}</dt><dd>{w.correct}</dd>
                    <dt className="text-muted">{t("Erreurs", "Mistakes")}</dt><dd>{w.wrong}</dd>
                    <dt className="text-muted">{t("Maîtrise", "Mastery")}</dt><dd>{STATUS_INFO[w.status].label}</dd>
                    <dt className="text-muted">{t("Prochaine révision", "Next review")}</dt><dd>{nextReviewLabel(w.nextReview)}</dd>
                    <dt className="text-muted">{t("Rencontré dans", "Met in")}</dt>
                    <dd>{[...(w.card.seenIn ?? []).map(whereLabel), sourceLabel(w.card.source)].filter((x, i, a) => x && a.indexOf(x) === i).join(", ")}</dd>
                  </dl>
                )}
              </li>
            ))}
          </ul>
        )}
        {shown.length > 200 && <p className="mt-2 text-center text-xs text-muted">{t(`Les 200 premiers sur ${shown.length}.`, `First 200 of ${shown.length}.`)}</p>}
      </Panel>
    </div>
  );
}

function sourceLabel(s: string): string {
  return (
    { seed: "Nouveaux mots", user: "Ajout manuel", reader: "Livres", conversation: "Conversations", translator: "Traducteur", verbs: "Verbes", grammar: "Cours", around: "Autour de moi", reallife: "Real Life English", memory: "Photos", journal: "Journal", mission: "Missions", game: "Jeux" } as Record<string, string>
  )[s] ?? s;
}
