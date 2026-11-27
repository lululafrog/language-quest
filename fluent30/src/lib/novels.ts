"use client";
// Personal AI novels: creation, chapter-by-chapter writing with memory, storage as a readable Book.
import { getDb, uid } from "./db";
import { postApi } from "./api";
import type { Book, BookChapter, Novel } from "./types";

export type NovelPrefs = Novel["prefs"];

interface PlanResponse {
  title: string;
  subtitle: string;
  cover: { palette: string[]; motif: string };
  bible: string;
  pitchFr: string;
}

interface ChapterResponse {
  title: string;
  paragraphs: string[];
  summary: string;
  bibleNotes: string;
  choices: string[];
  wovenWords: string[];
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const WOVEN_KEY = (id: string) => `fluent30.novel.woven.${id}`;
const PITCH_KEY = (id: string) => `fluent30.novel.pitch.${id}`;

/** Words the learner struggles with (most lapses / lowest stability) + recently saved words. */
export async function weakWords(max = 8): Promise<string[]> {
  const db = getDb();
  const states = await db.srs.where("skill").equals("recognition").toArray();
  const struggling = states
    .filter((s) => s.reps > 0 && (s.lapses > 0 || s.stability < 7))
    .sort((a, b) => b.lapses - a.lapses || a.stability - b.stability)
    .slice(0, 6);
  const cards = await db.cards.bulkGet(struggling.map((s) => s.cardId));
  const recent = (await db.cards.orderBy("createdAt").reverse().limit(10).toArray()).filter((c) => c.source !== "seed");
  const words = [...cards.filter(Boolean).map((c) => c!.term), ...recent.map((c) => c.term)].filter((w) => w.split(" ").length <= 3);
  return [...new Set(words.map((w) => w.toLowerCase()))].slice(0, max);
}

export function wovenWords(novelId: string): Record<number, string[]> {
  try {
    return JSON.parse(localStorage.getItem(WOVEN_KEY(novelId)) ?? "{}");
  } catch {
    return {};
  }
}
export function novelPitch(novelId: string): string {
  return localStorage.getItem(PITCH_KEY(novelId)) ?? "";
}

function toChapters(n: Novel): BookChapter[] {
  return n.chapters.map((c) => ({ title: c.title, paragraphs: c.text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) }));
}

/** Keeps the readable Book + its content in sync with the novel. */
async function syncBook(n: Novel) {
  const db = getDb();
  const chapters = toChapters(n);
  const words = chapters.reduce((a, c) => a + c.paragraphs.join(" ").split(/\s+/).filter(Boolean).length, 0);
  const now = Date.now();
  const existing = await db.books.get(n.bookId);
  const book: Book = {
    ...(existing ?? { position: { chapter: 0, paragraph: 0 }, progress: 0, createdAt: now }),
    id: n.bookId,
    title: n.title,
    author: "Mon roman · Fluent30",
    source: "custom",
    format: "builtin",
    level: n.prefs.level,
    genre: n.prefs.genre,
    words,
    chapterCount: chapters.length,
    novelId: n.id,
    updatedAt: now,
  } as Book;
  await db.transaction("rw", db.books, db.bookContent, async () => {
    await db.books.put(book);
    await db.bookContent.put({ bookId: n.bookId, chapters, updatedAt: now });
  });
}

/** Plans a new novel (title, cover, story bible) and writes its first chapter. */
export async function createNovel(prefs: NovelPrefs, onStep?: (step: "plan" | "chapter") => void): Promise<Novel> {
  onStep?.("plan");
  const plan = await postApi<PlanResponse>("/api/ai/novel/plan", { prefs });
  const palette = plan.cover.palette.filter((c) => HEX.test(c));
  while (palette.length < 3) palette.push(["#4a32bb", "#ff7a6b", "#ffd166"][palette.length]);
  const id = uid("novel");
  const now = Date.now();
  const novel: Novel = {
    id,
    bookId: `novel:${id}`,
    title: plan.title,
    prefs,
    bible: plan.bible,
    chapters: [],
    cover: { palette: palette.slice(0, 3), motif: plan.cover.motif, subtitle: plan.subtitle },
    status: "writing",
    createdAt: now,
    updatedAt: now,
  };
  localStorage.setItem(PITCH_KEY(id), plan.pitchFr);
  await getDb().novels.put(novel);
  onStep?.("chapter");
  return writeNextChapter(id);
}

/** Writes the next chapter (optionally following the reader's choice) and saves it everywhere. */
export async function writeNextChapter(novelId: string, chosen?: string): Promise<Novel> {
  const db = getDb();
  const n = await db.novels.get(novelId);
  if (!n) throw new Error("Roman introuvable.");
  if (n.chapters.length >= n.prefs.chapters) return n;
  const index = n.chapters.length;
  const practice = await weakWords();
  const r = await postApi<ChapterResponse>("/api/ai/novel/chapter", {
    prefs: n.prefs,
    title: n.title,
    bible: n.bible,
    summaries: n.chapters.map((c) => c.summary),
    chosen,
    weakWords: practice,
    index,
  });
  const chapters = [...n.chapters];
  if (chosen && index > 0) chapters[index - 1] = { ...chapters[index - 1], chosen };
  chapters.push({ title: r.title, text: r.paragraphs.join("\n\n"), summary: r.summary, choices: n.prefs.interactive && index + 1 < n.prefs.chapters ? r.choices.slice(0, 3) : undefined });
  const notes = [r.bibleNotes.trim(), chosen ? `Reader's choice after chapter ${index}: ${chosen}` : ""].filter(Boolean).join(" ");
  const next: Novel = {
    ...n,
    chapters,
    bible: notes ? `${n.bible}\n\n[Ch. ${index + 1}] ${notes}` : n.bible,
    status: chapters.length >= n.prefs.chapters ? "done" : "writing",
    updatedAt: Date.now(),
  };
  await db.novels.put(next);
  const woven = wovenWords(novelId);
  woven[index] = r.wovenWords.filter((w) => practice.includes(w.toLowerCase()) || practice.some((p) => w.toLowerCase().startsWith(p)));
  localStorage.setItem(WOVEN_KEY(novelId), JSON.stringify(woven));
  await syncBook(next);
  return next;
}

export async function deleteNovel(novelId: string) {
  const db = getDb();
  const n = await db.novels.get(novelId);
  await db.transaction("rw", db.novels, db.books, db.bookContent, async () => {
    if (n) {
      await db.books.delete(n.bookId);
      await db.bookContent.delete(n.bookId);
    }
    await db.novels.delete(novelId);
  });
  localStorage.removeItem(WOVEN_KEY(novelId));
  localStorage.removeItem(PITCH_KEY(novelId));
}

export const GENRES = [
  { id: "thriller", fr: "Thriller", en: "thriller", emoji: "🔪" },
  { id: "mystery", fr: "Enquête policière", en: "detective mystery", emoji: "🔎" },
  { id: "romance", fr: "Romance", en: "romance", emoji: "💘" },
  { id: "fantasy", fr: "Fantasy", en: "fantasy", emoji: "🐉" },
  { id: "scifi", fr: "Science-fiction", en: "science fiction", emoji: "🚀" },
  { id: "adventure", fr: "Aventure", en: "adventure", emoji: "🧭" },
  { id: "horror", fr: "Horreur", en: "horror", emoji: "🦇" },
  { id: "comedy", fr: "Comédie", en: "comedy", emoji: "😂" },
  { id: "historical", fr: "Historique", en: "historical fiction", emoji: "🏰" },
  { id: "slice", fr: "Tranche de vie", en: "slice of life", emoji: "☕" },
];

export const MOODS = [
  { fr: "Mystérieuse", en: "mysterious" },
  { fr: "Drôle", en: "funny" },
  { fr: "Romantique", en: "romantic" },
  { fr: "Angoissante", en: "tense and scary" },
  { fr: "Feel-good", en: "heart-warming" },
  { fr: "Épique", en: "epic" },
  { fr: "Mélancolique", en: "melancholic" },
];

export const ERAS = [
  { fr: "Aujourd'hui", en: "present day" },
  { fr: "Années 1920", en: "the 1920s" },
  { fr: "Époque victorienne", en: "Victorian era" },
  { fr: "Moyen Âge", en: "Middle Ages" },
  { fr: "Futur proche", en: "near future" },
  { fr: "Futur lointain", en: "far future" },
];
