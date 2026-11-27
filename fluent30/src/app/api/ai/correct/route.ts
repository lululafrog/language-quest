import { correctText } from "@/lib/server/ai";
import { aiRoute, requireString } from "@/lib/server/route";

export const POST = aiRoute<{ text?: string }>(async (b) => correctText(requireString(b.text, "text", 6000)));
