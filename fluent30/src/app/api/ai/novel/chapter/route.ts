import { writeChapter, type NovelPrefs } from "@/lib/server/ai-novel";
import { aiRoute, BadInput } from "@/lib/server/route";
import { parsePrefs } from "../prefs";

export const maxDuration = 300;

interface Body {
  prefs?: Partial<NovelPrefs>;
  title?: string;
  bible?: string;
  summaries?: unknown;
  chosen?: string;
  weakWords?: unknown;
  index?: number;
}

export const POST = aiRoute<Body>(async (b) => {
  if (!b.prefs) throw new BadInput("Préférences manquantes.");
  const prefs = parsePrefs(b.prefs);
  const index = Math.round(Number(b.index));
  if (!Number.isFinite(index) || index < 0 || index >= prefs.chapters) throw new BadInput("Numéro de chapitre invalide.");
  const summaries = (Array.isArray(b.summaries) ? b.summaries : []).filter((s): s is string => typeof s === "string").slice(0, 20).map((s) => s.slice(0, 800));
  const weakWords = (Array.isArray(b.weakWords) ? b.weakWords : []).filter((s): s is string => typeof s === "string").slice(0, 10).map((s) => s.slice(0, 40));
  return writeChapter({
    prefs,
    title: (b.title ?? "Untitled").slice(0, 120),
    bible: (b.bible ?? "").slice(0, 6000),
    summaries,
    chosen: typeof b.chosen === "string" ? b.chosen.slice(0, 200) : undefined,
    weakWords,
    index,
  });
}, { feature: "novel" });
