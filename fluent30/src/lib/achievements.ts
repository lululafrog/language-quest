"use client";
// Progressive achievements (trophies). Evaluated on reading events and at app start; each unlock grants coins once.
import { getDb } from "./db";
import { LIBRARY } from "./data/library";
import { addCoins } from "./game";
import { DURABLE_DAYS, State } from "./srs";
import { isOriginal } from "./collection";

export interface AchievementDef {
  id: string;
  fr: string;
  descFr: string;
  icon: "book" | "books" | "brain" | "star" | "globe" | "compass" | "crown" | "flame" | "feather" | "medal" | "quiz" | "shelf";
  tier: "bronze" | "silver" | "gold" | "platinum";
  coins: number;
  /** progress 0..1 (≥ 1 = unlocked) and a label like "3/5" */
  check: (s: AchStats) => { value: number; target: number };
}

export interface AchStats {
  chapters: number; // chapters read across books (position.chapter + finished chapters)
  finished: number;
  originals: number;
  b2Plus: number;
  memorized: number;
  genres: number;
  countries: number;
  quizzes: number;
  perfectQuizzes: number;
  wordsRead: number;
  rereads: number;
  streak: number;
}

const c = (value: number, target: number) => ({ value, target });

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-chapter", fr: "Mon premier chapitre", descFr: "Terminer un premier chapitre en anglais.", icon: "feather", tier: "bronze", coins: 30, check: (s) => c(s.chapters, 1) },
  { id: "first-book", fr: "Mon premier livre en anglais", descFr: "Terminer un livre, quel qu'il soit.", icon: "book", tier: "silver", coins: 100, check: (s) => c(s.finished, 1) },
  { id: "first-original", fr: "Mon premier roman en VO", descFr: "Terminer un roman en version originale (non simplifiée).", icon: "star", tier: "gold", coins: 200, check: (s) => c(s.originals, 1) },
  { id: "first-b2", fr: "Mon premier roman niveau B2", descFr: "Terminer un livre de niveau B2 ou plus.", icon: "medal", tier: "gold", coins: 200, check: (s) => c(s.b2Plus, 1) },
  { id: "books-5", fr: "5 livres terminés", descFr: "Une vraie petite bibliothèque.", icon: "books", tier: "silver", coins: 150, check: (s) => c(s.finished, 5) },
  { id: "books-10", fr: "10 livres terminés", descFr: "Lecteur confirmé.", icon: "books", tier: "gold", coins: 300, check: (s) => c(s.finished, 10) },
  { id: "books-25", fr: "25 livres terminés", descFr: "Rat de bibliothèque bilingue.", icon: "crown", tier: "platinum", coins: 800, check: (s) => c(s.finished, 25) },
  { id: "words-100", fr: "100 mots mémorisés", descFr: "100 mots durablement mémorisés (répétition espacée).", icon: "brain", tier: "bronze", coins: 80, check: (s) => c(s.memorized, 100) },
  { id: "words-1000", fr: "1 000 mots mémorisés", descFr: "1 000 mots durablement mémorisés.", icon: "brain", tier: "platinum", coins: 600, check: (s) => c(s.memorized, 1000) },
  { id: "explorer", fr: "Explorateur littéraire", descFr: "Terminer des livres de 4 genres différents.", icon: "compass", tier: "gold", coins: 250, check: (s) => c(s.genres, 4) },
  { id: "globetrotter", fr: "Globe-trotteur", descFr: "Des histoires dans 5 pays différents.", icon: "globe", tier: "gold", coins: 250, check: (s) => c(s.countries, 5) },
  { id: "quiz-5", fr: "Lecteur attentif", descFr: "Faire 5 quiz de fin de chapitre.", icon: "quiz", tier: "bronze", coins: 60, check: (s) => c(s.quizzes, 5) },
  { id: "quiz-perfect", fr: "Sans faute", descFr: "Obtenir 100 % à un quiz de chapitre.", icon: "star", tier: "silver", coins: 80, check: (s) => c(s.perfectQuizzes, 1) },
  { id: "words-read-100k", fr: "100 000 mots lus", descFr: "L'équivalent de deux romans.", icon: "feather", tier: "gold", coins: 300, check: (s) => c(s.wordsRead, 100_000) },
  { id: "reread", fr: "Deuxième lecture", descFr: "Relire un livre déjà terminé.", icon: "shelf", tier: "bronze", coins: 50, check: (s) => c(s.rereads, 1) },
  { id: "streak-7", fr: "Une semaine de lecture", descFr: "7 jours d'activité (avec les jokers).", icon: "flame", tier: "silver", coins: 100, check: (s) => c(s.streak, 7) },
];

export async function collectStats(streak = 0): Promise<AchStats> {
  const db = getDb();
  const [books, col, srs] = await Promise.all([db.books.toArray(), db.collection.toArray(), db.srs.where("skill").equals("recognition").toArray()]);
  const libById = new Map(LIBRARY.map((b) => [b.id, b]));
  const finishedBooks = books.filter((b) => b.finishedAt || col.some((c) => c.bookId === b.id));
  const genres = new Set(col.map((c) => c.cat).filter(Boolean));
  const countries = new Set(col.flatMap((c) => (c.libraryId ? libById.get(c.libraryId)?.countries ?? [] : [])));
  const quizzes = books.flatMap((b) => b.quizResults ?? []);
  return {
    chapters: books.reduce((a, b) => a + Math.max(b.position?.chapter ?? 0, b.chaptersDone?.length ?? 0) + (b.finishedAt ? 1 : 0), 0),
    finished: col.length,
    originals: finishedBooks.filter((b) => isOriginal(b) && (b.words ?? 0) >= 20_000).length,
    b2Plus: col.filter((c) => ["B2", "C1", "C2"].includes(c.level ?? "")).length,
    memorized: srs.filter((s) => s.state === State.Review && s.stability >= DURABLE_DAYS).length,
    genres: genres.size,
    countries: countries.size,
    quizzes: quizzes.length,
    perfectQuizzes: quizzes.filter((q) => q.total > 0 && q.score >= q.total).length,
    wordsRead: books.reduce((a, b) => a + (b.wordsRead ?? 0), 0),
    rereads: col.filter((c) => c.times > 1).length,
    streak,
  };
}

/** Unlocks every achievement whose condition is met; returns the newly unlocked ones (coins already paid). */
export async function evaluateAchievements(streak = 0): Promise<AchievementDef[]> {
  const db = getDb();
  const stats = await collectStats(streak);
  const have = new Set((await db.achievements.toArray()).map((a) => a.id));
  const fresh = ACHIEVEMENTS.filter((a) => !have.has(a.id) && a.check(stats).value >= a.check(stats).target);
  if (!fresh.length) return [];
  const now = Date.now();
  await db.achievements.bulkPut(fresh.map((a) => ({ id: a.id, unlockedAt: now, updatedAt: now })));
  await addCoins(fresh.reduce((n, a) => n + a.coins, 0));
  return fresh;
}

export async function unlockAchievement(id: string): Promise<AchievementDef | null> {
  const db = getDb();
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def || (await db.achievements.get(id))) return null;
  await db.achievements.put({ id, unlockedAt: Date.now(), updatedAt: Date.now() });
  await addCoins(def.coins);
  return def;
}
