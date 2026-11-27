// Local (offline) dictionary built from the shared seed lexicon (3,000 most frequent words + core verbs).
// LOCAL-FIRST: the reader popup, the translator and quick-add use it instantly and at no cost;
// the network / AI is only called for what it cannot answer (context-specific meaning, rare words).
import { SEED_VOCAB, seedByLemma } from "./data/vocab";
import { CORE_VERBS } from "./data/verbs";
import { IRREGULAR_VERBS } from "./data/irregular";
import { lemmaCandidates } from "./text";
import type { SeedWord } from "./data/types";

export interface LocalEntry {
  lemma: string;
  fr: string;
  pos?: string;
  ipa?: string;
  def?: string; // simple English learner definition
  example?: string;
  exampleFr?: string;
  forms?: Record<string, string>;
  meanings?: { en: string; fr: string; example?: string }[];
  rank?: number;
  themes?: string[];
  isInflected: boolean; // the clicked word is an inflected form of lemma
  source: "seed" | "verbs" | "irregular";
}

const irregularByBase = new Map(IRREGULAR_VERBS.map((v) => [v[0], v]));

export function lookupLocal(word: string): LocalEntry | null {
  const clicked = word.toLowerCase().trim();
  // Multi-word entries (phrasal verbs, expressions) are looked up as a whole.
  const cands = clicked.includes(" ") ? [clicked.replace(/^to /, "")] : lemmaCandidates(word);
  for (const cand of cands) {
    const verb = CORE_VERBS.find((v) => v.base === cand);
    const seed = seedByLemma(cand);
    const irr = irregularByBase.get(cand);
    if (!verb && !seed && !irr) continue;
    const entry: LocalEntry = {
      lemma: cand,
      fr: verb?.fr ?? seed?.fr ?? irr?.[3] ?? "",
      pos: seed?.pos ?? (verb || irr ? "verb" : undefined),
      ipa: verb?.ipa ?? seed?.ipa,
      def: seed?.def,
      example: seed?.ex ?? verb?.meanings[0]?.example,
      exampleFr: seed?.exFr ?? verb?.meanings[0]?.exampleFr,
      rank: seed?.rank,
      themes: seed?.themes,
      isInflected: cand !== clicked,
      source: verb ? "verbs" : seed ? "seed" : "irregular",
    };
    if (verb) {
      entry.forms = { infinitive: verb.base, "3e pers.": verb.third, prétérit: verb.past, "participe passé": verb.pp, "-ing": verb.ing };
      entry.meanings = verb.meanings.map((m) => ({ en: m.en, fr: m.fr, example: m.example }));
    } else if (irr) {
      entry.forms = { infinitive: irr[0], prétérit: irr[1], "participe passé": irr[2] };
    }
    return entry;
  }
  return null;
}

export function seedWordsInTier(maxRank: number, minRank = 1): SeedWord[] {
  return SEED_VOCAB.filter((w) => w.rank >= minRank && w.rank <= maxRank);
}

/** Rough per-word difficulty for reading-level estimation: share of words outside the first N most frequent. */
export function textDifficulty(words: string[]): { level: string; unknownShare: number } {
  if (!words.length) return { level: "A1", unknownShare: 0 };
  let beyond1000 = 0;
  let unknown = 0;
  for (const w of words) {
    const e = lookupLocal(w);
    if (!e) unknown++;
    else if ((e.rank ?? 0) > 1000) beyond1000++;
  }
  const share = (unknown + beyond1000 * 0.5) / words.length;
  const avgLen = words.reduce((a, w) => a + w.length, 0) / words.length;
  const s = share + (avgLen - 4) * 0.03;
  const level = s < 0.08 ? "A1" : s < 0.13 ? "A2" : s < 0.19 ? "B1" : s < 0.25 ? "B2" : s < 0.32 ? "C1" : "C2";
  return { level, unknownShare: share };
}

/** True when the term (word or expression) is fully covered by the shared lexicon: no AI needed. */
export function isInSharedLexicon(term: string): boolean {
  const e = lookupLocal(term);
  return !!e && e.source !== "irregular" && !!e.fr;
}
