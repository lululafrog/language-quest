"use client";
import { useState } from "react";
import type { TimelineColor, TimelineSpec } from "@/lib/data/grammar";
import { SpeakButton, cx } from "@/components/ui";

const COLORS: Record<TimelineColor, string> = { ink: "#6a55f2", coral: "#ff7a6b", mint: "#2fbf9a", sun: "#f5b83d" };

const W = 340;
const PAD = 22;
const AXIS_Y = 132;
const x = (at: number) => PAD + ((Math.max(-1, Math.min(1, at)) + 1) / 2) * (W - PAD * 2);

/** Interactive tense timeline: past — now — future. Tap a mark to see and hear its example. */
export function Timeline({ spec, labels }: { spec: TimelineSpec; labels?: { past: string; now: string; future: string } }) {
  const [sel, setSel] = useState(0);
  const lbl = labels ?? { past: "passé", now: "maintenant", future: "futur" };
  const lanes = spec.marks.length;
  const laneY = (i: number) => AXIS_Y - 24 - (lanes - 1 - i) * 34;
  const height = AXIS_Y + 30;
  const current = spec.marks[sel];

  return (
    <div className="rounded-2xl border border-line bg-surface-2/50 p-3">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full select-none" role="img" aria-label={spec.caption}>
        <defs>
          <marker id="tl-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="var(--muted)" />
          </marker>
        </defs>
        {/* axis */}
        <line x1={PAD - 8} y1={AXIS_Y} x2={W - PAD + 10} y2={AXIS_Y} stroke="var(--muted)" strokeWidth={2} markerEnd="url(#tl-arrow)" />
        <line x1={x(0)} y1={16} x2={x(0)} y2={AXIS_Y + 6} stroke="#ff7a6b" strokeWidth={2} strokeDasharray="4 4" />
        <text x={x(-0.75)} y={AXIS_Y + 22} textAnchor="middle" fontSize="11" fill="var(--muted)">{lbl.past}</text>
        <text x={x(0)} y={AXIS_Y + 22} textAnchor="middle" fontSize="11" fontWeight="600" fill="#ff7a6b">{lbl.now}</text>
        <text x={x(0.75)} y={AXIS_Y + 22} textAnchor="middle" fontSize="11" fill="var(--muted)">{lbl.future}</text>

        {spec.marks.map((m, i) => {
          const c = COLORS[m.color ?? "ink"];
          const y = laneY(i);
          const active = i === sel;
          const style = { animationDelay: `${i * 140}ms`, transformOrigin: "center", transformBox: "fill-box" as const };
          let shape;
          let cx0: number;
          if (m.kind === "point") {
            cx0 = x(m.at);
            shape = (
              <>
                <line x1={cx0} y1={y + 9} x2={cx0} y2={AXIS_Y} stroke={c} strokeWidth={1.5} strokeDasharray="2 3" opacity={0.6} />
                <circle cx={cx0} cy={y} r={active ? 9 : 7.5} fill={m.dashed ? "var(--surface)" : c} stroke={c} strokeWidth={2.5} strokeDasharray={m.dashed ? "3 2.5" : undefined} />
              </>
            );
          } else if (m.kind === "range") {
            const x1 = x(m.from);
            const x2 = x(m.to);
            cx0 = (x1 + x2) / 2;
            shape = (
              <>
                <rect x={x1} y={y - 7} width={Math.max(6, x2 - x1)} height={14} rx={7} fill={m.dashed ? "none" : c} fillOpacity={active ? 0.95 : 0.75} stroke={c} strokeWidth={2} strokeDasharray={m.dashed ? "5 3" : undefined} />
                <line x1={x1} y1={y + 7} x2={x1} y2={AXIS_Y} stroke={c} strokeWidth={1} strokeDasharray="2 3" opacity={0.5} />
                <line x1={x2} y1={y + 7} x2={x2} y2={AXIS_Y} stroke={c} strokeWidth={1} strokeDasharray="2 3" opacity={0.5} />
              </>
            );
          } else {
            const n = 6;
            const x1 = x(m.from);
            const x2 = x(m.to);
            cx0 = (x1 + x2) / 2;
            shape = (
              <>
                <line x1={x1} y1={y} x2={x2} y2={y} stroke={c} strokeWidth={1.5} opacity={0.35} />
                {Array.from({ length: n }, (_, k) => {
                  const px = x1 + ((x2 - x1) * k) / (n - 1);
                  return <path key={k} d={`M${px - 5} ${y - 5}L${px + 5} ${y + 5}M${px + 5} ${y - 5}L${px - 5} ${y + 5}`} stroke={c} strokeWidth={active ? 3 : 2.5} strokeLinecap="round" />;
                })}
              </>
            );
          }
          return (
            <g key={i} className="animate-pop cursor-pointer" style={style} onClick={() => setSel(i)} role="button" aria-label={m.label} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSel(i)}>
              <rect x={0} y={y - 20} width={W} height={34} fill="transparent" />
              {shape}
              <text x={Math.min(W - 60, Math.max(60, cx0))} y={y - 13} textAnchor="middle" fontSize="11.5" fontWeight={active ? 700 : 500} fill={active ? c : "var(--fg)"}>
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-center text-xs text-muted">{spec.caption}</p>
      {current && (
        <div key={sel} className="mt-3 flex animate-fade items-center gap-2 rounded-xl bg-surface px-3 py-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[current.color ?? "ink"] }} />
          <p className="flex-1 text-[15px] font-medium">{current.example}</p>
          <SpeakButton text={current.example} />
        </div>
      )}
      {spec.marks.length > 1 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {spec.marks.map((m, i) => (
            <button key={i} onClick={() => setSel(i)} className={cx("rounded-full px-2.5 py-1 text-xs transition", i === sel ? "bg-ink-600 text-white" : "bg-surface text-muted hover:text-fg")}>
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
