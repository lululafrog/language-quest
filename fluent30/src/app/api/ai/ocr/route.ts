import { ImageTextSchema, structured } from "@/lib/server/ai";
import { config } from "@/lib/server/config";
import { jsonError } from "@/lib/server/guard";
import { aiRoute, BadInput, parseImage } from "@/lib/server/route";

// Extracts English text from a screenshot (Claude vision). When the AI is not available the client
// falls back to on-device OCR (Tesseract.js, src/lib/ocr.ts) — the image then never leaves the device.
const handler = aiRoute<{ image?: unknown }>(async (b) => {
  const image = parseImage(b.image);
  if (!image) throw new BadInput("Image manquante.");
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
});

export async function POST(req: Request) {
  if (!config.anthropicKey) return jsonError(503, "use_local_ocr", "Lecture d'image en ligne indisponible : le texte sera lu directement sur ton appareil.");
  return handler(req);
}
