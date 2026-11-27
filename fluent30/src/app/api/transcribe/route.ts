import { NextResponse } from "next/server";
import { config } from "@/lib/server/config";
import { jsonError, notConfigured } from "@/lib/server/guard";
import { withAi } from "@/lib/server/route";
import { recordCall, recordFailure } from "@/lib/server/usage";
import { TRANSCRIBE_COST_PER_MIN_USD } from "@/lib/server/costs";

// Server-side speech-to-text (OpenAI transcription). Used when the browser has no Web Speech API.
// Audio is forwarded and never stored.
export function POST(req: Request) {
  return withAi("transcribe", req, async () => {
    if (!config.openaiKey) return notConfigured("La transcription audio", "OPENAI_API_KEY");
    const form = await req.formData().catch(() => null);
    const file = form?.get("audio");
    if (!(file instanceof Blob)) return jsonError(400, "bad_input", "Fichier audio manquant.");
    if (file.size > 10 * 1024 * 1024) return jsonError(400, "bad_input", "Enregistrement trop long (10 Mo maximum).");
    const fd = new FormData();
    fd.append("file", file, "speech.webm");
    fd.append("model", config.transcribeModel);
    fd.append("language", "en");
    const t0 = Date.now();
    let r: Response;
    try {
      r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${config.openaiKey}` }, body: fd, signal: AbortSignal.timeout(60_000) });
    } catch (e) {
      recordFailure({ code: "provider_unavailable", message: e instanceof Error ? e.name : "fetch", provider: "openai" });
      return jsonError(503, "provider_unavailable", "La transcription est momentanément indisponible. Tu peux écrire ta phrase à la place.");
    }
    if (!r.ok) {
      const code = r.status === 401 || r.status === 403 ? "service_auth" : r.status === 429 ? "provider_rate_limit" : "provider_unavailable";
      recordFailure({ code, message: `openai transcription ${r.status}`, provider: "openai" });
      return jsonError(r.status === 429 ? 429 : 503, code, "La transcription est momentanément indisponible. Tu peux écrire ta phrase à la place.");
    }
    const j = (await r.json().catch(() => ({}))) as { text?: string };
    // ≈ 16 kB per second for compressed speech (webm/opus) → rough duration for cost tracking
    const minutes = Math.max(0.05, file.size / 16_000 / 60);
    recordCall({ model: config.transcribeModel, usage: { input: 0, output: 0 }, latencyMs: Date.now() - t0, costUsd: minutes * TRANSCRIBE_COST_PER_MIN_USD });
    return NextResponse.json({ text: j.text ?? "" });
  }, { body: "none" });
}
