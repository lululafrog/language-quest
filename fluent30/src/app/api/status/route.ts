import { NextResponse } from "next/server";
import { serviceStatus } from "@/lib/server/config";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(serviceStatus());
}
