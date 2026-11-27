// Aggregates the built-in frequency vocabulary.
import type { SeedWord } from "./types";
import { VOCAB_1 } from "./vocab-1";
import { VOCAB_2 } from "./vocab-2";
import { VOCAB_3 } from "./vocab-3";

export const SEED_VOCAB: SeedWord[] = [...VOCAB_1, ...VOCAB_2, ...VOCAB_3].sort((a, b) => a.rank - b.rank);

const byLemma = new Map<string, SeedWord>();
for (const w of SEED_VOCAB) {
  const k = w.en.toLowerCase();
  if (!byLemma.has(k)) byLemma.set(k, w);
}
export function seedByLemma(lemma: string): SeedWord | undefined {
  return byLemma.get(lemma.toLowerCase());
}
