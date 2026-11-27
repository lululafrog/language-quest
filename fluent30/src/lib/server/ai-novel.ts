import "server-only";
import { z } from "zod";
import { structured } from "./ai";

// AI personal novels: story planning (title, cover, bible) and chapter writing with memory.

export const COVER_MOTIFS = ["magnifier", "castle", "ship", "rose", "planet", "compass", "key", "skull", "sun", "lighthouse", "crown", "quill", "mountain", "city", "moon"] as const;

export interface NovelPrefs {
  genre: string;
  level: string;
  setting: string;
  era: string;
  hero: string;
  mood: string;
  chapterWords: number;
  chapters: number;
  interactive: boolean;
}

const LEVEL_RULES: Record<string, string> = {
  A1: "CEFR A1: very short sentences (max ~10 words), present simple and present continuous, can/can't, the 500 most common words, no idioms, lots of repetition, concrete actions and dialogue.",
  A2: "CEFR A2: short clear sentences, present + past simple + going to, the 1,000 most common words, very common phrasal verbs only, simple dialogue.",
  B1: "CEFR B1: natural but clear prose, all common tenses incl. present perfect and past continuous, ~2,000 common words, some everyday idioms and phrasal verbs.",
  B2: "CEFR B2: rich natural prose, varied tenses, conditionals, passive, reported speech, common idioms and phrasal verbs, some less frequent vocabulary when the context makes it clear.",
  C1: "CEFR C1: sophisticated literary prose, nuanced vocabulary, varied sentence structures, idioms and figurative language.",
  C2: "CEFR C2: fully native literary style with no simplification.",
};

export const PlanSchema = z.object({
  title: z.string().describe("Catchy English title of the novel"),
  subtitle: z.string().describe("Short English tagline (max 8 words)"),
  cover: z.object({
    palette: z.array(z.string()).describe("Exactly 3 hex colours (#RRGGBB): background top, background bottom, accent — matching the mood"),
    motif: z.enum(COVER_MOTIFS).describe("Main visual motif for the cover"),
  }),
  bible: z.string().describe("Story bible in English (max ~350 words): main characters (name, age, personality, goal, way of speaking), secondary characters, places, central conflict, planned arc across the chapters, recurring motifs. No chapter text."),
  pitchFr: z.string().describe("Spoiler-free pitch in French (2 sentences) for the learner"),
});
export type NovelPlan = z.infer<typeof PlanSchema>;

export async function planNovel(p: NovelPrefs): Promise<NovelPlan> {
  return structured({
    schema: PlanSchema,
    effort: "medium",
    maxTokens: 8000,
    system: `Task: you are a gifted novelist designing an original novel for a French-speaking learner of English. It must be genuinely engaging (hooks, stakes, likeable characters), original (no existing copyrighted characters), and suitable for the learner's level. ${LEVEL_RULES[p.level] ?? LEVEL_RULES.B1}`,
    user: `Genre: ${p.genre}\nSetting (place): ${p.setting}\nEra: ${p.era}\nMain character: ${p.hero}\nMood: ${p.mood}\nNumber of chapters: ${p.chapters} (about ${p.chapterWords} words each)\nType: ${p.interactive ? "INTERACTIVE — the reader will choose what happens at the end of each chapter, so plan an arc that can branch" : "classic linear novel"}`,
  });
}

export const ChapterSchema = z.object({
  title: z.string().describe("Chapter title (English)"),
  paragraphs: z.array(z.string()).describe("The chapter text as paragraphs (dialogue lines may be their own paragraphs)"),
  summary: z.string().describe("2-3 sentence factual summary of what happens in this chapter (English), used as memory for the next chapters"),
  bibleNotes: z.string().describe("New facts to remember for continuity: character changes, revealed secrets, objects, promises, the reader's choice and its consequences (English, max 80 words). Empty if nothing new."),
  choices: z.array(z.string()).describe("For interactive novels and if this is not the last chapter: 2 or 3 short, meaningfully different options for what the hero does next (English, max 14 words each). Otherwise an empty array."),
  wovenWords: z.array(z.string()).describe("Which of the requested practice words were actually used in the chapter (exact base forms from the list)"),
});
export type NovelChapter = z.infer<typeof ChapterSchema>;

export interface ChapterRequest {
  prefs: NovelPrefs;
  title: string;
  bible: string;
  summaries: string[];
  chosen?: string;
  weakWords: string[];
  index: number; // 0-based chapter to write
}

export async function writeChapter(r: ChapterRequest): Promise<NovelChapter> {
  const p = r.prefs;
  const isLast = r.index + 1 >= p.chapters;
  const history = r.summaries.length ? r.summaries.map((s, i) => `Chapter ${i + 1}: ${s}`).join("\n") : "(This is the first chapter.)";
  return structured({
    schema: ChapterSchema,
    effort: "medium",
    maxTokens: 16000,
    system: `Task: you are the novelist writing "${r.title}" for a French-speaking learner of English. Write ONE chapter at a time, keeping perfect continuity with the story bible and previous chapters (names, facts, tone, the reader's choices). Make it vivid, with dialogue and a hook at the end (unless it is the final chapter, which must resolve the story satisfyingly).
Language level: ${LEVEL_RULES[p.level] ?? LEVEL_RULES.B1}
Practice words: the learner struggles with some words. Weave in those that fit NATURALLY (use each at most twice, in clear context that helps guess the meaning). Never force a word that doesn't fit, never explain them, and never let them lower the quality of the story. It is fine to skip some.
Length: about ${p.chapterWords} words.`,
    user: `STORY BIBLE:\n${r.bible}\n\nPREVIOUS CHAPTERS:\n${history}\n\n${r.chosen ? `THE READER CHOSE: "${r.chosen}" — the chapter must follow from this choice.\n\n` : ""}Write chapter ${r.index + 1} of ${p.chapters}${isLast ? " (FINAL chapter: no choices)" : ""}. Interactive: ${p.interactive && !isLast ? "yes, end with 2-3 choices" : "no choices"}.\nPractice words: ${r.weakWords.length ? r.weakWords.join(", ") : "(none)"}`,
  });
}
