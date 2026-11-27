"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { LIBRARY, LIBRARY_CATEGORIES } from "@/lib/data/library";
import { downloadGutenberg } from "@/lib/books";
import { toggleWish, wishIdForLibrary } from "@/lib/wishlist";
import { coverageComfort, MIN_KNOWN_FOR_COVERAGE } from "@/lib/coverage";
import { libraryIdOf } from "@/lib/recommend";
import { errorMessage } from "@/lib/api";
import { useT } from "@/hooks/useT";
import { Button, EmptyState, Panel, cx, toast } from "@/components/ui";
import { BookCover } from "@/components/library/BookCover";
import { LevelBadge, LibCard, Shelf, readingTimeLabel, useCoverage } from "@/components/library/shelf";

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const router = useRouter();
  const libId = Number(id);
  const book = LIBRARY.find((b) => b.id === libId);
  const mine = useLiveQuery(async () => (await getDb().books.toArray()).find((b) => libraryIdOf(b) === libId) ?? null, [libId]);
  const wished = useLiveQuery(async () => !!(await getDb().wishlist.get(wishIdForLibrary(libId))), [libId]);
  const cov = useCoverage(book ? libId : undefined);
  const [opening, setOpening] = useState(false);

  if (!book) return <EmptyState icon="📕" title={t("Livre introuvable", "Book not found")}><Link href="/library" className="text-ink-600 underline">{t("Retour à la bibliothèque", "Back to library")}</Link></EmptyState>;
  const cat = LIBRARY_CATEGORIES.find((c) => c.id === book.cat);
  const similar = LIBRARY.filter((b) => b.id !== book.id && (b.cat === book.cat || b.alsoIn?.includes(book.cat))).slice(0, 10);

  const open = async () => {
    if (mine) return router.push(`/library/read/${encodeURIComponent(mine.id)}`);
    setOpening(true);
    try {
      const b = await downloadGutenberg(book.id);
      router.push(`/library/read/${encodeURIComponent(b.id)}`);
    } catch (e) {
      toast(errorMessage(e), "err");
      setOpening(false);
    }
  };

  const rate = async (r: number) => {
    if (!mine) return;
    await getDb().books.update(mine.id, { rating: mine.rating === r ? undefined : r });
    toast(t("Merci pour ta note !", "Thanks for rating!"));
  };

  const progress = mine ? (mine.finishedAt ? 1 : mine.progress) : 0;
  const comfort = cov ? coverageComfort(cov.ratio) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => router.back()} className="mb-3 -ml-1 rounded-lg p-1.5 text-muted hover:bg-surface-2" aria-label={t("Retour", "Back")}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>

      <div className="relative overflow-hidden rounded-3xl border border-line/70 bg-surface p-5 card-shadow sm:flex sm:gap-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ background: book.cover?.palette[0] ?? "#6a55f2" }} />
        <div className="relative mx-auto w-44 shrink-0 sm:mx-0 sm:w-48">
          <div className="overflow-hidden rounded-xl shadow-2xl shadow-ink-900/30 ring-1 ring-black/5">
            <BookCover book={book} className="block aspect-[2/3] w-full" />
          </div>
          {progress > 0 && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-sun-400" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
          )}
        </div>
        <div className="relative mt-5 min-w-0 flex-1 sm:mt-0">
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={book.level} />
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium">{cat?.emoji} {t(cat?.fr ?? "", cat?.en ?? "")}</span>
            {mine?.finishedAt && <span className="rounded-full bg-sun-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-sun-500/20 dark:text-sun-100">🏆 {t("Terminé", "Finished")}</span>}
          </div>
          <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>{book.title}</h1>
          <p className="text-[15px] text-ink-700 dark:text-ink-200">{book.titleFr}</p>
          <p className="mt-0.5 text-sm text-muted">{book.author}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span>⏱ {readingTimeLabel(book.words)} {t("de lecture", "reading")}</span>
            <span>📄 {Math.round(book.words / 1000)}k {t("mots", "words")}</span>
            {book.countries?.length ? <span>🌍 {book.countries.join(", ")}</span> : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="lg" onClick={open} loading={opening}>{mine && mine.progress > 0 && !mine.finishedAt ? t(`Reprendre · ${Math.round(mine.progress * 100)} %`, `Resume · ${Math.round(mine.progress * 100)}%`) : mine?.finishedAt ? t("Relire", "Read again") : t("Lire", "Read")}</Button>
            <Button size="lg" variant={wished ? "secondary" : "outline"} onClick={async () => { const on = await toggleWish(wishIdForLibrary(book.id)); toast(on ? t("Ajouté à ta liste d'envies", "Added to wishlist") : t("Retiré de ta liste d'envies", "Removed from wishlist"), "info"); }}>
              <span className={cx(wished && "text-coral-500")}>{wished ? "♥" : "♡"}</span> {t("Liste d'envies", "Wishlist")}
            </Button>
          </div>

          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{t("Ta note", "Your rating")}</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} disabled={!mine} onClick={() => rate(r)} aria-label={`${r}/5`} className={cx("text-2xl transition active:scale-90 disabled:opacity-40", (mine?.rating ?? 0) >= r ? "text-sun-500" : "text-line")}>★</button>
              ))}
              {!mine && <span className="ml-2 text-xs text-muted">{t("Commence le livre pour le noter", "Start the book to rate it")}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Panel>
          <h2 className="mb-2 font-semibold">{t("L'histoire", "The story")}</h2>
          <p className="text-[15px] leading-relaxed">{book.summaryFr || book.noteFr}</p>
          {book.summaryFr && book.noteFr && <p className="mt-2 text-sm text-muted">💡 {book.noteFr}</p>}
          <p className="mt-2 text-xs text-muted">{t("Sans spoiler 🤫", "No spoilers 🤫")}</p>
        </Panel>
        <Panel>
          <h2 className="mb-2 font-semibold">{t("Ton vocabulaire", "Your vocabulary")}</h2>
          {cov ? (
            <>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold tabular-nums">{Math.round(cov.ratio * 100)} %</span>
                <span className={cx("mb-1 text-sm font-semibold", { mint: "text-mint-600", ink: "text-ink-600", sun: "text-amber-600", coral: "text-coral-600" }[comfort!.tone])}>{t(comfort!.fr, comfort!.en)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-gradient-to-r from-coral-400 via-sun-400 to-mint-500" style={{ width: `${Math.round(cov.ratio * 100)}%` }} /></div>
              <p className="mt-2 text-sm text-muted">{t("Part des mots du livre (pondérée par leur fréquence) que tu connais déjà. Entre 90 et 97 %, la lecture est agréable tout en te faisant progresser.", "Share of the book's words you already know. 90–97% is ideal.")}</p>
              {cov.unknownTop.length > 0 && <p className="mt-2 text-xs text-muted">{t("Mots fréquents à découvrir :", "Frequent new words:")} <span className="font-medium text-fg">{cov.unknownTop.slice(0, 8).join(", ")}</span></p>}
            </>
          ) : cov === null ? (
            <p className="text-sm text-muted">{t(`Estimation pas encore disponible : elle apparaît quand tu connais au moins ${MIN_KNOWN_FOR_COVERAGE} mots (apprends-en ou fais le test de niveau).`, `Not available yet: learn ${MIN_KNOWN_FOR_COVERAGE}+ words first.`)} <Link href="/learn" className="text-ink-600 underline dark:text-ink-300">{t("Apprendre des mots", "Learn words")}</Link></p>
          ) : (
            <div className="h-16 animate-pulse rounded-xl bg-surface-2" />
          )}
        </Panel>
      </div>

      {similar.length > 0 && (
        <div className="mt-6">
          <Shelf title={t("Dans le même genre", "More like this")}>
            {similar.map((b) => <LibCard key={b.id} book={b} />)}
          </Shelf>
        </div>
      )}
      <p className="mt-2 text-center text-xs text-muted">{t(`Œuvre du domaine public (Project Gutenberg n°${book.id}) · couverture originale Fluent30`, `Public domain (Project Gutenberg #${book.id}) · original cover`)}</p>
    </div>
  );
}
