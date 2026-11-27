"use client";
// Mystery: question the characters, collect clues in a notebook, then choose the solution.
import { useState } from "react";
import type { Mechanic } from "@/lib/atlas/types";
import { speak } from "@/lib/speech";
import { cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import { MechTitle, Verdict, Why, useOnce, type OnDone } from "./shared";

export function Investigate({ ex, accent, onDone }: { ex: Extract<Mechanic, { type: "investigate" }>; accent?: string; onDone: OnDone }) {
  const [who, setWho] = useState<number | null>(null);
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<number | null>(null);
  const [accusing, setAccusing] = useState(false);
  const done = useOnce(onDone);
  const clues = ex.suspects.flatMap((s, si) => s.questions.map((q, qi) => ({ key: `${si}:${qi}`, s, q }))).filter((x) => asked.has(x.key) && x.q.clue);
  const chosen = picked !== null ? ex.options[picked] : null;

  return (
    <div className="space-y-4">
      <MechTitle title={ex.title} brief={ex.brief} />
      <div className="grid grid-cols-2 gap-2">
        {ex.suspects.map((s, i) => (
          <button
            key={s.name}
            type="button"
            onClick={() => setWho(i)}
            className={cx("rounded-2xl border p-3 text-left transition", who === i ? "border-ink-500 bg-ink-50 dark:bg-ink-900/50" : "border-line bg-surface hover:border-ink-300")}
          >
            <span className="block font-semibold">{s.name}</span>
            <span className="block text-[13px] text-muted">{s.role}</span>
          </button>
        ))}
      </div>
      {who !== null && !accusing && (
        <div className="space-y-2 rounded-2xl border border-line p-3">
          <p className="text-[13px] font-semibold text-muted">Interroger {ex.suspects[who].name}</p>
          {ex.suspects[who].questions.map((q, qi) => {
            const key = `${who}:${qi}`;
            const open = asked.has(key);
            return (
              <div key={key} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setAsked((a) => new Set(a).add(key));
                    speak(q.a, { accent });
                  }}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-left text-[15px] font-medium transition hover:border-ink-300"
                >
                  {q.q}
                </button>
                {open && <p className="rounded-xl bg-surface-2 px-3 py-2 text-[15px]">« {q.a} »</p>}
              </div>
            );
          })}
        </div>
      )}
      <div className="rounded-2xl bg-sun-100/50 p-3 dark:bg-sun-500/10">
        <p className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-muted">
          <Icon name="pen" size={15} /> Carnet d&apos;indices ({clues.length})
        </p>
        {clues.length ? (
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[14.5px]">
            {clues.map((c) => <li key={c.key}>{c.q.clue}</li>)}
          </ul>
        ) : (
          <p className="mt-1 text-[14px] text-muted">Pose des questions pour récolter des indices.</p>
        )}
      </div>
      {!accusing ? (
        <button type="button" disabled={!clues.length} onClick={() => setAccusing(true)} className="w-full rounded-2xl bg-ink-600 px-4 py-3 font-semibold text-white transition hover:bg-ink-700 disabled:opacity-50">
          J&apos;ai résolu l&apos;énigme
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-[16px] font-semibold">{ex.question}</p>
          {ex.options.map((o, i) => (
            <button
              key={i}
              type="button"
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                done({ correct: o.correct });
              }}
              className={cx(
                "w-full rounded-2xl border px-4 py-3 text-left text-[15px] font-medium",
                picked === null ? "border-line bg-surface hover:border-ink-300" : o.correct ? "border-mint-500 bg-mint-500/10" : i === picked ? "border-coral-500 bg-coral-500/10" : "border-line opacity-50",
              )}
            >
              {o.en}
            </button>
          ))}
          {picked === null && (
            <button type="button" onClick={() => setAccusing(false)} className="text-sm text-muted hover:underline">
              Continuer l&apos;enquête
            </button>
          )}
        </div>
      )}
      {chosen && (
        <Verdict ok={chosen.correct} title={chosen.correct ? "Affaire résolue" : "Ce n'est pas la bonne piste"}>
          <Why>{chosen.why}</Why>
          {!chosen.correct && <p className="text-[14px]">La solution : <strong>{ex.options.find((o) => o.correct)?.en}</strong></p>}
        </Verdict>
      )}
    </div>
  );
}
