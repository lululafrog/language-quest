import { NextResponse } from "next/server";
import { adminOverview, requireAdmin } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

// Admin dashboard data: services, usage, costs, budget, alerts, errors. Never returns keys.
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  return NextResponse.json(await adminOverview(), { headers: { "Cache-Control": "no-store" } });
}
