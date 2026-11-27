// Types for the readable "Cours" (rules of spoken English), written for Fluent30.
export type CourseBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "examples"; items: { en: string; fr: string; note?: string }[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "tip"; text: string };

export interface Course {
  slug: string;
  title: string;
  emoji: string;
  level: "A1" | "A2" | "B1" | "B2";
  category: "grammaire" | "vocabulaire" | "prononciation";
  summary: string;
  /** related grammar lesson id (lib/data/grammar.ts) */
  grammarId?: string;
  /** related page in the app */
  link?: { href: string; label: string };
  blocks: CourseBlock[];
  retenir: string[];
  mistakes: { wrong: string; right: string; why: string }[];
  quiz: { q: string; options: string[]; answer: number; why: string }[];
}
