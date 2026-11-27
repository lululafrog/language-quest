"use client";
import { useEffect, useRef, useState } from "react";
import type { Dialogue } from "@/lib/data/types";
import { listenOnce, recognitionErrorFr, recognitionSupported, stopSpeaking } from "@/lib/speech";
import { speechSimilarity } from "@/lib/text";
import { getDb, uid } from "@/lib/db";
import { trackActivity, recordMistake } from "@/lib/track";
import { Button, ErrorNote, Panel, Segmented, Toggle, cx } from "@/components/ui";
import { MicButton } from "@/components/chat/MicButton";
import { useT } from "@/hooks/useT";
import { useDialogueVoices, speakWith } from "./voices";

type Feedback = { said: string; score: number; words: { word: string; ok: boolean }[] };

function FeedbackView({ f }: { f: Feedback }) {
  const t = useT();
  return (
    <div className="animate-fade rounded-xl bg-surface-2 p-3">
      <p className="text-[16.5px] leading-relaxed">
        {f.words.map((w, k) => (
          <span key={k} className={cx("mr-1", w.ok ? "text-mint-600 dark:text-mint-400" : "rounded bg-coral-100 px-0.5 font-semibold text-coral-600 dark:bg-coral-600/20 dark:text-coral-400")}>{w.word}</span>
        ))}
      </p>
      <p className="mt-1 text-sm text-muted">{t("Compris", "Heard")} : « {f.said || "…"} »</p>
      <p className="mt-1 text-sm font-medium">{Math.round(f.score * 100)} % — {f.score >= 0.85 ? t("Très clair !", "Very clear!") : f.score >= 0.6 ? t("Bien, quelques mots à travailler.", "Good, a few words to work on.") : t("Réécoutez et réessayez plus lentement.", "Listen again and try more slowly.")}</p>
    </div>
  );
}

export function Repeat({ dialogue, accent, rate }: { dialogue: Dialogue; accent: string; rate: number }) {
  const t = useT();
  const { a, b, ready } = useDialogueVoices(accent);
  const [mode, setMode] = useState<"repeat" | "shadow">("repeat");
  const [i, setI] = useState(0);
  const [hideText, setHideText] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shadowing, setShadowing] = useState(false);
  const [shadowState, setShadowState] = useState<"listen" | "speak" | "idle">("idle");
  const [shadowScores, setShadowScores] = useState<(Feedback | null)[]>([]);
  const token = useRef(0);
  const stopRec = useRef<() => void>(() => {});
  const line = dialogue.lines[i];

  useEffect(() => () => { token.current++; stopSpeaking(); stopRec.current(); }, []);

  function play(idx = i, onEnd?: () => void) {
    const l = dialogue.lines[idx];
    speakWith(l.en, l.speaker === "A" ? a : b, { rate, onEnd });
  }

  async function evaluate(said: string, target: string): Promise<Feedback> {
    const sim = speechSimilarity(said, target);
    const f = { said, score: sim.score, words: target.split(/\s+/).map((w, k) => ({ word: w, ok: sim.words[k]?.ok ?? false })) };
    const missed = sim.words.filter((w) => !w.ok).map((w) => w.word).filter((w) => w.length > 2);
    for (const w of missed.slice(0, 3)) await recordMistake({ id: `pron:${w}`, type: "pronunciation", label: w, example: target });
    await trackActivity({ xp: sim.score >= 0.85 ? 3 : 1, correct: sim.score >= 0.85 ? 1 : 0 });
    return f;
  }

  async function saveResult(scores: number[]) {
    if (!scores.length) return;
    const avg = scores.reduce((x, y) => x + y, 0) / scores.length;
    await getDb().games.put({ id: uid("g"), gameId: `listen:${mode}:${dialogue.id}`, score: Math.round(avg * scores.length), total: scores.length, durationSec: 0, at: Date.now(), updatedAt: Date.now() });
  }

  // ---- Shadowing loop: play a line, then listen to the learner, then move on.
  async function shadowFrom(idx: number, acc: (Feedback | null)[]) {
    const my = token.current;
    if (idx >= dialogue.lines.length) {
      setShadowing(false);
      setShadowState("idle");
      await saveResult(acc.filter(Boolean).map((f) => f!.score));
      await trackActivity({ games: 1 });
      return;
    }
    setI(idx);
    setShadowState("listen");
    play(idx, async () => {
      if (my !== token.current) return;
      setShadowState("speak");
      const { promise, stop } = listenOnce(accent);
      stopRec.current = stop;
      let f: Feedback | null = null;
      try {
        const r = await promise;
        f = await evaluate(r.transcript, dialogue.lines[idx].en);
      } catch (e) {
        const msg = recognitionErrorFr(e);
        if (!msg.includes("rien entendu")) {
          setError(msg);
          setShadowing(false);
          setShadowState("idle");
          return;
        }
      }
      if (my !== token.current) return;
      const next = [...acc, f];
      setShadowScores(next);
      setTimeout(() => my === token.current && void shadowFrom(idx + 1, next), 900);
    });
  }

  function startShadow() {
    if (!recognitionSupported()) {
      setError(recognitionErrorFr(new Error("unsupported")));
      return;
    }
    setError(null);
    token.current++;
    setShadowScores([]);
    setShadowing(true);
    void shadowFrom(0, []);
  }

  function stopShadow() {
    token.current++;
    stopSpeaking();
    stopRec.current();
    setShadowing(false);
    setShadowState("idle");
  }

  return (
    <div className="space-y-4">
      <Segmented
        value={mode}
        onChange={(m) => { stopShadow(); setMode(m); setFeedback(null); }}
        options={[
          { value: "repeat", label: t("Répéter après moi", "Repeat after me") },
          { value: "shadow", label: "Shadowing" },
        ]}
      />
      <p className="text-xs text-muted">ℹ️ {t("Le retour de prononciation est indicatif : il repose sur la reconnaissance vocale de votre navigateur, qui peut se tromper (accent, bruit, micro).", "Pronunciation feedback is indicative: it relies on your browser's speech recognition, which can make mistakes.")}</p>
      <ErrorNote>{error}</ErrorNote>

      {mode === "repeat" ? (
        <Panel className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>{t("Réplique", "Line")} {i + 1}/{dialogue.lines.length}</span>
            <Toggle checked={hideText} onChange={setHideText} label={t("Masquer le texte", "Hide text")} />
          </div>
          <p className={cx("text-[18px] font-medium leading-relaxed", hideText && !feedback && "select-none blur-[6px]")}>{line.en}</p>
          <p className="text-sm text-muted">{line.fr}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => play()} disabled={!ready}>🔊 {t("Écouter", "Listen")}</Button>
            <MicButton size="lg" lang={accent} onResult={async (said) => { setError(null); setFeedback(await evaluate(said, line.en)); }} onError={setError} />
            <span className="text-sm text-muted">{t("Appuyez puis répétez la phrase", "Tap and repeat the sentence")}</span>
          </div>
          {feedback && <FeedbackView f={feedback} />}
          <div className="flex justify-between">
            <Button variant="ghost" disabled={i === 0} onClick={() => { setI(i - 1); setFeedback(null); }}>← {t("Précédente", "Previous")}</Button>
            <Button variant="ghost" disabled={i >= dialogue.lines.length - 1} onClick={() => { setI(i + 1); setFeedback(null); }}>{t("Suivante", "Next")} →</Button>
          </div>
        </Panel>
      ) : (
        <Panel className="space-y-4">
          <p className="text-sm text-muted">{t("Le shadowing : écoutez chaque réplique puis répétez-la immédiatement, en imitant le rythme et l'intonation. Le micro s'active automatiquement après chaque réplique. Un casque est recommandé.", "Shadowing: listen to each line and repeat it right away, copying rhythm and intonation. The mic turns on automatically. Headphones recommended.")}</p>
          {shadowing ? <Button variant="secondary" onClick={stopShadow}>■ {t("Arrêter", "Stop")}</Button> : <Button onClick={startShadow} disabled={!ready}>▶ {t("Démarrer le shadowing", "Start shadowing")}</Button>}
          <div className="space-y-2">
            {dialogue.lines.map((l, k) => {
              const f = shadowScores[k];
              return (
                <div key={k} className={cx("rounded-xl border p-3", shadowing && k === i ? "border-ink-400 bg-ink-50/70 dark:bg-ink-900/40" : "border-line")}>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-[15.5px]">{l.en}</p>
                    {shadowing && k === i && <span className="text-xs font-medium text-ink-600 dark:text-ink-300">{shadowState === "listen" ? `🔊 ${t("écoutez", "listen")}` : `🎙️ ${t("à vous", "your turn")}`}</span>}
                    {f !== undefined && <span className={cx("text-sm font-semibold tabular-nums", !f ? "text-muted" : f.score >= 0.85 ? "text-mint-600" : f.score >= 0.6 ? "text-amber-600" : "text-coral-600")}>{f ? `${Math.round(f.score * 100)} %` : "—"}</span>}
                  </div>
                  {f && f.score < 1 && <p className="mt-1 text-xs text-muted">{f.words.filter((w) => !w.ok).map((w) => w.word).join(", ")}</p>}
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
