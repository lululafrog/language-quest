import "server-only";
import { jsonError } from "../guard";
import { FreeServiceError } from "./languagetool";

/** Friendly JSON error for a free provider failure (no technical wording). */
export function freeErrorResponse(e: unknown) {
  if (e instanceof FreeServiceError) return jsonError(e.status === 429 ? 429 : 503, "service_unavailable", e.message);
  console.error("free provider", e);
  return jsonError(503, "service_unavailable", "Ce service est momentanément indisponible. Réessaie un peu plus tard.");
}

/** True for errors worth retrying on the free engine (AI down, key missing/invalid, budget reached…), false for bad input / refusals. */
export function shouldFallBack(e: unknown, isBadInput: (e: unknown) => boolean, isRefusal: (e: unknown) => boolean): boolean {
  return !isBadInput(e) && !isRefusal(e);
}
