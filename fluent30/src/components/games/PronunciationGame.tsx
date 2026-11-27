"use client";
import { useRef, useState } from "react";
import { Badge, Button, Panel, SpeakButton, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { useSettings } from "@/hooks/useSettings";
import { reportAnswer, type MissedItem } from "@/lib/games/engine";
import { listenOnce, recognitionErrorFr, recognitionSupported, speak } from "@/lib/speech";
import { speechSimilarity } from "@/lib/text";
import { GameHeader, Notice, type FinishPayload } from "./common";

export interface SayItem {
  key: string;
  en: string;
  fr: string;
  cardId?: string;
}

const PASS = 0.75;

export function PronunciationGame({ gameId, items, onFinish }: { gameId: string; items: SayItem[]; onFinish: (p: FinishPayload) => void }) {
  const t = useT();
  const settings = useSettings();
  const supported = typeof window !== "undefined" && recognitionSupported();
  const [i, setI] = useState(0);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [result, setResult] = useState<{ said: string; score: number; words: { word: string; ok: boolean }[] } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [selfMode, setSelfMode] = useState(false);
  const missed = useRef<MissedItem[]>([]);
  const stopRef = useRef<() => void>(() => {});
  const it = items[i];

  async function record() {
    setError(null);
    setInterim("");
    setListening(true);
    const { promise, stop } = listenOnce(settings.accent === "en-US" ? "en-US" : "en-GB", setInterim);
    stopRef.current = stop;
    try {
      const r = await promise;
      // Use the best of the alternatives returned by the recogniser.
      const best = r.alternatives.map((a) => ({ said: a, ...speechSimilarity(a, it.en) })).sort((a, b) => b.score - a.score)[0];
      setResult(best);
      setAttempts((a) => a + 1);
    } catch (e) {
      setError(recognitionErrorFr(e));
    } finally {
      setListening(false);
    }
  }

  function next(passed: boolean) {
    if (passed) setScore((s) => s + 1);
    else missed.current.push({ en: it.en, fr: it.fr, cardId: it.cardId, note: t("À retravailler à l'oral", "Practise saying it again") });
    if (!selfMode) void reportAnswer({ correct: passed, cardId: it.cardId, skill: "production", mistake: { id: `pron:${it.en.toLowerCase()}`, type: "pronunciation", label: it.en, detail: it.fr } });
    const finalScore = score + (passed ? 1 : 0);
    if (i + 1 >= items.length) {
      onFinish({ score: finalScore, total: items.length, missed: missed.current, extra: selfMode ? t("Mode auto-évaluation (sans reconnaissance vocale).", "Self-assessment mode (no speech recognition).") : t("Retour indicatif : la reconnaissance vocale ne remplace pas l'oreille d'un professeur.", "Indicative feedback: speech recognition doesn't replace a teacher's ear.") });
      return;
    }
    setI(i + 1);
    setResult(null);
    setAttempts(0);
    setInterim("");
  }

  if (!it) return null;
  const passed = !!result && result.score >= PASS;

  return (
    <div>
      <GameHeader gameId={gameId} progress={i / items.length} right={<span className="text-sm text-muted">{i + 1}/{items.length}</span>} />
      {!supported && !selfMode && (
        <Notice>
          <p className="font-medium">{t("Reconnaissance vocale indisponible dans ce navigateur", "Speech recognition isn't available in this browser")}</p>
          <p className="mt-1">{t("Utilise Chrome, Edge ou Safari (iOS 14.5+) pour être évalué automatiquement. Tu peux quand même t'entraîner en mode auto-évaluation : écoute, répète, puis juge toi-même (les résultats ne modifient pas tes révisions).", "Use Chrome, Edge or Safari to be scored automatically. You can still practise in self-assessment mode (results won't affect your reviews).")}</p>
          <Button size="sm" variant="secondary" className="mt-2" onClick={() => setSelfMode(true)}>{t("Mode auto-évaluation", "Self-assessment mode")}</Button>
        </Notice>
      )}
      <Panel className="text-center">
        <p className="text-sm text-muted">{t("Écoute le modèle puis dis à voix haute :", "Listen to the model, then say aloud:")}</p>
        <div className="mt-2 flex items-center justify-center gap-1">
          <p className="text-2xl font-semibold">{it.en}</p>
          <SpeakButton text={it.en} />
        </div>
        <p className="text-sm text-muted">{it.fr}</p>
        <div className="mt-2 flex justify-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => speak(it.en, { rate: 0.6 })}>🐢 {t("Lentement", "Slowly")}</Button>
        </div>

        {result && (
          <div className="mt-4 animate-fade">
            <div className="flex flex-wrap justify-center gap-1.5 text-lg">
              {result.words.map((w, k) => (
                <span key={k} className={cx("rounded-md px-1.5", w.ok ? "bg-mint-100 text-mint-600 dark:bg-mint-600/20 dark:text-mint-400" : "bg-coral-100 text-coral-600 dark:bg-coral-600/20 dark:text-coral-400")}>{w.word}</span>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">
              {t("Compris", "Heard")} : « {result.said || "…"} »
            </p>
            <Badge tone={passed ? "mint" : "coral"} className="mt-2">{Math.round(result.score * 100)}% {passed ? t("— très bien !", "— great!") : t("— réessaie", "— try again")}</Badge>
          </div>
        )}
        {listening && <p className="mt-4 animate-pulse text-sm text-ink-600 dark:text-ink-300">🎙 {interim || t("J'écoute…", "Listening…")}</p>}
        {error && <p className="mt-3 text-sm text-coral-600">{error}</p>}

        <div className="mt-5 flex flex-col gap-2">
          {selfMode ? (
            <div className="flex gap-2">
              <Button variant="success" className="flex-1" onClick={() => next(true)}>{t("Je l'ai bien dit", "I said it well")}</Button>
              <Button variant="outline" className="flex-1" onClick={() => next(false)}>{t("À retravailler", "Needs work")}</Button>
            </div>
          ) : listening ? (
            <Button variant="danger" onClick={() => stopRef.current()}>■ {t("Arrêter", "Stop")}</Button>
          ) : passed || attempts >= 3 ? (
            <Button onClick={() => next(passed)} autoFocus>{i + 1 >= items.length ? t("Voir le résultat", "See results") : t("Suivant", "Next")}</Button>
          ) : (
            <>
              <Button onClick={record} disabled={!supported}>🎙 {result ? t("Réessayer", "Try again") : t("Parler", "Speak")}</Button>
              {result && <Button variant="ghost" onClick={() => next(false)}>{t("Passer", "Skip")}</Button>}
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}
