import { characterReply } from "@/lib/server/ai-reader";
import { aiRoute, BadInput, requireString } from "@/lib/server/route";

export const maxDuration = 60;

type Msg = { role: "user" | "assistant"; content: string };

export const POST = aiRoute<{ title?: string; character?: string; text?: string; chapter?: number; level?: string; source?: string; messages?: Msg[] }>(async (b) => {
  if (!["gutenberg", "graded", "custom"].includes(String(b.source))) throw new BadInput("Disponible uniquement pour les œuvres du domaine public ou créées dans l'appli.");
  const messages = (Array.isArray(b.messages) ? b.messages : []).filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  const reply = await characterReply({
    title: requireString(b.title, "title", 200),
    character: requireString(b.character, "character", 120),
    textSoFar: requireString(b.text, "text", 60000),
    chapter: Math.max(0, Number(b.chapter) || 0),
    level: String(b.level ?? "B1").slice(0, 3),
    messages,
  });
  return { reply };
}, { feature: "reader" });
