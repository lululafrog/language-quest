import { lookupInContext } from "@/lib/server/ai";
import { aiRoute, requireString } from "@/lib/server/route";

export const POST = aiRoute<{ word?: string; sentence?: string }>(async (b) => lookupInContext(requireString(b.word, "word", 80), requireString(b.sentence, "sentence", 1500)));
