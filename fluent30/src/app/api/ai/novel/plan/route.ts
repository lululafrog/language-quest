import { planNovel, type NovelPrefs } from "@/lib/server/ai-novel";
import { aiRoute, BadInput } from "@/lib/server/route";
import { parsePrefs } from "../prefs";

export const maxDuration = 120;

export const POST = aiRoute<{ prefs?: Partial<NovelPrefs> }>(async (b) => {
  if (!b.prefs) throw new BadInput("Préférences manquantes.");
  return planNovel(parsePrefs(b.prefs));
}, { feature: "novel" });
