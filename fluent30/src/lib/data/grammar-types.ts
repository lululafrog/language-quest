// Types for the conversation-oriented grammar track.

export type GrammarExercise =
  | { type: "mcq"; prompt: string; promptFr?: string; options: string[]; answer: string; explanation: string }
  | { type: "tense"; sentence: string; options: string[]; answer: string; explanation: string }
  | { type: "fill"; sentence: string; hint?: string; answer: string[]; explanation: string } // "___" marks the gap
  | { type: "reorder"; answer: string; translationFr: string; explanation: string }
  | { type: "error"; sentence: string; wrong: string; correct: string; explanation: string }; // tap the wrong word

export type TimelineColor = "ink" | "coral" | "mint" | "sun";

/** Positions: -1 = distant past, 0 = now, 1 = distant future. */
export type TimelineMark =
  | { kind: "point"; at: number; label: string; example: string; color?: TimelineColor; dashed?: boolean }
  | { kind: "range"; from: number; to: number; label: string; example: string; color?: TimelineColor; dashed?: boolean }
  | { kind: "repeat"; from: number; to: number; label: string; example: string; color?: TimelineColor };

export interface TimelineSpec {
  caption: string; // French
  marks: TimelineMark[];
}

export interface GrammarLesson {
  id: string;
  title: string; // English name
  titleFr: string;
  priority: 1 | 2 | 3 | 4; // 4 = comparisons
  summaryFr: string;
  when: string[]; // French bullets
  construction: { label: string; formula: string; example: string }[];
  examples: { en: string; fr: string }[]; // typical situations
  frenchDiff: string[];
  mistakes: { wrong: string; right: string; why: string }[];
  timeline?: TimelineSpec;
  exercises: GrammarExercise[];
  keywords: string[]; // for fuzzy topic matching (FR + EN)
}

export const PRIORITY_LABELS: Record<GrammarLesson["priority"], { fr: string; en: string; descFr: string; descEn: string }> = {
  1: { fr: "Fondamentaux", en: "Foundations", descFr: "Les bases indispensables pour parler dès maintenant.", descEn: "The essentials to start speaking now." },
  2: { fr: "Autonomie conversationnelle", en: "Conversational independence", descFr: "Raconter, imaginer, rapporter.", descEn: "Tell stories, imagine, report." },
  3: { fr: "Verbes modaux", en: "Modal verbs", descFr: "Nuancer : capacité, possibilité, obligation, conseil.", descEn: "Nuance: ability, possibility, obligation, advice." },
  4: { fr: "Comparatifs", en: "Comparisons", descFr: "Les paires qui posent problème aux francophones.", descEn: "The pairs French speakers mix up." },
};
