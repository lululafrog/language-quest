import { NextResponse } from "next/server";
import { RefusalError, translateMessage } from "@/lib/server/ai";
import { config } from "@/lib/server/config";
import { guard, jsonError } from "@/lib/server/guard";
import { BadInput, mapError, optionalString, parseImage } from "@/lib/server/route";
import { myMemoryTranslateLong } from "@/lib/server/free/mymemory";
import { freeErrorResponse } from "@/lib/server/free/respond";

// Message translation: Claude (context, register, replies) when available; otherwise a literal
// MyMemory translation of the text, flagged engine "mymemory" (no explanations, no reply suggestions).
export async function POST(req: Request) {
  const g = await guard(req);
  if (!g.ok) return g.response;
  let text = "";
  let image: { data: string; mediaType: string } | undefined;
  try {
    const b = (await req.json()) as { text?: unknown; image?: unknown };
    image = parseImage(b.image);
    text = optionalString(b.text, 6000) ?? "";
    if (!image && !text) throw new BadInput("Collez un message ou importez une capture d'écran.");
  } catch (e) {
    return e instanceof BadInput ? mapError(e) : jsonError(400, "bad_json", "Requête invalide.");
  }
  if (config.anthropicKey) {
    try {
      return NextResponse.json({ ...(await translateMessage(text, image)), engine: "ai" });
    } catch (e) {
      if (e instanceof RefusalError || e instanceof BadInput) return mapError(e);
      console.warn("translate: AI unavailable, falling back to MyMemory:", (e as Error)?.message);
    }
  }
  if (!text) {
    // images need the AI; the client can read the text on the device (local OCR) and send it as text
    return jsonError(503, "image_unavailable", "L'analyse d'image n'est pas disponible pour le moment. Utilise « Lire le texte sur l'appareil », puis traduis le texte.");
  }
  try {
    const translationFr = await myMemoryTranslateLong(text, "en");
    return NextResponse.json({
      sourceText: text,
      translationFr,
      register: "courant",
      registerExplanation: "",
      difficultExpressions: [],
      unknownWords: [],
      suggestedReplies: [],
      engine: "mymemory",
      note: "Traduction automatique simple, mot à mot par endroits : sans analyse du ton ni suggestions de réponse.",
    });
  } catch (e) {
    return freeErrorResponse(e);
  }
}
