"use client";
// Listen to a description and identify (safari photo, monument, dish): illustrated label cards.
import { useState } from "react";
import type { Mechanic } from "@/lib/atlas/types";
import { cx } from "@/components/ui";
import { AudioButtons, MechTitle, Verdict, Why, useOnce, type OnDone } from "./shared";

/** Neutral illustration: a framed "photo" with the initial, tinted per option (no stock art, no emoji). */
function Motif({ seed, label }: { seed: number; label: string }) {
  const hues = ["#5E8C6A", "#C9785A", "#4C7A99", "#C9A24A", "#8A6FA8", "#6A8F8F"];
  const c = hues[seed % hues.length];
  return (
    <svg viewBox="0 0 64 48" className="h-16 w-full" aria-hidden>
      <rect x="1" y="1" width="62" height="46" rx="8" fill={c} opacity="0.16" stroke={c} strokeOpacity="0.5" />
      <path d="M6 40 L22 24 L32 33 L42 22 L58 40 Z" fill={c} opacity="0.45" />
      <circle cx="48" cy="12" r="5" fill={c} opacity="0.55" />
      <text x="32" y="22" textAnchor="middle" fontSize="13" fontWeight="700" fill={c}>{label.replace(/^(a|an|the)\s+/i, "").charAt(0).toUpperCase()}</text>
    </svg>
  );
}

export function Identify({ ex, accent, onDone }: { ex: Extract<Mechanic, { type: "identify" }>; accent?: string; onDone: OnDone }) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = useOnce(onDone);
  return (
    <div className="space-y-4">
      <MechTitle title={ex.title} brief="Écoute la description, puis choisis la bonne photo." />
      <AudioButtons text={ex.audio} accent={accent} />
      <div className="grid grid-cols-2 gap-2">
        {ex.options.map((o, i) => {
          const state = picked === null ? "idle" : i === ex.answer ? "right" : i === picked ? "wrong" : "dim";
          return (
            <button
              key={i}
              type="button"
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                done({ correct: i === ex.answer });
              }}
              className={cx(
                "space-y-1.5 rounded-2xl border p-2 text-left transition",
                state === "idle" && "border-line bg-surface hover:border-ink-300",
                state === "right" && "border-mint-500 bg-mint-500/10",
                state === "wrong" && "border-coral-500 bg-coral-500/10",
                state === "dim" && "border-line opacity-50",
              )}
            >
              <Motif seed={i} label={o.en} />
              <span className="block px-1 text-[14.5px] font-semibold">{o.en}</span>
              <span className="block px-1 text-[12.5px] text-muted">{o.fr}</span>
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <Verdict ok={picked === ex.answer}>
          <p className="text-sm text-muted">Description : « {ex.audio} »</p>
          <Why>{ex.explain}</Why>
        </Verdict>
      )}
    </div>
  );
}
