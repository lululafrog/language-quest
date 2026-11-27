import { assessWriting } from "@/lib/server/ai";
import { aiRoute, BadInput, requireString } from "@/lib/server/route";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const POST = aiRoute<{ text?: string; task?: string; level?: string }>(async (b) => {
  const text = requireString(b.text, "text", 6000);
  if (text.split(/\s+/).filter(Boolean).length < 5) throw new BadInput("Texte trop court pour être évalué.");
  const level = LEVELS.includes(String(b.level)) ? String(b.level) : "B1";
  return assessWriting(text, requireString(b.task, "task", 600), level);
}, { feature: "assess" });
