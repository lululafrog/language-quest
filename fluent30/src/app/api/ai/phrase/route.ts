import { explainPhrase } from "@/lib/server/ai";
import { aiRoute, optionalString, requireString } from "@/lib/server/route";
import { sharedCache } from "@/lib/server/cache";

// Generic explanation of a given text: the shared cache only answers a learner who sends exactly the same text.
export const POST = aiRoute<{ text?: string; context?: string }>(async (b) => {
  const text = requireString(b.text, "text", 2000);
  const context = optionalString(b.context, 3000);
  return sharedCache("phrase", { text, context: context ?? "" }, () => explainPhrase(text, context));
}, { feature: "phrase" });
