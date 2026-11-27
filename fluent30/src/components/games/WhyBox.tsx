"use client";
// Short "Pourquoi ?" explanation after a wrong answer, with a link to the lesson that explains it.
import Link from "next/link";
import { explainForGameItem } from "@/lib/connect";
import { useT } from "@/hooks/useT";

export function WhyBox({ item, className }: { item: { explanation?: string; mistake?: { id: string; label?: string; detail?: string; example?: string } }; className?: string }) {
  const t = useT();
  const { why, link } = explainForGameItem(item);
  if (!why && !link) return null;
  return (
    <div className={className ?? "mt-2"}>
      {why && (
        <p className="text-muted">
          <span className="font-semibold">{t("Pourquoi ? ", "Why? ")}</span>
          {why}
        </p>
      )}
      {link && (
        <Link href={link.href} className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-ink-600 underline-offset-2 hover:underline dark:text-ink-300">
          {t("Revoir le cours", "Review the lesson")} · {link.title} ›
        </Link>
      )}
    </div>
  );
}
