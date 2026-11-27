"use client";
// Browser speech APIs: text-to-speech (speechSynthesis) and speech recognition (Web Speech API).
// These are real, free, on-device/OS services; availability depends on the browser.

export type Accent = "en-GB" | "en-US" | "en-AU" | "en-IE" | "en-IN" | "en-ZA" | "en-CA" | "en-NZ";
export const ACCENT_LABELS: Record<Accent, string> = {
  "en-GB": "Britannique", "en-US": "Américain", "en-AU": "Australien", "en-IE": "Irlandais",
  "en-IN": "Indien", "en-ZA": "Sud-africain", "en-CA": "Canadien", "en-NZ": "Néo-zélandais",
};

export function ttsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let voicesCache: SpeechSynthesisVoice[] = [];
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!ttsSupported()) return Promise.resolve([]);
  const v = window.speechSynthesis.getVoices();
  if (v.length) {
    voicesCache = v;
    return Promise.resolve(v);
  }
  return new Promise((resolve) => {
    const done = () => {
      voicesCache = window.speechSynthesis.getVoices();
      resolve(voicesCache);
    };
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1200);
  });
}

export function englishVoices(): SpeechSynthesisVoice[] {
  return voicesCache.filter((v) => v.lang.toLowerCase().startsWith("en"));
}

/** Available accents on this device. */
export function availableAccents(): Accent[] {
  const langs = new Set(englishVoices().map((v) => v.lang.replace("_", "-")));
  return (Object.keys(ACCENT_LABELS) as Accent[]).filter((a) => [...langs].some((l) => l.toLowerCase() === a.toLowerCase()));
}

function pickVoice(accent: string, voiceURI?: string): SpeechSynthesisVoice | undefined {
  const voices = voicesCache.length ? voicesCache : ttsSupported() ? window.speechSynthesis.getVoices() : [];
  if (voiceURI) {
    const v = voices.find((x) => x.voiceURI === voiceURI);
    if (v && v.lang.toLowerCase().replace("_", "-") === accent.toLowerCase()) return v;
  }
  const exact = voices.filter((v) => v.lang.toLowerCase().replace("_", "-") === accent.toLowerCase());
  // Prefer natural / enhanced voices when the OS provides them.
  const ranked = exact.sort((a, b) => score(b) - score(a));
  return ranked[0] ?? voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  function score(v: SpeechSynthesisVoice) {
    const n = v.name.toLowerCase();
    return (n.includes("natural") ? 3 : 0) + (n.includes("enhanced") || n.includes("premium") ? 2 : 0) + (n.includes("google") ? 1 : 0) + (v.localService ? 0.5 : 0);
  }
}

export interface SpeakOptions {
  accent?: string;
  voiceURI?: string;
  rate?: number;
  onBoundary?: (charIndex: number, charLength: number) => void;
  onEnd?: () => void;
}

export function speak(text: string, opts: SpeakOptions = {}): SpeechSynthesisUtterance | null {
  if (!ttsSupported() || !text.trim()) return null;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const accent = opts.accent ?? getPrefs().accent;
  const voice = pickVoice(accent, opts.voiceURI ?? getPrefs().voiceURI);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? accent;
  u.rate = opts.rate ?? getPrefs().rate;
  if (opts.onBoundary) u.onboundary = (e) => opts.onBoundary!(e.charIndex, (e as SpeechSynthesisEvent & { charLength?: number }).charLength ?? 0);
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();
  synth.speak(u);
  return u;
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

// Global voice preferences, mirrored from Settings by the app shell.
let prefs = { accent: "en-GB", voiceURI: undefined as string | undefined, rate: 0.95 };
export function setSpeechPrefs(p: Partial<typeof prefs>) {
  prefs = { ...prefs, ...p };
}
export function getPrefs() {
  return prefs;
}

// ---------- Speech recognition ----------
type RecCtor = new () => {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export function recognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor };
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export interface RecognitionResult {
  transcript: string;
  alternatives: string[];
  confidence: number;
}

/** Listen once and resolve with the transcript. */
export function listenOnce(lang = "en-US", onInterim?: (t: string) => void): { promise: Promise<RecognitionResult>; stop: () => void } {
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return { promise: Promise.reject(new Error("unsupported")), stop: () => {} };
  const rec = new Ctor();
  rec.lang = lang;
  rec.interimResults = !!onInterim;
  rec.maxAlternatives = 5;
  rec.continuous = false;
  let finalRes: RecognitionResult | null = null;
  const promise = new Promise<RecognitionResult>((resolve, reject) => {
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const alts = Array.from({ length: last.length }, (_, i) => last[i].transcript.trim());
      if (last.isFinal) finalRes = { transcript: alts[0] ?? "", alternatives: alts, confidence: last[0]?.confidence ?? 0 };
      else onInterim?.(alts[0] ?? "");
    };
    rec.onerror = (e) => reject(new Error(e.error));
    rec.onend = () => (finalRes ? resolve(finalRes) : reject(new Error("no-speech")));
  });
  rec.start();
  return { promise, stop: () => rec.stop() };
}

export function recognitionErrorFr(err: unknown): string {
  const m = err instanceof Error ? err.message : String(err);
  if (m === "unsupported") return "La reconnaissance vocale n'est pas disponible dans ce navigateur (essayez Chrome, Edge ou Safari).";
  if (m === "not-allowed" || m === "service-not-allowed") return "Accès au micro refusé. Autorisez le micro dans les réglages du navigateur.";
  if (m === "no-speech") return "Je n'ai rien entendu. Réessayez en parlant plus près du micro.";
  if (m === "network") return "La reconnaissance vocale du navigateur nécessite une connexion internet.";
  if (m === "audio-capture") return "Aucun micro détecté.";
  return `Erreur de reconnaissance vocale : ${m}`;
}
