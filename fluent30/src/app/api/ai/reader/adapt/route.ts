import { adaptParagraphs } from "@/lib/server/ai-reader";
import { aiRoute, BadInput, requireString } from "@/lib/server/route";

export const maxDuration = 60;
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

export const POST = aiRoute<{ paragraphs?: string[]; level?: string; title?: string; source?: string }>(async (b) => {
  if (!["gutenberg", "graded", "custom"].includes(String(b.source))) throw new BadInput("L'adaptation n'est proposée que pour les œuvres du domaine public ou créées dans l'appli.");
  const level = String(b.level);
  if (!LEVELS.includes(level)) throw new BadInput("Niveau invalide.");
  const ps = (Array.isArray(b.paragraphs) ? b.paragraphs : []).filter((p) => typeof p === "string").map((p) => p.slice(0, 6000));
  if (!ps.length) throw new BadInput("Aucun paragraphe.");
  if (ps.join("").length > 24000) throw new BadInput("Passage trop long : envoyez-le en plusieurs parties.");
  const r = await adaptParagraphs(ps, level, requireString(b.title, "title", 200));
  return { paragraphs: ps.map((p, i) => r.paragraphs[i] || p) };
});
