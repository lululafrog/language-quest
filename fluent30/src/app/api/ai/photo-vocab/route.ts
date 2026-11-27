import { photoVocab, safeLevel } from "@/lib/server/ai-personal";
import { aiRoute, BadInput, optionalString, parseImage } from "@/lib/server/route";

// Memory Cards: vocabulary to talk about a personal photo. The photo is forwarded for analysis only, never stored.
export const POST = aiRoute<{ image?: unknown; level?: unknown; note?: unknown }>(async (b) => {
  const image = parseImage(b.image);
  if (!image) throw new BadInput("Photo manquante.");
  return photoVocab(image, safeLevel(b.level), optionalString(b.note, 300));
}, { feature: "memories" });
