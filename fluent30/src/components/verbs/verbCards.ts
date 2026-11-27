"use client";
import { lemmaOf, saveCard, guessKind } from "@/lib/cards";
import { uid } from "@/lib/db";
import { seedByLemma } from "@/lib/data/vocab";
import type { CoreVerb } from "@/lib/data/types";
import type { Card } from "@/lib/types";

/** All lemmas belonging to a verb's track (the verb, its expressions and phrasal verbs). */
export function verbLemmas(v: CoreVerb): Set<string> {
  return new Set([v.base, ...v.expressions.map((x) => lemmaOf(x.en)), ...v.phrasal.map((x) => lemmaOf(x.en))]);
}

export function verbCard(v: CoreVerb): Card {
  const now = Date.now();
  const seed = seedByLemma(v.base);
  return {
    id: uid("c"), term: v.base, lemma: v.base, kind: "verb", fr: v.fr, ipa: v.ipa, pos: "verb",
    example: v.meanings[0]?.example, exampleFr: v.meanings[0]?.exampleFr,
    forms: { past: v.past, pp: v.pp, ing: v.ing, third: v.third },
    themes: ["action-verbs"], frequencyRank: seed?.rank, difficulty: 1, source: "verbs", enriched: true,
    notes: v.tips, createdAt: now, updatedAt: now,
  };
}

export function itemCard(item: { en: string; fr: string; example: string; exampleFr?: string }, phrasal: boolean): Card {
  const now = Date.now();
  const kind = phrasal ? "phrasal" : guessKind(item.en);
  return {
    id: uid("c"), term: item.en, lemma: lemmaOf(item.en), kind, fr: item.fr, pos: phrasal ? "phrasal verb" : "expression",
    example: item.example, exampleFr: item.exampleFr, themes: phrasal ? ["phrasal-verbs"] : ["daily"],
    difficulty: phrasal ? 3 : 2, source: "verbs", enriched: true, createdAt: now, updatedAt: now,
  };
}

export async function addToDeck(card: Card) {
  return saveCard(card);
}
