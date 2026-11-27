import { correctText, RefusalError } from "@/lib/server/ai";
import { BadInput, requireString, withAi } from "@/lib/server/route";
import { recordFailure } from "@/lib/server/usage";
import { languageToolCheck } from "@/lib/server/free/languagetool";
import { freeErrorResponse } from "@/lib/server/free/respond";

// Correction: Claude when available (natural rephrasing + explanations in French);
// otherwise — no key, budget reached, provider down — LanguageTool (open source): spelling & basic grammar only, flagged as such.
export function POST(req: Request) {
  return withAi<{ text?: unknown }>("correct", req, async (b) => {
    const text = requireString(b.text, "text", 6000);
    try {
      return { ...(await correctText(text)), engine: "ai" };
    } catch (e) {
      if (e instanceof RefusalError || e instanceof BadInput) throw e;
      recordFailure({ code: "fallback_languagetool", message: (e as Error)?.message?.slice(0, 120) ?? "ai unavailable", provider: "anthropic" });
    }
    try {
      return await languageToolCheck(text);
    } catch (e) {
      return freeErrorResponse(e);
    }
  });
}
