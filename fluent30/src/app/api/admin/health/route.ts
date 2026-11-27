import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { healthCheck, PROVIDERS } from "@/lib/server/providers";

export const dynamic = "force-dynamic";

// POST { provider: "anthropic" | "openai" | … | "all" } → real, cheap connectivity test (no tokens billed).
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { provider?: string };
  const ids = body.provider === "all" || !body.provider ? PROVIDERS.map((p) => p.id) : [body.provider];
  const results = await Promise.all(ids.map((id) => healthCheck(id)));
  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
