"use client";
// Final mission: a branching story. Choices change what happens next; productions are validated by meaning.
// The score measures communication (good decisions + clear messages), not memorised answers.
import { useEffect, useMemo, useRef, useState } from "react";
import type { AtlasFinal, StoryNode } from "@/lib/atlas/types";
import { speak, stopSpeaking } from "@/lib/speech";
import { Button, Panel, ProgressBar, SpeakButton, cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import { AtlasExerciseView } from "./mechanics";
import { Produce } from "./mechanics/Produce";
import type { ExerciseOutcome } from "@/components/lesson/Exercises";

interface Past {
  node: StoryNode;
  said?: string;
  good?: boolean;
  why?: string;
}

export interface StoryResult {
  score: number;
  good: number;
  total: number;
}

export function StoryPlayer({ final, accent, onFinish }: { final: AtlasFinal; accent?: string; onFinish: (r: StoryResult) => void }) {
  const byId = useMemo(() => new Map(final.nodes.map((n) => [n.id, n])), [final]);
  const [currentId, setCurrentId] = useState(final.start);
  const [past, setPast] = useState<Past[]>([]);
  const [pending, setPending] = useState<{ next: string; outcome: ExerciseOutcome } | null>(null);
  const tally = useRef({ good: 0, total: 0 });
  const finished = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);
  const node = byId.get(currentId);
  const steps = past.length + 1;
  const maxSteps = Math.max(final.nodes.length, 1);

  useEffect(() => {
    bottom.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
    const first = node?.lines?.find((l) => l.en)?.en;
    if (first) speak(first, { accent });
    return () => stopSpeaking();
  }, [currentId, node, accent]);

  const advance = (next: string, entry: Past) => {
    setPast((p) => [...p, entry]);
    setPending(null);
    if (!byId.has(next) || steps > 60) {
      // safety: unknown node or loop → end the story
      setCurrentId("__end__");
      return;
    }
    setCurrentId(next);
  };

  const end = () => {
    if (finished.current) return;
    finished.current = true;
    const { good, total } = tally.current;
    onFinish({ score: total ? good / total : 1, good, total });
  };

  if (!node) {
    return (
      <Panel className="space-y-3 text-center">
        <p className="font-semibold">Fin de l&apos;aventure</p>
        <Button onClick={end}>Voir mon bilan</Button>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <ProgressBar value={Math.min(steps, maxSteps)} max={maxSteps} />
      {past.map((p, i) => (
        <div key={i} className="space-y-2 opacity-80">
          <Scene node={p.node} accent={accent} />
          {p.said && (
            <div className="flex justify-end">
              <div className={cx("max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[15px] text-white", p.good === false ? "bg-coral-600" : "bg-ink-600")}>{p.said}</div>
            </div>
          )}
          {p.why && <p className={cx("text-[13.5px]", p.good ? "text-mint-600 dark:text-mint-400" : "text-coral-600 dark:text-coral-400")}>{p.why}</p>}
        </div>
      ))}

      <div className="space-y-3">
        <Scene node={node} accent={accent} />
        {node.step.kind === "choice" && (
          <div className="space-y-2">
            <p className="text-[15px] font-semibold">{node.step.prompt}</p>
            {node.step.options.map((o, k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  tally.current.total++;
                  if (o.good) tally.current.good++;
                  speak(o.en, { accent });
                  advance(o.next, { node, said: o.en, good: o.good, why: o.why });
                }}
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-left text-[15px] font-medium transition hover:border-ink-300"
              >
                {o.en}
              </button>
            ))}
          </div>
        )}
        {node.step.kind === "produce" && (
          <Panel>
            <Produce
              key={node.id}
              ex={node.step.exercise}
              onDone={(o) => {
                tally.current.total++;
                if (o.correct) tally.current.good++;
                setPending({ next: (node.step as { next: string }).next, outcome: o });
              }}
            />
          </Panel>
        )}
        {node.step.kind === "exercise" && (
          <Panel>
            <AtlasExerciseView
              key={node.id}
              ex={node.step.exercise}
              accent={accent}
              onDone={(o) => {
                if (!o.ungraded) {
                  tally.current.total++;
                  if (o.correct) tally.current.good++;
                }
                setPending({ next: (node.step as { next: string }).next, outcome: o });
              }}
            />
          </Panel>
        )}
        {pending && (
          <Button size="lg" className="w-full" onClick={() => advance(pending.next, { node })}>
            Continuer l&apos;aventure
          </Button>
        )}
        {node.step.kind === "end" && (
          <Panel tone="highlight" className="space-y-3">
            <p className="flex items-center gap-2 font-semibold">
              <Icon name="star" size={18} /> Fin de l&apos;aventure
            </p>
            <p className="text-[15px] leading-relaxed">{node.step.summary}</p>
            <Button className="w-full" onClick={end}>
              Voir mon bilan
            </Button>
          </Panel>
        )}
      </div>
      <div ref={bottom} />
    </div>
  );
}

function Scene({ node, accent }: { node: StoryNode; accent?: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[15px] italic leading-relaxed text-fg/80">{node.scene}</p>
      {node.lines?.map((l, i) =>
        l.en ? (
          <div key={i} className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{l.speaker}</p>
              <p className="flex items-start gap-1 text-[15px]">
                <span>{l.en}</span>
                <SpeakButton text={l.en} accent={accent} size={14} className="-my-1 p-1" />
              </p>
              {l.fr && <p className="text-[13px] text-muted">{l.fr}</p>}
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}
