"use client";
// Visa check: a third way to open a destination — prove the skills with 5 questions (≥ 80 %).
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDestination } from "@/lib/data/world";
import { recordVisa, unlockHint, visaQuestions, worldState } from "@/lib/world";
import { getPrefs, setSpeechPrefs } from "@/lib/speech";
import { ExerciseView, exerciseLabel, type ExerciseOutcome } from "@/components/lesson/Exercises";
import { DestinationScene } from "@/components/world/art";
import { Button, EmptyState, LinkButton, PageHeader, Panel, ProgressBar } from "@/components/ui";

export default function VisaPage() {
  const { dest: id } = useParams<{ dest: string }>();
  const dest = getDestination(id);
  const data = useLiveQuery(() => worldState(), []);
  const questions = useMemo(() => (dest ? visaQuestions(dest) : []), [dest]);
  const [started, setStarted] = useState(false);
  const [pos, setPos] = useState(0);
  const [outcome, setOutcome] = useState<ExerciseOutcome | null>(null);
  const results = useRef<boolean[]>([]);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    if (!dest) return;
    const before = getPrefs();
    setSpeechPrefs({ accent: dest.accent, voiceURI: undefined });
    return () => setSpeechPrefs({ accent: before.accent, voiceURI: before.voiceURI });
  }, [dest]);

  if (!dest) return <EmptyState title="Destination introuvable"><Link href="/world" className="underline">Retour à la carte</Link></EmptyState>;
  if (!data) return <div className="mx-auto h-96 max-w-2xl animate-pulse rounded-3xl bg-surface-2" />;
  const st = data.dests.find((d) => d.dest.id === dest.id)!;

  const score = () => results.current.filter(Boolean).length / Math.max(1, questions.length);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={`Visa pour ${dest.nameFr}`} subtitle="5 questions tirées des missions de la destination. 4 bonnes réponses suffisent." back="/world" />
      {st.open && passed === null && !started ? (
        <Panel className="space-y-3">
          <p>Cette destination est déjà ouverte pour toi.</p>
          <LinkButton href={`/world/${dest.id}`} className="w-full">Y aller</LinkButton>
        </Panel>
      ) : passed !== null ? (
        <Panel tone="highlight" className="space-y-3 text-center">
          <p className="font-display text-4xl font-bold">{Math.round(finalScore * 100)}%</p>
          <p className="text-lg font-semibold">{passed ? `Visa accordé : ${dest.nameFr} est ouverte !` : "Pas encore — réessaie quand tu veux."}</p>
          {!passed && <p className="text-sm text-muted">{unlockHint(st)}</p>}
          {passed ? (
            <LinkButton href={`/world/${dest.id}`} className="w-full">Partir pour {dest.nameFr}</LinkButton>
          ) : (
            <Button className="w-full" onClick={() => { results.current = []; setPos(0); setOutcome(null); setPassed(null); setStarted(true); }}>Réessayer</Button>
          )}
        </Panel>
      ) : !started ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-line"><DestinationScene dest={dest} /></div>
          <Panel className="space-y-2">
            <p className="text-sm">Tu peux aussi ouvrir {dest.nameFr} en terminant les cours conseillés ({st.unlock.lessonsDone}/{st.unlock.lessonsTotal}) ou en suivant le niveau {dest.level}. Le contrôle de visa permet de prouver directement que tu as déjà les compétences.</p>
          </Panel>
          <Button size="lg" className="w-full" onClick={() => setStarted(true)}>Commencer le contrôle</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>{exerciseLabel(questions[pos])}</span>
            <span className="tabular-nums">{pos + 1} / {questions.length}</span>
          </div>
          <ProgressBar value={pos + (outcome ? 1 : 0)} max={questions.length} />
          <Panel>
            <ExerciseView
              key={pos}
              ex={questions[pos]}
              onDone={(o) => {
                setOutcome(o);
                results.current[pos] = o.correct;
              }}
            />
          </Panel>
          {outcome && (
            <Button
              size="lg"
              className="w-full"
              onClick={async () => {
                if (pos + 1 < questions.length) {
                  setPos(pos + 1);
                  setOutcome(null);
                } else {
                  const sc = score();
                  setFinalScore(sc);
                  setPassed(await recordVisa(dest.id, sc));
                }
              }}
            >
              {pos + 1 < questions.length ? "Question suivante" : "Voir le résultat"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
