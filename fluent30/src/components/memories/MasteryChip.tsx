"use client";
import { cx } from "@/components/ui";
import type { Mastery } from "@/lib/memories";

const LABEL: Record<Mastery, string> = { new: "nouveau", learning: "en cours", known: "maîtrisé" };

export function MasteryChip({ en, fr, mastery, href }: { en: string; fr?: string; mastery?: Mastery; href?: string }) {
  const tone =
    mastery === "known"
      ? "border-mint-500/40 bg-mint-500/10"
      : mastery === "learning"
        ? "border-sun-400/60 bg-sun-100/60 dark:bg-sun-500/10"
        : "border-line bg-surface";
  const inner = (
    <>
      <span className="font-medium">{en}</span>
      {fr && <span className="text-muted"> · {fr}</span>}
      {mastery && <span className="ml-1.5 text-[11px] uppercase tracking-wide text-muted">{LABEL[mastery]}</span>}
    </>
  );
  const cls = cx("inline-flex items-baseline rounded-full border px-3 py-1 text-[13.5px]", tone);
  return href ? <a href={href} className={cx(cls, "hover:border-ink-300")}>{inner}</a> : <span className={cls}>{inner}</span>;
}
