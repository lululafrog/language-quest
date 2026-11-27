import "server-only";
import { z } from "zod";
import { structured } from "./ai";

// Personal content analysis (Memory Cards, journal). Content is forwarded for processing only: nothing is stored server-side.

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export function safeLevel(v: unknown): string {
  return typeof v === "string" && LEVELS.includes(v) ? v : "A2";
}

export const PhotoVocabSchema = z.object({
  sceneFr: z.string().describe("One short French sentence describing the scene"),
  title: z.string().describe("Short French title for this memory, max 6 words"),
  words: z
    .array(
      z.object({
        en: z.string().describe("English word or short expression, base form (verbs as 'to dive')"),
        fr: z.string().describe("Natural French translation"),
        pos: z.string().describe("noun, verb, adjective, expression…"),
        why: z.string().describe("In French, max 12 words: why it is useful for this scene"),
      }),
    )
    .describe("5 to 10 items, most useful first"),
  sentences: z
    .array(z.object({ en: z.string(), fr: z.string() }))
    .describe("2 or 3 natural first-person sentences the learner could say about this memory"),
});
export type PhotoVocab = z.infer<typeof PhotoVocabSchema>;

export async function photoVocab(image: { data: string; mediaType: string }, level: string, note?: string): Promise<PhotoVocab> {
  return structured({
    schema: PhotoVocabSchema,
    effort: "low",
    maxTokens: 3000,
    system: `Task: a French learner (CEFR ${level}) shares a personal photo (a memory). Propose the vocabulary they need to TALK ABOUT THIS MEMORY:
concrete nouns visible in the scene, the actions/verbs the scene suggests, and 1–2 natural collocations or expressions. Prefer frequent, reusable words;
adapt difficulty to the level (one or two slightly harder words are fine). Never identify real people, never guess names, ages, health or other sensitive traits.
Sentences: natural, first person, past tense when it reads as a memory (e.g. "I spotted a sea turtle while diving.").`,
    user: [
      { type: "image", source: { type: "base64", media_type: image.mediaType as "image/png", data: image.data } },
      { type: "text", text: note ? `Context given by the learner: ${note}` : "Here is my photo." },
    ],
  });
}

export const JournalSchema = z.object({
  corrected: z.string().describe("The learner's text with grammar/spelling corrected, changing as little as possible"),
  natural: z.string().describe("How a native speaker would naturally say the same thing (same meaning, same person), at a level slightly above the learner"),
  notes: z
    .array(
      z.object({
        from: z.string().describe("the learner's words"),
        to: z.string().describe("corrected or more natural words"),
        why: z.string().describe("short explanation in French"),
        kind: z.enum(["error", "style"]).describe("error = grammar/spelling/vocabulary mistake; style = correct but unnatural"),
        tag: z
          .string()
          .describe(
            "kebab-case concept tag for errors, chosen from: present-simple, present-continuous, past-simple, present-perfect, future, questions, negatives, articles, prepositions, plurals, word-order, modals, conditionals, irregular-verbs, phrasal-verbs, false-friends, spelling, vocabulary, other",
          ),
      }),
    )
    .describe("Most important first, max 10"),
  expressions: z.array(z.object({ en: z.string(), fr: z.string() })).describe("3 to 6 useful natural expressions from the natural version worth learning"),
  encouragement: z.string().describe("One warm, specific sentence in French about what went well"),
});
export type JournalAnalysis = z.infer<typeof JournalSchema>;

export async function analyseJournal(text: string, level: string): Promise<JournalAnalysis> {
  return structured({
    schema: JournalSchema,
    effort: "low",
    maxTokens: 4000,
    system: `Task: a French learner (CEFR ${level}) wrote a personal journal entry in English (it may contain French words they did not know: translate them naturally).
Give the corrected version, a natural native-like version and explain the differences. Be kind and precise; do not over-correct style in the "corrected" version.
If the text is already correct, return it unchanged with few notes. This is private personal content: do not comment on the person's life, only on the language.`,
    user: text,
  });
}
