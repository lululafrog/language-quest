import "server-only";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { config } from "./config";

// Protects paid API routes: requires a Supabase session when Supabase is configured,
// otherwise an optional shared access code (FLUENT30_ACCESS_CODE). Includes a basic rate limit.

const buckets = new Map<string, { count: number; reset: number }>();
const LIMIT_PER_MIN = Number(process.env.FLUENT30_RATE_LIMIT_PER_MIN || 30);

function rateLimited(key: string): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + 60_000 });
    return false;
  }
  b.count++;
  return b.count > LIMIT_PER_MIN;
}

export type GuardResult = { ok: true; userId: string | null } | { ok: false; response: NextResponse };

export async function guard(req: Request): Promise<GuardResult> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  let userId: string | null = null;
  if (config.supabaseUrl && config.supabaseAnonKey) {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return { ok: false, response: jsonError(401, "auth_required", "Connectez-vous pour utiliser les fonctions IA.") };
    const sb = createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data.user) return { ok: false, response: jsonError(401, "auth_required", "Session expirée. Reconnectez-vous.") };
    userId = data.user.id;
  } else if (config.accessCode) {
    if (req.headers.get("x-access-code") !== config.accessCode)
      return { ok: false, response: jsonError(401, "access_code", "Code d'accès requis (Réglages → Services).") };
  }
  if (rateLimited(userId ?? ip)) return { ok: false, response: jsonError(429, "rate_limited", "Trop de requêtes. Patientez une minute.") };
  return { ok: true, userId };
}

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function notConfigured(service: string, envVar: string) {
  return jsonError(503, "not_configured", `${service} n'est pas configuré sur le serveur (variable ${envVar} manquante).`);
}
