import { translateParagraphs } from "@/lib/server/ai-reader";
import { aiRoute, BadInput } from "@/lib/server/route";

export const maxDuration = 60;

export const POST = aiRoute<{ paragraphs?: string[] }>(async (b) => {
  const ps = (Array.isArray(b.paragraphs) ? b.paragraphs : []).filter((p) => typeof p === "string").map((p) => p.slice(0, 6000));
  if (!ps.length) throw new BadInput("Aucun paragraphe.");
  if (ps.join("").length > 24000) throw new BadInput("Passage trop long : envoyez-le en plusieurs parties.");
  const r = await translateParagraphs(ps);
  return { paragraphs: ps.map((_, i) => r.paragraphs[i] ?? "") };
});
