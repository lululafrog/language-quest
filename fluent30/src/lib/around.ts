"use client";
// "Autour de moi": name what you see in English. Works without any key (built-in lexicon,
// then free machine translation); uses the AI when available for richer cards.
import { SEED_VOCAB, seedByLemma } from "./data/vocab";
import { getApi } from "./api";
import { normalize, splitAlternatives, stripArticles } from "./text";
import { lemmaOf } from "./cards";

export interface Named {
  en: string;
  fr: string;
  pos?: string;
  example?: string;
  exampleFr?: string;
  source: "lexique" | "traduction" | "ia";
}

const frIndex = new Map<string, (typeof SEED_VOCAB)[number]>();
for (const w of SEED_VOCAB) {
  for (const alt of splitAlternatives(w.fr)) {
    const k = stripArticles(normalize(alt));
    if (k && !frIndex.has(k)) frIndex.set(k, w);
  }
}

/** Finds the English word for something typed in French or English. */
export async function nameThing(input: string): Promise<Named | null> {
  const raw = input.trim();
  if (!raw) return null;
  const n = stripArticles(normalize(raw));
  // 1. Already English and in the built-in lexicon.
  const en = seedByLemma(lemmaOf(n));
  if (en && !frIndex.has(n)) return { en: en.en, fr: en.fr, pos: en.pos, example: en.ex, exampleFr: en.exFr, source: "lexique" };
  // 2. French word known by the built-in lexicon.
  const fr = frIndex.get(n);
  if (fr) return { en: fr.en, fr: fr.fr, pos: fr.pos, example: fr.ex, exampleFr: fr.exFr, source: "lexique" };
  // 3. Free machine translation FR → EN (if the result equals the input, it was English: translate EN → FR).
  const toEn = await getApi<{ translation: string }>(`/api/translate-free?from=fr&q=${encodeURIComponent(raw)}`, { cacheKey: `free:fr:${n}` });
  const enWord = toEn.translation.trim();
  if (normalize(enWord) === n) {
    const toFr = await getApi<{ translation: string }>(`/api/translate-free?q=${encodeURIComponent(raw)}`, { cacheKey: `free:${n}` });
    return { en: raw.toLowerCase(), fr: toFr.translation.toLowerCase(), source: "traduction" };
  }
  return { en: enWord.toLowerCase().replace(/[.!]$/, ""), fr: raw.toLowerCase(), source: "traduction" };
}
