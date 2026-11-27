"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Icon } from "@/components/icons";
import { SheetView, categoryLabel } from "@/components/sheets/SheetView";
import { EmptyState, PageHeader } from "@/components/ui";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { ALL_LESSONS, SHEETS, getLesson, getSheet, lessonForTag, type Lesson, type Sheet } from "@/lib/curriculum";

function relatedLessons(sheet: Sheet): Lesson[] {
  const out = new Map<string, Lesson>();
  for (const id of sheet.lessonIds ?? []) {
    const l = getLesson(id);
    if (l) out.set(l.id, l);
  }
  for (const tag of sheet.tags) {
    const l = lessonForTag(tag);
    if (l) out.set(l.id, l);
  }
  const tags = new Set(sheet.tags);
  for (const l of ALL_LESSONS) {
    if (out.size >= 6) break;
    if (l.related?.sheet === sheet.id || l.tags.some((x) => tags.has(x))) out.set(l.id, l);
  }
  return [...out.values()].slice(0, 6);
}

function relatedSheets(sheet: Sheet): Sheet[] {
  const tags = new Set(sheet.tags);
  return SHEETS.filter((s) => s.id !== sheet.id)
    .map((s) => ({ s, n: s.tags.filter((x) => tags.has(x)).length + (s.category === sheet.category ? 0.5 : 0) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)
    .map((x) => x.s);
}

export default function SheetPage() {
  const t = useT();
  const { immersion } = useSettings();
  const params = useParams<{ id: string }>();
  const sheet = getSheet(params.id);
  const lessons = useMemo(() => (sheet ? relatedLessons(sheet) : []), [sheet]);
  const sheets = useMemo(() => (sheet ? relatedSheets(sheet) : []), [sheet]);

  if (!sheet) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader back="/cours/fiches" title={t("Fiche introuvable", "Sheet not found")} />
        <EmptyState icon="" title={t("Cette fiche n'existe pas.", "This sheet does not exist.")}>
          <Link href="/cours/fiches" className="text-sm font-medium text-ink-600 underline">
            {t("Voir toutes les fiches", "See all sheets")}
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <PageHeader back="/cours/fiches" title={sheet.title} subtitle={categoryLabel(sheet.category, immersion)} />
      <p className="-mt-2 mb-6 text-[15px] leading-relaxed text-muted">{sheet.summary}</p>

      <SheetView sheet={sheet} />

      {lessons.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted">{t("Cours liés", "Related lessons")}</h2>
          <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl border border-line/70 bg-surface">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link href={`/cours/${l.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
                  <span className="w-8 shrink-0 text-[12px] font-semibold tabular-nums text-ink-600 dark:text-ink-300">{l.level}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{l.title}</span>
                    <span className="block truncate text-[13px] text-muted">{l.goal}</span>
                  </span>
                  <Icon name="chevron" size={16} className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sheets.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted">{t("Fiches liées", "Related sheets")}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {sheets.map((s) => (
              <li key={s.id}>
                <Link href={`/cours/fiches/${s.id}`} className="flex h-full items-center gap-3 rounded-2xl border border-line/70 bg-surface px-4 py-3 transition hover:bg-surface-2">
                  <Icon name="sheet" size={18} className="shrink-0 text-ink-500" />
                  <span className="min-w-0 flex-1 text-[14px] font-medium leading-snug">{s.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
