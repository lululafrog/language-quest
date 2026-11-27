// Learner definitions and missing examples for the original seed lexicon (ranks 1–1713).
// Merged into SEED_VOCAB by vocab.ts; keys are lowercase headwords.
import { DETAILS_1 } from "./vocab-details-1";
import { DETAILS_2 } from "./vocab-details-2";
import { DETAILS_3 } from "./vocab-details-3";
import { DETAILS_4 } from "./vocab-details-4";

export const VOCAB_DETAILS: Record<string, [string, string?, string?]> = { ...DETAILS_1, ...DETAILS_2, ...DETAILS_3, ...DETAILS_4 };
