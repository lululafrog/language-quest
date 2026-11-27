import { enrich } from "@/lib/server/ai";
import { aiRoute, optionalString, requireString } from "@/lib/server/route";

// Flashcard enrichment by the AI. When it is unavailable the client completes the card itself from the
// built-in lexicon, the free dictionary and free translation (src/lib/fallbacks.ts, engine "local").
export const POST = aiRoute<{ input?: string; context?: string }>(
  async (b) => ({ ...(await enrich(requireString(b.input, "input", 500), optionalString(b.context, 1000))), engine: "ai" }),
  { feature: "enrich" },
);
