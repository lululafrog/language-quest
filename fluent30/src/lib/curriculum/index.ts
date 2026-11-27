// Course catalogue: level path A1 → C1, real-life modules, revision sheets.
import type { CefrLevel, Lesson, Sheet } from "./types";
import { LESSONS_A1 } from "./a1";
import { LESSONS_A2 } from "./a2";
import { LESSONS_B1 } from "./b1";
import { LESSONS_B2 } from "./b2";
import { LESSONS_C1 } from "./c1";
import { LESSONS_THEMES } from "./themes";
import { SHEETS } from "./sheets";

export * from "./types";
export { SHEETS };

export const PATH: Lesson[] = [...LESSONS_A1, ...LESSONS_A2, ...LESSONS_B1, ...LESSONS_B2, ...LESSONS_C1].sort(
  (a, b) => "A1A2B1B2C1".indexOf(a.level) - "A1A2B1B2C1".indexOf(b.level) || a.order - b.order,
);
export const THEME_MODULES: Lesson[] = [...LESSONS_THEMES].sort((a, b) => a.order - b.order);
export const ALL_LESSONS: Lesson[] = [...PATH, ...THEME_MODULES];

const byId = new Map(ALL_LESSONS.map((l) => [l.id, l]));
export function getLesson(id: string): Lesson | undefined {
  return byId.get(id);
}
export function lessonsOfLevel(level: CefrLevel): Lesson[] {
  return PATH.filter((l) => l.level === level);
}
export function getSheet(id: string): Sheet | undefined {
  return SHEETS.find((s) => s.id === id);
}
/** First lesson whose tags contain the concept tag (used to send mistakes to the right lesson). */
export function lessonForTag(tag: string): Lesson | undefined {
  const t = tag.replace(/^(grammar|lesson|pron|irregular):/, "");
  return ALL_LESSONS.find((l) => l.id === t || l.tags.includes(t) || l.related?.grammar === t);
}
export function sheetsForTag(tag: string): Sheet[] {
  return SHEETS.filter((s) => s.tags.includes(tag));
}
export const LEVEL_INFO: Record<CefrLevel, { title: string; promise: string }> = {
  A1: { title: "Les fondations", promise: "Construire tes premières phrases et te présenter." },
  A2: { title: "Devenir autonome", promise: "Raconter ta journée, voyager, gérer le quotidien." },
  B1: { title: "Tenir une conversation", promise: "Raconter une expérience, donner ton avis, discuter." },
  B2: { title: "Parler avec aisance", promise: "Argumenter, nuancer, suivre une conversation rapide." },
  C1: { title: "S'exprimer avec précision", promise: "Adapter ton registre, saisir l'humour et les sous-entendus." },
};
