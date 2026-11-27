"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { GRAMMAR_LESSONS, PRIORITY_LABELS, getGrammarLesson, grammarLessonForTopic, type GrammarLesson } from "@/lib/data/grammar";
import { getDb } from "@/lib/db";
import type { GrammarProgress, Mistake } from "@/lib/types";
import { Badge, LinkButton, PageHeader, Panel, ProgressBar, Ring, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";

function lessonForMistake(m: Mistake): GrammarLesson | undefined {
  if (m.id.startsWith("grammar:")) {
    const l = getGrammarLesson(m.id.slice(8));
    if (l) return l;
  }
  return grammarLessonForTopic(m.label) ?? (m.detail ? grammarLessonForTopic(m.detail) : undefined);
}

export default function GrammarPage() {
  const t = useT();
  const data = useLiveQuery(async () => {
    const db = getDb();
    const [progress, mistakes] = await Promise.all([db.grammar.toArray(), db.mistakes.where("type").equals("grammar").toArray()]);
    return { progress, mistakes };
  }, []);
  const byId = new Map<string, GrammarProgress>((data?.progress ?? []).map((p) => [p.lessonId, p]));
  const done = GRAMMAR_LESSONS.filter((l) => byId.get(l.id)?.status === "done").length;
  const nextUp = GRAMMAR_LESSONS.find((l) => byId.get(l.id)?.status !== "done");

  // Points to review: grammar mistakes whose lesson hasn't been mastered since the mistake.
  const toReview = (data?.mistakes ?? [])
    .map((m) => ({ m, lesson: lessonForMistake(m) }))
    .filter(({ m, lesson }) => {
      if (!lesson) return true;
      const p = byId.get(lesson.id);
      return !(p && p.bestScore >= 0.7 && p.lastAt > m.lastAt);
    })
    .sort((a, b) => b.m.count - a.m.count || b.m.lastAt - a.m.lastAt)
    .slice(0, 6);

  return (
    <div>
      <PageHeader title={t("Grammaire", "Grammar")} subtitle={t("Un parcours court et visuel, centré sur la conversation.", "A short, visual path focused on conversation.")} back="/cours" />

      <Panel className="flex items-center gap-4">
        <Ring value={done} max={GRAMMAR_LESSONS.length} size={76}>
          <span className="text-sm font-semibold tabular-nums">
            {done}/{GRAMMAR_LESSONS.length}
          </span>
        </Ring>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{t("Leçons validées (≥ 70 %)", "Lessons completed (≥ 70%)")}</p>
          {nextUp ? (
            <>
              <p className="mt-0.5 truncate font-semibold">{nextUp.title}</p>
              <LinkButton href={`/grammar/${nextUp.id}`} size="sm" className="mt-2">
                {byId.get(nextUp.id) ? t("Continuer", "Continue") : t("Commencer", "Start")} →
              </LinkButton>
            </>
          ) : (
            <p className="mt-1 font-semibold">{t("Parcours terminé, bravo ! Révise les leçons à tout moment.", "Path completed, well done! Review any lesson anytime.")}</p>
          )}
        </div>
      </Panel>

      {toReview.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">{t("Points à revoir", "Topics to review")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {toReview.map(({ m, lesson }) => {
              const inner = (
                <div className="flex h-full items-start gap-3 rounded-2xl border border-coral-400/40 bg-coral-100/40 p-3.5 transition hover:border-coral-400 dark:bg-coral-600/10">
                  <span className="mt-0.5 text-lg" aria-hidden>⚠️</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{lesson ? lesson.title : m.label}</p>
                    <p className="truncate text-sm text-muted">{m.detail ?? m.label}</p>
                    {m.example && <p className="mt-0.5 truncate text-xs italic text-muted">« {m.example} »</p>}
                  </div>
                  <Badge tone="coral">×{m.count}</Badge>
                </div>
              );
              return lesson ? (
                <Link key={m.id} href={`/grammar/${lesson.id}`}>
                  {inner}
                </Link>
              ) : (
                <div key={m.id}>{inner}</div>
              );
            })}
          </div>
        </section>
      )}

      {([1, 2, 3, 4] as const).map((prio) => {
        const lessons = GRAMMAR_LESSONS.filter((l) => l.priority === prio);
        const prioDone = lessons.filter((l) => byId.get(l.id)?.status === "done").length;
        const label = PRIORITY_LABELS[prio];
        return (
          <section key={prio} className="mt-8">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-600 dark:text-ink-300">
                  {prio < 4 ? t(`Priorité ${prio}`, `Priority ${prio}`) : t("Pour ne plus confondre", "Stop mixing them up")}
                </p>
                <h2 className="text-lg font-semibold">{t(label.fr, label.en)}</h2>
                <p className="text-sm text-muted">{t(label.descFr, label.descEn)}</p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-muted">
                {prioDone}/{lessons.length}
              </span>
            </div>
            <ProgressBar value={prioDone} max={lessons.length} tone="mint" className="mb-3" />
            <div className="grid gap-2 sm:grid-cols-2">
              {lessons.map((l) => {
                const p = byId.get(l.id);
                const status = p?.status === "done" ? "done" : p ? "started" : "new";
                return (
                  <Link
                    key={l.id}
                    href={`/grammar/${l.id}`}
                    className={cx(
                      "group flex items-center gap-3 rounded-2xl border bg-surface p-3.5 transition hover:border-ink-300",
                      status === "done" ? "border-mint-400/50" : "border-line",
                    )}
                  >
                    <span
                      className={cx(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        status === "done" ? "bg-mint-500 text-white" : status === "started" ? "bg-sun-100 text-amber-700 dark:bg-sun-500/20 dark:text-sun-400" : "bg-surface-2 text-muted",
                      )}
                    >
                      {status === "done" ? "✓" : status === "started" ? "…" : GRAMMAR_LESSONS.indexOf(l) + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{l.title}</p>
                      <p className="truncate text-sm text-muted">{l.titleFr}</p>
                    </div>
                    {p && p.attempts > 0 && <span className="shrink-0 text-xs tabular-nums text-muted">{Math.round(p.bestScore * 100)}%</span>}
                    <span className="text-muted transition group-hover:translate-x-0.5" aria-hidden>›</span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
