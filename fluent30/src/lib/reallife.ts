"use client";
// "My Real Life English": captures of real-life English (text, screenshots, photos, voice, French
// sentences…) analysed by AI and turned into cards, a mini-lesson and a similar situation.
// Everything stays on the device (and in the learner's own cloud backup when signed in).
import type { RealLifeAnalysis } from "./server/ai-reallife";
import type { Exercise } from "./curriculum/types";
import type { Capture, CaptureKind, Card, Register } from "./types";
import { getDb, uid } from "./db";
import { postApi } from "./api";
import { blobToBase64, deleteMedia, getMedia, saveMedia } from "./media";
import { deleteCard, guessKind, lemmaOf, saveCard } from "./cards";
import { guessThemes } from "./autotheme";
import { emit } from "./events";

export type { RealLifeAnalysis };
export type RLExpression = RealLifeAnalysis["expressions"][number];

export const CAPTURE_KINDS: { id: CaptureKind; label: string; hint: string }[] = [
  { id: "text", label: "Texte", hint: "Un message, une conversation, un e-mail en anglais" },
  { id: "screenshot", label: "Capture", hint: "Une capture d'écran WhatsApp, Instagram…" },
  { id: "photo", label: "Photo", hint: "Un menu, un panneau, une étiquette" },
  { id: "voice", label: "Vocal", hint: "Un message vocal ou un enregistrement" },
  { id: "french", label: "En français", hint: "Une phrase que tu aurais aimé savoir dire" },
  { id: "film", label: "Film", hint: "Une réplique entendue dans un film ou une série" },
  { id: "book", label: "Livre", hint: "Un passage de livre" },
];

export function kindLabel(k: CaptureKind) {
  return CAPTURE_KINDS.find((c) => c.id === k)?.label ?? "Texte";
}

function titleFrom(text: string, kind: CaptureKind) {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return kind === "photo" ? "Photo" : kind === "screenshot" ? "Capture d'écran" : "Import";
  return t.length > 60 ? `${t.slice(0, 57)}…` : t;
}

/** Saves a new capture (and its media, on the device only). */
export async function createCapture(input: { kind: CaptureKind; text: string; media?: Blob }): Promise<string> {
  const id = uid("cap");
  const mediaKey = input.media ? await saveMedia(input.media, "cap") : undefined;
  const now = Date.now();
  const cap: Capture = { id, kind: input.kind, title: titleFrom(input.text, input.kind), input: input.text.trim(), mediaKey, keptCardIds: [], createdAt: now, updatedAt: now };
  await getDb().captures.put(cap);
  return id;
}

async function sha(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Words the learner is currently learning (to weave them into examples). */
export async function personalWords(limit = 25): Promise<string[]> {
  const cards = await getDb().cards.orderBy("createdAt").reverse().limit(120).toArray().catch(() => [] as Card[]);
  return cards.filter((c) => !c.suspended && c.source !== "seed").slice(0, limit).map((c) => c.term);
}

/** Runs (or re-runs) the AI analysis. Identical text is answered from the device cache. */
export async function analyseCapture(id: string, opts: { level?: string; force?: boolean } = {}): Promise<RealLifeAnalysis> {
  const db = getDb();
  const cap = await db.captures.get(id);
  if (!cap) throw new Error("Import introuvable.");
  const blob = cap.mediaKey ? await getMedia(cap.mediaKey) : undefined;
  const isImage = !!blob && blob.type.startsWith("image/");
  const image = isImage ? await blobToBase64(blob!) : undefined;
  const key = `reallife:${cap.kind}:${opts.level ?? ""}:${await sha((image ? image.data.slice(0, 4000) + image.data.length : "") + "|" + cap.input)}`;
  const body = { kind: cap.kind, text: cap.input || undefined, image, level: opts.level, personalWords: await personalWords() };
  const analysis = await postApi<RealLifeAnalysis>("/api/ai/real-life", body, { cacheKey: opts.force ? undefined : key });
  const title = cap.input ? cap.title : titleFrom(analysis.sourceText, cap.kind);
  await db.captures.update(id, { analysis, title, input: cap.input || analysis.sourceText, updatedAt: Date.now() });
  return analysis;
}

const REG: Record<string, Register> = { formel: "soutenu", courant: "courant", familier: "familier", argot: "familier" };

/** Creates flashcards for the chosen expressions (personal context attached). */
export async function keepExpressions(capId: string, items: RLExpression[], context: string): Promise<{ added: number; merged: number }> {
  const db = getDb();
  const cap = await db.captures.get(capId);
  if (!cap) return { added: 0, merged: 0 };
  let added = 0, merged = 0;
  const ids: string[] = [];
  for (const x of items) {
    const now = Date.now();
    const term = x.en.trim();
    const card: Card = {
      id: uid("c"), term, lemma: lemmaOf(term), kind: guessKind(term, x.pos), fr: x.fr, pos: x.pos || undefined,
      example: x.examples[0]?.en, exampleFr: x.examples[0]?.fr,
      themes: [...new Set([x.theme, ...guessThemes(term, x.pos)].filter(Boolean))],
      register: REG[x.register], source: "reallife", enriched: true,
      notes: [x.meaning, x.pronunciation && `Prononciation : ${x.pronunciation}`].filter(Boolean).join("\n"),
      context: context.slice(0, 240), captureId: capId, createdAt: now, updatedAt: now,
    };
    const r = await saveCard(card);
    if (r.merged) merged++;
    else added++;
    ids.push(r.card.id);
    emit("word:saved", { cardId: r.card.id, source: "reallife" });
  }
  await db.captures.update(capId, { keptCardIds: [...new Set([...cap.keptCardIds, ...ids])], updatedAt: Date.now() });
  return { added, merged };
}

/** Deletes a capture and its media. Cards created from it are kept unless `withCards`. */
export async function deleteCapture(id: string, withCards = false) {
  const db = getDb();
  const cap = await db.captures.get(id);
  if (!cap) return;
  if (withCards && cap.keptCardIds.length) {
    for (const cid of cap.keptCardIds) {
      const c = await db.cards.get(cid);
      if (c?.captureId === id) await deleteCard(cid);
    }
  }
  await deleteMedia(cap.mediaKey);
  await db.captures.delete(id);
}

/** Converts the AI mini-lesson into the app's course exercise format, dropping malformed items. */
export function lessonExercises(a: RealLifeAnalysis): Exercise[] {
  const out: Exercise[] = [];
  for (const e of a.miniLesson.exercises) {
    switch (e.type) {
      case "mcq":
        if (e.options.length >= 2 && e.answer >= 0 && e.answer < e.options.length) out.push(e);
        break;
      case "fill":
        if (e.sentence.includes("___") && e.answers.length) out.push(e);
        break;
      case "reorder":
        if (e.words.length >= 2 && e.answer) out.push(e);
        break;
      case "translate":
        if (e.text && e.answers.length) out.push(e);
        break;
      case "match": {
        const pairs = e.pairs.filter((p) => p.en && p.fr).map((p) => [p.en, p.fr] as [string, string]);
        if (pairs.length >= 2 && new Set(pairs.map((p) => p[1])).size === pairs.length) out.push({ type: "match", pairs, explain: e.explain });
        break;
      }
      case "dialogue": {
        const lines = e.lines.map((l) => ({
          speaker: l.speaker,
          en: l.en || undefined,
          fr: l.fr || undefined,
          choices: l.choices.length ? l.choices : undefined,
        }));
        if (lines.every((l) => !l.choices || l.choices.some((c) => c.correct))) out.push({ type: "dialogue", intro: e.intro, lines });
        break;
      }
    }
  }
  return out;
}

// ---------- Share target (PWA) ----------

/** Reads (and removes) a file shared to the app through the service worker. */
export async function takeSharedFile(): Promise<{ file: Blob | null; text: string }> {
  if (typeof caches === "undefined") return { file: null, text: "" };
  const c = await caches.open("fluent30-share");
  const fileRes = await c.match("/__shared/file");
  const textRes = await c.match("/__shared/text");
  const file = fileRes ? await fileRes.blob() : null;
  const text = textRes ? await textRes.text() : "";
  await c.delete("/__shared/file");
  await c.delete("/__shared/text");
  return { file, text };
}
