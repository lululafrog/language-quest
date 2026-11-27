"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getGrammarLesson, nextGrammarLesson, PRIORITY_LABELS, type GrammarLesson } from "@/lib/data/grammar";
import { getDb } from "@/lib/db";
import { trackActivity, recordMistake } from "@/lib/track";
import { Timeline } from "@/components/grammar/Timeline";
import { ExerciseRunner } from "@/components/grammar/Exercises";
import { Badge, Button, EmptyState, LinkButton, PageHeader, Panel, Ring, SpeakButton } from "@/components/ui";
import { useT } from "@/hooks/useT";

type Mode = "lesson" | "practice" | "result";

export default function GrammarLessonPage() {
  const params = useParams<{ lesson: string }>();
  const lesson = getGrammarLesson(params.lesson);
  const t = useT();
  if (!lesson) {
    return (
      <div>
        <PageHeader title={t("Leçon introuvable", "Lesson not found")} back="/grammar" />
        <EmptyState icon="🔎" title={t("Cette leçon n'existe pas.", "This lesson doesn't exist.")}>
          <Link href="/grammar" className="text-ink-600 underline">{t("Retour au parcours", "Back to the path")}</Link>
        </EmptyState>
      </div>
    );
  }
  return <LessonView key={lesson.id} lesson={lesson} />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
      {children}
    </section>
  );
}

function LessonView({ lesson }: { lesson: GrammarLesson }) {
  const t = useT();
  const [mode, setMode] = useState<Mode>("lesson");
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const progress = useLiveQuery(() => getDb().grammar.get(lesson.id), [lesson.id]);
  const next = nextGrammarLesson(lesson.id);
  const prio = PRIORITY_LABELS[lesson.priority];

  async function start() {
    const db = getDb();
    const cur = await db.grammar.get(lesson.id);
    if (!cur) await db.grammar.put({ lessonId: lesson.id, status: "started", bestScore: 0, attempts: 0, lastAt: Date.now(), updatedAt: Date.now() });
    setRunId((r) => r + 1);
    setMode("practice");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function finish(results: boolean[]) {
    const correct = results.filter(Boolean).length;
    const total = lesson.exercises.length;
    const score = total ? correct / total : 0;
    const db = getDb();
    const cur = await db.grammar.get(lesson.id);
    await db.grammar.put({
      lessonId: lesson.id,
      status: score >= 0.7 || cur?.status === "done" ? "done" : "started",
      bestScore: Math.max(score, cur?.bestScore ?? 0),
      attempts: (cur?.attempts ?? 0) + 1,
      lastAt: Date.now(),
      updatedAt: Date.now(),
    });
    await trackActivity({ grammarExercises: total, xp: correct * 2 + (score >= 0.7 ? 10 : 0) });
    if (correct < total) {
      const wrong = lesson.exercises.filter((_, i) => !results[i]);
      const first = wrong[0];
      const example = first ? ("sentence" in first ? first.sentence : "answer" in first && typeof first.answer === "string" ? first.answer : first.type === "mcq" ? first.prompt : undefined) : undefined;
      await recordMistake({ id: `grammar:${lesson.id}`, type: "grammar", label: lesson.titleFr, detail: `${total - correct}/${total} ${total - correct > 1 ? "erreurs" : "erreur"} — ${lesson.title}`, example });
    }
    setResult({ correct, total });
    setMode("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (mode === "practice") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button onClick={() => setMode("lesson")} className="text-sm text-muted hover:text-fg">
            ← {t("Revoir la leçon", "Back to the lesson")}
          </button>
          <span className="truncate text-sm font-medium">{lesson.title}</span>
        </div>
        <ExerciseRunner key={runId} exercises={lesson.exercises} onFinish={finish} />
      </div>
    );
  }

  if (mode === "result" && result) {
    const pct = Math.round((result.correct / result.total) * 100);
    const passed = pct >= 70;
    return (
      <div className="mx-auto max-w-lg animate-fade text-center">
        <PageHeader title={lesson.title} subtitle={lesson.titleFr} back="/grammar" />
        <Panel className="flex flex-col items-center py-8">
          <Ring value={result.correct} max={result.total} size={120} stroke={10} tone={passed ? "#2fbf9a" : "#ff7a6b"}>
            <span className="text-3xl font-semibold tabular-nums">{pct}%</span>
          </Ring>
          <p className="mt-4 text-lg font-semibold">
            {passed ? t("Leçon validée !", "Lesson completed!") : t("Encore un petit effort", "Almost there")}
          </p>
          <p className="mt-1 text-sm text-muted">
            {result.correct}/{result.total} {t("bonnes réponses", "correct answers")}
            {progress && progress.bestScore > 0 && ` · ${t("meilleur score", "best")} ${Math.round(progress.bestScore * 100)}%`}
          </p>
          {!passed && <p className="mt-2 max-w-xs text-sm text-muted">{t("Relis les erreurs fréquentes, puis réessaie. Ce point a été ajouté à « points à revoir ».", "Re-read the common mistakes, then try again. This topic was added to your review list.")}</p>}
        </Panel>
        <div className="mt-4 grid gap-2">
          {passed && next ? (
            <LinkButton href={`/grammar/${next.id}`} size="lg">
              {t("Leçon suivante", "Next lesson")} : {next.title} →
            </LinkButton>
          ) : null}
          <Button variant={passed ? "secondary" : "primary"} size="lg" onClick={start}>
            {t("Refaire les exercices", "Retry the exercises")}
          </Button>
          <Button variant="ghost" onClick={() => setMode("lesson")}>
            {t("Revoir la leçon", "Review the lesson")}
          </Button>
          <LinkButton href="/grammar" variant="ghost">
            {t("Retour au parcours", "Back to the path")}
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={lesson.title}
        subtitle={lesson.titleFr}
        back="/grammar"
        action={
          progress?.status === "done" ? (
            <Badge tone="mint">✓ {Math.round(progress.bestScore * 100)}%</Badge>
          ) : (
            <Badge tone="gray">{t(prio.fr, prio.en)}</Badge>
          )
        }
      />

      <Panel className="border-ink-200 bg-ink-50/60 dark:border-ink-800 dark:bg-ink-900/30">
        <p className="text-[16px] font-medium leading-relaxed">{lesson.summaryFr}</p>
      </Panel>

      <Section title={t("Quand l'utiliser", "When to use it")}>
        <ul className="space-y-2">
          {lesson.when.map((w, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-500" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </Section>

      {lesson.timeline && (
        <Section title={t("Sur la ligne du temps", "On the timeline")}>
          <Timeline spec={lesson.timeline} labels={{ past: t("passé", "past"), now: t("maintenant", "now"), future: t("futur", "future") }} />
        </Section>
      )}

      <Section title={t("Construction", "Form")}>
        <div className="grid gap-2 sm:grid-cols-3">
          {lesson.construction.map((c, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600 dark:text-ink-300">{c.label}</p>
              <p className="mt-1.5 font-mono text-[13px] leading-snug">{c.formula}</p>
              <div className="mt-2 flex items-center gap-1 border-t border-line pt-2">
                <p className="flex-1 text-[14.5px] italic">{c.example}</p>
                <SpeakButton text={c.example} size={16} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("En situation", "In context")}>
        <Panel className="divide-y divide-line p-0 sm:p-0">
          {lesson.examples.map((e, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-3">
              <div className="flex-1">
                <p className="text-[15.5px] font-medium">{e.en}</p>
                <p className="text-sm text-muted">{e.fr}</p>
              </div>
              <SpeakButton text={e.en} />
            </div>
          ))}
        </Panel>
      </Section>

      <Section title={t("Différences avec le français", "Differences with French")}>
        <div className="space-y-2">
          {lesson.frenchDiff.map((d, i) => (
            <div key={i} className="flex gap-3 rounded-xl bg-surface-2 px-3.5 py-3 text-[14.5px] leading-relaxed">
              <span aria-hidden>🇫🇷</span>
              <span>{d}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("Erreurs fréquentes des francophones", "Common mistakes by French speakers")}>
        <div className="space-y-2">
          {lesson.mistakes.map((m, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-3.5">
              <p className="text-[15px] text-coral-600 line-through decoration-coral-400/70 dark:text-coral-400">✗ {m.wrong}</p>
              <p className="mt-1 text-[15px] font-medium text-mint-600 dark:text-mint-400">✓ {m.right}</p>
              <p className="mt-1 text-sm text-muted">{m.why}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="sticky bottom-20 z-10 mt-8 md:bottom-4">
        <Button size="lg" className="w-full shadow-lg" onClick={start}>
          {t("S'entraîner", "Practise")} · {lesson.exercises.length} {t("exercices", "exercises")}
        </Button>
      </div>
      {next && (
        <p className="mt-4 text-center text-sm text-muted">
          {t("Ensuite", "Next")} :{" "}
          <Link href={`/grammar/${next.id}`} className="font-medium text-ink-600 hover:underline dark:text-ink-300">
            {next.title}
          </Link>
        </p>
      )}
    </div>
  );
}
