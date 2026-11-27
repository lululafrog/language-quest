"use client";
// Short practice built from vocabulary gathered across destinations (match + multiple choice).
import { useMemo, useState } from "react";
import type { Exercise } from "@/lib/curriculum";
import { shuffle } from "@/lib/text";
import { ExerciseView, exerciseLabel, type ExerciseOutcome } from "@/components/lesson/Exercises";
import { Button, Panel, ProgressBar } from "@/components/ui";

export function buildVocabExercises(vocab: { en: string; fr: string }[], seed: number): Exercise[] {
  if (vocab.length < 4) return [];
  const pool = shuffle(vocab).slice(0, 9);
  const out: Exercise[] = [];
  const pairs = pool.slice(0, 5).map((v) => [v.en, v.fr.split(/[,;]/)[0].trim()] as [string, string]);
  if (new Set(pairs.map((p) => p[1])).size === pairs.length) out.push({ type: "match", pairs, explain: "Ces mots viennent des missions de cette collection." });
  for (const v of pool.slice(5, 9).concat(pool.slice(0, Math.max(0, 4 - pool.slice(5, 9).length)))) {
    const others = shuffle(vocab.filter((x) => x.en !== v.en)).slice(0, 3).map((x) => x.fr.split(/[,;]/)[0].trim());
    const right = v.fr.split(/[,;]/)[0].trim();
    if (others.includes(right)) continue;
    const options = shuffle([right, ...others]);
    out.push({ type: "mcq", prompt: `« ${v.en} » veut dire…`, options, answer: options.indexOf(right), explain: `${v.en} = ${v.fr}.` });
  }
  void seed;
  return out.slice(0, 5);
}

export function VocabPractice({ vocab }: { vocab: { en: string; fr: string }[] }) {
  const [round, setRound] = useState(0);
  const exercises = useMemo(() => buildVocabExercises(vocab, round), [vocab, round]);
  const [pos, setPos] = useState(0);
  const [outcome, setOutcome] = useState<ExerciseOutcome | null>(null);
  const [score, setScore] = useState(0);
  if (!exercises.length) return <p className="text-sm text-muted">Il faut au moins 4 mots dans cette collection pour s&apos;entraîner.</p>;
  if (pos >= exercises.length) {
    return (
      <Panel className="space-y-2 text-center">
        <p className="font-display text-2xl font-semibold">{score}/{exercises.length}</p>
        <Button variant="secondary" onClick={() => { setRound((r) => r + 1); setPos(0); setScore(0); setOutcome(null); }}>Nouvelle série</Button>
      </Panel>
    );
  }
  const ex = exercises[pos];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{exerciseLabel(ex)}</span>
        <span className="tabular-nums">{pos + 1}/{exercises.length}</span>
      </div>
      <ProgressBar value={pos + (outcome ? 1 : 0)} max={exercises.length} />
      <Panel>
        <ExerciseView key={`${round}-${pos}`} ex={ex} onDone={(o) => { setOutcome(o); if (o.correct) setScore((s) => s + 1); }} />
      </Panel>
      {outcome && <Button className="w-full" onClick={() => { setPos(pos + 1); setOutcome(null); }}>Continuer</Button>}
    </div>
  );
}
