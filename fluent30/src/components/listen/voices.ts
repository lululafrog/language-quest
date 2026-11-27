"use client";
import { useEffect, useState } from "react";
import { englishVoices, loadVoices, speak, type SpeakOptions } from "@/lib/speech";

export const normLang = (l: string) => l.replace("_", "-");

/** Loads English voices and picks two distinct voices (speaker A / B) for the chosen accent. */
export function useDialogueVoices(accent: string) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    let alive = true;
    void loadVoices().then(() => alive && setVoices(englishVoices()));
    return () => {
      alive = false;
    };
  }, []);
  const same = voices.filter((v) => normLang(v.lang).toLowerCase() === accent.toLowerCase());
  const a = same[0] ?? voices[0];
  const b = same.find((v) => v !== a) ?? voices.find((v) => v !== a && normLang(v.lang) !== normLang(a?.lang ?? "")) ?? voices.find((v) => v !== a) ?? a;
  const accents = [...new Set(voices.map((v) => normLang(v.lang)))];
  return { voices, a, b, accents, ready: voices.length > 0 };
}

export function speakWith(text: string, voice: SpeechSynthesisVoice | undefined, opts: Omit<SpeakOptions, "accent" | "voiceURI"> = {}) {
  return speak(text, voice ? { ...opts, accent: normLang(voice.lang), voiceURI: voice.voiceURI } : opts);
}

/** Word-level alignment (LCS) between a target sentence and what the learner typed. */
export function alignWords(target: string, typed: string, norm: (s: string) => string) {
  const t = target.split(/\s+/).filter(Boolean);
  const tn = t.map((w) => norm(w));
  const sn = norm(typed).split(" ").filter(Boolean);
  const dp = Array.from({ length: tn.length + 1 }, () => new Array(sn.length + 1).fill(0));
  for (let i = tn.length - 1; i >= 0; i--)
    for (let j = sn.length - 1; j >= 0; j--) dp[i][j] = tn[i] && tn[i] === sn[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ok = new Array(t.length).fill(false);
  let i = 0, j = 0;
  while (i < tn.length && j < sn.length) {
    if (tn[i] && tn[i] === sn[j]) { ok[i] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  tn.forEach((w, k) => { if (!w) ok[k] = true; }); // pure punctuation tokens
  const counted = tn.filter(Boolean).length;
  const matched = ok.filter((x, k) => x && tn[k]).length;
  return { words: t.map((w, k) => ({ word: w, ok: ok[k] })), score: counted ? matched / counted : 0, extra: Math.max(0, sn.length - matched) };
}
