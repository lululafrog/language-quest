"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useState } from "react";
import { Badge, PageHeader, Panel, ProgressBar, cx } from "@/components/ui";
import { levelOverview, vocabDashboard } from "@/lib/vocab/engine";
import { levelLabel, type LevelEstimate } from "@/lib/vocab/core";
import { useT } from "@/hooks/useT";
import { getDb } from "@/lib/db";
import { CATEGORY_LABELS, GAMES, gameById, type GameCategory, type GameDef } from "@/lib/games/registry";
import type { GameResult, Mistake } from "@/lib/types";

function recommend(mistakes: Mistake[], results: GameResult[]): { game: GameDef; reasonFr: string; reasonEn: string } {
  const since = Date.now() - 14 * 86400000;
  const recent = mistakes.filter((m) => m.lastAt >= since);
  const weight = (type: Mistake["type"]) => recent.filter((m) => m.type === type).reduce((a, m) => a + m.count, 0);
  const tenseErrors = recent.filter((m) => m.type === "grammar" && m.id.startsWith("grammar:") && !m.id.startsWith("grammar:err") && !m.id.startsWith("grammar:gap")).length;
  const scores: [string, number, string, string][] = [
    ["conjugation", weight("conjugation"), "Tu fais des erreurs de conjugaison récemment.", "Recent conjugation mistakes."],
    [tenseErrors > 2 ? "tenses" : "errors", weight("grammar"), "Des points de grammaire reviennent dans tes erreurs.", "Grammar points keep coming up in your mistakes."],
    ["hangman", weight("spelling") * 1.2, "Travaille l'orthographe des mots que tu confonds.", "Work on the spelling of tricky words."],
    ["pronunciation", weight("pronunciation") * 1.2, "Quelques mots sont à retravailler à l'oral.", "Some words need speaking practice."],
    ["fr-en", weight("vocab") * 0.8, "Tes mots oubliés : passe à la production active.", "Your forgotten words: switch to active recall."],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  if (scores[0][1] >= 2) return { game: gameById(scores[0][0])!, reasonFr: scores[0][2], reasonEn: scores[0][3] };
  // Otherwise: the game played least recently.
  const last = new Map<string, number>();
  for (const r of results) last.set(r.gameId, Math.max(last.get(r.gameId) ?? 0, r.at));
  const g = [...GAMES].sort((a, b) => (last.get(a.id) ?? 0) - (last.get(b.id) ?? 0))[0];
  return { game: g, reasonFr: last.has(g.id) ? "Le jeu que tu n'as pas fait depuis le plus longtemps." : "Un jeu que tu n'as pas encore essayé.", reasonEn: last.has(g.id) ? "The game you haven't played for the longest." : "A game you haven't tried yet." };
}

function VocabHeader() {
  const t = useT();
  const [info, setInfo] = useState<{ est: LevelEstimate; learned: number; reviewed: number; toReview: number } | null>(null);
  const logs = useLiveQuery(() => getDb().reviewLogs.count(), []);
  useEffect(() => {
    Promise.all([levelOverview(), vocabDashboard()]).then(([est, d]) => setInfo({ est, learned: d.today.learned, reviewed: d.today.reviewed, toReview: d.counts.review }));
  }, [logs]);
  if (!info) return null;
  const today =
    info.learned || info.reviewed
      ? t(`Aujourd'hui : ${info.learned} nouveau${info.learned > 1 ? "x" : ""} mot${info.learned > 1 ? "s" : ""} appris, ${info.reviewed} révisé${info.reviewed > 1 ? "s" : ""}.`, `Today: ${info.learned} new, ${info.reviewed} reviewed.`)
      : info.toReview
        ? t(`${info.toReview} mots à réviser t'attendent.`, `${info.toReview} words to review.`)
        : t("Chaque jeu te propose d'apprendre de nouveaux mots ou de réviser les tiens.", "Each game: learn new words or review yours.");
  return (
    <Link href="/games/progress" className="mb-4 block">
      <Panel className="transition hover:border-ink-300">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-semibold">{levelLabel(info.est.state)}</span>
          <span className="text-xs font-medium text-ink-600 dark:text-ink-300">{t("Mes progrès ›", "My progress ›")}</span>
        </div>
        <ProgressBar value={info.est.progress} tone="mint" className="mt-2" />
        <p className="mt-2 text-sm text-muted">{today}</p>
      </Panel>
    </Link>
  );
}

export default function GamesHub() {
  const t = useT();
  const [cat, setCat] = useState<GameCategory | "all">("all");
  const results = useLiveQuery(() => getDb().games.toArray(), []);
  const mistakes = useLiveQuery(() => getDb().mistakes.toArray(), []);

  const stats = useMemo(() => {
    const m = new Map<string, { best: number; plays: number }>();
    for (const r of results ?? []) {
      const acc = r.total ? r.score / r.total : 0;
      const cur = m.get(r.gameId) ?? { best: 0, plays: 0 };
      m.set(r.gameId, { best: Math.max(cur.best, acc), plays: cur.plays + 1 });
    }
    return m;
  }, [results]);

  const rec = results && mistakes ? recommend(mistakes, results) : null;
  const cats: (GameCategory | "all")[] = ["all", "vocabulary", "listening", "grammar", "verbs", "speaking"];
  const shown = GAMES.filter((g) => cat === "all" || g.category === cat);
  const todayPlays = (results ?? []).filter((r) => r.at >= new Date().setHours(0, 0, 0, 0)).length;

  return (
    <div>
      <PageHeader
        title={t("Mini-jeux", "Games")}
        subtitle={t("Avant chaque jeu de vocabulaire : apprendre de nouveaux mots ou réviser les tiens. Tout est enregistré et revient au bon moment.", "Before each vocabulary game: learn new words or review yours.")}
        back="/practice"
        action={todayPlays > 0 ? <Badge tone="mint">{todayPlays} {t("aujourd'hui", "today")}</Badge> : undefined}
      />

      <VocabHeader />

      {rec && (
        <Link href={`/games/${rec.game.id}`} className="mb-5 block">
          <Panel className="flex items-center gap-4 border-ink-200 bg-gradient-to-br from-ink-50 to-surface transition hover:border-ink-400 dark:border-ink-800 dark:from-ink-900/40">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ink-600 text-3xl">{rec.game.emoji}</div>
            <div className="min-w-0 flex-1">
              <Badge tone="ink">✨ {t("Recommandé pour toi", "Recommended for you")}</Badge>
              <p className="mt-1 font-semibold">{t(rec.game.titleFr, rec.game.titleEn)}</p>
              <p className="text-sm text-muted">{t(rec.reasonFr, rec.reasonEn)}</p>
            </div>
            <span className="text-2xl text-ink-500">›</span>
          </Panel>
        </Link>
      )}

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cx("shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition", cat === c ? "border-ink-600 bg-ink-600 text-white" : "border-line bg-surface text-muted hover:text-fg")}>
            {c === "all" ? t("Tous", "All") : t(CATEGORY_LABELS[c].fr, CATEGORY_LABELS[c].en)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((g) => {
          const s = stats.get(g.id);
          return (
            <Link key={g.id} href={`/games/${g.id}`} className="group flex flex-col rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-sm">
              <div className="flex items-start justify-between">
                <span className="text-3xl transition group-hover:scale-110">{g.emoji}</span>
                {s && <Badge tone={s.best >= 0.9 ? "mint" : s.best >= 0.6 ? "ink" : "gray"}>{Math.round(s.best * 100)}%</Badge>}
              </div>
              <p className="mt-3 font-semibold leading-tight">{t(g.titleFr, g.titleEn)}</p>
              <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted">{t(g.descFr, g.descEn)}</p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
                <span>{t(CATEGORY_LABELS[g.category].fr, CATEGORY_LABELS[g.category].en)}</span>
                <span>·</span>
                <span>~{g.minutes} min</span>
                {s && (
                  <>
                    <span>·</span>
                    <span>{s.plays}×</span>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
