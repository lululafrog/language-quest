import { ImageTextSchema, structured } from "@/lib/server/ai";
import { jsonError } from "@/lib/server/guard";
import { BadInput, parseImage, withAi } from "@/lib/server/route";
import { classifyAiError } from "@/lib/server/errors";

// Extracts English text from a screenshot (Claude vision). When the AI is not available the client
// falls back to on-device OCR (Tesseract.js, src/lib/ocr.ts) — the image then never leaves the device.
export function POST(req: Request) {
  return withAi<{ image?: unknown }>("ocr", req, async (b) => {
    const image = parseImage(b.image);
    if (!image) throw new BadInput("Image manquante.");
    try {
      const out = await structured({
        schema: ImageTextSchema,
        effort: "low",
        system: "Task: transcribe the text of this screenshot exactly (do not translate).",
        user: [
          { type: "image", source: { type: "base64", media_type: image.mediaType as "image/png", data: image.data } },
          { type: "text", text: "Transcribe the text." },
        ],
      });
      return { ...out, engine: "ai" };
    } catch (e) {
      const m = classifyAiError(e);
      if (m.code === "bad_input" || m.code === "refusal") throw e;
      return jsonError(503, "use_local_ocr", "Lecture d'image en ligne indisponible : le texte va être lu directement sur ton appareil.");
    }
  });
}
