"use client";
// Quick review of a memory's words, with the photo as visual cue. Grades go to the real FSRS scheduler.
import { useState } from "react";
import { gradeCard } from "@/lib/srs";
import { shuffle } from "@/lib/text";
import { Button, Panel, SpeakButton } from "@/components/ui";
import { MemoryPhoto } from "./MemoryPhoto";
import type { Memory } from "@/lib/types";

export function MemoryQuiz({ memory, onClose }: { memory: Memory; onClose: () => void }) {
  const [items] = useState(() => shuffle(memory.words.filter((w) => w.cardId)));
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [score, setScore] = useState(0);
  const done = i >= items.length;

  const grade = async (ok: boolean) => {
    const w = items[i];
    if (w.cardId) await gradeCard(w.cardId, "production", ok ? 3 : 1, { context: "review" }).catch(() => {});
    if (ok) setScore((x) => x + 1);
    setShown(false);
    setI((x) => x + 1);
  };

  if (!items.length) return null;
  return (
    <Panel className="space-y-4">
      <MemoryPhoto memory={memory} className="h-40 w-full rounded-2xl" />
      {done ? (
        <div className="space-y-3 text-center">
          <p className="text-lg font-semibold">
            {score} / {items.length} retrouvés
          </p>
          <p className="text-sm text-muted">Les mots oubliés reviendront plus tôt dans tes révisions.</p>
          <Button className="w-full" onClick={onClose}>Terminer</Button>
        </div>
      ) : (
        <>
          <p className="text-center text-sm text-muted">
            {i + 1} / {items.length} · Comment dit-on en anglais ?
          </p>
          <p className="text-center text-xl font-semibold">{items[i].fr}</p>
          {shown ? (
            <>
              <p className="flex items-center justify-center gap-1 text-center text-xl font-semibold text-ink-600 dark:text-ink-300">
                {items[i].en} <SpeakButton text={items[i].en} size={18} />
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => grade(false)}>Je ne savais pas</Button>
                <Button onClick={() => grade(true)}>Je savais</Button>
              </div>
            </>
          ) : (
            <Button className="w-full" onClick={() => setShown(true)}>Voir la réponse</Button>
          )}
        </>
      )}
    </Panel>
  );
}
