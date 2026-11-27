"use client";
import { useEffect, useRef, useState } from "react";
import type { Dialogue } from "@/lib/data/types";
import { stopSpeaking } from "@/lib/speech";
import { checkAnswer, normalize } from "@/lib/text";
import { getDb, uid } from "@/lib/db";
import { trackActivity, recordMistake } from "@/lib/track";
import { Button, Panel, ProgressBar, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { useDialogueVoices, speakWith, alignWords } from "./voices";

export function Dictation({ dialogue, accent, rate }: { dialogue: Dialogue; accent: string; rate: number }) {
  const t = useT();
  const { a, b, ready } = useDialogueVoices(accent);
  const [i, setI] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<typeof alignWords> | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [plays, setPlays] = useState(0);
  const started = useRef(0);
  useEffect(() => {
    started.current = Date.now();
  }, []);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const line = dialogue.lines[i];
  const done = i >= dialogue.lines.length;

  useEffect(() => () => stopSpeaking(), []);

  function play(slow = false) {
    if (!line) return;
    setPlays((p) => p + 1);
    speakWith(line.en, line.speaker === "A" ? a : b, { rate: slow ? Math.max(0.5, rate * 0.7) : rate });
    inputRef.current?.focus();
  }

  async function check() {
    if (!line) return;
    const r = alignWords(line.en, input, normalize);
    const verdict = checkAnswer(input, line.en);
    const score = verdict === "exact" ? 1 : verdict === "close" ? Math.max(r.score, 0.95) : r.score;
    setResult({ ...r, score });
    setScores((s) => [...s, score]);
    const missed = r.words.filter((w) => !w.ok).map((w) => normalize(w.word)).filter((w) => w.length > 2);
    for (const w of missed.slice(0, 3)) await recordMistake({ id: `spelling:${w}`, type: "spelling", label: w, detail: t("Dictée", "Dictation"), example: line.en });
    await trackActivity({ xp: score >= 0.9 ? 3 : 1, correct: score >= 0.9 ? 1 : 0 });
  }

  async function next() {
    setResult(null);
    setInput("");
    setPlays(0);
    const n = i + 1;
    setI(n);
    if (n >= dialogue.lines.length) {
      const avg = [...scores].reduce((x, y) => x + y, 0) / Math.max(1, scores.length);
      await getDb().games.put({ id: uid("g"), gameId: `listen:dictation:${dialogue.id}`, score: Math.round(avg * dialogue.lines.length), total: dialogue.lines.length, durationSec: Math.round((Date.now() - started.current) / 1000), at: Date.now(), updatedAt: Date.now() });
      await trackActivity({ games: 1 });
    }
  }

  if (done) {
    const avg = scores.reduce((x, y) => x + y, 0) / Math.max(1, scores.length);
    return (
      <Panel className="text-center">
        <p className="text-4xl">{avg >= 0.85 ? "🎉" : avg >= 0.6 ? "👍" : "💪"}</p>
        <p className="mt-2 text-xl font-semibold">{Math.round(avg * 100)} % {t("de mots corrects", "words correct")}</p>
        <p className="mt-1 text-sm text-muted">{t("Les mots manqués sont ajoutés à vos erreurs récurrentes.", "Missed words are added to your recurring mistakes.")}</p>
        <Button className="mt-4" onClick={() => { setI(0); setScores([]); started.current = Date.now(); }}>{t("Recommencer", "Start again")}</Button>
      </Panel>
    );
  }

  return (
    <Panel className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span>{t("Réplique", "Line")} {i + 1}/{dialogue.lines.length}</span>
        <ProgressBar value={i} max={dialogue.lines.length} className="flex-1" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => play()} disabled={!ready}>🔊 {plays ? t("Réécouter", "Replay") : t("Écouter", "Listen")}</Button>
        <Button variant="secondary" onClick={() => play(true)} disabled={!ready}>🐢 {t("Lentement", "Slowly")}</Button>
      </div>
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (result) void next();
            else if (input.trim()) void check();
          }
        }}
        disabled={!!result}
        rows={2}
        placeholder={t("Écrivez ce que vous entendez…", "Type what you hear…")}
        className="w-full resize-none rounded-xl border border-line bg-surface-2 p-3 text-[16px] outline-none focus:border-ink-400"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {result && (
        <div className="animate-fade rounded-xl bg-surface-2 p-3">
          <p className="text-[16.5px] leading-relaxed">
            {result.words.map((w, k) => (
              <span key={k} className={cx("mr-1", w.ok ? "text-mint-600 dark:text-mint-400" : "rounded bg-coral-100 px-0.5 font-semibold text-coral-600 dark:bg-coral-600/20 dark:text-coral-400")}>{w.word}</span>
            ))}
          </p>
          <p className="mt-1 text-sm text-muted">{line.fr}</p>
          <p className="mt-2 text-sm font-medium">{Math.round(result.score * 100)} % — {result.score >= 0.9 ? t("Excellent !", "Excellent!") : result.score >= 0.6 ? t("Presque !", "Almost!") : t("Réécoutez et observez les mots en rouge.", "Listen again and check the red words.")}</p>
        </div>
      )}
      <div className="flex justify-end">
        {result ? <Button onClick={next}>{t("Suivant", "Next")} →</Button> : <Button onClick={check} disabled={!input.trim()}>{t("Vérifier", "Check")}</Button>}
      </div>
    </Panel>
  );
}
