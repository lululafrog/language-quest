"use client";
// Put steps / events in the right order (pasta workshop, lantern, archaeologist's timeline).
import { useMemo, useState } from "react";
import type { Mechanic } from "@/lib/atlas/types";
import { scoreSteps } from "@/lib/atlas/select";
import { shuffle } from "@/lib/text";
import { Button, cx } from "@/components/ui";
import { MechTitle, Verdict, Why, useOnce, type OnDone } from "./shared";

export function Steps({ ex, onDone }: { ex: Extract<Mechanic, { type: "steps" }>; onDone: OnDone }) {
  const pool = useMemo(() => {
    let s = shuffle(ex.steps.map((t, i) => ({ t, i })));
    if (s.length > 2 && s.every((x, k) => x.i === k)) s = [...s.slice(1), s[0]];
    return s;
  }, [ex]);
  const [order, setOrder] = useState<number[]>([]); // indexes into pool
  const [res, setRes] = useState<ReturnType<typeof scoreSteps> | null>(null);
  const done = useOnce(onDone);
  const remaining = pool.map((_, k) => k).filter((k) => !order.includes(k));
  return (
    <div className="space-y-4">
      <MechTitle title={ex.title} brief={ex.brief} />
      <ol className="space-y-2">
        {order.map((k, pos) => {
          const right = res ? pool[k].i === pos : null;
          return (
            <li key={k}>
              <button
                type="button"
                disabled={!!res}
                onClick={() => setOrder((o) => o.filter((x) => x !== k))}
                className={cx(
                  "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-[15px]",
                  right === null ? "border-ink-300 bg-ink-50 dark:bg-ink-900/50" : right ? "border-mint-500 bg-mint-500/10" : "border-coral-500 bg-coral-500/10",
                )}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-600 text-[12px] font-bold text-white">{pos + 1}</span>
                <span>
                  {pool[k].t}
                  {ex.fr?.[pool[k].i] && <span className="block text-[12.5px] text-muted">{ex.fr[pool[k].i]}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {remaining.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-dashed border-line p-2">
          <p className="px-1 text-[13px] text-muted">Touche l&apos;étape suivante :</p>
          {remaining.map((k) => (
            <button key={k} type="button" onClick={() => setOrder((o) => [...o, k])} className="block w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-left text-[15px] transition hover:border-ink-300">
              {pool[k].t}
            </button>
          ))}
        </div>
      )}
      {!res && (
        <Button
          className="w-full"
          disabled={remaining.length > 0}
          onClick={() => {
            const r = scoreSteps(order.map((k) => pool[k].i));
            setRes(r);
            done({ correct: r.ok });
          }}
        >
          Vérifier l&apos;ordre
        </Button>
      )}
      {res && (
        <Verdict ok={res.ok} title={res.ok ? "Tout est dans l'ordre" : `${res.right}/${res.total} étapes à la bonne place`}>
          {!res.ok && (
            <ol className="list-decimal space-y-0.5 pl-5 text-[14.5px]">
              {ex.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          )}
          <Why>{ex.explain}</Why>
        </Verdict>
      )}
    </div>
  );
}
