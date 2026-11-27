import { RefusalError, translateMessage } from "@/lib/server/ai";
import { jsonError } from "@/lib/server/guard";
import { BadInput, optionalString, parseImage, withAi } from "@/lib/server/route";
import { recordFailure } from "@/lib/server/usage";
import { myMemoryTranslateLong } from "@/lib/server/free/mymemory";
import { freeErrorResponse } from "@/lib/server/free/respond";

// Message translation: Claude (context, register, replies) when available; otherwise a literal
// MyMemory translation of the text, flagged engine "mymemory" (no explanations, no reply suggestions).
export function POST(req: Request) {
  return withAi<{ text?: unknown; image?: unknown }>("translate", req, async (b) => {
    const image = parseImage(b.image);
    const text = optionalString(b.text, 6000) ?? "";
    if (!image && !text) throw new BadInput("Colle un message ou importe une capture d'écran.");
    try {
      return { ...(await translateMessage(text, image)), engine: "ai" };
    } catch (e) {
      if (e instanceof RefusalError || e instanceof BadInput) throw e;
      recordFailure({ code: "fallback_mymemory", message: (e as Error)?.message?.slice(0, 120) ?? "ai unavailable", provider: "anthropic" });
    }
    if (!text) {
      // images need the AI; the client then reads the text on the device (local OCR) and sends it as text
      return jsonError(503, "image_unavailable", "L'analyse d'image n'est pas disponible pour le moment. Le texte va être lu directement sur ton appareil.");
    }
    try {
      return {
        sourceText: text,
        translationFr: await myMemoryTranslateLong(text, "en"),
        register: "courant",
        registerExplanation: "",
        difficultExpressions: [],
        unknownWords: [],
        suggestedReplies: [],
        engine: "mymemory",
        note: "Traduction automatique simple (parfois littérale), sans analyse du ton ni suggestions de réponse.",
      };
    } catch (e) {
      return freeErrorResponse(e);
    }
  });
}
