import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { structured, THEME_IDS } from "./ai";

// "My Real Life English": analyse something the learner met in real life and turn it into a lesson.

const Ex = z.object({ en: z.string(), fr: z.string() });
const Register = z.enum(["formel", "courant", "familier", "argot"]);

const Exercise = z.discriminatedUnion("type", [
  z.object({ type: z.literal("mcq"), prompt: z.string(), options: z.array(z.string()).describe("3 or 4 options"), answer: z.number().int().describe("index of the correct option"), explain: z.string().describe("French: why") }),
  z.object({ type: z.literal("fill"), sentence: z.string().describe("English sentence with ___ for the blank"), answers: z.array(z.string()).describe("all accepted answers"), explain: z.string(), fr: z.string().describe("French translation of the sentence") }),
  z.object({ type: z.literal("reorder"), words: z.array(z.string()).describe("the words of the answer, in the correct order (shuffled by the app)"), answer: z.string(), explain: z.string(), fr: z.string() }),
  z.object({ type: z.literal("translate"), from: z.enum(["fr", "en"]), text: z.string(), answers: z.array(z.string()).describe("several accepted translations"), explain: z.string() }),
  z.object({ type: z.literal("match"), pairs: z.array(z.object({ en: z.string(), fr: z.string() })).describe("4 or 5 pairs, all French sides different"), explain: z.string() }),
  z.object({
    type: z.literal("dialogue"),
    intro: z.string(),
    lines: z.array(z.object({
      speaker: z.string(),
      en: z.string().describe("empty string when the learner must choose"),
      fr: z.string(),
      choices: z.array(z.object({ en: z.string(), correct: z.boolean(), why: z.string() })).describe("empty array for normal lines; 2-3 choices (one correct) when the learner replies"),
    })),
  }),
]);

export const RealLifeSchema = z.object({
  sourceText: z.string().describe("The exact text that was analysed (transcribed from the image if any)"),
  language: z.enum(["en", "fr", "mixed"]),
  context: z.string().describe("French: what this is (text message between friends, restaurant menu, street sign, film line…)"),
  naturalTranslation: z.string().describe("Natural French translation (for French input: the best natural English version)"),
  englishVersions: z.array(z.object({ en: z.string(), register: Register, note: z.string() })).describe("For French input: 2-4 natural ways to say it in English in different registers. For English input: empty array"),
  register: Register,
  nuance: z.string().describe("French: tone, intention, register, cultural nuance"),
  expressions: z.array(z.object({
    en: z.string().describe("base form, e.g. 'to be up for something'"),
    fr: z.string(),
    meaning: z.string().describe("French explanation"),
    register: Register,
    examples: z.array(Ex).describe("2 new natural examples"),
    pronunciation: z.string().describe("French tip: stress, linking, weak forms, IPA if useful"),
    theme: z.enum(THEME_IDS).describe("closest theme"),
    pos: z.string(),
  })).describe("The 3-8 most useful words/expressions to keep, most useful first"),
  grammar: z.array(z.object({ point: z.string(), explanation: z.string().describe("French, short") })).describe("0-3 grammar points worth noticing"),
  replySuggestions: z.array(z.object({ en: z.string(), fr: z.string(), tone: z.string().describe("French: décontracté, poli…") })).describe("3 natural replies when a reply makes sense, else empty"),
  miniLesson: z.object({
    title: z.string().describe("French"),
    explanation: z.array(z.string()).describe("2-4 short French sentences"),
    rule: z.string(),
    exercises: z.array(Exercise).describe("5-7 progressive exercises reusing the expressions; every answer must be unambiguous"),
  }),
  similarSituation: z.object({
    context: z.string().describe("French"),
    dialogue: z.array(z.object({ speaker: z.string(), en: z.string(), fr: z.string() })).describe("4-6 lines reusing the expressions"),
    task: z.string().describe("French: what the learner should now say/do"),
  }),
});
export type RealLifeAnalysis = z.infer<typeof RealLifeSchema>;

const KIND_HINT: Record<string, string> = {
  text: "an English text or conversation the learner received or read",
  screenshot: "a screenshot of a conversation or social media post",
  photo: "a photo of something written in English (menu, sign, label, poster…)",
  voice: "the transcript of a voice message",
  french: "a FRENCH sentence the learner wished they could say in English — give natural English versions",
  film: "an expression heard in a film or series",
  book: "a passage from a book",
};

export async function analyseRealLife(input: { kind: string; text?: string; image?: { data: string; mediaType: string }; level?: string; personalWords?: string[] }) {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (input.image) content.push({ type: "image", source: { type: "base64", media_type: input.image.mediaType as "image/png", data: input.image.data } });
  const lines = [
    `Source: ${KIND_HINT[input.kind] ?? KIND_HINT.text}.`,
    `Learner level: ${input.level ?? "A2-B1"}.`,
    input.personalWords?.length ? `Words the learner is currently learning (reuse some naturally in examples if relevant): ${input.personalWords.slice(0, 30).join(", ")}.` : "",
    input.text ? `Content:\n"""\n${input.text}\n"""` : "Analyse the text visible in the image (if it is a conversation, focus on the most recent messages).",
  ];
  content.push({ type: "text", text: lines.filter(Boolean).join("\n") });
  return structured({
    schema: RealLifeSchema,
    effort: "low",
    maxTokens: 12000,
    system:
      "Task: turn real-life content met by a French-speaking learner into a short personalised lesson. Explanations in French, examples in natural current English. " +
      "Be precise about register (formel/courant/familier/argot) and mark vulgar slang clearly. Exercises must be solvable from the lesson, with one unambiguous answer (list all acceptable variants, contractions included). " +
      "If the image contains private details (names, phone numbers), do not repeat them; use neutral placeholders.",
    user: content,
  });
}
