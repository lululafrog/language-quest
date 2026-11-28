"use client";
// Screen shown before every vocabulary game: one tap on "new words" or "review" starts the game.
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProgressBar, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { getSettings } from "@/lib/db";
import { levelOverview, reviewCount, type WordMode } from "@/lib/vocab/engine";
import { levelLabel, type LevelEstimate } from "@/lib/vocab/core";
import { THEME_GROUPS } from "@/lib/vocab/words";
import { GameHeader } from "./common";

export function LevelIndicator({ est, className }: { est: LevelEstimate; className?: string }) {
  return (
    <div className={cx("rounded-2xl border border-line bg-surface p-3", className)}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold">{levelLabel(est.state)}</span>
        <span className="text-xs text-muted tabular-nums">{Math.round(est.progress * 100)} %</span>
      </div>
      <ProgressBar value={est.progress} tone="mint" className="mt-2" />
    </div>
  );
}

export function ModePicker({ gameId, onStart }: { gameId: string; onStart: (mode: WordMode, theme?: string) => void }) {
  const t = useT();
  const [theme, setTheme] = useState<string | undefined>(undefined);
  const [last, setLast] = useState<WordMode | null>(null);
  const [est, setEst] = useState<LevelEstimate | null>(null);
  const [rc, setRc] = useState<{ toReview: number; total: number } | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      setTheme(s.gamePrefs?.theme);
      setLast(s.gamePrefs?.mode ?? null);
    });
    levelOverview().then(setEst);
  }, []);
  useEffect(() => {
    reviewCount(theme).then(setRc);
  }, [theme]);

  const level = est?.state.down ? `${est.state.level} (consolidation)` : est?.state.level;
  const reviewText = !rc
    ? "…"
    : rc.total === 0
      ? t("Tu n'as pas encore de mots : on commence avec des mots de ton niveau.", "No words yet: we'll start with words at your level.")
      : rc.toReview > 0
        ? t(`${rc.toReview} mot${rc.toReview > 1 ? "s" : ""} à revoir : tes erreurs et tes mots enregistrés en priorité.`, `${rc.toReview} words to review.`)
        : t("Rien d'urgent : on reprend tes mots les moins solides.", "Nothing urgent: your least solid words.");

  return (
    <div className="animate-fade">
      <GameHeader gameId={gameId} />
      {est && <LevelIndicator est={est} className="mb-4" />}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => onStart("new", theme)}
          className={cx("group rounded-3xl border-2 bg-gradient-to-br from-sun-100 to-surface p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] dark:from-sun-500/15", last === "new" ? "border-sun-500" : "border-transparent")}
        >
          <span className="text-4xl transition group-hover:scale-110">✨</span>
          <p className="mt-2 text-lg font-semibold">{t("Apprendre de nouveaux mots", "Learn new words")}</p>
          <p className="mt-1 text-sm text-muted">{t(`Des mots que tu ne connais pas encore, adaptés à ton niveau${level ? ` (${level})` : ""}.`, "Words you don't know yet, at your level.")}</p>
        </button>
        <button
          onClick={() => onStart("review", theme)}
          className={cx("group rounded-3xl border-2 bg-gradient-to-br from-mint-100 to-surface p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] dark:from-mint-600/15", last === "review" ? "border-mint-500" : "border-transparent")}
        >
          <span className="text-4xl transition group-hover:scale-110">🔁</span>
          <p className="mt-2 text-lg font-semibold">{t("Réviser mon vocabulaire", "Review my vocabulary")}</p>
          <p className="mt-1 text-sm text-muted">{reviewText}</p>
        </button>
      </div>

      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">{t("Thème (facultatif)", "Theme (optional)")}</p>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[{ id: undefined as string | undefined, fr: "Tous les univers" }, ...THEME_GROUPS].map((g) => (
          <button
            key={g.id ?? "all"}
            onClick={() => setTheme(g.id)}
            className={cx("shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition", theme === g.id ? "border-ink-600 bg-ink-600 text-white" : "border-line bg-surface text-muted hover:text-fg")}
          >
            {g.fr}
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-muted">
        <Link href="/games/progress" className="underline-offset-2 hover:underline">{t("Voir mes progrès de vocabulaire ›", "See my vocabulary progress ›")}</Link>
      </p>
    </div>
  );
}
