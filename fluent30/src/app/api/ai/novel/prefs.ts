import type { NovelPrefs } from "@/lib/server/ai-novel";
import { BadInput } from "@/lib/server/route";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const str = (v: unknown, name: string, max = 200) => {
  if (typeof v !== "string" || !v.trim()) throw new BadInput(`Champ « ${name} » manquant.`);
  return v.trim().slice(0, max);
};

/** Validates novel preferences coming from the browser. */
export function parsePrefs(p: Partial<NovelPrefs>): NovelPrefs {
  const level = typeof p.level === "string" && LEVELS.includes(p.level) ? p.level : "B1";
  return {
    genre: str(p.genre, "genre", 80),
    level,
    setting: str(p.setting, "lieu", 120),
    era: str(p.era, "époque", 80),
    hero: str(p.hero, "personnage", 300),
    mood: str(p.mood, "ambiance", 80),
    chapterWords: Math.min(1500, Math.max(300, Math.round(Number(p.chapterWords) || 600))),
    chapters: Math.min(20, Math.max(3, Math.round(Number(p.chapters) || 6))),
    interactive: !!p.interactive,
  };
}
