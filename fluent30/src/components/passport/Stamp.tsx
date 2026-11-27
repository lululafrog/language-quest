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
  // Atlas countries (original simplified line drawings)
  candi: "M12 50h40M18 50V42h3V36h3V30h3V22l3-5v33M46 50V42h-3V36h-3V30h-3V22l-3-5v33M30 44l2-4 2 4M32 13m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0",
  karst: "M8 46q6 3 12 0t12 0t12 0t12 0M12 42q-2-14 5-20q6 6 4 20M24 42q-1-22 8-26q8 6 5 26M42 42q-2-12 5-16q6 5 4 16M28 52h10l-2 3h-6zM33 52v-6l4 4",
  torii: "M8 42l12-18 6 6 8-12 22 24M18 52V30M46 52V30M12 28q20-6 40 0M15 35h34M32 35v-6",
  canyon: "M6 50h52M6 50V34h8v-8h8v10M58 50V30h-8v-8h-8v14M28 50l3-14M36 50l-3-14M32 48v-2M32 42v-2",
  colosseum: "M10 48h44M10 48V26q22-8 44 0v22M10 35q22-6 44 0M14 48v-6a2 2 0 0 1 4 0v6M22 48v-7a2 2 0 0 1 4 0v7M30 48v-7a2 2 0 0 1 4 0v7M38 48v-7a2 2 0 0 1 4 0v7M46 48v-6a2 2 0 0 1 4 0v6M16 30v-2M24 28v-2M32 27v-2M40 28v-2M48 30v-2",
  fern: "M6 38l12-16 6 6 8-12 12 20M30 54q2-14 14-24M33 46l-6-2M35 42l-6-3M38 38l-5-3M41 34l-4-3M35 44l5-4M38 40l5-4M41 36l4-3",
  pyramids: "M8 50h48M12 50l14-24 14 24M30 50l12-18 12 18M19 38h14M47 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  table: "M6 46h52M8 46l8-14h6l4-6h18l4 6h4l8 14M18 24q4-4 8 0q4-4 8 0q4-4 8 0M10 52q6 3 12 0t12 0t12 0t12 0",
};

/** Very light palette colours (white, cream) can't be used as stamp ink. */
function isLight(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 200;
}

export function Stamp({ dest, locked, size = 96, className, tilt = 0 }: { dest: Destination; locked?: boolean; size?: number; className?: string; tilt?: number }) {
  const [a, , c] = dest.colors;
  const ink = locked ? "currentColor" : isLight(a) ? c : a;
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
