"use client";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { getBasicLesson, allItems, BASIC_LESSONS } from "@/lib/data/basics";
import { speak } from "@/lib/speech";
import { useT } from "@/hooks/useT";
import { EmptyState, PageHeader, Panel, SpeakButton, cx } from "@/components/ui";
import { Visual } from "@/components/basics/Visual";
import { AddAllButton, ClockLab, LessonQuiz, NumberDictation } from "@/components/basics/Exercises";
import { FamilyTree, FAMILY_NODES, TimeLine, TIMELINE_MARKS } from "@/components/basics/Diagrams";

export default function BasicLessonPage() {
  const { lesson: id } = useParams<{ lesson: string }>();
  const t = useT();
  const lesson = getBasicLesson(id);
  const [familyActive, setFamilyActive] = useState<string>();
  const [timeActive, setTimeActive] = useState<number>();
  if (!lesson) return <EmptyState icon="🤔" title={t("Leçon introuvable", "Lesson not found")} />;
  const items = allItems(lesson);
  const idx = BASIC_LESSONS.findIndex((l) => l.id === lesson.id);
  const next = BASIC_LESSONS[idx + 1];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={`${lesson.emoji} ${t(lesson.title, lesson.titleEn)}`} back="/basics" />
      <div className={cx("rounded-3xl bg-gradient-to-br p-4 text-white shadow-lg", lesson.tone)}>
        <p className="text-[15px] leading-relaxed">{lesson.intro}</p>
      </div>

      {lesson.special === "clock" && <ClockLab />}
      {lesson.special === "numbers" && <NumberDictation />}
      {lesson.special === "family" && (
        <Panel className="flex flex-col items-center">
          <FamilyTree active={familyActive} onPick={(pid) => { setFamilyActive(pid); const p = FAMILY_NODES.find((n) => n.id === pid); if (p) speak(p.en.split(" (")[0]); }} />
          {familyActive && <p className="mt-1 text-center text-sm">{(() => { const p = FAMILY_NODES.find((n) => n.id === familyActive)!; return <><b>{p.en}</b> = {p.fr}</>; })()}</p>}
        </Panel>
      )}
      {lesson.special === "timeline" && (
        <Panel>
          <TimeLine active={timeActive} onPick={(i) => { setTimeActive(i); speak(TIMELINE_MARKS[i].en.split(" / ")[0]); }} />
          {timeActive !== undefined && <p className="text-center text-sm"><b>{TIMELINE_MARKS[timeActive].en}</b> = {TIMELINE_MARKS[timeActive].fr}</p>}
        </Panel>
      )}

      {lesson.sections.map((sec) => (
        <Panel key={sec.title}>
          <h2 className="text-lg font-bold">{sec.title}</h2>
          {sec.text && <p className="mt-1 text-sm leading-relaxed text-muted">{sec.text}</p>}
          {sec.grid ? (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {sec.items.map((it) => (
                <button key={it.en} onClick={() => speak(it.ex && it.visual?.kind !== "big" ? `${it.en}. ${it.ex}` : it.en)} className="group flex flex-col items-center rounded-2xl border border-line/70 bg-surface-2/60 p-2 text-center transition hover:border-ink-300 active:scale-95">
                  <span className="h-16 w-16">{it.visual ? <Visual v={it.visual} /> : <span className="flex h-full items-center justify-center text-2xl">🔊</span>}</span>
                  <span className="mt-1 text-[13px] font-bold leading-tight">{it.en}</span>
                  <span className="text-[11px] leading-tight text-muted">{it.fr}</span>
                </button>
              ))}
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {sec.items.map((it) => (
                <li key={it.en} className="flex items-start gap-3 py-2.5">
                  {it.visual && <span className="h-10 w-12 shrink-0"><Visual v={it.visual} /></span>}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{it.en}</p>
                    <p className="text-sm text-ink-700 dark:text-ink-200">{it.fr}</p>
                    {it.ex && <p className="mt-0.5 text-sm text-muted">“{it.ex}”{it.exFr && <span className="block text-xs">{it.exFr}</span>}</p>}
                  </div>
                  <SpeakButton text={it.ex ? `${it.en}. ${it.ex}` : it.en} size={16} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ))}

      {lesson.tips?.length ? (
        <Panel className="border-sun-400/60 bg-sun-100/50 dark:bg-sun-500/10">
          <p className="font-bold">💡 {t("À savoir", "Good to know")}</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm">{lesson.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
        </Panel>
      ) : null}

      <LessonQuiz lesson={lesson} items={items} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AddAllButton lesson={lesson} items={items} />
        {next && <Link href={`/basics/${next.id}`} className="text-sm font-semibold text-ink-600 dark:text-ink-300">{t("Leçon suivante :", "Next:")} {next.emoji} {t(next.title, next.titleEn)} →</Link>}
      </div>
    </div>
  );
}
