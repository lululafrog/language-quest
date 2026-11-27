"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { SearchBox } from "@/components/sheets/SearchBox";
import { SHEET_CATEGORIES, categoryLabel } from "@/components/sheets/SheetView";
import { PageHeader, cx } from "@/components/ui";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { SHEETS } from "@/lib/curriculum";
import type { SheetCategory } from "@/lib/curriculum/types";

export default function SheetsPage() {
  const t = useT();
  const { immersion } = useSettings();
  const [cat, setCat] = useState<SheetCategory | "all">("all");
  const [query, setQuery] = useState("");
  const searching = query.trim().length >= 2;

  const counts = useMemo(() => {
    const m = new Map<SheetCategory, number>();
    for (const s of SHEETS) m.set(s.category, (m.get(s.category) ?? 0) + 1);
    return m;
  }, []);
  const list = cat === "all" ? SHEETS : SHEETS.filter((s) => s.category === cat);
  const cats = SHEET_CATEGORIES.filter((c) => counts.get(c.id));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader back="/cours" title={t("Fiches de révision", "Revision sheets")} subtitle={t(`${SHEETS.length} fiches claires, liées aux cours`, `${SHEETS.length} clear sheets linked to the course`)} />

      <SearchBox onQueryChange={setQuery} className="mb-6" />

      {!searching && (
        <>
          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="tablist" aria-label={t("Catégories", "Categories")}>
            {[{ id: "all" as const, fr: "Toutes", en: "All" }, ...cats].map((c) => {
              const active = cat === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCat(c.id)}
                  className={cx(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition",
                    active ? "border-ink-900 bg-ink-900 text-white dark:border-ink-100 dark:bg-ink-100 dark:text-ink-950" : "border-line bg-surface text-ink-900/80 hover:bg-surface-2 dark:text-ink-100/80",
                  )}
                >
                  {t(c.fr, c.en)}
                  {c.id !== "all" && <span className={cx("ml-1.5 tabular-nums", active ? "opacity-70" : "text-muted")}>{counts.get(c.id)}</span>}
                </button>
              );
            })}
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {list.map((s) => (
              <li key={s.id}>
                <Link href={`/cours/fiches/${s.id}`} className="card-shadow group flex h-full flex-col rounded-2xl border border-line/70 bg-surface p-4 transition hover:border-ink-300 active:scale-[0.99] dark:hover:border-ink-700">
                  <span className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{categoryLabel(s.category, immersion)}</span>
                  <span className="text-[16px] font-semibold leading-snug">{s.title}</span>
                  <span className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-snug text-muted">{s.summary}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-ink-600 dark:text-ink-300">
                    {t("Ouvrir", "Open")}
                    <Icon name="arrow" size={14} className="transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
