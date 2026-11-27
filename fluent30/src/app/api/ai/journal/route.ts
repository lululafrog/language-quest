import { analyseJournal, safeLevel } from "@/lib/server/ai-personal";
import { aiRoute, requireString } from "@/lib/server/route";

// Journal: corrected + natural versions with explanations. The text is analysed, never stored server-side.
export const POST = aiRoute<{ text?: unknown; level?: unknown }>(async (b) => analyseJournal(requireString(b.text, "text", 6000), safeLevel(b.level)));
