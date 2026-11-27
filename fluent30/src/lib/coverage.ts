"use client";
// Estimated share of a built-in book's vocabulary the learner already knows.
// Uses /books/<id>.lemmas.json (word → count) produced with the library data; returns null when unavailable.
import { cacheGet, cacheSet, getDb, todayKey } from "./db";
import { lemmaCandidates } from "./text";
import { IRREGULAR_FORMS } from "./data/irregular";
import { SEED_VOCAB } from "./data/vocab";
import { lemmaOf } from "./cards";

type LemmaFile = Record<string, number> | [string, number][] | { lemmas: Record<string, number> | [string, number][]; total?: number };

/** Minimum size of the learner's vocabulary for the estimate to be meaningful. */
export const MIN_KNOWN_FOR_COVERAGE = 60;
/** Grammar words everybody learns first (pronouns, articles, be/have…): counted as known. */
const BASELINE = new Set(SEED_VOCAB.filter((w) => w.rank <= 120).map((w) => w.en.toLowerCase()));

let knownPromise: Promise<Set<string>> | null = null;
let knownAt = 0;

/** Lemmas the learner knows: their cards (incl. grouped forms), words marked as known, baseline grammar words. */
export async function knownLemmaSet(): Promise<Set<string>> {
  if (knownPromise && Date.now() - knownAt < 60_000) return knownPromise;
  knownAt = Date.now();
  knownPromise = (async () => {
    const db = getDb();
    const [cards, known] = await Promise.all([db.cards.toArray(), db.known.toArray()]);
    const set = new Set<string>();
    for (const c of cards) {
      if (c.suspended) continue;
      set.add(c.lemma);
      for (const v of c.variants ?? []) set.add(lemmaOf(v));
    }
    for (const k of known) set.add(k.lemma);
    return set;
  })();
  return knownPromise;
}

const fileCache = new Map<number, Promise<[string, number][] | null>>();

async function loadLemmas(libraryId: number): Promise<[string, number][] | null> {
  if (!fileCache.has(libraryId)) {
    fileCache.set(
      libraryId,
      (async () => {
        try {
          const r = await fetch(`/books/${libraryId}.lemmas.json`);
          if (!r.ok) return null;
          const j = (await r.json()) as LemmaFile;
          const raw = Array.isArray(j) ? j : "lemmas" in j && j.lemmas ? j.lemmas : (j as Record<string, number>);
          const entries = Array.isArray(raw) ? raw : Object.entries(raw);
          return entries.filter((e): e is [string, number] => typeof e[0] === "string" && typeof e[1] === "number");
        } catch {
          return null;
        }
      })(),
    );
  }
  return fileCache.get(libraryId)!;
}

function isKnown(word: string, known: Set<string>): boolean {
  const w = word.toLowerCase();
  if (known.has(w) || BASELINE.has(w)) return true;
  const irr = IRREGULAR_FORMS[w];
  if (irr && (known.has(irr) || BASELINE.has(irr))) return true;
  for (const c of lemmaCandidates(w)) if (known.has(c) || BASELINE.has(c)) return true;
  return false;
}

export interface Coverage {
  /** share of running words (weighted by frequency in the book) the learner knows, 0..1 */
  ratio: number;
  /** distinct words of the book not yet known (most frequent first, max 30) */
  unknownTop: string[];
}

/** Coverage of a built-in book, cached per book per day. null = not enough data. */
export async function bookCoverage(libraryId: number): Promise<Coverage | null> {
  const known = await knownLemmaSet();
  if (known.size < MIN_KNOWN_FOR_COVERAGE) return null;
  const key = `coverage:${libraryId}:${todayKey()}:${Math.floor(known.size / 10)}`;
  const hit = await cacheGet<Coverage>(key);
  if (hit) return hit;
  const lemmas = await loadLemmas(libraryId);
  if (!lemmas?.length) return null;
  let total = 0;
  let ok = 0;
  const unknown: [string, number][] = [];
  for (const [w, n] of lemmas) {
    total += n;
    if (isKnown(w, known)) ok += n;
    else unknown.push([w, n]);
  }
  if (!total) return null;
  unknown.sort((a, b) => b[1] - a[1]);
  const res: Coverage = { ratio: ok / total, unknownTop: unknown.slice(0, 30).map(([w]) => w) };
  await cacheSet(key, res);
  return res;
}

/** Human label for a coverage ratio. */
export function coverageComfort(ratio: number): { fr: string; en: string; tone: "mint" | "ink" | "sun" | "coral" } {
  if (ratio >= 0.97) return { fr: "lecture facile", en: "easy read", tone: "mint" };
  if (ratio >= 0.9) return { fr: "idéal pour progresser", en: "ideal to progress", tone: "ink" };
  if (ratio >= 0.8) return { fr: "un peu exigeant", en: "a bit challenging", tone: "sun" };
  return { fr: "difficile pour l'instant", en: "hard for now", tone: "coral" };
}
