import { NextResponse } from "next/server";
import { config } from "@/lib/server/config";
import { guard, jsonError, notConfigured } from "@/lib/server/guard";

// Server-side speech-to-text (OpenAI transcription). Used when the browser has no Web Speech API.
// Audio is forwarded and never stored.
export async function POST(req: Request) {
  const g = await guard(req);
  if (!g.ok) return g.response;
  if (!config.openaiKey) return notConfigured("La transcription audio", "OPENAI_API_KEY");
  const form = await req.formData().catch(() => null);
  const file = form?.get("audio");
  if (!(file instanceof Blob)) return jsonError(400, "bad_input", "Fichier audio manquant.");
  if (file.size > 10 * 1024 * 1024) return jsonError(400, "bad_input", "Audio trop long (max 10 Mo).");
  const fd = new FormData();
  fd.append("file", file, "speech.webm");
  fd.append("model", config.transcribeModel);
  fd.append("language", "en");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${config.openaiKey}` }, body: fd });
  if (!r.ok) return jsonError(502, "transcribe_error", `Erreur du service de transcription (${r.status}).`);
  const j = (await r.json()) as { text?: string };
  return NextResponse.json({ text: j.text ?? "" });
}
