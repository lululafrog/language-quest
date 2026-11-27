import { takeQuota } from "./usage";
import type { AiFeature } from "../plan";
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { guard, jsonError, notConfigured } from "./guard";
import { NotConfiguredError, RefusalError } from "./ai";

/** Wraps an AI route: auth/rate-limit guard, JSON parsing and uniform error mapping. */
export function aiRoute<B>(handler: (body: B, ctx: { userId: string | null }) => Promise<unknown>, opts: { feature?: AiFeature } = {}) {
  return async (req: Request) => {
    const g = await guard(req);
    if (!g.ok) return g.response;
    if (opts.feature) {
      const who = g.userId ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
      const limited = takeQuota(opts.feature, who);
      if (limited) return limited;
    }
    let body: B;
    try {
      body = (await req.json()) as B;
    } catch {
      return jsonError(400, "bad_json", "Requête invalide.");
    }
    try {
      const data = await handler(body, { userId: g.userId });
      return NextResponse.json(data);
    } catch (e) {
      return mapError(e);
    }
  };
}

export function mapError(e: unknown) {
  if (e instanceof NotConfiguredError) return notConfigured("L'IA (Anthropic Claude)", "ANTHROPIC_API_KEY");
  if (e instanceof RefusalError) return jsonError(422, "refusal", "L'IA a refusé de traiter cette demande.");
  if (e instanceof BadInput) return jsonError(400, "bad_input", e.message);
  if (e instanceof Anthropic.AuthenticationError) return jsonError(502, "ai_auth", "Clé API Anthropic invalide.");
  if (e instanceof Anthropic.RateLimitError) return jsonError(429, "ai_rate_limit", "Limite de l'API IA atteinte. Réessayez dans un instant.");
  if (e instanceof Anthropic.BadRequestError) return jsonError(400, "ai_bad_request", `Requête refusée par l'API IA : ${e.message}`);
  if (e instanceof Anthropic.APIConnectionError) return jsonError(502, "ai_unreachable", "Impossible de joindre l'API IA.");
  if (e instanceof Anthropic.APIError) return jsonError(502, "ai_error", `Erreur de l'API IA (${e.status}).`);
  console.error(e);
  return jsonError(500, "internal", "Erreur interne du serveur.");
}

export class BadInput extends Error {}

export function requireString(v: unknown, name: string, max = 4000): string {
  if (typeof v !== "string" || !v.trim()) throw new BadInput(`Champ « ${name} » manquant.`);
  if (v.length > max) throw new BadInput(`Champ « ${name} » trop long (max ${max} caractères).`);
  return v.trim();
}

export function optionalString(v: unknown, max = 4000): string | undefined {
  if (typeof v !== "string" || !v.trim()) return undefined;
  return v.slice(0, max).trim();
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export function parseImage(v: unknown): { data: string; mediaType: string } | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as { data?: unknown; mediaType?: unknown };
  if (typeof o.data !== "string" || typeof o.mediaType !== "string") return undefined;
  if (!IMAGE_TYPES.includes(o.mediaType)) throw new BadInput("Format d'image non pris en charge (PNG, JPEG, WebP, GIF).");
  const data = o.data.replace(/^data:[^,]+,/, "");
  if (data.length > 7_000_000) throw new BadInput("Image trop lourde (max ~5 Mo).");
  return { data, mediaType: o.mediaType };
}
