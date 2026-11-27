"use client";
// Finished books → collectible cards on the personal bookshelf, rewards and a personalised recap.
import { getDb } from "./db";
import { LIBRARY, type LibraryBook } from "./data/library";
import { SHOP_BY_ID, type ShopItem } from "./data/shop";
import { addCoins, grantItems, itemsUnlockedBy } from "./game";
import { trackActivity } from "./track";
import { DURABLE_DAYS, State } from "./srs";
import type { Book, CollectionEntry } from "./types";

export const FINISH_XP = 200;
export const REREAD_XP = 50;
export const REREAD_COINS = 30;

export function libraryEntryOf(book: Pick<Book, "libraryId" | "gutenbergId">): LibraryBook | undefined {
  const id = book.libraryId ?? book.gutenbergId;
  return id ? LIBRARY.find((b) => b.id === id) : undefined;
}

export function cardRarity(words: number, level?: string): CollectionEntry["card"] {
  if (words >= 120_000 || level === "C2") return "holo";
  if (words >= 60_000 || level === "C1") return "gold";
  if (words >= 20_000 || level === "B2") return "silver";
  return "bronze";
}

export function finishCoins(words: number, level?: string) {
  const lvl = level === "C2" ? 150 : level === "C1" ? 100 : level === "B2" ? 50 : 0;
  return 150 + Math.min(300, Math.round(words / 1000)) + lvl;
}

/** An original (not simplified) novel: built-in classics, Gutenberg and imported books. */
export function isOriginal(book: Pick<Book, "source">) {
  return book.source === "gutenberg" || book.source === "import";
}

export interface CeremonyData {
  book: Book;
  lib?: LibraryBook;
  entry: CollectionEntry;
  reread: boolean;
  xp: number;
  coins: number;
  items: ShopItem[];
  finishedCount: number;
  firstNovel: boolean;
  message: string;
}

/** Computes the recap stats of a book (from the reader's data and the learner's cards). */
export async function computeBookStats(book: Book): Promise<CollectionEntry["stats"]> {
  const db = getDb();
  const since = book.startedAt ?? book.createdAt;
  const until = book.finishedAt ?? Date.now();
  const cards = (await db.cards.where("createdAt").between(since, until + 1).toArray()).filter((c) => c.source === "reader");
  const states = cards.length ? await db.srs.where("cardId").anyOf(cards.map((c) => c.id)).toArray() : [];
  const durable = new Set(states.filter((s) => s.skill === "recognition" && s.state === State.Review && s.stability >= DURABLE_DAYS).map((s) => s.cardId));
  const quiz = book.quizResults ?? [];
  const quizAvg = quiz.length ? quiz.reduce((a, q) => a + q.score / Math.max(1, q.total), 0) / quiz.length : null;
  const wordsRead = book.wordsRead ?? book.words ?? 0;
  return {
    wordsRead,
    readingSeconds: book.readingSeconds ?? 0,
    newWords: cards.length,
    memorized: durable.size,
    expressions: cards.filter((c) => c.kind === "expression" || c.kind === "phrasal" || c.kind === "phrase").length,
    quizAvg,
    lookupsPer100: book.lookups != null && wordsRead > 0 ? Math.round((book.lookups / (wordsRead / 100)) * 10) / 10 : null,
  };
}

/** Called once when the reader reports a finished book: writes the collection entry and pays rewards (no double rewards on re-reads). */
export async function finishBook(bookId: string): Promise<CeremonyData | null> {
  const db = getDb();
  const book = await db.books.get(bookId);
  if (!book) return null;
  if (!book.finishedAt) await db.books.update(bookId, { finishedAt: Date.now(), progress: 1 });
  const fresh = (await db.books.get(bookId))!;
  const lib = libraryEntryOf(fresh);
  const prev = await db.collection.get(bookId);
  const stats = await computeBookStats(fresh);
  const words = fresh.words ?? stats.wordsRead;
  const level = lib?.level ?? fresh.level;
  const reread = !!prev;
  const entry: CollectionEntry = {
    bookId,
    libraryId: lib?.id ?? fresh.libraryId ?? fresh.gutenbergId,
    title: fresh.title,
    author: fresh.author,
    cat: lib?.cat ?? fresh.genre,
    level,
    finishedAt: Date.now(),
    times: (prev?.times ?? 0) + 1,
    card: prev?.card ?? cardRarity(words, level),
    stats,
    updatedAt: Date.now(),
  };
  const others = (await db.collection.toArray()).filter((c) => c.bookId !== bookId);
  await db.collection.put(entry);
  const xp = reread ? REREAD_XP : FINISH_XP;
  const coins = reread ? REREAD_COINS : finishCoins(words, level);
  await trackActivity({ xp });
  await addCoins(coins);
  const granted = await grantItems(itemsUnlockedBy(entry.libraryId));
  const novels = others.filter((c) => (c.stats.wordsRead ?? 0) >= 20_000);
  const firstNovel = !reread && words >= 20_000 && novels.length === 0;
  return {
    book: fresh, lib, entry, reread, xp, coins,
    items: granted.map((id) => SHOP_BY_ID.get(id)!).filter(Boolean),
    finishedCount: others.length + 1,
    firstNovel,
    message: ceremonyMessage({ reread, firstNovel, count: others.length + 1, level, stats, title: fresh.title }),
  };
}

function ceremonyMessage(o: { reread: boolean; firstNovel: boolean; count: number; level?: string; stats: CollectionEntry["stats"]; title: string }): string {
  const w = o.stats.wordsRead.toLocaleString("fr-FR");
  if (o.reread) return `Relire « ${o.title} », c'est la meilleure façon d'ancrer le vocabulaire : cette fois, tu as sûrement compris des passages qui t'échappaient la première fois.`;
  if (o.firstNovel) return `Tu viens de terminer ton premier roman entièrement en anglais ! ${w} mots lus. Il y a quelques semaines, certains de ces mots t'étaient inconnus. Aujourd'hui, tu as réussi à suivre toute une histoire.`;
  if (o.count === 1) return `Ton premier livre en anglais est terminé : ${w} mots lus d'un bout à l'autre. C'est exactement comme ça qu'on devient à l'aise.`;
  if (o.level === "C1" || o.level === "C2") return `Un livre de niveau ${o.level} en version originale : chapeau ! Tu lis maintenant ce que lisent les anglophones.`;
  if (o.stats.memorized > 0) return `${o.count} livres terminés. Et ${o.stats.memorized} mots de celui-ci sont déjà durablement mémorisés : ta bibliothèque grandit, ton anglais aussi.`;
  return `${o.count} livres terminés ! ${w} mots de plus lus en anglais. Chaque page rend la suivante plus facile.`;
}

/** Fallback recommendations when lib/recommend.ts isn't available: same category, close level, not finished. */
export async function fallbackRecommendations(lib: LibraryBook | undefined, n = 3): Promise<LibraryBook[]> {
  const done = new Set((await getDb().collection.toArray()).map((c) => c.libraryId));
  const order = ["A2", "B1", "B2", "C1", "C2"];
  const li = order.indexOf(lib?.level ?? "B1");
  return LIBRARY.filter((b) => !done.has(b.id) && b.id !== lib?.id)
    .map((b) => ({ b, score: (b.cat === lib?.cat ? 0 : 2) + Math.abs(order.indexOf(b.level) - li) + Math.random() * 0.5 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, n)
    .map((x) => x.b);
}

// ---------- Shelf decorations & styles ----------
export interface ShelfStyle { id: string; fr: string; price: number; board: string; edge: string; back: string; glow?: string }
export const SHELF_STYLES: ShelfStyle[] = [
  { id: "oak", fr: "Bois clair", price: 0, board: "#D8A86B", edge: "#B5834A", back: "#F6EBDD" },
  { id: "walnut", fr: "Noyer", price: 150, board: "#7A4B2A", edge: "#5A341C", back: "#EADBCB" },
  { id: "white", fr: "Moderne blanc", price: 150, board: "#F4F4F7", edge: "#D5D5DE", back: "#EEF0F6" },
  { id: "english", fr: "Bibliothèque anglaise", price: 300, board: "#5B2E1E", edge: "#3E1E12", back: "#2F3B2F" },
  { id: "neon", fr: "Néon", price: 400, board: "#20203A", edge: "#14142A", back: "#11111F", glow: "#FF4FD8" },
];

export interface Decor { id: string; fr: string; price: number }
export const DECORS: Decor[] = [
  { id: "plant", fr: "Plante verte", price: 40 },
  { id: "cactus", fr: "Cactus", price: 40 },
  { id: "candle", fr: "Bougie", price: 40 },
  { id: "globe", fr: "Globe terrestre", price: 80 },
  { id: "lamp", fr: "Lampe de lecture", price: 80 },
  { id: "vinyl", fr: "Platine vinyle", price: 120 },
  { id: "cat", fr: "Chat qui dort", price: 120 },
  { id: "snowglobe", fr: "Boule à neige", price: 90 },
  { id: "bigben", fr: "Mini Big Ben", price: 110 },
  { id: "eiffel", fr: "Mini tour Eiffel", price: 110 },
  { id: "trophy", fr: "Trophée doré", price: 200 },
  { id: "hourglass", fr: "Sablier", price: 90 },
];

/** Shelves unlock as the collection grows: 2 to start, +1 every 4 finished books (max 8). */
export function unlockedShelves(finished: number) {
  return Math.min(8, 2 + Math.floor(finished / 4));
}
export const BOOKS_PER_SHELF = 7;
