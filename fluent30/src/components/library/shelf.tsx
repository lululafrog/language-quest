"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { LIBRARY_CATEGORIES, type LibraryBook } from "@/lib/data/library";
import { bookCoverage, coverageComfort, type Coverage } from "@/lib/coverage";
import { useT } from "@/hooks/useT";
import { cx } from "@/components/ui";
import { BookCover } from "./BookCover";
import type { Book } from "@/lib/types";

export function readingTimeLabel(words = 0) {
  const min = words / 200;
  if (min < 55) return `${Math.max(5, Math.round(min / 5) * 5)} min`;
  return `${Math.round(min / 60)} h`;
}

const LEVEL_TONE: Record<string, string> = {
  A1: "bg-mint-500", A2: "bg-mint-600", B1: "bg-ink-500", B2: "bg-ink-700", C1: "bg-coral-500", C2: "bg-coral-600",
};

export function LevelBadge({ level, className }: { level?: string; className?: string }) {
  if (!level) return null;
  return <span className={cx("rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white shadow", LEVEL_TONE[level] ?? "bg-ink-500", className)}>{level}</span>;
}

/** Coverage of a built-in book, loaded lazily. undefined = loading, null = unavailable. */
export function useCoverage(libraryId: number | undefined): Coverage | null | undefined {
  const [state, setState] = useState<{ id?: number; cov: Coverage | null | undefined }>({ cov: undefined });
  useEffect(() => {
    let alive = true;
    if (libraryId === undefined) return;
    void bookCoverage(libraryId).then((c) => alive && setState({ id: libraryId, cov: c }));
    return () => {
      alive = false;
    };
  }, [libraryId]);
  return state.id === libraryId ? state.cov : undefined;
}

export function CoverageChip({ libraryId, long }: { libraryId: number; long?: boolean }) {
  const t = useT();
  const cov = useCoverage(libraryId);
  if (!cov) return null;
  const c = coverageComfort(cov.ratio);
  const tone = { mint: "text-mint-600", ink: "text-ink-600 dark:text-ink-300", sun: "text-amber-600", coral: "text-coral-600" }[c.tone];
  return (
    <span className={cx("text-[11px] font-semibold", tone)} title={t("Part des mots du livre que tu connais déjà", "Share of the book's words you already know")}>
      🧠 {Math.round(cov.ratio * 100)} %{long ? ` · ${t(c.fr, c.en)}` : ""}
    </span>
  );
}

/** Horizontal scrolling shelf, like a bookshop row. */
export function Shelf({ title, subtitle, action, children }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-7">
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">{children}</div>
    </section>
  );
}

/** Card of a built-in book (links to its detail page). */
export function LibCard({ book, mine, reason, wide }: { book: LibraryBook; mine?: Book; reason?: string; wide?: boolean }) {
  const t = useT();
  const cat = LIBRARY_CATEGORIES.find((c) => c.id === book.cat);
  const progress = mine && !mine.finishedAt ? mine.progress : 0;
  return (
    <Link href={`/library/book/${book.id}`} className={cx("group shrink-0 snap-start", wide ? "w-40 sm:w-44" : "w-32 sm:w-36")}>
      <div className="relative overflow-hidden rounded-xl shadow-md shadow-ink-900/15 ring-1 ring-black/5 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <BookCover book={book} className="block aspect-[2/3] w-full" />
        <LevelBadge level={book.level} className="absolute left-1.5 top-1.5" />
        {mine?.finishedAt && <span className="absolute right-1.5 top-1.5 rounded-full bg-sun-400 px-1.5 text-[11px] font-bold text-amber-900 shadow">✓</span>}
        {progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/30">
            <div className="h-full bg-sun-400" style={{ width: `${Math.max(3, Math.round(progress * 100))}%` }} />
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug">{book.title}</p>
      <p className="line-clamp-1 text-[11px] text-muted">{book.titleFr}</p>
      <p className="line-clamp-1 text-[11px] text-muted">{book.author}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
        <span>{cat?.emoji} ⏱ {readingTimeLabel(book.words)}</span>
        <CoverageChip libraryId={book.id} />
      </div>
      {progress > 0 && <p className="text-[11px] font-semibold text-ink-600 dark:text-ink-300">{Math.round(progress * 100)} % {t("lu", "read")}</p>}
      {reason && <p className="mt-0.5 line-clamp-2 text-[11px] font-medium text-coral-600 dark:text-coral-400">{reason}</p>}
    </Link>
  );
}

/** Card for a book that is not in the built-in library (imported, graded, personal story). */
export function MyBookCard({ book }: { book: Book }) {
  const t = useT();
  const cover = useLiveQuery(async () => (await getDb().images.get(`cover:${book.id}`))?.data ?? null, [book.id]);
  const progress = book.finishedAt ? 1 : book.progress;
  return (
    <Link href={`/library/read/${encodeURIComponent(book.id)}`} className="group w-32 shrink-0 snap-start sm:w-36">
      <div className="relative overflow-hidden rounded-xl shadow-md shadow-ink-900/15 ring-1 ring-black/5 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- local data URL extracted from the EPUB
          <img src={cover} alt="" className="block aspect-[2/3] w-full object-cover" />
        ) : (
          <BookCover book={{ title: book.title, author: book.author, level: book.level, cat: book.source === "custom" ? "courtes" : undefined }} className="block aspect-[2/3] w-full" />
        )}
        <LevelBadge level={book.level} className="absolute left-1.5 top-1.5" />
        {book.finishedAt && <span className="absolute right-1.5 top-1.5 rounded-full bg-sun-400 px-1.5 text-[11px] font-bold text-amber-900 shadow">✓</span>}
        {!book.finishedAt && progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/30">
            <div className="h-full bg-sun-400" style={{ width: `${Math.max(3, Math.round(progress * 100))}%` }} />
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug">{book.title}</p>
      {book.author && <p className="line-clamp-1 text-[11px] text-muted">{book.author}</p>}
      <p className="text-[11px] text-muted">
        {book.source === "custom" ? t("✨ Histoire perso", "✨ Personal story") : book.source === "graded" ? t("Graduée", "Graded") : book.source === "import" ? t("Importé", "Imported") : "Gutenberg"}
        {book.words ? ` · ⏱ ${readingTimeLabel(book.words)}` : ""}
      </p>
      {!book.finishedAt && progress > 0 && <p className="text-[11px] font-semibold text-ink-600 dark:text-ink-300">{Math.round(progress * 100)} % {t("lu", "read")}</p>}
    </Link>
  );
}

/** Small "action" card at the end of a shelf. */
export function ShelfAction({ href, icon, label, onClick }: { href?: string; icon: string; label: string; onClick?: () => void }) {
  const cls = "flex aspect-[2/3] w-32 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line p-3 text-center text-sm font-medium text-muted transition hover:border-ink-300 hover:text-fg sm:w-36";
  if (href) return <Link href={href} className={cls}><span className="text-3xl">{icon}</span>{label}</Link>;
  return <button onClick={onClick} className={cls}><span className="text-3xl">{icon}</span>{label}</button>;
}
