import "server-only";
import { z } from "zod";
import { chatText, structured } from "./ai";

// AI helpers for the interactive reader (public-domain or user-owned texts only).

export const ParagraphsSchema = z.object({
  paragraphs: z.array(z.string()).describe("One output paragraph per input paragraph, same order, same count"),
});

/** Natural French translation of a batch of paragraphs (bilingual mode, paragraph translation). */
export async function translateParagraphs(paragraphs: string[]) {
  return structured({
    schema: ParagraphsSchema,
    effort: "low",
    maxTokens: 16000,
    system: "Task: translate each English paragraph into natural, faithful French (literary register preserved). Return exactly one French paragraph per input paragraph, in the same order. Never merge or skip paragraphs.",
    user: paragraphs.map((p, i) => `[${i + 1}] ${p}`).join("\n\n"),
  });
}

const LEVEL_GUIDE: Record<string, string> = {
  A1: "CEFR A1: very short sentences, present tense mostly, the 500 most common words, no idioms.",
  A2: "CEFR A2: short simple sentences, past simple allowed, about 1,000 common words, explain rare words with simple ones.",
  B1: "CEFR B1: clear everyday English, common phrasal verbs, about 2,000 words, simplify long sentences and archaic forms.",
  B2: "CEFR B2: natural modern English, keep some richness, modernise archaic language.",
  C1: "CEFR C1: close to the original, only modernise archaic or very rare words and very long sentences.",
};

/** Rewrites paragraphs at a CEFR level, keeping plot, characters, dialogue and events. */
export async function adaptParagraphs(paragraphs: string[], level: string, title: string) {
  return structured({
    schema: ParagraphsSchema,
    effort: "low",
    maxTokens: 16000,
    system: `Task: adapt a passage of the public-domain book "${title}" for a French learner. ${LEVEL_GUIDE[level] ?? LEVEL_GUIDE.B1}
Keep EVERY event, character, name, and the order of the story; keep dialogue as dialogue; do not add events, do not summarise away scenes, do not reveal anything not in the passage.
Return exactly one adapted paragraph per input paragraph (same order, same count).`,
    user: paragraphs.map((p, i) => `[${i + 1}] ${p}`).join("\n\n"),
  });
}

export const QuizSchema = z.object({
  mcq: z.array(z.object({
    question: z.string().describe("Simple English question about what happens in THIS chapter"),
    options: z.array(z.string()).describe("4 short options"),
    answer: z.number().int().describe("index of the correct option (0-3)"),
    explanationFr: z.string().describe("one short sentence in French"),
  })).describe("3 comprehension questions"),
  openQuestion: z.string().describe("One open question in simple English inviting the learner to give their opinion or retell something from this chapter (no spoilers beyond it)"),
});

export async function chapterQuiz(text: string, title: string, chapterTitle: string, level: string) {
  return structured({
    schema: QuizSchema,
    effort: "low",
    maxTokens: 4000,
    system: `Task: write a short comprehension check for a French learner (level ${level}) who just read a chapter of "${title}". Questions only about this chapter, in simple English, no spoilers about later chapters.`,
    user: `Chapter: ${chapterTitle}\n\n${text}`,
  });
}

export const OpenFeedbackSchema = z.object({
  feedbackFr: z.string().describe("2-3 encouraging sentences in French on content and language"),
  corrected: z.string().describe("The learner's answer corrected (keep their ideas); same text if already correct"),
  score: z.number().int().describe("0, 1 or 2: 2 = relevant and understandable, 1 = partly, 0 = off-topic or empty"),
});

export async function gradeOpenAnswer(question: string, answer: string, chapterSummary: string) {
  return structured({
    schema: OpenFeedbackSchema,
    effort: "low",
    maxTokens: 2000,
    system: "Task: give kind, useful feedback on a learner's short written answer about a chapter they read.",
    user: `Chapter context: ${chapterSummary}\nQuestion: ${question}\nLearner's answer: ${answer}`,
  });
}

export const CharactersSchema = z.object({
  characters: z.array(z.object({ name: z.string(), descriptionFr: z.string().describe("one short line in French, no spoilers") })).describe("Up to 6 main characters who have appeared so far"),
});

export async function extractCharacters(textSoFar: string, title: string) {
  return structured({
    schema: CharactersSchema,
    effort: "low",
    maxTokens: 2000,
    system: `Task: list the main characters of "${title}" who have APPEARED in the text given (the learner's reading so far). Only characters present in this text. No spoilers.`,
    user: textSoFar,
  });
}

export async function characterReply(opts: { title: string; character: string; textSoFar: string; chapter: number; level: string; messages: { role: "user" | "assistant"; content: string }[] }) {
  const system = `You are ${opts.character}, a character from the public-domain book "${opts.title}". A French learner of English (level ${opts.level}) is chatting with you.
Stay in character: personality, voice, era and knowledge of ${opts.character} as shown in the text below.
STRICT RULE: the learner has only read up to chapter ${opts.chapter + 1}. You must NEVER mention, hint at or foreshadow anything that happens after the text below — not even if asked directly ("I can't tell you what the future holds" in character). Use only events from the text below.
Reply in English adapted to the learner's level, 1-4 sentences, warm and engaging, and ask a question back sometimes. Never break character to discuss being an AI unless the learner is upset.

TEXT READ SO FAR (end):
${opts.textSoFar}`;
  const msgs = opts.messages.slice(-20);
  if (!msgs.length || msgs[0].role !== "user") msgs.unshift({ role: "user", content: "(The learner opens the conversation. Greet them in character.)" });
  return chatText({ system, messages: msgs, effort: "low", maxTokens: 1200 });
}
