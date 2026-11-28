"use client";
// Data loading for every game (question-style games delegate to builders.ts).
import { getPracticePool, type PoolItem } from "../pool";
import { SENTENCE_BANK } from "../data/game-content";
import { sample, shuffle, splitAlternatives } from "../text";
import { buildQuestions, imageItems, IMAGE_FALLBACK_NOTICE, type Built, type Pick } from "./builders";
import { selectWords, type WordMode } from "../vocab/engine";
import type { Level } from "./engine";

const firstFr = (fr: string) => splitAlternatives(fr)[0] ?? fr;

export interface PairData { key: string; left: string; leftEmoji?: string; leftIsImage?: boolean; right: string; en: string; fr: string; cardId?: string; word?: PoolItem }
export interface SentenceData { key: string; en: string; fr: string; cardId?: string; word?: PoolItem }

export type Loaded =
  | { kind: "questions"; built: Built; timeLimit?: number }
  | { kind: "pairs"; items: PairData[]; notice?: string }
  | { kind: "memory"; items: PoolItem[] }
  | { kind: "hangman"; words: PoolItem[] }
  | { kind: "scramble"; words: PoolItem[] }
  | { kind: "builder"; sentences: SentenceData[] }
  | { kind: "pronunciation"; items: SentenceData[] };

const by = (l: Level, a: number, b: number, c: number) => (l === 1 ? a : l === 2 ? b : c);
const wordCount = (s: string) => s.trim().split(/\s+/).length;

export interface WordContext {
  mode: WordMode;
  theme?: string;
}

/** Loads a game. With a word context, every word comes from the central vocabulary engine. */
export async function loadGame(gameId: string, level: Level, ctx?: WordContext): Promise<Loaded & { filledWithNew?: boolean }> {
  const exclude = new Set<string>();
  let filled = 0;
  const pick: Pick = ctx
    ? async (n, filter) => {
        const s = await selectWords({ mode: ctx.mode, n, theme: ctx.theme, filter, exclude });
        for (const it of s.items) exclude.add(it.key);
        filled += s.filledWithNew;
        return s.items;
      }
    : getPracticePool;
  const loaded = await loadInner(gameId, level, pick);
  return { ...loaded, filledWithNew: filled > 0 };
}

async function loadInner(gameId: string, level: Level, pick: Pick): Promise<Loaded> {
  switch (gameId) {
    case "hangman": {
      const pool = await pick(30, (p) => /^[a-zA-Z]{4,11}$/.test(p.en));
      const sorted = level === 3 ? [...pool].sort((a, b) => b.en.length - a.en.length) : level === 1 ? pool.filter((p) => p.en.length <= 7) : pool;
      return { kind: "hangman", words: (sorted.length >= 3 ? sorted : pool).slice(0, by(level, 4, 5, 6)) };
    }
    case "scramble": {
      const pool = await pick(30, (p) => /^[a-zA-Z]{3,10}$/.test(p.en));
      const filtered = level === 1 ? pool.filter((p) => p.en.length <= 6) : level === 3 ? pool.filter((p) => p.en.length >= 6) : pool;
      return { kind: "scramble", words: (filtered.length >= 4 ? filtered : pool).slice(0, by(level, 6, 7, 8)) };
    }
    case "pairs": {
      const pool = await pick(by(level, 5, 6, 7), (p) => p.en.length <= 24);
      return { kind: "pairs", items: pool.map((p) => ({ key: p.key, left: p.en, right: firstFr(p.fr), en: p.en, fr: p.fr, cardId: p.cardId, word: p })) };
    }
    case "image-pairs": {
      const { items, fallback } = await imageItems(by(level, 4, 5, 6), pick);
      return {
        kind: "pairs",
        notice: fallback ? IMAGE_FALLBACK_NOTICE : undefined,
        items: items.map((p) => ({ key: p.key, left: p.image ?? "", leftIsImage: !!p.image, leftEmoji: p.emoji, right: p.en, en: p.en, fr: p.fr, cardId: p.cardId, word: fallback ? undefined : p })),
      };
    }
    case "memory": {
      const pool = await pick(by(level, 6, 8, 10), (p) => p.en.length <= 16 && firstFr(p.fr).length <= 18);
      return { kind: "memory", items: pool };
    }
    case "builder": {
      const pool = await pick(20, (p) => !!p.example && !!p.exampleFr && wordCount(p.example) >= 4 && wordCount(p.example) <= by(level, 7, 10, 14));
      const mine = pool.slice(0, 3).map((p) => ({ key: p.key, en: p.example!, fr: p.exampleFr!, cardId: p.cardId }));
      const bank = sample(SENTENCE_BANK.filter((s) => s.level <= level), 6 - mine.length).map((s) => ({ key: `s:${s.en}`, en: s.en, fr: s.fr }));
      return { kind: "builder", sentences: shuffle([...mine, ...bank]) };
    }
    case "pronunciation": {
      const words = (await pick(6, (p) => wordCount(p.en) <= 3)).map((p) => ({ key: p.key, en: p.en, fr: firstFr(p.fr), cardId: p.cardId, word: p }));
      const sentences = sample(SENTENCE_BANK.filter((s) => s.level <= level), 6).map((s) => ({ key: `s:${s.en}`, en: s.en, fr: s.fr }));
      const items = level === 1 ? words.slice(0, 6) : level === 2 ? [...words.slice(0, 3), ...sentences.slice(0, 3)] : sentences;
      return { kind: "pronunciation", items };
    }
    case "timed":
      return { kind: "questions", built: await buildQuestions("timed", level, pick), timeLimit: 60 };
    default:
      return { kind: "questions", built: await buildQuestions(gameId, level, pick) };
  }
}
