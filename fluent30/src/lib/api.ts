"use client";
import { accessToken } from "./supabase";
import { cacheGet, cacheSet } from "./db";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
  get notConfigured() {
    return this.code === "not_configured";
  }
  /** the service is temporarily unusable (not configured, provider down, budget reached…) — offer an alternative */
  get unavailable() {
    return ["not_configured", "service_auth", "provider_unavailable", "provider_rate_limit", "budget", "timeout", "network", "offline"].includes(this.code);
  }
}

function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/** fetch wrapper: turns network failures into a typed, friendly error */
async function request(path: string, init: RequestInit): Promise<Response> {
  if (isOffline()) throw new ApiError(0, "offline", FRIENDLY.offline);
  try {
    return await fetch(path, init);
  } catch {
    throw new ApiError(0, isOffline() ? "offline" : "network", isOffline() ? FRIENDLY.offline : FRIENDLY.network);
  }
}

async function toError(res: Response): Promise<ApiError> {
  const j = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
  const code = j?.error?.code ?? (res.status === 429 ? "rate_limited" : res.status >= 500 ? "provider_unavailable" : "error");
  return new ApiError(res.status, code, j?.error?.message ?? `Erreur ${res.status}`);
}

const ACCESS_CODE_KEY = "fluent30.accessCode";
export function getAccessCode() {
  return typeof localStorage !== "undefined" ? localStorage.getItem(ACCESS_CODE_KEY) ?? "" : "";
}
export function setAccessCode(code: string) {
  localStorage.setItem(ACCESS_CODE_KEY, code);
}

async function headers(json = true): Promise<HeadersInit> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const token = await accessToken();
  if (token) h.Authorization = `Bearer ${token}`;
  const code = getAccessCode();
  if (code) h["x-access-code"] = code;
  return h;
}

/** POST to an AI route. With `cacheKey`, identical requests are answered from the device cache. */
export async function postApi<T>(path: string, body: unknown, opts: { cacheKey?: string } = {}): Promise<T> {
  if (opts.cacheKey) {
    const hit = await cacheGet<T>(opts.cacheKey);
    if (hit) return hit;
  }
  const res = await request(path, { method: "POST", headers: await headers(), body: JSON.stringify(body) });
  if (!res.ok) throw await toError(res);
  const j = await res.json().catch(() => null);
  if (j === null) throw new ApiError(res.status, "bad_response", FRIENDLY.bad_response);
  if (opts.cacheKey) await cacheSet(opts.cacheKey, j);
  return j as T;
}

export async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await request(path, { method: "POST", headers: await headers(false), body: form });
  if (!res.ok) throw await toError(res);
  const j = await res.json().catch(() => null);
  if (j === null) throw new ApiError(res.status, "bad_response", FRIENDLY.bad_response);
  return j as T;
}

export async function getApi<T>(path: string, opts: { cacheKey?: string } = {}): Promise<T> {
  if (opts.cacheKey) {
    const hit = await cacheGet<T>(opts.cacheKey);
    if (hit) return hit;
  }
  const res = await request(path, { headers: await headers(false) });
  if (!res.ok) throw await toError(res);
  const j = await res.json().catch(() => null);
  if (j === null) throw new ApiError(res.status, "bad_response", FRIENDLY.bad_response);
  if (opts.cacheKey) await cacheSet(opts.cacheKey, j);
  return j as T;
}

export interface ServiceStatus {
  ai: boolean;
  images: boolean;
  imageProvider: "openai" | "claude-svg" | null;
  transcription: boolean;
  supabase: boolean;
  accessCodeRequired: boolean;
}

let statusPromise: Promise<ServiceStatus> | null = null;
export function fetchStatus(): Promise<ServiceStatus> {
  if (!statusPromise)
    statusPromise = fetch("/api/status")
      .then((r) => r.json() as Promise<ServiceStatus>)
      .catch(() => {
        statusPromise = null;
        return { ai: false, images: false, imageProvider: null, transcription: false, supabase: false, accessCodeRequired: false };
      });
  return statusPromise;
}

/** Friendly French messages for the learner — never technical details (those go to the admin dashboard). */
const FRIENDLY: Record<string, string> = {
  not_configured: "Cette fonction n'est pas encore disponible sur cette version de l'application.",
  service_auth: "Ce service est momentanément indisponible. Réessaie un peu plus tard.",
  provider_unavailable: "Le service ne répond pas pour le moment. Réessaie dans quelques minutes.",
  provider_rate_limit: "Le service est très sollicité en ce moment. Réessaie dans une minute.",
  budget: "Cette fonction a atteint sa limite d'utilisation pour aujourd'hui. Elle sera de nouveau disponible demain.",
  rate_limited: "Tu as fait beaucoup de demandes d'un coup : patiente une minute avant de réessayer.",
  quota: "Tu as atteint la limite quotidienne pour cette fonction. Elle se renouvelle demain.",
  timeout: "La réponse a pris trop de temps. Réessaie avec un contenu plus court.",
  bad_response: "La réponse reçue était incomplète. Réessaie : rien n'a été enregistré.",
  offline: "Tu es hors connexion. Cette fonction a besoin d'internet ; tes cartes, cours, jeux et révisions restent disponibles.",
  network: "Impossible de joindre le serveur. Vérifie ta connexion puis réessaie.",
  auth_required: "Connecte-toi à ton compte pour utiliser cette fonction.",
  access_code: "Cette fonction est réservée : un code d'accès est demandé (Paramètres → Services).",
  refused: "Cette demande n'a pas pu être traitée. Essaie de la reformuler.",
};

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (FRIENDLY[e.code]) {
      // server messages for quotas / bad input are already written for learners; keep them when present
      if ((e.code === "quota" || e.code === "rate_limited" || e.code === "budget") && e.message && !/[A-Z_]{6,}/.test(e.message)) return e.message;
      return FRIENDLY[e.code];
    }
    if (e.status === 400 && e.message && !/[A-Z_]{6,}|env|api[_ ]?key/i.test(e.message)) return e.message;
    if (e.status >= 500) return FRIENDLY.provider_unavailable;
    return /[A-Z_]{6,}|env|api[_ ]?key/i.test(e.message) ? FRIENDLY.provider_unavailable : e.message;
  }
  if (e instanceof TypeError && /fetch|network/i.test(e.message)) return isOffline() ? FRIENDLY.offline : FRIENDLY.network;
  if (e instanceof Error) return /[A-Z_]{6,}|env|api[_ ]?key/i.test(e.message) ? FRIENDLY.provider_unavailable : e.message;
  return String(e);
}
