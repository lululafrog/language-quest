"use client";
// Listen / read an order and pick exactly the right items (sushi chef, taqueria, packing a bag).
import { useState } from "react";
import type { Mechanic } from "@/lib/atlas/types";
import { scoreAssemble } from "@/lib/atlas/select";
import { Button, cx } from "@/components/ui";
import { AudioButtons, MechTitle, Verdict, Why, chip, useOnce, type OnDone } from "./shared";

export function Assemble({ ex, accent, onDone }: { ex: Extract<Mechanic, { type: "assemble" }>; accent?: string; onDone: OnDone }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [res, setRes] = useState<ReturnType<typeof scoreAssemble> | null>(null);
  const done = useOnce(onDone);
  const label = (id: string) => ex.options.find((o) => o.id === id)?.en ?? id;
  return (
    <div className="space-y-4">
      <MechTitle title={ex.title} brief={ex.brief} />
      {ex.audio && <AudioButtons text={ex.audio} accent={accent} />}
      <div className="grid grid-cols-2 gap-2">
        {ex.options.map((o) => {
          const on = picked.includes(o.id);
          const state = res ? (ex.correct.includes(o.id) ? "right" : on ? "wrong" : "idle") : "idle";
          return (
            <button
              key={o.id}
              type="button"
              disabled={!!res}
              aria-pressed={on}
              onClick={() => setPicked((p) => (on ? p.filter((x) => x !== o.id) : [...p, o.id]))}
              className={cx(chip(on && !res), state === "right" && "border-mint-500 bg-mint-500/10", state === "wrong" && "border-coral-500 bg-coral-500/10")}
            >
              <span className="block">{o.en}</span>
              <span className={cx("block text-[12.5px]", on && !res ? "text-white/75" : "text-muted")}>{o.fr}</span>
            </button>
          );
        })}
      </div>
      {!res && (
        <Button
          className="w-full"
          disabled={!picked.length}
          onClick={() => {
            const r = scoreAssemble(picked, ex.correct);
            setRes(r);
            done({ correct: r.ok });
          }}
        >
          Vérifier
        </Button>
      )}
      {res && (
        <Verdict ok={res.ok}>
          {!res.ok && res.missing.length > 0 && <p>Il manquait : <strong>{res.missing.map(label).join(", ")}</strong></p>}
          {!res.ok && res.extra.length > 0 && <p>En trop : <strong>{res.extra.map(label).join(", ")}</strong></p>}
          {ex.audio && <p className="text-sm text-muted">Transcription : « {ex.audio} »</p>}
          <Why>{ex.explain}</Why>
        </Verdict>
      )}
    </div>
  );
}
