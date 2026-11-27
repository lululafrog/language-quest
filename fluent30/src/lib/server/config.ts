import "server-only";
// Which external services are configured. Keys are only ever read on the server.

export const config = {
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  /** main model: conversations, lessons, corrections, analyses */
  model: process.env.FLUENT30_MODEL || "claude-opus-5-5",
  /** cheaper model for simple high-volume tasks (word cards, lookups, translations, phrase explanations, classification) */
  modelFast: process.env.FLUENT30_MODEL_FAST || process.env.FLUENT30_MODEL || "claude-opus-5-5",
  aiTimeoutMs: Number(process.env.FLUENT30_AI_TIMEOUT_MS) || 120_000,
  openaiKey: process.env.OPENAI_API_KEY,
  imageModel: process.env.FLUENT30_IMAGE_MODEL || "gpt-image-1",
  transcribeModel: process.env.FLUENT30_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  accessCode: process.env.FLUENT30_ACCESS_CODE,
  languageToolUrl: process.env.LANGUAGETOOL_URL || "https://api.languagetool.org",
};

/** Public, minimal service status (no variable names, no keys). Kept backward compatible with the client. */
export function serviceStatus() {
  const supabase = !!(config.supabaseUrl && config.supabaseAnonKey);
  return {
    ai: !!config.anthropicKey,
    images: !!config.openaiKey || !!config.anthropicKey,
    imageProvider: config.openaiKey ? "openai" : config.anthropicKey ? "claude-svg" : null,
    transcription: !!config.openaiKey,
    supabase,
    accessCodeRequired: !!config.accessCode && !supabase,
    // free services, always available (subject to their own fair-use limits)
    translateFree: true,
    grammarFree: true,
    dictionaryFree: true,
    imagesFree: true,
    sync: supabase,
  };
}
