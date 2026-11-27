import { lookupInContext } from "@/lib/server/ai";
import { aiRoute, requireString } from "@/lib/server/route";
import { sharedCache } from "@/lib/server/cache";

// Generic answer (a word in a given sentence): served from the shared cache when another learner asked the same.
export const POST = aiRoute<{ word?: string; sentence?: string }>(async (b) => {
  const word = requireString(b.word, "word", 80);
  const sentence = requireString(b.sentence, "sentence", 1500);
  return sharedCache("lookup", { word, sentence }, () => lookupInContext(word, sentence));
}, { feature: "lookup" });
