import { explainPhrase } from "@/lib/server/ai";
import { aiRoute, optionalString, requireString } from "@/lib/server/route";

export const POST = aiRoute<{ text?: string; context?: string }>(async (b) => explainPhrase(requireString(b.text, "text", 2000), optionalString(b.context, 3000)));
