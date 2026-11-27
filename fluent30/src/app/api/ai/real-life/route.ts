import { analyseRealLife } from "@/lib/server/ai-reallife";
import { aiRoute, optionalString, parseImage, BadInput } from "@/lib/server/route";

// Personal content is analysed on the fly and never stored on the server (never in the shared cache either).
export const POST = aiRoute<{ kind?: string; text?: string; image?: unknown; level?: string; personalWords?: unknown }>(async (body) => {
  const image = parseImage(body.image);
  const text = optionalString(body.text, 8000);
  if (!image && !text) throw new BadInput("Ajoute un texte, une capture ou une photo à analyser.");
  const personalWords = Array.isArray(body.personalWords) ? body.personalWords.filter((w): w is string => typeof w === "string").slice(0, 30) : [];
  const kind = typeof body.kind === "string" ? body.kind : "text";
  const level = typeof body.level === "string" ? body.level.slice(0, 4) : undefined;
  return analyseRealLife({ kind, text, image, level, personalWords });
}, { feature: "reallife" });
