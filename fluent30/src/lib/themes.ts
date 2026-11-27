"use client";
// Vocabulary themes: curated packs (by priority) + built-in frequency words tagged with the theme.
import { getDb, uid } from "./db";
import { THEMES, themeById, type Theme } from "./data/types";
import { THEME_PACKS, type PackItem } from "./data/theme-packs";
import { SEED_VOCAB } from "./data/vocab";
import { guessKind, lemmaOf } from "./cards";
import { guessThemes } from "./autotheme";
import type { Card } from "./types";

export interface ThemeWord {
  en: string;
  fr: string;
  pos: string;
  ex?: string;
  exFr?: string;
  level: number;
  themeId: string;
  rank?: number;
}

/** All words of a theme, most necessary first (pack items, then frequent words tagged with it). */
export function themeWords(themeId: string): ThemeWord[] {
  const pack = (THEME_PACKS[themeId] ?? []).map<ThemeWord>((p: PackItem) => ({ ...p, themeId }));
  const seen = new Set(pack.map((p) => lemmaOf(p.en)));
  const seed = SEED_VOCAB.filter((w) => w.themes?.includes(themeId) && !seen.has(lemmaOf(w.en))).map<ThemeWord>((w) => ({
    en: w.en, fr: w.fr, pos: w.pos, ex: w.ex, exFr: w.exFr, level: w.rank <= 500 ? 1 : w.rank <= 1000 ? 2 : 3, themeId, rank: w.rank,
  }));
  return [...pack, ...seed].sort((a, b) => a.level - b.level);
}

export function cardFromThemeWord(w: ThemeWord): Card {
  const now = Date.now();
  const kind = guessKind(w.en, w.pos);
  const themes = [...new Set([w.themeId, ...guessThemes(w.en, w.pos).filter((t) => t !== "daily")])].slice(0, 3);
  return {
    id: uid("c"), term: w.en, lemma: lemmaOf(w.en), kind, fr: w.fr, pos: w.pos, example: w.ex, exampleFr: w.exFr, themes,
    frequencyRank: w.rank, difficulty: w.level, source: "seed", enriched: true, createdAt: now, updatedAt: now,
  };
}

export async function knownLemmas(): Promise<Set<string>> {
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

export interface ThemeProgress {
  theme: Theme;
  total: number;
  learned: number;
}

export async function themesProgress(): Promise<ThemeProgress[]> {
  const known = await knownLemmas();
  return THEMES.filter((t) => t.id !== "irregular-verbs").map((theme) => {
    const words = themeWords(theme.id);
    return { theme, total: words.length, learned: words.filter((w) => known.has(lemmaOf(w.en))).length };
  });
}

/** Weight of a theme for the personalised part of new words: essentials first, then interests. */
export function themeWeight(themeId: string, interests: string[]): number {
  const t = themeById(themeId);
  if (!t) return 0;
  const interest = interests.includes(themeId) ? 3 : 0;
  return interest + (t.priority === 1 ? 3 : t.priority === 2 ? 1.2 : t.priority === 4 ? 0.6 : 0.2);
}

/** Next words for the personalised share, picked across themes by weight (deterministic order, most necessary first). */
export async function nextThemeWords(count: number, interests: string[], onlyTheme?: string): Promise<ThemeWord[]> {
  const known = await knownLemmas();
  const themes = onlyTheme ? [onlyTheme] : THEMES.map((t) => t.id).filter((id) => id !== "irregular-verbs" && id !== "grammar-words");
  const queues = themes
    .map((id) => ({ id, weight: onlyTheme ? 1 : themeWeight(id, interests), words: themeWords(id).filter((w) => !known.has(lemmaOf(w.en))) }))
    .filter((q) => q.weight > 0 && q.words.length);
  const out: ThemeWord[] = [];
  const taken = new Set<string>();
  // Weighted round-robin: higher-weight themes contribute more often.
  const credit = new Map(queues.map((q) => [q.id, 0]));
  let guard = 0;
  while (out.length < count && queues.some((q) => q.words.length) && guard++ < 1000) {
    for (const q of queues) credit.set(q.id, (credit.get(q.id) ?? 0) + q.weight);
    const best = queues.filter((q) => q.words.length).sort((a, b) => (credit.get(b.id) ?? 0) - (credit.get(a.id) ?? 0))[0];
    credit.set(best.id, (credit.get(best.id) ?? 0) - 10);
    const w = best.words.shift()!;
    const l = lemmaOf(w.en);
    if (!taken.has(l)) {
      taken.add(l);
      out.push(w);
    }
  }
  return out;
}
