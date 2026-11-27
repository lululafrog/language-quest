"use client";
// Memory Cards: personal photos turned into vocabulary. Photos stay on the device (db.media, never synced);
// a small thumbnail is cached in db.images (also never synced) so flashcards can show the memory.
import { getDb, uid } from "./db";
import { postApi } from "./api";
import { cardFromLocal, guessKind, lemmaOf, saveCard } from "./cards";
import { guessThemes } from "./autotheme";
import { blobToBase64, compressImage, deleteMedia, saveMedia } from "./media";
import type { Card, Memory } from "./types";

export interface PhotoVocab {
  sceneFr: string;
  title: string;
  words: { en: string; fr: string; pos: string; why: string }[];
  sentences: { en: string; fr: string }[];
}

/** Sends a downscaled copy of the photo for analysis (call only after consent). */
export async function analysePhoto(photo: Blob, level: string, note?: string): Promise<PhotoVocab> {
  const small = await compressImage(photo, 1024, 0.8);
  const image = await blobToBase64(small);
  return postApi<PhotoVocab>("/api/ai/photo-vocab", { image, level, note: note?.trim() || undefined });
}

async function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });
}

/**
 * Creates (or merges into) a flashcard coming from personal content, without any extra AI call.
 * Returns the card id.
 */
export async function addPersonalCard(
  en: string,
  fr: string,
  opts: { source: Card["source"]; context?: string; memoryId?: string; journalId?: string; imageKey?: string; pos?: string },
): Promise<string> {
  const now = Date.now();
  const base: Card =
    cardFromLocal(en, fr) ?? {
      id: uid("c"), term: en.trim(), lemma: lemmaOf(en), kind: guessKind(en, opts.pos), fr, pos: opts.pos,
      themes: guessThemes(en, opts.pos), source: opts.source, enriched: false, createdAt: now, updatedAt: now,
    };
  const card: Card = {
    ...base,
    fr: fr || base.fr,
    pos: base.pos ?? opts.pos,
    source: opts.source,
    context: opts.context,
    example: base.example ?? opts.context,
    memoryId: opts.memoryId,
    journalId: opts.journalId,
    imageKey: opts.imageKey ?? base.imageKey,
  };
  const r = await saveCard(card);
  if (r.merged && r.duplicateOf) {
    // keep the learner's personal context on an existing card if it had none
    const d = r.duplicateOf;
    const patch: Partial<Card> = {};
    if (!d.context && opts.context) patch.context = opts.context;
    if (!d.memoryId && opts.memoryId) patch.memoryId = opts.memoryId;
    if (!d.journalId && opts.journalId) patch.journalId = opts.journalId;
    if (!d.imageKey && opts.imageKey) patch.imageKey = opts.imageKey;
    if (Object.keys(patch).length) await getDb().cards.update(d.id, patch);
    return d.id;
  }
  return r.card.id;
}

export async function createMemory(input: {
  photo: Blob;
  title: string;
  place?: string;
  takenAt?: string;
  sentence?: { en: string; fr: string };
  words: { en: string; fr: string; pos?: string }[];
}): Promise<Memory> {
  const db = getDb();
  const id = uid("mem");
  const now = Date.now();
  const stored = await compressImage(input.photo, 1600, 0.82);
  const photoKey = await saveMedia(stored, "photo");
  // thumbnail for flashcards (local images cache, never synced)
  const thumb = await compressImage(input.photo, 480, 0.78);
  const thumbKey = `memory-${id}`;
  await db.images.put({ key: thumbKey, mime: thumb.type || "image/jpeg", data: await blobToDataUrl(thumb), provider: "upload", createdAt: now, updatedAt: now });
  const words: Memory["words"] = [];
  for (const w of input.words) {
    const cardId = await addPersonalCard(w.en, w.fr, { source: "memory", context: input.sentence?.en, memoryId: id, imageKey: thumbKey, pos: w.pos });
    words.push({ en: w.en, fr: w.fr, cardId });
  }
  const m: Memory = {
    id, title: input.title.trim() || "Souvenir", place: input.place?.trim() || undefined, takenAt: input.takenAt || undefined,
    photoKey, sentence: input.sentence?.en, sentenceFr: input.sentence?.fr, words, createdAt: now, updatedAt: now,
  };
  await db.memories.put(m);
  return m;
}

/** Adds more words to an existing memory. */
export async function addWordsToMemory(m: Memory, words: { en: string; fr: string; pos?: string }[]) {
  const added: Memory["words"] = [];
  for (const w of words) {
    if (m.words.some((x) => x.en.toLowerCase() === w.en.toLowerCase())) continue;
    const cardId = await addPersonalCard(w.en, w.fr, { source: "memory", context: m.sentence, memoryId: m.id, imageKey: `memory-${m.id}`, pos: w.pos });
    added.push({ en: w.en, fr: w.fr, cardId });
  }
  if (added.length) await getDb().memories.update(m.id, { words: [...m.words, ...added] });
}

/** Optional illustration inspired by the memory (on explicit request only; the photo itself is NOT sent). */
export async function illustrateMemory(m: Memory, sceneFr?: string): Promise<string> {
  const key = `memory-illus-${m.id}`;
  const r = await postApi<{ data: string; mime: string; provider: "openai" | "claude-svg" }>("/api/image", {
    key, term: m.words[0]?.en ?? m.title, meaning: m.title, kind: "phrase", prompt: [m.sentence, sceneFr].filter(Boolean).join(" — "),
  });
  const now = Date.now();
  await getDb().images.put({ key, data: r.data, mime: r.mime, provider: r.provider, createdAt: now, updatedAt: now });
  await getDb().memories.update(m.id, { illustrationKey: key });
  return key;
}

export async function deleteMemory(m: Memory, alsoCards: boolean) {
  const db = getDb();
  if (alsoCards) {
    const { deleteCard } = await import("./cards");
    for (const w of m.words) if (w.cardId) {
      const c = await db.cards.get(w.cardId);
      if (c?.memoryId === m.id) await deleteCard(w.cardId);
    }
  } else {
    // detach cards from the deleted photo
    for (const w of m.words) if (w.cardId) {
      const c = await db.cards.get(w.cardId);
      if (c?.imageKey === `memory-${m.id}`) await db.cards.update(w.cardId, { imageKey: undefined });
    }
  }
  await deleteMedia(m.photoKey);
  await db.images.bulkDelete([`memory-${m.id}`, `memory-illus-${m.id}`]);
  await db.memories.delete(m.id);
}

export type Mastery = "new" | "learning" | "known";

/** Mastery per card from FSRS states (known = durable in at least one skill). */
export async function masteryOf(cardIds: string[]): Promise<Record<string, Mastery>> {
  const { isDurable } = await import("./srs");
  const rows = await getDb().srs.where("cardId").anyOf(cardIds).toArray();
  const out: Record<string, Mastery> = {};
  for (const id of cardIds) {
    const r = rows.filter((x) => x.cardId === id);
    out[id] = r.some(isDurable) ? "known" : r.some((x) => x.reps > 0) ? "learning" : "new";
  }
  return out;
}
