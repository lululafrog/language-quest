import { NextResponse } from "next/server";

// Fallback for the PWA share target when the service worker is not controlling the page yet:
// text is passed through the URL; images need the service worker (nothing is stored on the server).
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const parts = ["title", "text", "url"].map((k) => form?.get(k)).filter((v): v is string => typeof v === "string" && !!v.trim());
  const file = form?.get("image");
  const url = new URL("/practice/real-life", req.url);
  if (parts.length) url.searchParams.set("text", parts.join("\n").slice(0, 4000));
  if (file && typeof file !== "string") url.searchParams.set("shareFailed", "1");
  return NextResponse.redirect(url, 303);
}
