"use client";
// Practice pool for games and exercises: mixes the learner's own cards (weighted toward the
// weakest ones) with built-in frequency vocabulary near their level.
import { getDb } from "./db";
import { SEED_VOCAB } from "./data/vocab";
import { shuffle } from "./text";
import type { Card } from "./types";

export interface PoolItem {
  key: string; // card id or "seed:<rank>"
  cardId?: string; // present when it's one of the learner's cards (results feed the SRS)
  en: string;
  fr: string;
  pos?: string;
  example?: string;
  exampleFr?: string;
  imageKey?: string;
  synonyms?: string[];
  weakness: number; // 0..1, higher = needs more practice
}

function fromCard(c: Card, weakness: number): PoolItem {
  return { key: c.id, cardId: c.id, en: c.term, fr: c.fr, pos: c.pos, example: c.example, exampleFr: c.exampleFr, imageKey: c.imageKey, synonyms: c.synonyms, weakness };
}

/** Weighted sample of n items. `filter` lets a game restrict to e.g. items with examples or images. */
export async function getPracticePool(n = 20, filter?: (p: PoolItem) => boolean): Promise<PoolItem[]> {
  const db = getDb();
  const cards = (await db.cards.toArray()).filter((c) => !c.suspended && c.fr);
  const states = await db.srs.where("skill").equals("recognition").toArray();
  const byCard = new Map(states.map((s) => [s.cardId, s]));
  const mine: PoolItem[] = cards.map((c) => {
    const s = byCard.get(c.id);
    const stab = s?.stability ?? 0;
    const weakness = Math.min(1, (s?.lapses ?? 0) * 0.2 + (stab < 1 ? 0.8 : stab < 7 ? 0.5 : stab < 21 ? 0.3 : 0.1));
    return fromCard(c, weakness);
  });
  let items = mine.filter((p) => !filter || filter(p));
  // Weighted sampling without replacement.
  const picked: PoolItem[] = [];
  const pool = [...items];
  while (picked.length < n && pool.length) {
    const total = pool.reduce((a, p) => a + 0.15 + p.weakness, 0);
    let r = Math.random() * total;
    let i = 0;
    for (; i < pool.length; i++) {
      r -= 0.15 + pool[i].weakness;
      if (r <= 0) break;
    }
    picked.push(...pool.splice(Math.min(i, pool.length - 1), 1));
  }
  if (picked.length < n) {
    // Top up with built-in vocabulary around the learner's level.
    const knownLemmas = new Set(cards.map((c) => c.lemma));
    const maxRank = Math.max(300, Math.min(SEED_VOCAB.length, cards.length * 3 + 300));
    const seed = SEED_VOCAB.filter((w) => w.rank <= maxRank && !knownLemmas.has(w.en.toLowerCase()) && w.pos !== "det" && w.pos !== "pron")
      .map<PoolItem>((w) => ({ key: `seed:${w.rank}`, en: w.en, fr: w.fr, pos: w.pos, example: w.ex, exampleFr: w.exFr, weakness: 0.4 }))
      .filter((p) => !filter || filter(p));
    items = shuffle(seed).slice(0, n - picked.length);
    picked.push(...items);
  }
  return shuffle(picked);
}

/** Distractors: other items with the same part of speech when possible. */
export function distractors(target: PoolItem, pool: PoolItem[], k = 3, field: "en" | "fr" = "fr"): string[] {
  const same = pool.filter((p) => p.key !== target.key && p[field] !== target[field] && p.pos === target.pos);
  const other = pool.filter((p) => p.key !== target.key && p[field] !== target[field] && p.pos !== target.pos);
  let out = shuffle(same).slice(0, k).map((p) => p[field]);
  if (out.length < k) out = [...out, ...shuffle(other).slice(0, k - out.length).map((p) => p[field])];
  if (out.length < k) {
    const extra = shuffle(SEED_VOCAB.filter((w) => w.pos === target.pos && w[field === "en" ? "en" : "fr"] !== target[field])).slice(0, k - out.length);
    out = [...out, ...extra.map((w) => (field === "en" ? w.en : w.fr))];
  }
  return [...new Set(out)].slice(0, k);
}
