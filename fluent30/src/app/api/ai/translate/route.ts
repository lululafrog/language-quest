import { translateMessage } from "@/lib/server/ai";
import { aiRoute, BadInput, optionalString, parseImage } from "@/lib/server/route";

export const POST = aiRoute<{ text?: string; image?: unknown }>(async (b) => {
  const image = parseImage(b.image);
  const text = optionalString(b.text, 6000) ?? "";
  if (!image && !text) throw new BadInput("Collez un message ou importez une capture d'écran.");
  return translateMessage(text, image);
});
