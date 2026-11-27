"use client";
// Atlas engine: learner level, level-adapted selection, cross-destination reviews, mission vocabulary.
import { getDb, getSettings, uid } from "../db";
import { cardFromLocal, findDuplicate, lemmaOf, saveCard } from "../cards";
import { guessThemes } from "../autotheme";
import { shuffle } from "../text";
import { DESTINATIONS_CONTENT, getDestinationContent } from "./destinations";
import { getCatalog } from "./catalog";
import { LEGACY_PREVIEWS, legacyMission, type AtlasDestinationView } from "./legacy";
import { BAND_ORDER, type AtlasExercise, type AtlasMission, type AtlasVocab, type Band } from "./types";
import type { Card } from "../types";

export { selectExercises, checkProduce, isMechanic, MECHANIC_TYPES } from "./select";

// ---------- destinations & missions ----------

/** Full content if written, otherwise a clearly labelled preview (old world map), otherwise undefined. */
export function atlasDestination(id: string): AtlasDestinationView | undefined {
  return getDestinationContent(id) ?? LEGACY_PREVIEWS.get(id);
}

/** Every playable destination (complete content + previews whose content is not written yet). */
export function playableDestinations(): AtlasDestinationView[] {
  const out: AtlasDestinationView[] = [...DESTINATIONS_CONTENT];
  for (const [id, p] of LEGACY_PREVIEWS) if (!getDestinationContent(id)) out.push(p);
  return out;
}

export interface MissionRef {
  mission: AtlasMission;
  dest: AtlasDestinationView;
  /** id under which progress is stored (the Atlas id, or the old id for legacy-only missions) */
  progressId: string;
}

/** Finds a mission by Atlas id, by legacy id (old URLs) or in a preview. */
export function getAtlasMission(id: string): MissionRef | undefined {
  for (const d of DESTINATIONS_CONTENT) {
    const m = d.missions.find((x) => x.id === id) ?? d.missions.find((x) => x.legacyId === id);
    if (m) return { mission: m, dest: d, progressId: m.id };
  }
  const leg = legacyMission(id);
  if (leg) {
    const dest = atlasDestination(leg.destId);
    if (dest) return { mission: leg.mission, dest, progressId: id };
  }
  return undefined;
}

export function destName(id: string): string {
  return getCatalog(id)?.nameFr ?? id;
}

/** TTS accent: the character's own accent, else the destination's variety of English. */
export function accentFor(destId: string, characterAccent?: string): string {
  if (characterAccent) return characterAccent;
  const byDest: Record<string, string> = {
    uk: "en-GB", ireland: "en-IE", australia: "en-AU", "new-zealand": "en-NZ", "south-africa": "en-ZA", india: "en-IN", canada: "en-CA", usa: "en-US",
  };
  if (byDest[destId]) return byDest[destId];
  const c = getCatalog(destId)?.continent;
  return c === "europe" || c === "africa" ? "en-GB" : "en-US";
}

// ---------- learner level ----------

export function bandFromLevel(level?: string | null): Band | undefined {
  if (!level) return undefined;
  const up = level.toUpperCase();
  if (up === "C2") return "C1";
  return (BAND_ORDER as string[]).includes(up) ? (up as Band) : undefined;
}

/** Course path level, else the last full CEFR test, else A1. */
export async function learnerBand(): Promise<Band> {
  const s = await getSettings();
  const fromPath = bandFromLevel(s.pathLevel);
  if (fromPath) return fromPath;
  try {
    const last = JSON.parse(localStorage.getItem("fluent30.cefr.last") ?? "null") as { overall?: number } | null;
    if (last && typeof last.overall === "number" && last.overall >= 0) return BAND_ORDER[Math.min(4, last.overall)];
  } catch {
    /* ignore */
  }
  return "A1";
}

// ---------- vocabulary across destinations ----------

interface VocabRef {
  destId: string;
  vocab: AtlasVocab;
}

function vocabIndex(): Map<string, VocabRef[]> {
  const idx = new Map<string, VocabRef[]>();
  for (const d of DESTINATIONS_CONTENT)
    for (const v of d.vocab) {
      const k = lemmaOf(v.en);
      idx.set(k, [...(idx.get(k) ?? []), { destId: d.id, vocab: v }]);
    }
  return idx;
}

/** Adds the vocabulary of a passed mission to the learner's cards (no AI call). Returns the number of new cards. */
export async function ensureMissionVocab(mission: AtlasMission, dest: AtlasDestinationView): Promise<number> {
  let added = 0;
  for (const vid of mission.vocab) {
    const v = dest.vocab.find((x) => x.id === vid);
    if (!v) continue;
    const dup = await findDuplicate(v.en);
    if (dup) {
      // already known: just remember it was met in this destination too
      if (!dup.themes.includes(dest.id)) await getDb().cards.update(dup.id, { themes: [...new Set([...dup.themes, dest.id])] });
      continue;
    }
    const now = Date.now();
    const base: Card =
      cardFromLocal(v.en, v.fr) ??
      { id: uid("c"), term: v.en, lemma: lemmaOf(v.en), kind: v.en.includes(" ") ? "expression" : "word", fr: v.fr, themes: [], source: "mission", enriched: false, createdAt: now, updatedAt: now };
    const card: Card = {
      ...base,
      fr: v.fr || base.fr,
      source: "mission",
      themes: [...new Set([...(base.themes.length ? base.themes : guessThemes(v.en)), dest.id, "travel"])],
      context: v.example ?? base.context,
      example: base.example ?? v.example,
    };
    await saveCard(card);
    added++;
  }
  return added;
}

export interface ReviewItem {
  exercise: AtlasExercise;
  cardId: string;
  fromDest: string;
}

/**
 * 0–n review items built from words learned in OTHER destinations: first the ones sharing a concept
 * with this mission (e.g. "to bargain" from Vietnam at Indonesia's market), then due mission words.
 */
export async function reviewItems(destId: string, mission: AtlasMission, n = 2): Promise<ReviewItem[]> {
  const db = getDb();
  const cards = (await db.cards.toArray()).filter((c) => c.source === "mission" && !c.suspended);
  if (!cards.length) return [];
  const idx = vocabIndex();
  const dest = atlasDestination(destId);
  const concepts = new Set(mission.vocab.map((id) => dest?.vocab.find((v) => v.id === id)?.concept).filter(Boolean) as string[]);
  const origin = (c: Card): VocabRef | undefined => (idx.get(c.lemma) ?? []).find((r) => r.destId !== destId);
  const others = cards.filter((c) => origin(c));
  const related = others.filter((c) => {
    const o = origin(c);
    return o?.vocab.concept && concepts.has(o.vocab.concept);
  });
  const now = Date.now();
  const dueIds = new Set((await db.srs.where("due").belowOrEqual(now).toArray()).map((s) => s.cardId));
  const due = others.filter((c) => dueIds.has(c.id) && !related.includes(c));
  const picked = [...shuffle(related), ...shuffle(due)].slice(0, n);
  const pool = [...new Set([...cards.map((c) => c.term), ...DESTINATIONS_CONTENT.flatMap((d) => d.vocab.map((v) => v.en))])];
  return picked.map((c) => {
    const o = origin(c)!;
    const from = destName(o.destId);
    const distractors = shuffle(pool.filter((t) => lemmaOf(t) !== c.lemma)).slice(0, 3);
    const options = shuffle([c.term, ...distractors]);
    const exercise: AtlasExercise = {
      type: "mcq",
      prompt: `Souvenir de voyage : comment dit-on « ${c.fr.split(/[,;]/)[0]} » ?`,
      options,
      answer: options.indexOf(c.term),
      explain: `Tu as appris « ${c.term} » (${from}).${o.vocab.example ? ` Exemple : ${o.vocab.example}` : ""} Il revient ici car il sert aussi dans cette situation.`,
    };
    return { exercise, cardId: c.id, fromDest: o.destId };
  });
}
