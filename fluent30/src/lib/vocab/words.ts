// Shared lexicon seen by the vocabulary engine: every built-in word with its CEFR level and theme group.
import { SEED_VOCAB } from "../data/vocab";
import { VOCAB_CEFR } from "../data/vocab-cefr";
import type { SeedWord } from "../data/types";
import type { Card, Cefr } from "../types";
import { UNIVERSES } from "./universes";
import { cefrFromDifficulty, cefrFromRank, isCefr } from "./core";

export interface ThemeGroup {
  id: string;
  fr: string;
  emoji: string;
  themes: string[];
}

/** Themes offered on the game mode screen = the 20 vocabulary universes (one taxonomy for the whole app). */
export const THEME_GROUPS: ThemeGroup[] = UNIVERSES.map((u) => ({ id: u.id, fr: u.fr, emoji: "", themes: [...u.legacy, ...u.subs.map((x) => x.id)] }));

export function themeGroup(id?: string): ThemeGroup | undefined {
  return id ? THEME_GROUPS.find((g) => g.id === id) : undefined;
}

export function inGroup(themes: string[] | undefined, group?: ThemeGroup): boolean {
  if (!group) return true;
  return !!themes?.some((t) => group.themes.includes(t));
}

/** Theme group of a word (first matching group), for statistics. */
export function groupOf(themes: string[] | undefined): ThemeGroup | undefined {
  return THEME_GROUPS.find((g) => themes?.some((t) => g.themes.includes(t)));
}

export function seedLevel(w: SeedWord): Cefr {
  if (isCefr(w.cefr)) return w.cefr;
  const e = VOCAB_CEFR[w.en] ?? VOCAB_CEFR[w.en.toLowerCase()];
  if (e && isCefr(e[0])) return e[0];
  return cefrFromRank(w.rank);
}

export function seedSynonym(w: SeedWord): string | undefined {
  return w.syn ?? (VOCAB_CEFR[w.en] ?? VOCAB_CEFR[w.en.toLowerCase()])?.[1];
}

export interface LexWord extends SeedWord {
  level: Cefr;
  synonym?: string;
  lemma: string;
  /** extended lexicon fields (lexicon-full.ts) */
  cat?: string;
  subs?: string[];
  ant?: string;
  tip?: string;
  note?: string;
}

/** Entries of the extended lexicon, registered once it has been loaded (lexicon-full.ts). */
const extended = new Map<string, LexWord>();
export function registerExtended(words: LexWord[]) {
  for (const w of words) if (!extended.has(w.lemma)) extended.set(w.lemma, w);
}

let cache: LexWord[] | null = null;
/** The whole lexicon with levels (computed once). */
export function lexicon(): LexWord[] {
  if (!cache) cache = SEED_VOCAB.map((w) => ({ ...w, level: seedLevel(w), synonym: seedSynonym(w), lemma: w.en.toLowerCase().replace(/^to /, "") }));
  return cache;
}

const byLemma = new Map<string, LexWord>();
export function lexWord(term: string): LexWord | undefined {
  if (!byLemma.size) for (const w of lexicon()) byLemma.set(w.lemma, w);
  const k = term.toLowerCase().trim().replace(/^to /, "");
  return extended.get(k) ?? byLemma.get(k);
}

/** CEFR level of a learner's card: stored value, else the lexicon level, else from its difficulty. */
export function cardLevel(c: Pick<Card, "cefr" | "lemma" | "term" | "difficulty" | "frequencyRank">): Cefr {
  if (c.cefr) return c.cefr;
  const w = lexWord(c.lemma) ?? lexWord(c.term);
  if (w) return w.level;
  if (c.frequencyRank) return cefrFromRank(c.frequencyRank);
  return cefrFromDifficulty(c.difficulty);
}

/** Words of the lexicon per level (for "progression par niveau"). */
export function lexiconCountByLevel(): Record<Cefr, number> {
  const out: Record<Cefr, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
  for (const w of lexicon()) out[w.level]++;
  return out;
}
