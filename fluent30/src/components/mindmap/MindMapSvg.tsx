"use client";
// Radial SVG map: centre "Mon anglais", one branch per category.
// Node size = number of words; fill intensity = weighted mastery; small leaves = mastered words.
import { useState } from "react";
import type { Branch } from "@/lib/mindmap";
import { cx } from "@/components/ui";

const W = 360;
const C = W / 2;

export function MindMapSvg({ branches, onSelect, selected, reduceMotion }: { branches: Branch[]; onSelect: (id: string) => void; selected?: string | null; reduceMotion?: boolean }) {
  const [hover, setHover] = useState<string | null>(null);
  const n = branches.length;
  const max = Math.max(1, ...branches.map((b) => b.counts.total));
  const R = 124;
  return (
    <svg viewBox={`0 0 ${W} ${W}`} className="mx-auto block h-auto w-full max-w-[460px] select-none" role="img" aria-label="Carte mentale de ton vocabulaire">
      <defs>
        <radialGradient id="mm-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-mint-500)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--color-mint-500)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={C - 4} fill="url(#mm-glow)" />
      <circle cx={C} cy={C} r={R} fill="none" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="2 5" />
      {branches.map((b, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = C + Math.cos(a) * R;
        const y = C + Math.sin(a) * R;
        const r = 11 + 15 * Math.sqrt(b.counts.total / max);
        const active = selected === b.cat.id || hover === b.cat.id;
        const empty = b.counts.total === 0;
        const leaves = Math.min(7, b.counts.employe + b.counts.reconnu);
        // label placed outside the node, away from the centre
        const lx = C + Math.cos(a) * (R + r + 12);
        const ly = C + Math.sin(a) * (R + r + 12);
        const anchor = Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        // curved branch from the centre
        const mx = C + Math.cos(a + 0.25) * R * 0.5;
        const my = C + Math.sin(a + 0.25) * R * 0.5;
        return (
          <g
            key={b.cat.id}
            role="button"
            tabIndex={0}
            aria-label={`${b.cat.label} : ${b.counts.total} mots, ${b.counts.employe} maîtrisés`}
            onClick={() => onSelect(b.cat.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(b.cat.id)}
            onMouseEnter={() => setHover(b.cat.id)}
            onMouseLeave={() => setHover(null)}
            className="cursor-pointer outline-none"
          >
            <path
              d={`M ${C} ${C} Q ${mx} ${my} ${x} ${y}`}
              fill="none"
              stroke={empty ? "currentColor" : "var(--color-mint-500)"}
              strokeOpacity={empty ? 0.1 : 0.25 + 0.55 * b.strength}
              strokeWidth={empty ? 1 : 1.5 + 3 * Math.sqrt(b.counts.total / max)}
              strokeLinecap="round"
            />
            {Array.from({ length: leaves }, (_, k) => {
              const la = a + ((k - (leaves - 1) / 2) * 0.32) / Math.max(1, r / 14);
              const lr = r + 6;
              return <circle key={k} cx={x + Math.cos(la) * lr} cy={y + Math.sin(la) * lr} r={2.3} fill={k < b.counts.employe ? "var(--color-mint-600)" : "var(--color-mint-400)"} opacity={0.85} />;
            })}
            <circle
              cx={x}
              cy={y}
              r={r + (active ? 3 : 0)}
              fill={empty ? "var(--color-surface)" : "var(--color-mint-500)"}
              fillOpacity={empty ? 1 : 0.18 + 0.72 * b.strength}
              stroke={active ? "var(--color-ink-500)" : empty ? "currentColor" : "var(--color-mint-600)"}
              strokeOpacity={empty ? 0.18 : 0.9}
              strokeWidth={active ? 2.5 : 1.3}
              strokeDasharray={empty ? "3 3" : undefined}
              className={cx(!reduceMotion && "transition-all duration-200")}
            />
            <text x={x} y={y + 4} textAnchor="middle" className={cx("text-[11px] font-semibold tabular-nums", empty ? "fill-current opacity-40" : b.strength > 0.55 ? "fill-white" : "fill-current")}>
              {b.counts.total}
            </text>
            <text x={lx} y={ly + 3.5} textAnchor={anchor} className={cx("fill-current text-[10.5px] font-medium", empty && "opacity-45")}>
              {b.cat.short}
            </text>
          </g>
        );
      })}
      <circle cx={C} cy={C} r={34} fill="var(--color-ink-600)" />
      <text x={C} y={C - 2} textAnchor="middle" className="fill-white text-[10.5px] font-semibold">
        Mon anglais
      </text>
      <text x={C} y={C + 12} textAnchor="middle" className="fill-white/75 text-[9.5px]">
        tes mots
      </text>
    </svg>
  );
}
