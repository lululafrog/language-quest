"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { COURSES, getCourse } from "@/lib/data/courses";
import { getGrammarLesson } from "@/lib/data/grammar";
import { useT } from "@/hooks/useT";
import { Badge, EmptyState, PageHeader, Panel, SpeakButton } from "@/components/ui";
import { CourseQuiz, Rich } from "@/components/basics/CourseParts";

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useT();
  const course = getCourse(slug);
  if (!course) return <EmptyState icon="🤔" title={t("Cours introuvable", "Lesson not found")} />;
  const grammar = course.grammarId ? getGrammarLesson(course.grammarId) : undefined;
  const idx = COURSES.findIndex((c) => c.slug === course.slug);
  const next = COURSES[idx + 1];

  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={`${course.emoji} ${course.title}`} subtitle={course.summary} back="/courses" action={<Badge tone="ink">{course.level}</Badge>} />

      <Panel className="space-y-3 text-[15.5px] leading-relaxed">
        {course.blocks.map((b, i) => {
          switch (b.type) {
            case "p":
              return <p key={i} className="text-fg/90"><Rich text={b.text} /></p>;
            case "h":
              return <h2 key={i} className="pt-2 text-lg font-bold">{b.text}</h2>;
            case "tip":
              return <p key={i} className="rounded-2xl bg-ink-50 p-3 text-sm dark:bg-ink-900/40">💡 <Rich text={b.text} /></p>;
            case "examples":
              return (
                <ul key={i} className="space-y-1.5">
                  {b.items.map((ex) => (
                    <li key={ex.en} className="flex items-start gap-2 rounded-2xl bg-surface-2/70 px-3 py-2">
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{ex.en}</span>
                        <span className="block text-sm text-muted">{ex.fr}{ex.note && <em className="ml-1 text-ink-600 dark:text-ink-300">· {ex.note}</em>}</span>
                      </span>
                      <SpeakButton text={ex.en} size={16} />
                    </li>
                  ))}
                </ul>
              );
            case "table":
              return (
                <div key={i} className="overflow-x-auto rounded-2xl border border-line">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted"><tr>{b.head.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
                    <tbody>{b.rows.map((r, ri) => <tr key={ri} className="border-t border-line">{r.map((c, ci) => <td key={ci} className={ci === 0 ? "px-3 py-2 font-medium" : "px-3 py-2"}>{c}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              );
          }
        })}
      </Panel>

      <Panel className="border-mint-400/60 bg-mint-100/40 dark:bg-mint-600/10">
        <p className="font-bold">✅ {t("À retenir", "Key points")}</p>
        <ul className="mt-1 list-inside list-disc space-y-1 text-sm">{course.retenir.map((r) => <li key={r}>{r}</li>)}</ul>
      </Panel>

      <Panel>
        <p className="mb-2 font-bold">⚠️ {t("Les erreurs des francophones", "Typical French mistakes")}</p>
        <ul className="space-y-2">
          {course.mistakes.map((m) => (
            <li key={m.wrong} className="rounded-2xl bg-surface-2/70 p-3 text-sm">
              <p><span className="text-coral-600 line-through decoration-2">{m.wrong}</span> → <span className="font-semibold text-mint-600">{m.right}</span></p>
              <p className="mt-0.5 text-muted">{m.why}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <CourseQuiz course={course} />

      <div className="flex flex-wrap gap-2">
        {grammar && <Link href={`/grammar/${grammar.id}`} className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-ink-300">✍️ {t("Leçon & exercices :", "Lesson & exercises:")} {grammar.title}</Link>}
        {course.link && <Link href={course.link.href} className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-ink-300">→ {course.link.label}</Link>}
        {next && <Link href={`/courses/${next.slug}`} className="ml-auto rounded-xl bg-ink-600 px-4 py-2.5 text-sm font-semibold text-white">{t("Cours suivant", "Next lesson")} : {next.emoji} {next.title} →</Link>}
      </div>
    </article>
  );
}
