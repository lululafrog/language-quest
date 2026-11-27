"use client";
// "My English Journey": private journal entries, AI rewrites, and links to the central engine (mistakes → courses).
import { getDb, todayKey, uid } from "./db";
import { postApi } from "./api";
import { recordMistake, trackActivity } from "./track";
import { addPersonalCard } from "./memories";
import { deleteMedia } from "./media";
import type { JournalEntry } from "./types";

export interface JournalAnalysis {
  corrected: string;
  natural: string;
  notes: { from: string; to: string; why: string; kind: "error" | "style"; tag: string }[];
  expressions: { en: string; fr: string }[];
  encouragement: string;
}

export const PROMPTS: { en: string; fr: string }[] = [
  { en: "What made you happy today?", fr: "Qu'est-ce qui t'a rendu heureux aujourd'hui ?" },
  { en: "What did you do this weekend?", fr: "Qu'as-tu fait ce week-end ?" },
  { en: "Tell me about someone you met.", fr: "Parle-moi de quelqu'un que tu as rencontré." },
  { en: "What are you looking forward to?", fr: "Qu'est-ce que tu attends avec impatience ?" },
  { en: "Describe your favourite place.", fr: "Décris ton endroit préféré." },
  { en: "What did you eat today, and was it good?", fr: "Qu'as-tu mangé aujourd'hui, et c'était bon ?" },
  { en: "What was the hardest part of your day?", fr: "Quel a été le moment le plus difficile de ta journée ?" },
  { en: "Describe a trip you would love to take.", fr: "Décris un voyage que tu aimerais faire." },
  { en: "What is something new you learned recently?", fr: "Qu'as-tu appris de nouveau récemment ?" },
  { en: "Tell me about a film, a book or a series you enjoyed.", fr: "Parle-moi d'un film, d'un livre ou d'une série que tu as aimé." },
  { en: "What does a perfect Sunday look like for you?", fr: "À quoi ressemble ton dimanche idéal ?" },
  { en: "Describe your morning routine.", fr: "Décris ta routine du matin." },
  { en: "What is a small thing that annoyed you today?", fr: "Quelle petite chose t'a agacé aujourd'hui ?" },
  { en: "Who would you like to thank, and why?", fr: "Qui aimerais-tu remercier, et pourquoi ?" },
  { en: "Where do you see yourself in a year?", fr: "Où te vois-tu dans un an ?" },
];

/** The monthly oral check always uses the same topic, so recordings can be compared over time. */
export const MONTHLY_TOPIC = { en: "Tell me about your life right now.", fr: "Raconte ta vie en ce moment." };

export const MOODS = ["Heureux·se", "Calme", "Fatigué·e", "Motivé·e", "Stressé·e", "Fier·e", "Nostalgique", "Curieux·se"];

export function monthKey(date: string) {
  return date.slice(0, 7);
}

export async function saveEntry(e: Partial<JournalEntry> & { text: string }): Promise<JournalEntry> {
  const db = getDb();
  const now = Date.now();
  const cur = e.id ? await db.journal.get(e.id) : undefined;
  const entry: JournalEntry = {
    id: e.id ?? uid("j"),
    date: e.date ?? cur?.date ?? todayKey(),
    prompt: e.prompt ?? cur?.prompt,
    text: e.text,
    mood: e.mood ?? cur?.mood,
    place: e.place ?? cur?.place,
    mediaKeys: e.mediaKeys ?? cur?.mediaKeys,
    audioKey: e.audioKey ?? cur?.audioKey,
    monthly: e.monthly ?? cur?.monthly,
    // the text changed → previous AI versions no longer apply
    versions: cur && cur.text !== e.text ? undefined : (e.versions ?? cur?.versions),
    keptCardIds: e.keptCardIds ?? cur?.keptCardIds ?? [],
    createdAt: cur?.createdAt ?? now,
    updatedAt: now,
  };
  await db.journal.put(entry);
  if (!cur) await trackActivity({ xp: 10 });
  return entry;
}

const SKIP_TAGS = new Set(["spelling", "vocabulary", "other"]);

/** Analyse with AI, store the versions and feed real grammar errors to the central mistakes table (once per entry). */
export async function analyseEntry(entry: JournalEntry, level: string): Promise<JournalAnalysis> {
  const a = await postApi<JournalAnalysis>("/api/ai/journal", { text: entry.text, level });
  const firstAnalysis = !entry.versions;
  await getDb().journal.update(entry.id, {
    versions: { corrected: a.corrected, natural: a.natural, notes: a.notes.map((n) => ({ from: n.from, to: n.to, why: n.why, tag: n.kind === "error" ? n.tag : undefined })) },
  });
  if (firstAnalysis) {
    const seen = new Set<string>();
    for (const n of a.notes) {
      if (n.kind !== "error" || SKIP_TAGS.has(n.tag) || seen.has(n.tag)) continue;
      seen.add(n.tag);
      await recordMistake({ id: `grammar:${n.tag}`, type: "grammar", label: n.tag, detail: n.why, example: `${n.from} → ${n.to}` });
    }
  }
  return a;
}

export async function keepExpressions(entry: JournalEntry, items: { en: string; fr: string }[], context?: string) {
  const ids: string[] = [];
  for (const it of items) ids.push(await addPersonalCard(it.en, it.fr, { source: "journal", journalId: entry.id, context }));
  await getDb().journal.update(entry.id, { keptCardIds: [...new Set([...(entry.keptCardIds ?? []), ...ids])] });
  return ids;
}

export async function deleteEntry(entry: JournalEntry) {
  await deleteMedia(entry.audioKey, ...(entry.mediaKeys ?? []));
  await getDb().journal.delete(entry.id);
}

/** Recurring grammar issues across all analysed entries (tag → count), most frequent first. */
export function recurringIssues(entries: JournalEntry[]): { tag: string; count: number; example?: string }[] {
  const m = new Map<string, { count: number; example?: string }>();
  for (const e of entries) for (const n of e.versions?.notes ?? []) {
    if (!n.tag || SKIP_TAGS.has(n.tag)) continue;
    const cur = m.get(n.tag) ?? { count: 0 };
    m.set(n.tag, { count: cur.count + 1, example: cur.example ?? `${n.from} → ${n.to}` });
  }
  return [...m.entries()].map(([tag, v]) => ({ tag, ...v })).sort((a, b) => b.count - a.count);
}
