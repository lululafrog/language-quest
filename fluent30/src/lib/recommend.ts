"use client";
// Book recommendation engine for the built-in library.
import { getDb, getSettings } from "./db";
import { LIBRARY, LIBRARY_CATEGORIES, type LibraryBook, type LibraryCategory } from "./data/library";
import { currentLevel } from "./progress";
import { bookCoverage, type Coverage } from "./coverage";
import { wishedLibraryIds } from "./wishlist";
import type { Book } from "./types";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export interface Recommendation {
  book: LibraryBook;
  score: number;
  reason: string;
  coverage: Coverage | null;
}

/** Interests chosen in settings → library categories. */
const INTEREST_TO_CAT: Record<string, LibraryCategory[]> = {
  crime: ["thriller"], dating: ["romance"], relationships: ["romance"], emotions: ["romance", "devperso"], adventure: ["aventure"],
  travel: ["aventure"], beach: ["aventure"], nature: ["aventure"], books: ["classiques"], art: ["classiques"], movies: ["fantastique", "horreur"],
  work: ["devperso"], school: ["devperso"], health: ["devperso"], animals: ["aventure", "classiques"],
};

export function libraryIdOf(b: Book): number | undefined {
  return b.libraryId ?? (b.gutenbergId && LIBRARY.some((l) => l.id === b.gutenbergId) ? b.gutenbergId : undefined);
}

function catsOf(b: LibraryBook): LibraryCategory[] {
  return [b.cat, ...(b.alsoIn ?? [])];
}

export async function recommendBooks(n = 8): Promise<Recommendation[]> {
  const db = getDb();
  const [books, wishes, settings, level] = await Promise.all([db.books.toArray(), db.wishlist.toArray(), getSettings(), currentLevel()]);
  const byLib = new Map<number, Book>();
  for (const b of books) {
    const id = libraryIdOf(b);
    if (id) byLib.set(id, b);
  }
  // Genre preferences
  const pref = new Map<LibraryCategory, number>();
  const bump = (c: LibraryCategory, v: number) => pref.set(c, (pref.get(c) ?? 0) + v);
  for (const [id, b] of byLib) {
    const lib = LIBRARY.find((l) => l.id === id);
    if (!lib) continue;
    const w = b.rating ? (b.rating >= 4 ? 2.5 : b.rating <= 2 ? -2 : 0.5) : b.finishedAt ? 2 : b.progress > 0.1 ? 1 : 0.3;
    for (const c of catsOf(lib)) bump(c, w);
  }
  const wishedIds = wishedLibraryIds(wishes);
  for (const id of wishedIds) {
    const lib = LIBRARY.find((l) => l.id === id);
    if (lib) for (const c of catsOf(lib)) bump(c, 1);
  }
  for (const i of settings.interests) for (const c of INTEREST_TO_CAT[i] ?? []) bump(c, 1);
  if (settings.goals.includes("reading")) bump("classiques", 0.5);

  // Difficulty signal: lookups per 100 words in the learner's own reading.
  let looked = 0;
  let read = 0;
  for (const b of books) {
    if (b.lookups && b.wordsRead && b.wordsRead > 200) {
      looked += b.lookups;
      read += b.wordsRead;
    }
  }
  const lookupRate = read > 0 ? (looked / read) * 100 : null;
  let target = Math.max(0, LEVELS.indexOf(level));
  if (lookupRate !== null && lookupRate > 8) target = Math.max(0, target - 1);
  if (lookupRate !== null && lookupRate < 2) target = Math.min(5, target + 1);

  const bestCat = [...pref.entries()].sort((a, b) => b[1] - a[1])[0];
  const candidates = LIBRARY.filter((l) => {
    const mine = byLib.get(l.id);
    return !mine || (!mine.finishedAt && mine.progress < 0.02);
  }).map((book) => {
    const li = LEVELS.indexOf(book.level);
    const diff = li - target;
    let score = diff === 0 ? 3 : diff === 1 ? 2.2 : diff === -1 ? 1.5 : diff >= 2 ? -2 * (diff - 1) : 0.5;
    const p = Math.max(...catsOf(book).map((c) => pref.get(c) ?? 0));
    score += Math.min(4, p);
    if (wishedIds.includes(book.id)) score += 1.5;
    score -= book.words > 150_000 ? 0.8 : 0;
    return { book, score };
  });
  candidates.sort((a, b) => b.score - a.score);

  // Refine the best candidates with the real vocabulary coverage (90–97 % = comfortable but stretching).
  const top = candidates.slice(0, Math.max(n * 2, 16));
  const withCov = await Promise.all(
    top.map(async (c) => {
      const coverage = await bookCoverage(c.book.id);
      let score = c.score;
      if (coverage) {
        const r = coverage.ratio;
        score += r >= 0.9 && r <= 0.97 ? 3 : r > 0.97 ? 1.5 : r >= 0.85 ? 1 : -2;
      }
      return { ...c, score, coverage };
    }),
  );
  withCov.sort((a, b) => b.score - a.score);
  return withCov.slice(0, n).map((c) => ({ ...c, reason: reasonFor(c.book, c.coverage, LEVELS[target], bestCat?.[0], pref) }));
}

function reasonFor(book: LibraryBook, coverage: Coverage | null, target: string, bestCat: LibraryCategory | undefined, pref: Map<LibraryCategory, number>): string {
  const parts: string[] = [];
  if (coverage && coverage.ratio >= 0.9 && coverage.ratio <= 0.97) parts.push(`${Math.round(coverage.ratio * 100)} % de mots connus`);
  else if (book.level === target) parts.push(`Parfait pour ton niveau ${target}`);
  else if (LEVELS.indexOf(book.level) === LEVELS.indexOf(target) + 1) parts.push("Un petit défi pour progresser");
  else if (LEVELS.indexOf(book.level) < LEVELS.indexOf(target)) parts.push("Lecture détente");
  const liked = [book.cat, ...(book.alsoIn ?? [])].find((c) => (pref.get(c) ?? 0) > 0.9);
  if (liked) {
    const lab = LIBRARY_CATEGORIES.find((c) => c.id === liked)?.fr.toLowerCase();
    if (lab) parts.push(liked === bestCat ? `ton genre préféré : ${lab}` : `tu aimes : ${lab}`);
  }
  if (book.words < 30_000) parts.push("se lit vite");
  return parts.slice(0, 2).join(" · ") || "Un classique à découvrir";
}
