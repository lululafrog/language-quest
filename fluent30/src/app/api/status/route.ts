import { NextResponse } from "next/server";
import { serviceStatus } from "@/lib/server/config";

export const dynamic = "force-dynamic";

// Public, minimal: which feature groups are available. No keys, no variable names.
export function GET() {
  return NextResponse.json(serviceStatus(), { headers: { "Cache-Control": "no-store" } });
}
