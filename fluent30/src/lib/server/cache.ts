import "server-only";
// Shared GENERIC answer cache (server side). Only for non-personal features (word cards by term, lookups and
// explanations of public text, translation/adaptation of public-domain books, generic illustrations).
// NEVER used for journal, real-life captures, photos, chat, postcards or writing assessment.
// Storage: Supabase table shared_ai_cache (service role only) when configured, else an in-memory LRU (5 000 entries).
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AiFeature } from "../plan";
import { FEATURES, modelForTier } from "./costs-core";
import { recordCacheHit } from "./usage";

const LRU = new Map<string, unknown>();
const MAX = Number(process.env.FLUENT30_CACHE_MAX_ENTRIES) || 5000;
const TTL_DAYS = Number(process.env.FLUENT30_CACHE_TTL_DAYS) || 90;

let sb: SupabaseClient | null | undefined;
function admin(): SupabaseClient | null {
  if (sb !== undefined) return sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  sb = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return sb;
}

function normalise(v: unknown): string {
  if (typeof v === "string") return v.trim().replace(/\s+/g, " ").toLowerCase();
  if (Array.isArray(v)) return `[${v.map(normalise).join("|")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v as object).sort().map((k) => `${k}:${normalise((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return String(v);
}

export function cacheKey(feature: AiFeature, input: unknown): string {
  const tier = FEATURES[feature].tier;
  return createHash("sha256").update(`${feature}|${modelForTier(tier)}|${normalise(input)}`).digest("hex");
}

function lruGet(k: string) {
  if (!LRU.has(k)) return undefined;
  const v = LRU.get(k);
  LRU.delete(k);
  LRU.set(k, v);
  return v;
}
function lruSet(k: string, v: unknown) {
  LRU.set(k, v);
  while (LRU.size > MAX) LRU.delete(LRU.keys().next().value as string);
}

/**
 * Returns the cached answer for this generic request, or computes it with `fn` and stores it.
 * Throws if `feature` is not marked cacheable (protects personal data by construction).
 */
export async function sharedCache<T>(feature: AiFeature, input: unknown, fn: () => Promise<T>): Promise<T> {
  if (!FEATURES[feature].sharedCache) throw new Error(`Feature ${feature} is personal and must not use the shared cache`);
  if (process.env.FLUENT30_SHARED_CACHE === "off") return fn();
  const k = cacheKey(feature, input);
  const mem = lruGet(k);
  if (mem !== undefined) {
    recordCacheHit(feature);
    return mem as T;
  }
  const s = admin();
  if (s) {
    try {
      const since = new Date(Date.now() - TTL_DAYS * 86_400_000).toISOString();
      const { data } = await s.from("shared_ai_cache").select("payload").eq("key", k).gte("created_at", since).maybeSingle();
      if (data?.payload !== undefined && data?.payload !== null) {
        lruSet(k, data.payload);
        recordCacheHit(feature);
        void s.rpc("shared_ai_cache_hit", { p_key: k });
        return data.payload as T;
      }
    } catch {
      /* cache is best effort */
    }
  }
  const value = await fn();
  lruSet(k, value);
  if (s) {
    try {
      await s.from("shared_ai_cache").upsert({ key: k, feature, payload: value as object, created_at: new Date().toISOString(), hits: 0 });
    } catch {
      /* ignore */
    }
  }
  return value;
}

export function cacheStats() {
  return { entriesInMemory: LRU.size, storage: admin() ? "supabase" : "memory" };
}
