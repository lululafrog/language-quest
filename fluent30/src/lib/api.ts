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
  if (typeof navigator !== "undefined" && !navigator.onLine) throw new ApiError(0, "offline", "Vous êtes hors ligne. Cette fonction nécessite une connexion.");
  let res: Response;
  try {
    res = await fetch(path, { method: "POST", headers: await headers(), body: JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "network", "Connexion au serveur impossible.");
  }
  const j = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (j as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(res.status, e?.code ?? "error", e?.message ?? `Erreur ${res.status}`);
  }
  if (opts.cacheKey) await cacheSet(opts.cacheKey, j);
  return j as T;
}

export async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: await headers(false), body: form });
  const j = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (j as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(res.status, e?.code ?? "error", e?.message ?? `Erreur ${res.status}`);
  }
  return j as T;
}

export async function getApi<T>(path: string, opts: { cacheKey?: string } = {}): Promise<T> {
  if (opts.cacheKey) {
    const hit = await cacheGet<T>(opts.cacheKey);
    if (hit) return hit;
  }
  const res = await fetch(path, { headers: await headers(false) });
  const j = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (j as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(res.status, e?.code ?? "error", e?.message ?? `Erreur ${res.status}`);
  }
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

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return String(e);
}
