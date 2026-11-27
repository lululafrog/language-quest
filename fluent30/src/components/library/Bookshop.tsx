"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { LIBRARY, LIBRARY_CATEGORIES, type LibraryBook, type LibraryCategory } from "@/lib/data/library";
import { GRADED_STORIES } from "@/lib/data/stories";
import { recommendBooks, libraryIdOf, type Recommendation } from "@/lib/recommend";
import { wishedLibraryIds } from "@/lib/wishlist";
import { normalize } from "@/lib/text";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { cx } from "@/components/ui";
import { BookCover } from "./BookCover";
import { LevelBadge, LibCard, MyBookCard, Shelf, ShelfAction, readingTimeLabel } from "./shelf";
import type { Book } from "@/lib/types";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LENGTHS = [
  { id: "short", fr: "Court (< 2 h)", en: "Short", test: (w: number) => w < 24_000 },
  { id: "medium", fr: "Moyen (2–8 h)", en: "Medium", test: (w: number) => w >= 24_000 && w < 96_000 },
  { id: "long", fr: "Long (> 8 h)", en: "Long", test: (w: number) => w >= 96_000 },
];

/** The digital bookshop: continue reading, recommendations and shelves per category. */
export function Bookshop({ books }: { books: Book[] }) {
  const t = useT();
  const s = useSettings();
  const wishes = useLiveQuery(() => getDb().wishlist.toArray(), []);
  const novels = useLiveQuery(() => getDb().novels.toArray(), []);
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [cat, setCat] = useState<LibraryCategory | "">("");
  const [length, setLength] = useState("");

  const finishedKey = books.filter((b) => b.finishedAt).length;
  useEffect(() => {
    let alive = true;
    void recommendBooks(10).then((r) => alive && setRecs(r)).catch(() => alive && setRecs([]));
    return () => {
      alive = false;
    };
  }, [finishedKey, wishes?.length]);

  const byLib = useMemo(() => {
    const m = new Map<number, Book>();
    for (const b of books) {
      const id = libraryIdOf(b);
      if (id) m.set(id, b);
    }
    return m;
  }, [books]);

  const reading = useMemo(() => books.filter((b) => !b.finishedAt && b.progress > 0 && b.progress < 1).sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0)), [books]);
  const finished = useMemo(() => books.filter((b) => b.finishedAt).sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0)), [books]);
  const wished = useMemo(() => {
    const ids = wishedLibraryIds(wishes ?? []);
    return ids.map((id) => LIBRARY.find((l) => l.id === id)).filter((x): x is LibraryBook => !!x);
  }, [wishes]);
  const custom = useMemo(() => books.filter((b) => b.source === "custom" || (b.novelId && (novels ?? []).some((n) => n.id === b.novelId))), [books, novels]);

  const filtering = !!(q.trim() || level || cat || length);
  const results = useMemo(() => {
    if (!filtering) return [];
    const nq = normalize(q);
    const len = LENGTHS.find((l) => l.id === length);
    return LIBRARY.filter((b) => (!nq || normalize(`${b.title} ${b.titleFr} ${b.author}`).includes(nq)) && (!level || b.level === level) && (!cat || b.cat === cat || b.alsoIn?.includes(cat)) && (!len || len.test(b.words)));
  }, [filtering, q, level, cat, length]);

  const hero = reading.slice(0, 5);

  return (
    <div>
      {/* Continue reading carousel */}
      {hero.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          {hero.map((b) => {
            const lib = LIBRARY.find((l) => l.id === libraryIdOf(b));
            return (
              <Link key={b.id} href={`/library/read/${encodeURIComponent(b.id)}`} className="relative flex w-[85%] max-w-md shrink-0 snap-start items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-ink-700 to-ink-950 p-4 text-white shadow-xl sm:w-96">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-coral-500/25 blur-2xl" />
                <div className="relative w-20 shrink-0 overflow-hidden rounded-lg shadow-lg ring-1 ring-white/10">
                  <BookCover book={lib ?? { title: b.title, author: b.author, level: b.level }} className="block aspect-[2/3] w-full" />
                </div>
                <div className="relative min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-sun-400">{t("Continuer la lecture", "Continue reading")}</p>
                  <p className="mt-1 line-clamp-2 font-bold leading-snug" style={{ fontFamily: "var(--font-display)" }}>{b.title}</p>
                  {b.author && <p className="truncate text-xs text-white/70">{b.author}</p>}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-sun-400" style={{ width: `${Math.round(b.progress * 100)}%` }} /></div>
                    <span className="text-xs tabular-nums text-white/80">{Math.round(b.progress * 100)} %</span>
                  </div>
                  <p className="mt-1 text-[11px] text-white/60">{t(`Chapitre ${b.position.chapter + 1}/${b.chapterCount}`, `Chapter ${b.position.chapter + 1}/${b.chapterCount}`)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Search & filters */}
      <div className="mb-5 space-y-2.5">
        <div className="relative">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Chercher un titre, un auteur (Sherlock, Austen, Verne…)", "Search a title or author")} className="h-12 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 outline-none focus:border-ink-400" />
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">🔍</span>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
          {LIBRARY_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(cat === c.id ? "" : c.id)} className={cx("shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium", cat === c.id ? "border-ink-500 bg-ink-600 text-white" : "border-line bg-surface")}>{c.emoji} {s.immersion ? c.en : c.fr}</button>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
          {LEVELS.map((l) => (
            <button key={l} onClick={() => setLevel(level === l ? "" : l)} className={cx("shrink-0 rounded-full px-3 py-1 text-xs font-bold", level === l ? "bg-ink-600 text-white" : "bg-surface-2 text-muted")}>{l}</button>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" />
          {LENGTHS.map((l) => (
            <button key={l.id} onClick={() => setLength(length === l.id ? "" : l.id)} className={cx("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", length === l.id ? "bg-ink-600 text-white" : "bg-surface-2 text-muted")}>{t(l.fr, l.en)}</button>
          ))}
          {filtering && <button onClick={() => { setQ(""); setLevel(""); setCat(""); setLength(""); }} className="shrink-0 px-2 text-xs font-semibold text-coral-600 underline">{t("Effacer", "Clear")}</button>}
        </div>
      </div>

      {filtering ? (
        <div>
          <p className="mb-3 text-sm text-muted">{t(`${results.length} livre${results.length > 1 ? "s" : ""}`, `${results.length} book${results.length > 1 ? "s" : ""}`)}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-5">
            {results.map((b) => <LibCard key={b.id} book={b} mine={byLib.get(b.id)} fluid />)}
          </div>
          {!results.length && <p className="py-8 text-center text-sm text-muted">{t("Aucun livre ne correspond.", "No match.")}</p>}
        </div>
      ) : (
        <>
          <Shelf title={t("✨ Recommandés pour toi", "✨ Recommended for you")} subtitle={t("Selon ton niveau, tes goûts et le vocabulaire que tu connais", "Based on your level, tastes and vocabulary")}>
            {recs === null
              ? Array.from({ length: 5 }, (_, i) => <div key={i} className="aspect-[2/3] w-32 shrink-0 animate-pulse rounded-xl bg-surface-2 sm:w-36" />)
              : recs.map((r) => <LibCard key={r.book.id} book={r.book} mine={byLib.get(r.book.id)} reason={r.reason} />)}
          </Shelf>

          {reading.length > 0 && (
            <Shelf title={t("📖 Mes livres en cours", "📖 Reading now")}>
              {reading.map((b) => {
                const lib = LIBRARY.find((l) => l.id === libraryIdOf(b));
                return lib ? <LibCard key={b.id} book={lib} mine={b} /> : <MyBookCard key={b.id} book={b} />;
              })}
            </Shelf>
          )}

          <Shelf title={t("♡ Ma liste d'envies", "♡ My wishlist")} subtitle={wished.length ? undefined : t("Touche ♡ sur la fiche d'un livre pour l'ajouter", "Tap ♡ on a book page to add it")}>
            {wished.map((b) => <LibCard key={b.id} book={b} mine={byLib.get(b.id)} />)}
            {!wished.length && <ShelfAction href={`/library/book/${(recs?.[0]?.book ?? LIBRARY[0])?.id}`} icon="♡" label={t("Découvrir un livre", "Discover a book")} />}
          </Shelf>

          {finished.length > 0 && (
            <Shelf title={t("🏆 Mes livres terminés", "🏆 Finished")} subtitle={t(`${finished.length} livre${finished.length > 1 ? "s" : ""} lu${finished.length > 1 ? "s" : ""} en anglais`, `${finished.length} read in English`)}>
              {finished.map((b) => {
                const lib = LIBRARY.find((l) => l.id === libraryIdOf(b));
                return lib ? <LibCard key={b.id} book={lib} mine={b} /> : <MyBookCard key={b.id} book={b} />;
              })}
            </Shelf>
          )}

          {LIBRARY_CATEGORIES.map((c) => {
            const list = LIBRARY.filter((b) => b.cat === c.id || b.alsoIn?.includes(c.id));
            if (!list.length) return null;
            return (
              <Shelf key={c.id} title={`${c.emoji} ${s.immersion ? c.en : c.fr}`} subtitle={t(`${list.length} livres`, `${list.length} books`)} action={<button onClick={() => setCat(c.id)} className="shrink-0 text-sm font-semibold text-ink-600 dark:text-ink-300">{t("Tout voir", "See all")}</button>}>
                {list.map((b) => <LibCard key={b.id} book={b} mine={byLib.get(b.id)} />)}
              </Shelf>
            );
          })}

          <Shelf title={t("🪄 Histoires personnalisées", "🪄 Personal stories")} subtitle={t("Des romans écrits pour toi par l'IA, à ton niveau", "Novels written for you by AI")}>
            {custom.map((b) => <MyBookCard key={b.id} book={b} />)}
            <ShelfAction href="/novels" icon="✍️" label={t("Créer mon histoire", "Create my story")} />
          </Shelf>

          <Shelf title={t("🌱 Histoires graduées", "🌱 Graded stories")} subtitle={t("Histoires originales écrites pour Fluent30, de A1 à C2", "Original stories from A1 to C2")}>
            {GRADED_STORIES.map((st) => {
              const mine = books.find((b) => b.id === `graded:${st.id}`);
              const words = st.chapters.reduce((a, ch) => a + ch.paragraphs.join(" ").split(/\s+/).length, 0);
              return (
                <Link key={st.id} href={`/library/read/${encodeURIComponent(`graded:${st.id}`)}`} className="group w-32 shrink-0 snap-start sm:w-36">
                  <div className="relative overflow-hidden rounded-xl shadow-md ring-1 ring-black/5 transition group-hover:-translate-y-1 group-hover:shadow-xl">
                    <BookCover book={{ title: st.title, author: "Fluent30", level: st.level }} className="block aspect-[2/3] w-full" />
                    <LevelBadge level={st.level} className="absolute left-1.5 top-1.5" />
                    {mine && mine.progress > 0 && <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/30"><div className="h-full bg-sun-400" style={{ width: `${Math.round(mine.progress * 100)}%` }} /></div>}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug">{st.title}</p>
                  <p className="line-clamp-2 text-[11px] text-muted">{st.summaryFr}</p>
                  <p className="text-[11px] text-muted">{st.genre} · ⏱ {readingTimeLabel(words)}</p>
                </Link>
              );
            })}
          </Shelf>

          <p className="mt-2 text-center text-xs text-muted">{t("Œuvres du domaine public (Project Gutenberg), couvertures originales Fluent30. Les best-sellers récents sont protégés par le droit d'auteur : importez vos propres livres numériques sans DRM.", "Public-domain works, original Fluent30 covers.")}</p>
        </>
      )}
    </div>
  );
}
