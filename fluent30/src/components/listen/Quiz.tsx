"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Dialogue } from "@/lib/data/types";
import { DIALOGUES } from "@/lib/data/dialogues";
import { stopSpeaking } from "@/lib/speech";
import { shuffle } from "@/lib/text";
import { getDb, uid } from "@/lib/db";
import { trackActivity } from "@/lib/track";
import { Button, Panel, ProgressBar, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { useDialogueVoices, speakWith } from "./voices";

interface Q {
  type: "heard" | "meaning";
  line: Dialogue["lines"][number];
  options: string[];
  answer: string;
}

function buildQuiz(d: Dialogue): Q[] {
  const others = DIALOGUES.filter((x) => x.id !== d.id).flatMap((x) => x.lines);
  const lines = shuffle(d.lines).slice(0, Math.min(8, d.lines.length));
  return lines.map((line, k) => {
    const type: Q["type"] = k % 2 === 0 ? "heard" : "meaning";
    const field = type === "heard" ? "en" : "fr";
    const pool = [...d.lines.filter((l) => l !== line), ...shuffle(others).slice(0, 6)].map((l) => l[field]);
    const distract = shuffle([...new Set(pool)].filter((x) => x !== line[field])).slice(0, 3);
    return { type, line, answer: line[field], options: shuffle([line[field], ...distract]) };
  });
}

export function Quiz({ dialogue, accent, rate }: { dialogue: Dialogue; accent: string; rate: number }) {
  const t = useT();
  const { a, b, ready } = useDialogueVoices(accent);
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildQuiz(dialogue), [dialogue, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const started = useRef(0);
  useEffect(() => {
    started.current = Date.now();
  }, []);
  const q = questions[i];

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => {
    if (q && ready) speakWith(q.line.en, q.line.speaker === "A" ? a : b, { rate });
  }, [i, ready, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  async function pick(o: string) {
    if (choice) return;
    setChoice(o);
    const ok = o === q.answer;
    if (ok) setScore((s) => s + 1);
    await trackActivity({ xp: ok ? 2 : 0, correct: ok ? 1 : 0 });
  }

  async function next() {
    setChoice(null);
    const n = i + 1;
    setI(n);
    if (n >= questions.length) {
      await getDb().games.put({ id: uid("g"), gameId: `listen:quiz:${dialogue.id}`, score, total: questions.length, durationSec: Math.round((Date.now() - started.current) / 1000), at: Date.now(), updatedAt: Date.now() });
      await trackActivity({ games: 1 });
    }
  }

  if (i >= questions.length) {
    return (
      <Panel className="text-center">
        <p className="text-4xl">{score / questions.length >= 0.8 ? "🎉" : "👂"}</p>
        <p className="mt-2 text-xl font-semibold">{score}/{questions.length}</p>
        <Button className="mt-4" onClick={() => { setSeed((s) => s + 1); setI(0); setScore(0); started.current = Date.now(); }}>{t("Rejouer", "Play again")}</Button>
      </Panel>
    );
  }

  return (
    <Panel className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span>{i + 1}/{questions.length}</span>
        <ProgressBar value={i} max={questions.length} className="flex-1" />
        <span className="tabular-nums">✓ {score}</span>
      </div>
      <p className="font-medium">{q.type === "heard" ? t("Quelle phrase avez-vous entendue ?", "Which sentence did you hear?") : t("Que signifie la phrase entendue ?", "What does the sentence mean?")}</p>
      <Button variant="secondary" onClick={() => speakWith(q.line.en, q.line.speaker === "A" ? a : b, { rate })} disabled={!ready}>🔊 {t("Réécouter", "Replay")}</Button>
      <div className="grid gap-2">
        {q.options.map((o) => {
          const isAns = o === q.answer;
          return (
            <button
              key={o}
              onClick={() => pick(o)}
              className={cx(
                "rounded-xl border px-4 py-3 text-left text-[15.5px] transition",
                !choice && "border-line hover:border-ink-300 hover:bg-surface-2",
                choice && isAns && "border-mint-500 bg-mint-100 dark:bg-mint-600/20",
                choice === o && !isAns && "animate-shake border-coral-500 bg-coral-100 dark:bg-coral-600/20",
                choice && !isAns && choice !== o && "border-line opacity-60",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
      {choice && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">{q.type === "heard" ? q.line.fr : q.line.en}</p>
          <Button onClick={next}>{t("Suivant", "Next")} →</Button>
        </div>
      )}
    </Panel>
  );
}
