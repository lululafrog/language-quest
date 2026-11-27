// Aggregates the built-in frequency vocabulary (deduplicated, re-ranked contiguously).
// This is the SHARED, GENERIC lexicon (same for every learner, bundled with the app, works offline):
// ranks 1–3000 with French translations, learner definitions and spoken examples. Personal data never lives here.
import type { SeedWord } from "./types";
import { VOCAB_1 } from "./vocab-1";
import { VOCAB_2 } from "./vocab-2";
import { VOCAB_3 } from "./vocab-3";
import { VOCAB_4 } from "./vocab-4";
import { VOCAB_5 } from "./vocab-5";
import { VOCAB_6 } from "./vocab-6";
import { VOCAB_7 } from "./vocab-7";
import { VOCAB_DETAILS } from "./vocab-details";

export const SEED_VOCAB: SeedWord[] = (() => {
  const seen = new Set<string>();
  const out: SeedWord[] = [];
  const base = [...VOCAB_1, ...VOCAB_2, ...VOCAB_3].sort((a, b) => a.rank - b.rank);
  // New words (ranks ≈ 1714–3000) come after the original lists, in their own order.
  for (const w of [...base, ...VOCAB_4, ...VOCAB_5, ...VOCAB_6, ...VOCAB_7]) {
    const k = w.en.toLowerCase().trim();
    if (seen.has(k)) continue;
    seen.add(k);
    const d = VOCAB_DETAILS[k] ?? VOCAB_DETAILS[w.en];
    out.push({
      ...w,
      def: w.def ?? d?.[0],
      ex: w.ex ?? d?.[1],
      exFr: w.exFr ?? d?.[2],
      rank: out.length + 1,
    });
  }
  return out;
})();

const byLemma = new Map<string, SeedWord>();
for (const w of SEED_VOCAB) byLemma.set(w.en.toLowerCase(), w);

export function seedByLemma(lemma: string): SeedWord | undefined {
  return byLemma.get(lemma.toLowerCase());
}
