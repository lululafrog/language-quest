// Aggregates the built-in frequency vocabulary (deduplicated, re-ranked contiguously).
import type { SeedWord } from "./types";
import { VOCAB_1 } from "./vocab-1";
import { VOCAB_2 } from "./vocab-2";
import { VOCAB_3 } from "./vocab-3";

export const SEED_VOCAB: SeedWord[] = (() => {
  const seen = new Set<string>();
  const out: SeedWord[] = [];
  for (const w of [...VOCAB_1, ...VOCAB_2, ...VOCAB_3].sort((a, b) => a.rank - b.rank)) {
    const k = w.en.toLowerCase().trim();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ ...w, rank: out.length + 1 });
  }
  return out;
})();

const byLemma = new Map<string, SeedWord>();
for (const w of SEED_VOCAB) byLemma.set(w.en.toLowerCase(), w);

export function seedByLemma(lemma: string): SeedWord | undefined {
  return byLemma.get(lemma.toLowerCase());
}
