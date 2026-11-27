import { adaptParagraphs } from "@/lib/server/ai-reader";
import { aiRoute, BadInput, requireString } from "@/lib/server/route";
import { sharedCache } from "@/lib/server/cache";

export const maxDuration = 60;
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

export const POST = aiRoute<{ paragraphs?: string[]; level?: string; title?: string; source?: string }>(async (b) => {
  if (!["gutenberg", "graded", "custom"].includes(String(b.source))) throw new BadInput("L'adaptation n'est proposée que pour les œuvres du domaine public ou créées dans l'appli.");
  const level = String(b.level);
  if (!LEVELS.includes(level)) throw new BadInput("Niveau invalide.");
  const ps = (Array.isArray(b.paragraphs) ? b.paragraphs : []).filter((p) => typeof p === "string").map((p) => p.slice(0, 6000));
  if (!ps.length) throw new BadInput("Aucun paragraphe.");
  if (ps.join("").length > 24000) throw new BadInput("Passage trop long : envoyez-le en plusieurs parties.");
  const title = requireString(b.title, "title", 200);
  // Public-domain / in-app texts only (checked above): adaptations are shared between learners.
  const r = await sharedCache("reader", { op: "adapt", level, title, ps }, () => adaptParagraphs(ps, level, title));
  return { paragraphs: ps.map((p, i) => r.paragraphs[i] || p) };
}, { feature: "reader" });
