"use client";
// Reading statistics, chapter/book completion and difficulty signals.
import { getDb } from "./db";
import { emit } from "./events";
import { trackActivity } from "./track";

export async function markStarted(bookId: string) {
  const db = getDb();
  const b = await db.books.get(bookId);
  if (b && !b.startedAt) await db.books.update(bookId, { startedAt: Date.now() });
}

export async function addReadingTime(bookId: string, seconds: number) {
  if (seconds <= 0) return;
  const db = getDb();
  const b = await db.books.get(bookId);
  if (b) await db.books.update(bookId, { readingSeconds: (b.readingSeconds ?? 0) + seconds });
}

export async function addWordsRead(bookId: string, words: number) {
  if (words <= 0) return;
  const db = getDb();
  const b = await db.books.get(bookId);
  if (b) await db.books.update(bookId, { wordsRead: (b.wordsRead ?? 0) + words });
  await trackActivity({ readingWords: words, xp: Math.floor(words / 50) });
}

export async function addLookup(bookId: string) {
  const db = getDb();
  const b = await db.books.get(bookId);
  if (b) await db.books.update(bookId, { lookups: (b.lookups ?? 0) + 1 });
}

export function finishChapter(bookId: string, chapter: number) {
  emit("chapter:finished", { bookId, chapter });
}

/** Marks the book as finished and notifies listeners (ceremony, collection, trophies). */
export async function finishBook(bookId: string) {
  const db = getDb();
  const b = await db.books.get(bookId);
  if (!b) return;
  await db.books.update(bookId, { progress: 1, finishedAt: b.finishedAt ?? Date.now(), lastOpenedAt: Date.now() });
  emit("book:finished", { bookId });
}

export async function recordQuiz(bookId: string, chapter: number, score: number, total: number) {
  const db = getDb();
  const b = await db.books.get(bookId);
  if (!b) return;
  const quizResults = [...(b.quizResults ?? []).filter((q) => q.chapter !== chapter), { chapter, score, total, at: Date.now() }];
  const chaptersDone = [...new Set([...(b.chaptersDone ?? []), chapter])];
  await db.books.update(bookId, { quizResults, chaptersDone });
  await trackActivity({ xp: 5 + score * 2 });
  emit("quiz:done", { bookId, chapter, score, total });
}

export type DifficultyAdvice = "hard" | "easy" | "ok";

/** Lookups per 100 words read in a chapter → advice. */
export function difficultyAdvice(lookups: number, words: number): DifficultyAdvice {
  if (words < 150) return "ok";
  const per100 = (lookups / words) * 100;
  if (per100 > 6) return "hard";
  if (per100 < 0.8) return "easy";
  return "ok";
}

/** Public-domain texts can be adapted (simplified); personal imports can't (copyright). */
export function canAdapt(source: string) {
  return source === "gutenberg" || source === "graded" || source === "custom";
}
