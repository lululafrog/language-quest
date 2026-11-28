"use client";
// Card creation, enrichment, duplicate detection and illustrations.
import { getDb, uid } from "./db";
import { postApi, ApiError } from "./api";
import { scheduleNewCard } from "./srs";
import { trackActivity } from "./track";
import { lookupLocal } from "./lexicon";
import { seedByLemma } from "./data/vocab";
import { tierOf, type SeedWord } from "./data/types";
import { IRREGULAR_FORMS } from "./data/irregular";
import { lemmaCandidates, normalize, splitAlternatives } from "./text";
import { cardLevel, lexWord } from "./vocab/words";
import { subForLegacy } from "./vocab/universes";
import { catFromPos } from "./vocab/lexicon-full";
import { guessThemes } from "./autotheme";
import type { Card, EntryKind, Enrichment } from "./types";

export type EnrichResponse = Omit<Enrichment, "forms" | "ipaUK"> & { ipaUK: string; forms: { name: string; value: string }[]; originalLanguage: "en" | "fr" };

export function lemmaOf(term: string): string {
  const t = normalize(term).replace(/^to /, "");
  if (t.includes(" ")) return t; // expressions keep their full form
  return IRREGULAR_FORMS[t] ?? t;
}

/** Existing card with the same lemma, or whose variants include the term. */
export async function findDuplicate(term: string): Promise<Card | undefined> {
  const db = getDb();
  const lemma = lemmaOf(term);
  const direct = await db.cards.where("lemma").equals(lemma).first();
  if (direct) return direct;
  if (!lemma.includes(" ")) {
    for (const cand of lemmaCandidates(lemma)) {
      const c = await db.cards.where("lemma").equals(cand).first();
      if (c && c.kind !== "expression" && c.kind !== "phrase") return c;
    }
  }
  return undefined;
}

export function guessKind(term: string, pos?: string): EntryKind {
  const words = term.trim().split(/\s+/).length;
  if (pos?.includes("phrasal")) return "phrasal";
  if (words >= 5 || /[.?!]$/.test(term.trim())) return "phrase";
  if (words > 1) return "expression";
  if (pos?.startsWith("verb") || pos === "modal") return "verb";
  return "word";
}

export function cardFromSeed(w: SeedWord, source: Card["source"] = "seed"): Card {
  const now = Date.now();
  const kind = guessKind(w.en, w.pos);
  return {
    id: uid("c"), term: w.en, lemma: lemmaOf(w.en), kind, fr: w.fr, pos: w.pos, ipa: w.ipa, definition: w.def, example: w.ex, exampleFr: w.exFr,
    themes: [...new Set([...(w.themes ?? []), ...guessThemes(w.en, w.pos)])].filter((t, _i, all) => t !== "daily" || all.length === 1).slice(0, 3), frequencyRank: w.rank || undefined, tier: w.rank ? tierOf(w.rank) : undefined,
    difficulty: !w.rank ? 2 : w.rank <= 500 ? 1 : w.rank <= 1000 ? 2 : w.rank <= 2000 ? 3 : 4, source, enriched: true, createdAt: now, updatedAt: now,
  };
}

export function cardFromEnrichment(e: EnrichResponse, source: Card["source"] = "user"): Card {
  const now = Date.now();
  const seed = seedByLemma(e.lemma);
  const forms: Record<string, string> = {};
  for (const f of e.forms ?? []) if (f.name && f.value) forms[f.name] = f.value;
  const themes = [...new Set([...guessThemes(e.term, e.kind === "phrasal" ? "phrasal verb" : e.kind === "verb" ? "verb" : e.pos).filter((x) => x !== "daily"), ...(e.themes ?? []).filter(Boolean)])].slice(0, 4);
  return {
    id: uid("c"), term: e.term, lemma: lemmaOf(e.lemma || e.term), kind: e.kind, fr: e.fr, definition: e.definition, ipa: e.ipaUK, ipaUS: e.ipaUS,
    pos: e.pos, example: e.example, exampleFr: e.exampleFr, synonyms: e.synonyms, antonyms: e.antonyms, forms,
    themes: themes.length ? themes : ["daily"], difficulty: Math.min(5, Math.max(1, Math.round(e.difficulty || 3))),
    frequencyRank: seed?.rank, tier: seed ? tierOf(seed.rank) : e.frequency === "very common" ? 1000 : e.frequency === "common" ? 3000 : 5000,
    register: e.register, source, enriched: true, notes: e.notes || undefined, createdAt: now, updatedAt: now,
    variants: [],
  };
}

/** Build a card from offline data only (when the AI isn't available). Returns null if unknown. */
export function cardFromLocal(term: string, fr?: string): Card | null {
  const local = lookupLocal(term.trim().split(/\s+/).length === 1 ? term.trim() : "__none__");
  const now = Date.now();
  if (!local && !fr) return null;
  const seed = local ? seedByLemma(local.lemma) : undefined;
  if (seed) return { ...cardFromSeed(seed, "user"), fr: fr || seed.fr };
  const kind = guessKind(term, local?.pos);
  return {
    id: uid("c"), term: local?.lemma ?? term.trim(), lemma: lemmaOf(local?.lemma ?? term), kind, fr: fr || local?.fr || "", pos: local?.pos,
    ipa: local?.ipa, example: local?.example, exampleFr: local?.exampleFr, forms: local?.forms, themes: guessThemes(local?.lemma ?? term, local?.pos),
    source: "user", enriched: !!local, createdAt: now, updatedAt: now,
  };
}

/** AI enrichment; when the AI is unavailable, a card completed from the built-in lexicon, the free dictionary and free translation (engine "local"). */
export async function enrichTerm(input: string, context?: string): Promise<EnrichResponse & { engine?: "ai" | "local" }> {
  try {
    return await postApi<EnrichResponse>("/api/ai/enrich", { input, context }, { cacheKey: `enrich:${normalize(input)}:${context ? normalize(context).slice(0, 80) : ""}` });
  } catch (err) {
    if (!(err instanceof ApiError) || err.status === 400) throw err;
    const { enrichWithoutAI } = await import("./fallbacks");
    return enrichWithoutAI(input);
  }
}

export interface AddResult {
  card: Card;
  duplicateOf?: Card;
  merged?: boolean;
}

/** Save a card (or merge into an existing one with the same lemma) and schedule it for review. */
export async function saveCard(card: Card, opts: { mergeDuplicates?: boolean; countAsNew?: boolean } = {}): Promise<AddResult> {
  const db = getDb();
  card = classifyCard(card);
  const dup = await findDuplicate(card.term);
  if (dup && opts.mergeDuplicates !== false) {
    const variants = new Set([...(dup.variants ?? []), ...(normalize(card.term) !== normalize(dup.term) ? [card.term] : [])]);
    const themes = [...new Set([...dup.themes, ...card.themes])];
    const subs = [...new Set([...(dup.subs ?? []), ...(card.subs ?? [])])].slice(0, 4);
    await db.cards.update(dup.id, { variants: [...variants], themes, subs, suspended: false, updatedAt: Date.now() });
    await scheduleNewCard(dup.id);
    return { card: { ...dup, variants: [...variants], themes }, duplicateOf: dup, merged: true };
  }
  await db.cards.put(card);
  await scheduleNewCard(card.id);
  if (opts.countAsNew !== false) await trackActivity({ newWords: 1, xp: 5 });
  return { card };
}

/** True when two French translations share at least one meaning ("banque, rive" vs "rive" → same). */
export function sameMeaning(a: string, b: string): boolean {
  const A = new Set(splitAlternatives(a).map((x) => normalize(x)));
  return splitAlternatives(b).some((x) => A.has(normalize(x)) || [...A].some((y) => y.length > 3 && (y.includes(normalize(x)) || normalize(x).includes(y))));
}

async function findSense(lemma: string, fr: string): Promise<Card | undefined> {
  const all = await getDb().cards.where("lemma").equals(lemma).toArray();
  return all.find((c) => sameMeaning(c.fr, fr));
}

/**
 * Classifies a word wherever it comes from (book, game, lesson, conversation, photo, mission, manual list):
 * sub-themes, universe, category and CEFR level from the shared lexicon when the word is known, otherwise from its
 * themes and part of speech. Never overwrites what is already set.
 */
export function classifyCard(card: Card): Card {
  const lex = lexWord(card.lemma) ?? lexWord(card.term);
  const subs = card.subs?.length ? card.subs : lex?.subs?.length ? lex.subs : [...new Set(card.themes.map(subForLegacy).filter((x): x is string => !!x))].slice(0, 3);
  return {
    ...card,
    subs: subs.length ? subs : ["daily.small-talk"],
    cat: card.cat ?? lex?.cat ?? catFromPos(card.pos, card.term),
    cefr: card.cefr ?? cardLevel(card),
  };
}

/** Quick add from any screen (reader, chat report, translator): enrich with AI if possible, else local data. */
export async function quickAdd(term: string, opts: { fr?: string; context?: string; source?: Card["source"]; example?: string; pos?: string } = {}): Promise<AddResult & { usedAI: boolean }> {
  const dup = await findDuplicate(term);
  if (dup && opts.fr && !sameMeaning(dup.fr, opts.fr) && dup.sense !== opts.fr) {
    // same word, clearly different meaning (e.g. "bank" = banque / rive): a separate entry for this sense
    const other = await findSense(dup.lemma, opts.fr);
    if (other) return { card: other, duplicateOf: other, merged: true, usedAI: false };
    const card: Card = classifyCard({ ...dup, id: uid("c"), fr: opts.fr, sense: opts.fr, example: opts.example ?? undefined, exampleFr: undefined, context: opts.context, source: opts.source ?? "user", variants: [], createdAt: Date.now(), updatedAt: Date.now(), gameStats: undefined, seenIn: undefined, imageKey: undefined });
    await getDb().cards.put(card);
    await scheduleNewCard(card.id);
    await trackActivity({ newWords: 1, xp: 5 });
    return { card, usedAI: false };
  }
  if (dup) {
    const r = await saveCard({ ...dup, term }, {});
    return { ...r, usedAI: false };
  }
  // Local-first: words and expressions of the shared lexicon (3,000 most frequent) need no AI call.
  const local = lookupLocal(term);
  const seed = local && local.source !== "irregular" ? seedByLemma(local.lemma) : undefined;
  if (seed && (term.trim().split(/\s+/).length === 1 || normalize(seed.en) === normalize(term))) {
    const card = cardFromSeed(seed, opts.source ?? "user");
    if (opts.fr) card.fr = opts.fr; // contextual meaning chosen by the learner
    const r = await saveCard(card);
    return { ...r, usedAI: false };
  }
  try {
    const e = await enrichTerm(term, opts.context);
    const card = cardFromEnrichment(e, opts.source ?? "user");
    if (e.engine === "local") {
      if (opts.fr) card.fr = opts.fr;
      if (opts.example && !card.example) card.example = opts.example;
      card.enriched = false;
    }
    const r = await saveCard(card);
    if (e.engine !== "local") void maybeGenerateImage(r.card, e.imagePrompt);
    return { ...r, usedAI: e.engine !== "local" };
  } catch (err) {
    if (!(err instanceof ApiError) && !(err instanceof Error && /sans connexion à l'IA/.test(err.message))) throw err;
    const local = cardFromLocal(term, opts.fr);
    const card = local ?? {
      id: uid("c"), term, lemma: lemmaOf(term), kind: guessKind(term, opts.pos), fr: opts.fr ?? "", pos: opts.pos, themes: guessThemes(term, opts.pos), source: opts.source ?? "user",
      enriched: false, createdAt: Date.now(), updatedAt: Date.now(), example: opts.example,
    };
    if (opts.source) card.source = opts.source;
    if (opts.example && !card.example) card.example = opts.example;
    const r = await saveCard(card);
    return { ...r, usedAI: false };
  }
}

// ---------- Illustrations ----------

export function imageKeyFor(card: Pick<Card, "lemma" | "fr">): string {
  const sense = normalize(card.fr.split(/[,;]/)[0] ?? "").replace(/\s+/g, "-").slice(0, 24);
  return `${card.lemma.replace(/\s+/g, "-")}--${sense}`;
}

const inflight = new Map<string, Promise<string | null>>();

/** Returns the data URL of the card's illustration, generating and caching it if needed. */
export async function ensureImage(card: Card, prompt?: string): Promise<string | null> {
  const db = getDb();
  const key = card.imageKey ?? imageKeyFor(card);
  const cached = await db.images.get(key);
  if (cached) {
    if (card.imageKey !== key) await db.cards.update(card.id, { imageKey: key });
    return cached.data;
  }
  if (inflight.has(key)) return inflight.get(key)!;
  const p = (async () => {
    try {
      const r = await postApi<{ data: string; mime: string; provider: "openai" | "claude-svg" | "openverse"; attribution?: string; license?: string; sourceUrl?: string }>("/api/image", {
        key, term: card.term, meaning: card.fr, kind: card.kind, prompt: prompt ?? card.definition ?? "",
      });
      await db.images.put({ key, data: r.data, mime: r.mime, provider: r.provider, attribution: r.attribution, license: r.license, sourceUrl: r.sourceUrl, createdAt: Date.now(), updatedAt: Date.now() });
      await db.cards.update(card.id, { imageKey: key });
      return r.data;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

async function maybeGenerateImage(card: Card, prompt?: string) {
  const s = await getDb().settings.get("me");
  if (s && s.autoImages === false) return;
  await ensureImage(card, prompt);
}

export async function setCardImageFromFile(card: Card, file: File) {
  // a flashcard picture never needs more than ~600 px: keeps local storage small
  const { compressImage } = await import("./media");
  const small = await compressImage(file, 600, 0.8);
  const data = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(small);
  });
  const key = `upload-${card.id}`;
  await getDb().images.put({ key, data, mime: small.type || file.type, provider: "upload", createdAt: Date.now(), updatedAt: Date.now() });
  await getDb().cards.update(card.id, { imageKey: key });
}

export async function deleteCard(id: string) {
  const db = getDb();
  await db.transaction("rw", db.cards, db.srs, async () => {
    await db.srs.where("cardId").equals(id).delete();
    await db.cards.delete(id);
  });
}
