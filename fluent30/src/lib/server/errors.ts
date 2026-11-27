// Typed errors and their mapping to friendly, non-technical French messages.
// The learner never sees variable names or provider internals; technical detail goes to the admin error log.
import Anthropic from "@anthropic-ai/sdk";

export class NotConfiguredError extends Error {
  constructor(public service = "ai") {
    super("not_configured");
  }
}
export class RefusalError extends Error {}
/** The model answered but the output was unusable (schema mismatch, truncated, empty). */
export class BadResponseError extends Error {}
export class BadInput extends Error {}
export class BudgetError extends Error {
  constructor(public scope: "global" | "user" = "global") {
    super("budget_reached");
  }
}

export interface MappedError {
  status: number;
  code: string;
  message: string;
}

/** Maps any error thrown during an AI request to an HTTP status, a stable code and a friendly French message. */
export function classifyAiError(e: unknown): MappedError {
  if (e instanceof NotConfiguredError)
    return { status: 503, code: "not_configured", message: "Cette fonction intelligente n'est pas encore activée sur ce serveur. Le reste de l'application fonctionne normalement." };
  if (e instanceof BudgetError)
    return e.scope === "user"
      ? { status: 429, code: "user_budget", message: "Tu as utilisé toute ta réserve d'IA de ce mois-ci. Elle se recharge le mois prochain — cours, révisions, jeux et lecture restent disponibles." }
      : { status: 503, code: "budget", message: "Les fonctions IA sont en pause pour le moment. Cours, révisions, jeux, lecture et traduction simple restent disponibles." };
  if (e instanceof RefusalError) return { status: 422, code: "refusal", message: "Je ne peux pas traiter cette demande. Essaie de la reformuler." };
  if (e instanceof BadInput) return { status: 400, code: "bad_input", message: e.message };
  if (e instanceof BadResponseError) return { status: 502, code: "bad_response", message: "La réponse obtenue était incomplète. Réessaie dans un instant." };
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError)
    return { status: 503, code: "service_auth", message: "Le service d'IA est momentanément indisponible. Réessaie plus tard." };
  if (e instanceof Anthropic.RateLimitError) return { status: 429, code: "provider_rate_limit", message: "Le service d'IA est très sollicité. Réessaie dans une minute." };
  if (e instanceof Anthropic.APIConnectionTimeoutError) return { status: 504, code: "timeout", message: "Le service d'IA met trop de temps à répondre. Réessaie dans un instant." };
  if (e instanceof Anthropic.APIConnectionError) return { status: 503, code: "provider_unavailable", message: "Le service d'IA est injoignable pour le moment. Réessaie plus tard." };
  if (e instanceof Anthropic.BadRequestError) return { status: 400, code: "bad_request", message: "Cette demande n'a pas pu être traitée (texte trop long ou format non pris en charge ?)." };
  if (e instanceof Anthropic.APIError) {
    const s = e.status ?? 500;
    if (s === 529 || s >= 500) return { status: 503, code: "provider_unavailable", message: "Le service d'IA est temporairement surchargé. Réessaie dans un instant." };
    return { status: 502, code: "provider_error", message: "Le service d'IA a rencontré un problème. Réessaie plus tard." };
  }
  if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError"))
    return { status: 504, code: "timeout", message: "Le service met trop de temps à répondre. Réessaie dans un instant." };
  if (e instanceof TypeError && /fetch failed|network|ECONN|ENOTFOUND|socket/i.test(`${e.message} ${String((e as { cause?: unknown }).cause ?? "")}`))
    return { status: 503, code: "provider_unavailable", message: "Le service est injoignable pour le moment. Réessaie plus tard." };
  if (e instanceof SyntaxError || (e instanceof Error && /zod|parse|schema/i.test(e.message)))
    return { status: 502, code: "bad_response", message: "La réponse obtenue était incomplète. Réessaie dans un instant." };
  return { status: 500, code: "internal", message: "Une erreur inattendue est survenue. Réessaie dans un instant." };
}
