import { ImageTextSchema, structured } from "@/lib/server/ai";
import { aiRoute, BadInput, parseImage } from "@/lib/server/route";

// Extracts English text from a screenshot (Claude vision).
export const POST = aiRoute<{ image?: unknown }>(async (b) => {
  const image = parseImage(b.image);
  if (!image) throw new BadInput("Image manquante.");
  return structured({
    schema: ImageTextSchema,
    effort: "low",
    system: "Task: transcribe the text of this screenshot exactly (do not translate).",
    user: [
      { type: "image", source: { type: "base64", media_type: image.mediaType as "image/png", data: image.data } },
      { type: "text", text: "Transcribe the text." },
    ],
  });
});
