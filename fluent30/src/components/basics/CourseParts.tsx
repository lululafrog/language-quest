"use client";
import { Fragment, useState } from "react";
import { getDb, uid } from "@/lib/db";
import { recordMistake, trackActivity } from "@/lib/track";
import { useT } from "@/hooks/useT";
import { Button, Panel, ProgressBar, cx } from "@/components/ui";
import type { Course } from "@/lib/data/courses";

/** Renders **bold** segments. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((p, i) => (i % 2 ? <strong key={i} className="font-semibold text-fg">{p}</strong> : <Fragment key={i}>{p}</Fragment>))}</>;
}

export function CourseQuiz({ course }: { course: Course }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = course.quiz[i];

  if (!q) {
    const pct = score / course.quiz.length;
    return (
      <Panel className="text-center">
        <div className="text-4xl">{pct >= 0.8 ? "🏆" : pct >= 0.5 ? "👍" : "📚"}</div>
        <p className="mt-2 text-lg font-bold">{t(`${score}/${course.quiz.length} bonnes réponses`, `${score}/${course.quiz.length} correct`)}</p>
        <p className="text-sm text-muted">{pct >= 0.8 ? t("Règle maîtrisée !", "Rule mastered!") : t("Relis la partie « À retenir » et réessaie.", "Re-read the key points and try again.")}</p>
        <Button className="mt-3" variant="outline" onClick={() => { setI(0); setScore(0); setPicked(null); }}>{t("Refaire le quiz", "Retake the quiz")}</Button>
      </Panel>
    );
  }

  const choose = async (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const ok = k === q.answer;
    if (ok) setScore((s) => s + 1);
    else await recordMistake({ id: `grammar:${course.grammarId ?? `course:${course.slug}`}`, type: "grammar", label: course.title, detail: q.why });
  };
  const next = async () => {
    setPicked(null);
    if (i + 1 >= course.quiz.length) {
      await trackActivity({ grammarExercises: course.quiz.length, xp: score * 3 });
      await getDb().games.put({ id: uid("g"), gameId: `course:${course.slug}`, score, total: course.quiz.length, durationSec: 0, at: Date.now(), updatedAt: Date.now() });
    }
    setI(i + 1);
  };

  return (
    <Panel>
      <div className="mb-2 flex items-center justify-between text-sm text-muted"><span>🎯 {t("Mini-quiz", "Mini-quiz")} · {i + 1}/{course.quiz.length}</span><span>{score} ✓</span></div>
      <ProgressBar value={i} max={course.quiz.length} className="mb-4" />
      <p key={i} className="animate-pop text-lg font-semibold">{q.q}</p>
      <div className="mt-3 grid gap-2">
        {q.options.map((o, k) => (
          <button key={o} onClick={() => choose(k)} className={cx("rounded-2xl border px-4 py-3 text-left transition", picked === null ? "border-line bg-surface hover:border-ink-300" : k === q.answer ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : k === picked ? "animate-shake border-coral-500 bg-coral-100 dark:bg-coral-600/20" : "border-line opacity-60")}>
            {o}
          </button>
        ))}
      </div>
      {picked !== null && (
        <>
          <p className={cx("mt-3 rounded-xl p-3 text-sm", picked === q.answer ? "bg-mint-100/60 dark:bg-mint-600/10" : "bg-coral-100/60 dark:bg-coral-600/10")}>{picked === q.answer ? "✓ " : "✗ "}{q.why}</p>
          <Button className="mt-3 w-full" onClick={next}>{i + 1 >= course.quiz.length ? t("Voir le résultat", "See result") : t("Suivant", "Next")}</Button>
        </>
      )}
    </Panel>
  );
}
