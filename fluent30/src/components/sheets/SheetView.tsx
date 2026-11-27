"use client";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { SpeakButton, cx } from "@/components/ui";
import type { Sheet, SheetBlock, SheetCategory } from "@/lib/curriculum/types";

export const SHEET_CATEGORIES: { id: SheetCategory; fr: string; en: string }[] = [
  { id: "temps", fr: "Les temps", en: "Tenses" },
  { id: "verbes", fr: "Verbes irréguliers", en: "Irregular verbs" },
  { id: "modaux", fr: "Modaux", en: "Modals" },
  { id: "prepositions", fr: "Prépositions", en: "Prepositions" },
  { id: "phrasal", fr: "Phrasal verbs", en: "Phrasal verbs" },
  { id: "faux-amis", fr: "Faux amis", en: "False friends" },
  { id: "erreurs", fr: "Erreurs typiques", en: "Typical mistakes" },
  { id: "confusions", fr: "Mots similaires", en: "Confusing words" },
  { id: "expressions", fr: "Expressions", en: "Expressions" },
  { id: "prononciation", fr: "Prononciation", en: "Pronunciation" },
];

export function categoryLabel(id: SheetCategory, en = false): string {
  const c = SHEET_CATEGORIES.find((x) => x.id === id);
  return c ? (en ? c.en : c.fr) : id;
}

/** Heuristic: is this cell an English example worth an audio button? */
function looksEnglish(s: string): boolean {
  return /[a-z]/i.test(s) && /[.!?]$/.test(s.trim()) && !/[éèêàùçôîœ]/i.test(s) && s.split(" ").length >= 2;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{children}</h3>;
}

function Block({ block }: { block: SheetBlock }) {
  switch (block.type) {
    case "text":
      return <p className="text-[15px] leading-relaxed text-ink-900/85 dark:text-ink-100/85">{block.text}</p>;
    case "rule":
      return (
        <div className="rounded-2xl border-l-[3px] border-ink-500 bg-ink-50/70 px-4 py-3.5 dark:border-ink-400 dark:bg-ink-900/40">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-600 dark:text-ink-300">La règle</p>
          <p className="text-[15px] font-medium leading-relaxed">{block.text}</p>
        </div>
      );
    case "tip":
      return (
        <div className="flex gap-3 rounded-2xl border border-line/70 bg-surface-2/60 px-4 py-3.5">
          <Icon name="sparkle" size={18} className="mt-0.5 shrink-0 text-ink-500" />
          <p className="text-[14px] leading-relaxed">
            <span className="font-semibold">Astuce · </span>
            {block.text}
          </p>
        </div>
      );
    case "list":
      return (
        <div>
          {block.title && <SectionLabel>{block.title}</SectionLabel>}
          <ul className="space-y-2">
            {block.items.map((it, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-400" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "examples":
      return (
        <div>
          <SectionLabel>Exemples</SectionLabel>
          <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl border border-line/70 bg-surface">
            {block.items.map((ex, i) => (
              <li key={i} className="flex items-start gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium leading-snug" lang="en">
                    {ex.en}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted">{ex.fr}</p>
                  {ex.note && <p className="mt-1 text-xs text-muted italic">{ex.note}</p>}
                </div>
                <SpeakButton text={ex.en} size={16} className="-mr-2 shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      );
    case "compare":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {[block.left, block.right].map((side, i) => (
            <div key={i} className="rounded-2xl border border-line/70 bg-surface p-4">
              <p className={cx("mb-2.5 text-sm font-semibold", i === 0 ? "text-ink-700 dark:text-ink-200" : "text-coral-600 dark:text-coral-400")}>{side.title}</p>
              <ul className="space-y-1.5">
                {side.items.map((it, j) => (
                  <li key={j} className="flex items-center justify-between gap-2 text-[14px] leading-snug" lang="en">
                    <span>{it}</span>
                    {looksEnglish(it) && <SpeakButton text={it} size={14} className="-my-1 -mr-2 shrink-0 p-1.5" />}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case "mistakes":
      return (
        <div>
          <SectionLabel>Erreurs à éviter</SectionLabel>
          <ul className="space-y-2.5">
            {block.items.map((m, i) => (
              <li key={i} className="rounded-2xl border border-line/70 bg-surface px-4 py-3">
                <p className="text-[14px] text-muted line-through decoration-coral-500/70">{m.wrong}</p>
                <div className="mt-1 flex items-start gap-2">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-mint-600 dark:text-mint-400" />
                  <p className="flex-1 text-[15px] font-medium leading-snug" lang="en">
                    {m.right}
                  </p>
                  {looksEnglish(m.right) && <SpeakButton text={m.right} size={14} className="-my-1 -mr-2 shrink-0 p-1.5" />}
                </div>
                <p className="mt-1.5 text-[13px] leading-snug text-muted">{m.why}</p>
              </li>
            ))}
          </ul>
        </div>
      );
    case "table":
      return (
        <div>
          {block.caption && <SectionLabel>{block.caption}</SectionLabel>}
          <div className="-mx-1 overflow-x-auto rounded-2xl border border-line/70 bg-surface">
            <table className="w-full min-w-[480px] border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b border-line/70 bg-surface-2/60">
                  {block.head.map((h, i) => (
                    <th key={i} scope="col" className="px-3.5 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {block.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className={cx("px-3.5 py-2.5 align-top leading-snug", j === 0 && "font-medium")}>
                        <span className="inline-flex items-start gap-1">
                          <span>{cell}</span>
                          {j > 0 && looksEnglish(cell) && <SpeakButton text={cell} size={13} className="-my-1 shrink-0 p-1" />}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
  }
}

/** Renders a revision sheet with a clear hierarchy. */
export function SheetView({ sheet }: { sheet: Sheet }) {
  return (
    <article className="space-y-6">
      {sheet.blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </article>
  );
}
