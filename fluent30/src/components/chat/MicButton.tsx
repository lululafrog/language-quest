"use client";
import { useEffect, useRef, useState } from "react";
import { listenOnce, recognitionErrorFr, recognitionSupported } from "@/lib/speech";
import { postForm, errorMessage } from "@/lib/api";
import { useStatus } from "@/hooks/useStatus";
import { cx } from "@/components/ui";

/**
 * Voice input. Uses the browser's Web Speech API when available; otherwise records audio
 * (MediaRecorder) and sends it to /api/transcribe (requires OPENAI_API_KEY on the server).
 */
export function MicButton({
  onResult, onInterim, onError, lang = "en-US", disabled, className, size = "md", label,
}: {
  onResult: (text: string, alternatives: string[]) => void;
  onInterim?: (text: string) => void;
  onError?: (message: string) => void;
  lang?: string;
  disabled?: boolean;
  className?: string;
  size?: "md" | "lg";
  label?: string;
}) {
  const status = useStatus();
  const [state, setState] = useState<"idle" | "listening" | "recording" | "processing">("idle");
  const stopRef = useRef<() => void>(() => {});
  const recRef = useRef<MediaRecorder | null>(null);

  useEffect(() => () => stopRef.current(), []);

  const webSpeech = typeof window !== "undefined" && recognitionSupported();
  const canRecord = typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia;

  async function start() {
    if (state === "listening") return stopRef.current();
    if (state === "recording") return recRef.current?.stop();
    if (webSpeech) {
      setState("listening");
      const { promise, stop } = listenOnce(lang, onInterim);
      stopRef.current = stop;
      try {
        const r = await promise;
        onResult(r.transcript, r.alternatives);
      } catch (e) {
        onError?.(recognitionErrorFr(e));
      } finally {
        setState("idle");
      }
      return;
    }
    if (!canRecord) return onError?.("Ni la reconnaissance vocale ni l'enregistrement audio ne sont disponibles dans ce navigateur.");
    if (!status?.transcription)
      return onError?.("La reconnaissance vocale n'est pas disponible dans ce navigateur, et la transcription serveur n'est pas configurée (OPENAI_API_KEY). Essayez Chrome, Edge ou Safari.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setState("processing");
        try {
          const fd = new FormData();
          fd.append("audio", new Blob(chunks, { type: rec.mimeType || "audio/webm" }), "speech.webm");
          const r = await postForm<{ text: string }>("/api/transcribe", fd);
          if (r.text.trim()) onResult(r.text.trim(), [r.text.trim()]);
          else onError?.("Je n'ai rien entendu. Réessayez.");
        } catch (e) {
          onError?.(errorMessage(e));
        } finally {
          setState("idle");
        }
      };
      recRef.current = rec;
      stopRef.current = () => rec.state === "recording" && rec.stop();
      rec.start();
      setState("recording");
      setTimeout(() => rec.state === "recording" && rec.stop(), 30000);
    } catch {
      onError?.("Accès au micro refusé. Autorisez le micro dans les réglages du navigateur.");
      setState("idle");
    }
  }

  const active = state === "listening" || state === "recording";
  const dim = size === "lg" ? "h-16 w-16" : "h-11 w-11";
  return (
    <button
      type="button"
      onClick={start}
      disabled={disabled || state === "processing"}
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full transition active:scale-95 disabled:opacity-50",
        label ? "h-11 px-4 font-medium" : dim,
        active ? "bg-coral-500 text-white" : "bg-ink-50 text-ink-700 hover:bg-ink-100 dark:bg-ink-900/60 dark:text-ink-200",
        className,
      )}
      aria-label={active ? "Arrêter l'écoute" : "Parler"}
      title={active ? "Arrêter" : "Parler"}
    >
      {active && <span className="absolute inset-0 animate-ping rounded-full bg-coral-400/40" />}
      {state === "processing" ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <svg width={size === "lg" ? 28 : 20} height={size === "lg" ? 28 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0014 0M12 17v5M8 22h8" />
        </svg>
      )}
      {label && <span className="relative">{active ? "Stop" : label}</span>}
    </button>
  );
}
