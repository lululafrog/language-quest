// Passport stamp: round ink stamp with a landmark motif, tinted by the destination palette.
import type { Destination, Landmark } from "@/lib/data/destinations";
import { cx } from "@/components/ui";

// Simple line drawings on a 64×64 grid (centre ≈ 32,34).
const MOTIFS: Record<Landmark, string> = {
  clock: "M26 50V24l6-8 6 8v26M26 30h12M32 27a3 3 0 1 0 0.01 0M22 50h20M29 50v-8h6v8",
  bridge: "M12 44h40M20 44V22M44 44V22M20 22q12 18 24 0M20 26l-8 18M44 26l8 18M26 44v-8M32 44v-6M38 44v-8",
  statue: "M30 50V36h4v14M27 36h10M30 36l-1-12 6-2 1 14M34 22l2-8M35 14l-3-1 4-3 1 4M24 50h16",
  castle: "M16 50V30h6v-4h4v4h4v-6h4v6h4v-4h4v4h6v20zM29 50v-8a3 3 0 0 1 6 0v8M20 36h4M40 36h4",
  opera: "M10 46h44M14 46q4-16 12-18q-2 10 2 18M24 46q4-18 12-20q-2 12 2 20M34 46q4-14 12-16q-2 10 0 16",
  mountain: "M8 48l16-22 8 10 8-14 16 26zM20 32l4 4 4-4M36 28l4 4 4-4",
  lighthouse: "M28 50l2-26h4l2 26M27 24h10M29 24v-5h6v5M32 19v-3M24 32l-8-3M40 32l8-3M22 50h20M30 38h4",
  palm: "M32 50q-2-14 1-26M33 24q-8-6-16-2M33 24q8-6 16-2M33 24q-4-8-12-8M33 24q4-8 12-8M33 24q0-8 2-12M20 50h26",
  skyline: "M10 50h44M14 50V34h6v16M22 50V22h6v28M30 50V28h6v22M38 50V18h6v32M46 50V36h4v14M41 18v-4",
  temple: "M14 50h36M16 46h32M18 46V30M24 46V30M30 46V30M36 46V30M42 46V30M48 46V30M14 30h36L32 18z",
  arch: "M14 50V24h36v26M22 50V36a10 10 0 0 1 20 0v14M14 24l18-8 18 8M18 30h4M42 30h4",
  wheel: "M32 32m-14 0a14 14 0 1 0 28 0a14 14 0 1 0-28 0M32 18v28M18 32h28M22 22l20 20M42 22L22 42M26 50l6-4 6 4M22 50h20",
  dome: "M16 50h32M18 50V36h28v14M20 36q0-14 12-14t12 14M32 22v-6M30 16h4M24 50v-8M32 50v-8M40 50v-8",
  harbour: "M10 44q6 4 11 0t11 0t11 0t11 0M18 40h28l-4-8H22zM32 32V16l10 12H32M10 50q6 4 11 0t11 0t11 0t11 0",
  maple: "M32 50V38M32 38l-10 4 2-6-8-4 4-2-2-8 7 3 2-5 5 6V14l0 0M32 38l10 4-2-6 8-4-4-2 2-8-7 3-2-5-5 6",
  tower: "M32 14l-8 36M32 14l8 36M26 36h12M28 26h8M22 50h20",
};

export function Stamp({ dest, locked, size = 96, className, tilt = 0 }: { dest: Destination; locked?: boolean; size?: number; className?: string; tilt?: number }) {
  const [a, , c] = dest.colors;
  const ink = locked ? "currentColor" : a === "#FFFFFF" ? c : a;
  const id = `arc-${dest.id}`;
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} className={cx(locked && "text-line", className)} style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }} role="img" aria-label={dest.nameFr}>
      <defs>
        <path id={id} d="M48 48m-34 0a34 34 0 1 1 68 0a34 34 0 1 1-68 0" />
      </defs>
      <g fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round" opacity={locked ? 0.7 : 0.92}>
        <circle cx="48" cy="48" r="44" strokeWidth="2.5" strokeDasharray={locked ? "4 5" : undefined} />
        <circle cx="48" cy="48" r="39" strokeWidth="1" />
        <circle cx="48" cy="48" r="27" strokeWidth="1" />
        <g transform="translate(25 22) scale(0.72)" strokeWidth="2.6">
          <path d={MOTIFS[dest.landmark]} />
        </g>
      </g>
      {!locked && (
        <g>
          <rect x="30" y="70" width="12" height="3" fill={dest.colors[0]} />
          <rect x="42" y="70" width="12" height="3" fill={dest.colors[1] === "#FFFFFF" ? "#E8E4DA" : dest.colors[1]} />
          <rect x="54" y="70" width="12" height="3" fill={dest.colors[2]} />
        </g>
      )}
      <text fill={ink} fontSize="8.5" fontWeight="700" letterSpacing="1.6" opacity={locked ? 0.7 : 0.95} style={{ textTransform: "uppercase" }}>
        <textPath href={`#${id}`} startOffset="25%" textAnchor="middle">
          {dest.nameEn.toUpperCase()}
        </textPath>
      </text>
    </svg>
  );
}
