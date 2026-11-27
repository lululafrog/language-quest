"use client";
// Negotiation with a virtual seller. Politeness and strategy move the price; a rude line can end the deal.
import { useEffect, useState } from "react";
import type { Mechanic } from "@/lib/atlas/types";
import { speak } from "@/lib/speech";
import { SpeakButton, cx } from "@/components/ui";
import { MechTitle, Verdict, useOnce, type OnDone } from "./shared";

type Turn = { seller: string; said?: string; mood?: "good" | "rude" | "weak"; why?: string };

export function Bargain({ ex, accent, onDone }: { ex: Extract<Mechanic, { type: "bargain" }>; accent?: string; onDone: OnDone }) {
  const [price, setPrice] = useState(ex.start);
  const [t, setT] = useState(0);
  const [log, setLog] = useState<Turn[]>([]);
  const [finished, setFinished] = useState(false);
  const done = useOnce(onDone);
  const turn = ex.turns[t];
  const span = Math.max(1, ex.start - ex.floor);
  const pct = (v: number) => Math.min(100, Math.max(0, ((ex.start - v) / span) * 100));
  const rude = log.filter((l) => l.mood === "rude").length;
  const good = log.filter((l) => l.mood === "good").length;

  const choose = (k: number) => {
    const o = turn.options[k];
    const next = Math.max(ex.floor, Math.min(ex.start * 1.2, price + o.delta));
    setPrice(Math.round(next));
    const entry: Turn = { seller: turn.seller, said: o.en, mood: o.mood, why: o.why };
    const newLog = [...log, entry];
    setLog(newLog);
    speak(o.en, { accent });
    if (t + 1 >= ex.turns.length) {
      setFinished(true);
      const rudeN = newLog.filter((l) => l.mood === "rude").length;
      const goodN = newLog.filter((l) => l.mood === "good").length;
      // communication first: no rude line and mostly good moves
      done({ correct: rudeN === 0 && goodN >= Math.ceil(ex.turns.length / 2) });
    } else setT(t + 1);
  };

  const deal = finished && rude === 0;
  const fmt = (v: number) => `${v.toLocaleString("fr-FR")} ${ex.currency}`;

  return (
    <div className="space-y-4">
      <MechTitle title={ex.title} brief={ex.brief} />
      <div className="rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted">{ex.item}</span>
          <span className="font-display text-xl font-semibold tabular-nums">{fmt(price)}</span>
        </div>
        <div className="relative mt-2 h-2 rounded-full bg-surface-2" aria-hidden>
          <div className="absolute inset-y-0 left-0 rounded-full bg-sun-500 transition-all" style={{ width: `${pct(price)}%` }} />
          <div className="absolute -top-1 h-4 w-0.5 bg-mint-600" style={{ left: `${pct(ex.target)}%` }} title="Bon compromis" />
        </div>
        <div className="mt-1 flex justify-between text-[11.5px] text-muted">
          <span>Départ {fmt(ex.start)}</span>
          <span>Bon compromis ≈ {fmt(ex.target)}</span>
        </div>
      </div>
      <div className="space-y-2">
        {log.map((l, i) => (
          <div key={i} className="space-y-1.5">
            <Bubble who="seller" text={l.seller} accent={accent} />
            <Bubble who="me" text={l.said ?? ""} accent={accent} />
            <p className={cx("text-[13px]", l.mood === "good" ? "text-mint-600 dark:text-mint-400" : l.mood === "rude" ? "text-coral-600 dark:text-coral-400" : "text-muted")}>
              {l.mood === "good" ? "Bonne stratégie — " : l.mood === "rude" ? "Maladroit — " : "Trop timide — "}
              {l.why}
            </p>
          </div>
        ))}
        {!finished && turn && (
          <>
            <Bubble who="seller" text={turn.seller} accent={accent} autoPlay />
            <p className="pt-1 text-sm font-semibold text-muted">Ta réponse :</p>
            <div className="grid gap-2">
              {turn.options.map((o, k) => (
                <button key={k} type="button" onClick={() => choose(k)} className="rounded-2xl border border-line bg-surface px-4 py-3 text-left text-[15px] font-medium transition hover:border-ink-300">
                  {o.en}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {finished && (
        <Verdict ok={rude === 0 && good >= Math.ceil(ex.turns.length / 2)} title={deal ? `Marché conclu à ${fmt(price)}` : "Pas d'accord cette fois"}>
          <p>
            {rude > 0
              ? "Une phrase trop brusque a refroidi ton interlocuteur : en négociation, la politesse compte plus que le résultat."
              : price <= ex.target
                ? "Bon compromis obtenu tout en restant aimable : c'est exactement l'objectif."
                : "Tu es resté(e) poli(e) ; avec une contre-proposition plus claire, tu aurais pu obtenir davantage."}
          </p>
        </Verdict>
      )}
    </div>
  );
}

function Bubble({ who, text, accent, autoPlay }: { who: "seller" | "me"; text: string; accent?: string; autoPlay?: boolean }) {
  useEffect(() => {
    if (autoPlay) speak(text, { accent });
  }, [autoPlay, text, accent]);
  const me = who === "me";
  return (
    <div className={cx("flex", me ? "justify-end" : "justify-start")}>
      <div className={cx("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px]", me ? "rounded-br-md bg-ink-600 text-white" : "rounded-bl-md bg-surface-2")}>
        <span className="inline-flex items-start gap-1">
          {text}
          {!me && <SpeakButton text={text} accent={accent} size={14} className="-my-1 p-1" />}
        </span>
      </div>
    </div>
  );
}
