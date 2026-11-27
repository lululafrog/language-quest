import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/server/guard";
import { analyseRealLife } from "@/lib/server/ai-reallife";
import { mapError, optionalString, parseImage, BadInput } from "@/lib/server/route";
import { recordUsage, takeQuota } from "@/lib/server/usage";

// Personal content is analysed on the fly and never stored on the server.
export async function POST(req: Request) {
  const g = await guard(req);
  if (!g.ok) return g.response;
  let body: { kind?: string; text?: string; image?: unknown; level?: string; personalWords?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "bad_json", "Requête invalide.");
  }
  try {
    const image = parseImage(body.image);
    const text = optionalString(body.text, 8000);
    if (!image && !text) throw new BadInput("Ajoute un texte, une capture ou une photo à analyser.");
    const who = g.userId ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const limited = takeQuota("reallife", who);
    if (limited) return limited;
    const personalWords = Array.isArray(body.personalWords) ? body.personalWords.filter((w): w is string => typeof w === "string").slice(0, 30) : [];
    const kind = typeof body.kind === "string" ? body.kind : "text";
    const level = typeof body.level === "string" ? body.level.slice(0, 4) : undefined;
    const out = await analyseRealLife({ kind, text, image, level, personalWords });
    recordUsage("reallife", { chars: (text?.length ?? 0) + 1500, images: image ? 1 : 0 }, JSON.stringify(out).length);
    return NextResponse.json(out);
  } catch (e) {
    return mapError(e);
  }
}
