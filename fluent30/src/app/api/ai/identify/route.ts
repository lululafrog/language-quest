import { IdentifySchema, structured } from "@/lib/server/ai";
import { aiRoute, BadInput, parseImage } from "@/lib/server/route";

// Names the everyday objects visible in a photo (vocabulary from the learner's surroundings).
// The photo is only forwarded for analysis and never stored.
export const POST = aiRoute<{ image?: unknown }>(async (b) => {
  const image = parseImage(b.image);
  if (!image) throw new BadInput("Photo manquante.");
  return structured({
    schema: IdentifySchema,
    effort: "low",
    maxTokens: 3000,
    system: "Task: a French learner of English photographed their surroundings. List the useful everyday objects they can see, with the word a native speaker would naturally use (British or American common usage).",
    user: [
      { type: "image", source: { type: "base64", media_type: image.mediaType as "image/png", data: image.data } },
      { type: "text", text: "What useful objects can you see? Give their everyday English names." },
    ],
  });
});
