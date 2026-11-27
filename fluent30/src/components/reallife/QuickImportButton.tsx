"use client";
// Compact entry point to "My Real Life English" (used on the home screen).
import Link from "next/link";
import { Icon } from "@/components/icons";
import { cx } from "@/components/ui";

export function QuickImportButton({ className, compact }: { className?: string; compact?: boolean }) {
  if (compact)
    return (
      <Link href="/practice/real-life" className={cx("inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold transition hover:border-ink-300", className)}>
        <Icon name="inbox" size={17} className="text-ink-600 dark:text-ink-300" />
        Importer de la vraie vie
      </Link>
    );
  return (
    <Link
      href="/practice/real-life"
      className={cx("flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 card-shadow transition hover:border-ink-300", className)}
      aria-label="Importer un contenu de la vie réelle"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-600 dark:bg-ink-900/60 dark:text-ink-300">
        <Icon name="inbox" size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">My Real Life English</span>
        <span className="block truncate text-sm text-muted">Un message, une capture, un menu, une phrase entendue…</span>
      </span>
      <Icon name="plus" size={20} className="shrink-0 text-fg/50" />
    </Link>
  );
}
