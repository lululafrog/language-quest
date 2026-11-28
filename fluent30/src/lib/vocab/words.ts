// Shared lexicon seen by the vocabulary engine: every built-in word with its CEFR level and theme group.
import { SEED_VOCAB } from "../data/vocab";
import { VOCAB_CEFR } from "../data/vocab-cefr";
import type { SeedWord } from "../data/types";
import type { Card, Cefr } from "../types";
import { cefrFromDifficulty, cefrFromRank, isCefr } from "./core";

export interface ThemeGroup {
  id: string;
  fr: string;
  emoji: string;
  themes: string[];
}

/** Themes offered on the game mode screen (each groups several lexicon themes). */
export const THEME_GROUPS: ThemeGroup[] = [
  { id: "travel", fr: "Voyage", emoji: "✈️", themes: ["travel", "airport", "transport", "accommodation", "directions", "travel-problems", "beach", "adventure", "city"] },
  { id: "food", fr: "Restauration", emoji: "🍽️", themes: ["restaurant", "food", "cooking"] },
  { id: "emotions", fr: "Émotions", emoji: "😊", themes: ["emotions", "opinions"] },
  { id: "work", fr: "Travail", emoji: "💼", themes: ["work", "tech", "school"] },
  { id: "sport", fr: "Sport", emoji: "⚽", themes: ["sport", "body"] },
  { id: "relations", fr: "Relations", emoji: "💞", themes: ["relationships", "people", "dating", "party", "greetings", "introductions"] },
  { id: "daily", fr: "Vie quotidienne", emoji: "🏠", themes: ["daily", "home", "time", "shopping", "clothes", "numbers"] },
  { id: "health", fr: "Santé", emoji: "🩺", themes: ["health", "body", "emergency"] },
  { id: "nature", fr: "Nature", emoji: "🌿", themes: ["nature", "animals", "beach"] },
  { id: "culture", fr: "Culture", emoji: "🎭", themes: ["art", "books", "movies", "music"] },
];

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
  return byLemma.get(term.toLowerCase().trim().replace(/^to /, ""));
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
