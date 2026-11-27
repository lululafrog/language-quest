import { NextResponse } from "next/server";
import { correctText, RefusalError } from "@/lib/server/ai";
import { config } from "@/lib/server/config";
import { guard, jsonError } from "@/lib/server/guard";
import { BadInput, mapError, requireString } from "@/lib/server/route";
import { languageToolCheck } from "@/lib/server/free/languagetool";
import { freeErrorResponse } from "@/lib/server/free/respond";

// Correction: Claude when available (natural rephrasing + explanations in French);
// otherwise, or if the AI call fails, LanguageTool (open source): spelling & basic grammar only, flagged as such.
export async function POST(req: Request) {
  const g = await guard(req);
  if (!g.ok) return g.response;
  let text: string;
  try {
    const b = (await req.json()) as { text?: unknown };
    text = requireString(b.text, "text", 6000);
  } catch (e) {
    return e instanceof BadInput ? mapError(e) : jsonError(400, "bad_json", "Requête invalide.");
  }
  if (config.anthropicKey) {
    try {
      return NextResponse.json({ ...(await correctText(text)), engine: "ai" });
    } catch (e) {
      if (e instanceof RefusalError || e instanceof BadInput) return mapError(e);
      console.warn("correct: AI unavailable, falling back to LanguageTool:", (e as Error)?.message);
    }
  }
  try {
    return NextResponse.json(await languageToolCheck(text));
  } catch (e) {
    return freeErrorResponse(e);
  }
}
