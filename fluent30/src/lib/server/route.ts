import "server-only";
/**
 * Shared wrapper for every server route that calls a paid AI / external API.
 *
 *   withAi<B>(feature: AiFeature, req: Request, handler: (body: B, ctx: AiRouteContext) => Promise<unknown>, opts?: { body?: "json" | "none" }): Promise<Response>
 *     1. guard: Supabase session (or access code) + per-minute rate limit per user/IP
 *     2. request size limit (FEATURES[feature].maxBodyChars) and JSON parsing (opts.body "none" → body is undefined, read req yourself)
 *     3. per-user daily/monthly quota for the feature, per-user concurrency limit
 *     4. runs `handler` inside the AI context (feature + hashed user) so every model call is routed to the right
 *        model tier, budget-checked and cost-tracked automatically (see ai.ts)
 *     5. maps any error to a friendly JSON error { error: { code, message } } (no variable names) and logs it for the admin.
 *     A handler may return a Response (sent as is) or any JSON-serialisable value.
 *
 *   aiRoute<B>(handler, { feature }) → (req) => withAi(feature, req, handler)   — shorthand for route files.
 *   mapError(e) → Response                                                      — friendly error response.
 *   sharedCache(feature, input, fn) lives in ./cache (generic, non-personal features only).
 */
import { NextResponse } from "next/server";
import { guard, jsonError } from "./guard";
import { FEATURES, MAX_IMAGE_BASE64 } from "./costs-core";
import { acquireSlot, hashUser, recordFailure, refundQuota, rememberUser, runWithAiContext, takeQuota } from "./usage";
import { BadInput, classifyAiError } from "./errors";
import type { AiFeature } from "../plan";

export { BadInput } from "./errors";

export interface AiRouteContext {
  userId: string | null;
  /** pseudonymous id used for quotas and stats */
  user: string;
  feature: AiFeature;
}

export async function withAi<B>(
  feature: AiFeature,
  req: Request,
  handler: (body: B, ctx: AiRouteContext) => Promise<unknown>,
  opts: { body?: "json" | "none" } = {},
): Promise<Response> {
  const g = await guard(req);
  if (!g.ok) return g.response;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const user = hashUser(g.userId ?? `ip:${ip}`);
  rememberUser(user, g.userId);
  const spec = FEATURES[feature];

  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > spec.maxBodyChars * 1.1) return jsonError(413, "too_large", "Ce contenu est trop volumineux. Essaie avec un texte plus court ou une image plus légère.");

  let body = undefined as B;
  if (opts.body !== "none") {
    let raw: string;
    try {
      raw = await req.text();
    } catch {
      return jsonError(400, "bad_json", "Requête invalide.");
    }
    if (raw.length > spec.maxBodyChars) return jsonError(413, "too_large", "Ce contenu est trop volumineux. Essaie avec un texte plus court ou une image plus légère.");
    try {
      body = (raw ? JSON.parse(raw) : {}) as B;
    } catch {
      return jsonError(400, "bad_json", "Requête invalide.");
    }
  }

  const limited = takeQuota(feature, user);
  if (limited) return limited;
  const release = acquireSlot(user);
  if (!release) return jsonError(429, "busy", "Une analyse est déjà en cours. Attends qu'elle se termine avant d'en lancer une autre.");

  try {
    const data = await runWithAiContext({ feature, user }, () => handler(body, { userId: g.userId, user, feature }));
    // a failure on our side (no engine available, provider down) must not eat the learner's quota
    if (data instanceof Response && data.status >= 500) refundQuota(feature, user);
    return data instanceof Response ? data : NextResponse.json(data);
  } catch (e) {
    refundQuota(feature, user);
    return runWithAiContext({ feature, user }, async () => mapError(e));
  } finally {
    release();
  }
}

/** Shorthand for route files: export const POST = aiRoute<Body>(handler, { feature: "lookup" }). */
export function aiRoute<B>(handler: (body: B, ctx: AiRouteContext) => Promise<unknown>, opts: { feature?: AiFeature } = {}) {
  return (req: Request) => withAi<B>(opts.feature ?? "chat", req, handler);
}

/** Friendly JSON error for any exception (technical detail only goes to the admin error log). */
export function mapError(e: unknown) {
  const m = classifyAiError(e);
  if (m.code === "internal") {
    console.error(e);
    recordFailure({ code: "internal", message: e instanceof Error ? `${e.name}: ${e.message.slice(0, 160)}` : "unknown" });
  } else if (m.code === "not_configured") {
    recordFailure({ code: "not_configured", message: "ANTHROPIC_API_KEY manquant" });
  }
  return jsonError(m.status, m.code, m.message);
}

export function requireString(v: unknown, name: string, max = 4000): string {
  if (typeof v !== "string" || !v.trim()) throw new BadInput(`Champ « ${name} » manquant.`);
  if (v.length > max) throw new BadInput(`Texte trop long (maximum ${max} caractères).`);
  return v.trim();
}

export function optionalString(v: unknown, max = 4000): string | undefined {
  if (typeof v !== "string" || !v.trim()) return undefined;
  return v.slice(0, max).trim();
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
/** Validates an image sent as base64. Images must be compressed by the client (≤ 1600 px JPEG); max ≈ 1.1 MB binary. */
export function parseImage(v: unknown): { data: string; mediaType: string } | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as { data?: unknown; mediaType?: unknown };
  if (typeof o.data !== "string" || typeof o.mediaType !== "string") return undefined;
  if (!IMAGE_TYPES.includes(o.mediaType)) throw new BadInput("Format d'image non pris en charge (PNG, JPEG, WebP, GIF).");
  const data = o.data.replace(/^data:[^,]+,/, "");
  if (data.length > MAX_IMAGE_BASE64) throw new BadInput("Image trop lourde. Recadre-la ou prends une photo moins détaillée, puis réessaie.");
  return { data, mediaType: o.mediaType };
}
