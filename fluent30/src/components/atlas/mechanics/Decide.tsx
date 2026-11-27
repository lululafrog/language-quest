"use client";
// Read or listen to a document (weather report, sign, safety briefing) and decide.
import { useState } from "react";
import type { Mechanic } from "@/lib/atlas/types";
import { SpeakButton, cx } from "@/components/ui";
import { MechTitle, Verdict, Why, useOnce, type OnDone } from "./shared";

export function Decide({ ex, accent, onDone }: { ex: Extract<Mechanic, { type: "decide" }>; accent?: string; onDone: OnDone }) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = useOnce(onDone);
  const chosen = picked !== null ? ex.options[picked] : null;
  const right = ex.options.find((o) => o.correct);
  return (
    <div className="space-y-4">
      <MechTitle title={ex.title} />
      <div className="relative rounded-2xl border border-line bg-surface-2/60 p-4 font-serif text-[15.5px] leading-relaxed whitespace-pre-line">
        {ex.audio && <SpeakButton text={ex.doc} accent={accent} className="float-right -mr-2 -mt-2" label="Écouter" />}
        {ex.doc}
      </div>
      <p className="text-[16px] font-semibold">{ex.question}</p>
      <div className="grid gap-2">
        {ex.options.map((o, i) => {
          const state = picked === null ? "idle" : o.correct ? "right" : i === picked ? "wrong" : "dim";
          return (
            <button
              key={i}
              type="button"
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                done({ correct: o.correct });
              }}
              className={cx(
                "rounded-2xl border px-4 py-3 text-left text-[15px] font-medium transition",
                state === "idle" && "border-line bg-surface hover:border-ink-300",
                state === "right" && "border-mint-500 bg-mint-500/10",
                state === "wrong" && "border-coral-500 bg-coral-500/10",
                state === "dim" && "border-line opacity-50",
              )}
            >
              {o.en}
            </button>
          );
        })}
      </div>
      {chosen && (
        <Verdict ok={chosen.correct}>
          <Why>{chosen.why}</Why>
          {!chosen.correct && right && <p className="text-[14px]"><strong>{right.en}</strong> — {right.why}</p>}
        </Verdict>
      )}
    </div>
  );
}
