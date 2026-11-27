import "server-only";
// Which external services are configured. Keys are only ever read on the server.

export const config = {
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.FLUENT30_MODEL || "claude-opus-5-5",
  openaiKey: process.env.OPENAI_API_KEY,
  imageModel: process.env.FLUENT30_IMAGE_MODEL || "gpt-image-1",
  transcribeModel: process.env.FLUENT30_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  accessCode: process.env.FLUENT30_ACCESS_CODE,
};

export function serviceStatus() {
  return {
    ai: !!config.anthropicKey,
    images: !!config.openaiKey || !!config.anthropicKey,
    imageProvider: config.openaiKey ? "openai" : config.anthropicKey ? "claude-svg" : null,
    transcription: !!config.openaiKey,
    supabase: !!(config.supabaseUrl && config.supabaseAnonKey),
    accessCodeRequired: !!config.accessCode && !(config.supabaseUrl && config.supabaseAnonKey),
  };
}
