"use client";
// Daily new words with the 70/30 rule: 70 % most useful frequent words, 30 % personalised
// (learner's interests and needs).
import { getDb } from "./db";
import { SEED_VOCAB } from "./data/vocab";
import type { SeedWord } from "./data/types";
import { postApi } from "./api";
import { lemmaOf } from "./cards";
import { nextThemeWords, type ThemeWord } from "./themes";

export interface Candidate {
  word: SeedWord;
  origin: "frequent" | "personal" | "ai" | "theme";
  theme?: string;
}

const SKIP = new Set(["the", "a", "an"]);

async function excludedLemmas(): Promise<Set<string>> {
  const db = getDb();
  const [cards, known] = await Promise.all([db.cards.toArray(), db.known.toArray()]);
  const set = new Set<string>();
  for (const c of cards) {
    set.add(c.lemma);
    for (const v of c.variants ?? []) set.add(lemmaOf(v));
  }
  for (const k of known) set.add(k.lemma);
  return set;
}

const fromTheme = (w: ThemeWord): Candidate => ({
  word: { en: w.en, fr: w.fr, pos: w.pos, ex: w.ex, exFr: w.exFr, rank: w.rank ?? 0, themes: [w.themeId] },
  origin: "theme",
  theme: w.themeId,
});

/** 70 % most frequent words + 30 % from vocabulary themes (essential themes and your interests first).
 * With `onlyTheme`, all words come from that theme (most necessary first). */
export async function nextNewWords(count: number, interests: string[], onlyTheme?: string): Promise<Candidate[]> {
  if (onlyTheme) return (await nextThemeWords(count, interests, onlyTheme)).map(fromTheme);
  const excluded = await excludedLemmas();
  const available = SEED_VOCAB.filter((w) => !SKIP.has(w.en) && !excluded.has(lemmaOf(w.en)));
  const personalCount = Math.round(count * 0.3);
  const frequent = available.slice(0, count - personalCount).map<Candidate>((w) => ({ word: w, origin: "frequent" }));
  const taken = new Set(frequent.map((c) => lemmaOf(c.word.en)));
  const themed = (await nextThemeWords(personalCount + 5, interests)).filter((w) => !taken.has(lemmaOf(w.en))).slice(0, personalCount).map(fromTheme);
  const out = [...frequent, ...themed];
  for (const w of available) {
    if (out.length >= count) break;
    if (!out.some((c) => lemmaOf(c.word.en) === lemmaOf(w.en))) out.push({ word: w, origin: "frequent" });
  }
  return out;
}

export interface AiWord {
  en: string;
  fr: string;
  pos: string;
  ex: string;
  exFr: string;
  themes: string[];
}

/** AI-generated words for tiers beyond the built-in list or for the learner's interests. */
export async function aiWords(mode: "tier" | "interests", opts: { tier?: number; interests?: string[]; count?: number }): Promise<Candidate[]> {
  const excluded = await excludedLemmas();
  const r = await postApi<{ words: AiWord[] }>("/api/ai/words", { mode, tier: opts.tier, interests: opts.interests, count: opts.count ?? 10, exclude: [...excluded].slice(-400) });
  return r.words
    .filter((w) => w.en && w.fr && !excluded.has(lemmaOf(w.en)))
    .map((w, i) => ({ word: { en: w.en, fr: w.fr, pos: w.pos, ex: w.ex, exFr: w.exFr, themes: w.themes, rank: 2000 + i + 1 }, origin: "ai" as const }));
}

export function seedCoverage(excluded: Set<string>) {
  return SEED_VOCAB.filter((w) => excluded.has(lemmaOf(w.en))).length;
}

export async function markKnown(lemmas: string[]) {
  const db = getDb();
  const now = Date.now();
  await db.known.bulkPut(lemmas.map((l) => ({ lemma: lemmaOf(l), at: now, updatedAt: now })));
}
