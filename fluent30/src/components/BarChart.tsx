"use client";
import { useState } from "react";

/** Single-series bar chart (one hue, rounded data-ends, hover tooltip, table fallback for screen readers). */
export function BarChart({ data, unit = "", height = 140, goal }: { data: { label: string; value: number; title?: string }[]; unit?: string; height?: number; goal?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, goal ?? 0, ...data.map((d) => d.value));
  return (
    <div className="relative">
      <div className="relative flex items-end gap-[2px]" style={{ height }} onMouseLeave={() => setHover(null)}>
        {goal !== undefined && <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted/50" style={{ bottom: `${(goal / max) * 100}%` }} />}
        {data.map((d, i) => (
          <div key={i} className="flex h-full flex-1 cursor-default items-end" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
            <div className="w-full rounded-t-[4px] transition-colors" style={{ height: `${d.value > 0 ? Math.max(2, (d.value / max) * 100) : 0}%`, background: hover === i ? "var(--color-ink-700)" : "var(--color-ink-500)" }} />
          </div>
        ))}
        {hover !== null && data[hover] && (
          <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-ink-950 px-2 py-1 text-xs whitespace-nowrap text-white shadow" style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}>
            {data[hover].title ?? data[hover].label}: <b>{data[hover].value}{unit}</b>
          </div>
        )}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
      <table className="sr-only">
        <tbody>{data.map((d, i) => <tr key={i}><td>{d.title ?? d.label}</td><td>{d.value}{unit}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
