import { extractCharacters } from "@/lib/server/ai-reader";
import { aiRoute, BadInput, requireString } from "@/lib/server/route";

export const maxDuration = 60;

export const POST = aiRoute<{ text?: string; title?: string; source?: string }>(async (b) => {
  if (!["gutenberg", "graded", "custom"].includes(String(b.source))) throw new BadInput("Disponible uniquement pour les œuvres du domaine public ou créées dans l'appli.");
  return extractCharacters(requireString(b.text, "text", 60000), requireString(b.title, "title", 200));
});
