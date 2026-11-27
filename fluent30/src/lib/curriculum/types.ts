// Structured English course (A1 → C1 + real-life modules + revision sheets).
// Every micro-lesson follows the same 12-part structure (see AUDIT.md).

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";
export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];

export interface Example {
  en: string;
  fr: string;
  note?: string; // short comment (register, nuance)
}

export interface FrenchMistake {
  wrong: string;
  right: string;
  why: string; // short French explanation
}

/** Exercise types. Every checkable exercise carries `explain`: WHY the answer is right (shown after a mistake). */
export type Exercise =
  | { type: "mcq"; prompt: string; options: string[]; answer: number; explain: string; fr?: string }
  | { type: "fill"; sentence: string; answers: string[]; explain: string; hint?: string; fr?: string } // sentence contains "___"
  | { type: "translate"; from: "fr" | "en"; text: string; answers: string[]; explain: string } // answers in the other language
  | { type: "reorder"; words: string[]; answer: string; explain: string; fr?: string } // words shuffled at runtime
  | { type: "fix"; sentence: string; answers: string[]; explain: string } // incorrect sentence → corrected versions
  | { type: "listen"; audio: string; question: string; options: string[]; answer: number; explain: string } // TTS
  | { type: "dictation"; audio: string; answers: string[]; explain: string }
  | { type: "match"; pairs: [string, string][]; explain?: string } // en ↔ fr
  | { type: "speak"; text: string; fr: string } // pronunciation, indicative feedback
  | { type: "dialogue"; intro?: string; lines: DialogueLine[] }; // interactive dialogue with reply choices

export interface DialogueLine {
  speaker: string; // "A", "B", "You", or a name
  en?: string;
  fr?: string;
  /** When present, the learner chooses the reply. */
  choices?: { en: string; correct: boolean; why: string }[];
}

export type Register = "formel" | "courant" | "familier" | "argot";

export interface Lesson {
  id: string; // unique slug, e.g. "a1-to-be"
  level: CefrLevel;
  kind: "grammar" | "skills" | "theme";
  unit: string; // grouping label, e.g. "Les fondations"
  order: number; // order inside the level
  title: string; // French title
  titleEn?: string;
  minutes: number; // 5–10
  // 1. objective
  goal: string;
  // 2. simple explanation (short bullet-like sentences, no long paragraphs)
  explanation: string[];
  // 3. essential rule
  rule: string;
  // 4. table / schema
  table?: { caption?: string; head: string[]; rows: string[][] };
  // 5–6. natural examples (audio played with TTS)
  examples: Example[];
  // 7. typical French-speaker mistakes
  mistakes: FrenchMistake[];
  // 8. memory tip
  tip: string;
  // 9. progressive exercises (≥ 8, easy → harder, at least 4 different types)
  exercises: Exercise[];
  // 10. real-life situation
  situation: { context: string; dialogue: { speaker: string; en: string; fr: string }[]; task: string };
  // 11. summary
  summary: string[];
  // theme modules: vocabulary with register
  vocab?: { en: string; fr: string; register?: Register; note?: string }[];
  registers?: { meaning: string; formel?: string; courant?: string; familier?: string; argot?: string }[];
  /** concept tags used to connect the app (mistakes, games, sheets): e.g. "present-simple", "irregular-verbs" */
  tags: string[];
  /** links to existing content */
  related?: { grammar?: string; course?: string; sheet?: string; verb?: string; pronunciation?: string };
}

export type SheetCategory = "temps" | "verbes" | "modaux" | "prepositions" | "phrasal" | "faux-amis" | "erreurs" | "expressions" | "confusions" | "prononciation";

export type SheetBlock =
  | { type: "text"; text: string }
  | { type: "rule"; text: string }
  | { type: "table"; caption?: string; head: string[]; rows: string[][] }
  | { type: "examples"; items: Example[] }
  | { type: "list"; title?: string; items: string[] }
  | { type: "compare"; left: { title: string; items: string[] }; right: { title: string; items: string[] } }
  | { type: "tip"; text: string }
  | { type: "mistakes"; items: FrenchMistake[] };

export interface Sheet {
  id: string;
  category: SheetCategory;
  title: string;
  summary: string;
  blocks: SheetBlock[];
  tags: string[];
  lessonIds?: string[];
}
