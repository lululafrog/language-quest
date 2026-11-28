"use client";
// Vocabulary garden: one plant per universe, growing with consolidated words. It never wilts or dies.
import { cx } from "@/components/ui";

export const HUE: Record<string, { main: string; soft: string; deep: string }> = {
  sea: { main: "#3f6f92", soft: "#dce6ed", deep: "#254a66" },
  ocean: { main: "#254a66", soft: "#dce6ed", deep: "#1b3a52" },
  sage: { main: "#688a58", soft: "#e1eadb", deep: "#415a37" },
  moss: { main: "#415a37", soft: "#e1eadb", deep: "#2f4228" },
  terracotta: { main: "#c6623b", soft: "#f8e1d6", deep: "#8a3f24" },
  rose: { main: "#e59e80", soft: "#f8e1d6", deep: "#c6623b" },
  sand: { main: "#c18e36", soft: "#f5ead0", deep: "#7a5822" },
  amber: { main: "#c18e36", soft: "#f5ead0", deep: "#7a5822" },
  plum: { main: "#7d5a7a", soft: "#efe4ec", deep: "#563d54" },
  slate: { main: "#5b6b78", soft: "#e4e8eb", deep: "#3d4a55" },
};

const LEAF = "#688a58";
const LEAF_DARK = "#415a37";
const LEAF_LIGHT = "#a4bd95";

export function Plant({ stage, hue = "sage", className, title }: { stage: number; hue?: string; className?: string; title?: string }) {
  const h = HUE[hue] ?? HUE.sage;
  return (
    <svg viewBox="0 0 80 90" className={cx("overflow-visible", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <g className={stage >= 2 ? "plant-sway" : undefined} style={{ transformOrigin: "40px 70px" }}>
        {stage === 1 && (
          <g>
            <ellipse cx="40" cy="66" rx="4" ry="2.6" fill="#7a5822" />
            <path d="M40 65 C40 60 41 58 43 57" stroke={LEAF} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <ellipse cx="44.5" cy="56.5" rx="2.6" ry="1.5" fill={LEAF_LIGHT} transform="rotate(-25 44.5 56.5)" />
          </g>
        )}
        {stage === 2 && (
          <g>
            <path d="M40 68 C40 58 40 52 40 46" stroke={LEAF} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M40 54 C33 53 29 48 30 44 C35 44 39 48 40 54Z" fill={LEAF} />
            <path d="M40 50 C47 49 51 44 50 40 C45 40 41 44 40 50Z" fill={LEAF_LIGHT} />
          </g>
        )}
        {stage === 3 && (
          <g>
            <path d="M40 68 C40 52 39 42 41 30" stroke={LEAF_DARK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M40 60 C31 60 25 54 26 48 C33 48 39 53 40 60Z" fill={LEAF} />
            <path d="M40 54 C49 54 55 48 54 42 C47 42 41 47 40 54Z" fill={LEAF_LIGHT} />
            <path d="M40 45 C32 44 28 38 29 33 C35 34 39 39 40 45Z" fill={LEAF_LIGHT} />
            <path d="M41 38 C48 37 52 31 51 26 C45 27 41 32 41 38Z" fill={LEAF} />
            <circle cx="41" cy="28" r="2.6" fill={h.main} />
          </g>
        )}
        {stage >= 4 && (
          <g>
            <path d="M38 68 C39 56 38 46 40 36 M40 48 C44 44 47 42 51 40 M40 52 C36 48 33 46 29 45" stroke="#7a5822" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="40" cy="28" r="17" fill={LEAF} />
            <circle cx="27" cy="36" r="10" fill={LEAF_LIGHT} />
            <circle cx="53" cy="35" r="11" fill={LEAF_DARK} opacity="0.85" />
            <circle cx="45" cy="20" r="9" fill={LEAF_LIGHT} opacity="0.9" />
            {stage >= 5 &&
              [
                [31, 24], [44, 15], [52, 29], [36, 36], [24, 33], [57, 38], [41, 27], [48, 40],
              ].map(([x, y], i) => (
                <g key={i} className="plant-bloom" style={{ animationDelay: `${i * 80}ms` }}>
                  <circle cx={x} cy={y} r="2.8" fill={h.soft} />
                  <circle cx={x} cy={y} r="1.3" fill={h.main} />
                </g>
              ))}
          </g>
        )}
      </g>
      {/* pot (always there: the garden is ready, it just waits for words) */}
      <path d="M24 68 H56 L52 86 H28 Z" fill={h.main} />
      <rect x="22" y="64" width="36" height="6" rx="2" fill={h.deep} />
      <ellipse cx="40" cy="65" rx="15" ry="2" fill="#5a4630" opacity="0.55" />
      {stage === 0 && <circle cx="40" cy="61" r="1.6" fill={h.soft} className="plant-twinkle" />}
    </svg>
  );
}
