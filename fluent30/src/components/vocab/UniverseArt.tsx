// Original flat "carnet de voyage" illustrations for the vocabulary universes.
// Simple SVG primitives only, a shared restrained palette, no text in the drawings.
import type { JSX, ReactNode } from "react";

export type UniverseId =
  | "travel"
  | "daily"
  | "love"
  | "friends"
  | "emotions"
  | "food"
  | "sport"
  | "health"
  | "nature"
  | "work"
  | "money"
  | "shopping"
  | "culture"
  | "tech"
  | "transport"
  | "home"
  | "debate"
  | "humour"
  | "admin"
  | "emergency";

const C = {
  cream: "#f6efe2",
  sand1: "#f5ead0",
  sand2: "#e2c27c",
  sand3: "#c18e36",
  sage1: "#e1eadb",
  sage2: "#a4bd95",
  sage3: "#688a58",
  sage4: "#415a37",
  blue1: "#dce6ed",
  blue2: "#8fb0c6",
  blue3: "#3f6f92",
  blue4: "#254a66",
  terra1: "#f8e1d6",
  terra2: "#e59e80",
  terra3: "#c6623b",
  terra4: "#8a3f24",
  ink: "#23201b",
  white: "#ffffff",
} as const;

/** Thin ink outline props, used sparingly. */
const ink = (w = 1.3, o = 0.85) => ({
  stroke: C.ink,
  strokeWidth: w,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeOpacity: o,
});

const bg = (fill: string) => <rect width="160" height="100" fill={fill} />;

const skyGrad = (id: string, top: string, bottom: string) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={top} />
      <stop offset="1" stopColor={bottom} />
    </linearGradient>
  </defs>
);

/* ------------------------------------------------------------------ travel */
function Travel() {
  return (
    <>
      {skyGrad("ua-travel-sky", C.blue1, C.cream)}
      <rect width="160" height="100" fill="url(#ua-travel-sky)" />
      <circle cx="34" cy="26" r="10" fill={C.sand2} opacity="0.8" />
      <path d="M0 70L20 52l12 9 22-24 20 25 16-13 22 18 20-20 28 22V100H0z" fill={C.blue2} opacity="0.55" />
      <path d="M46 43l8-6 7 9-4-2-4 3zM110 47l10-10 7 7-4-1-4 3z" fill={C.white} opacity="0.85" />
      <path d="M0 76q40-9 80-3t80-4V100H0z" fill={C.sage1} />
      <path d="M0 86q50-6 100 0t60-2V100H0z" fill={C.sage2} opacity="0.55" />
      {/* plane trail */}
      <path d="M52 44q30-10 54-20t28-10" fill="none" stroke={C.white} strokeWidth="1.6" strokeDasharray="2 3" strokeLinecap="round" />
      <g transform="rotate(-18 140 12)" fill={C.blue4}>
        <path d="M132 12q0-1.6 2-1.6h12q3 0 3 1.6t-3 1.6h-12q-2 0-2-1.6z" />
        <path d="M139 11l-4-6h2.4l5.6 6zM139 13l-4 6h2.4l5.6-6zM133 11.6l-1.6-3.6h1.6l2.4 3.6z" />
      </g>
      {/* suitcase */}
      <ellipse cx="80" cy="89" rx="26" ry="3" fill={C.sage4} opacity="0.2" />
      <path d="M72 56v-6q0-3 3-3h10q3 0 3 3v6" fill="none" {...ink(1.4)} />
      <rect x="58" y="56" width="44" height="31" rx="4" fill={C.terra3} {...ink(1.3)} />
      <rect x="58" y="56" width="44" height="6" rx="3" fill={C.terra4} opacity="0.35" />
      <path d="M70 57v29M90 57v29" stroke={C.terra2} strokeWidth="3" />
      <rect x="93" y="64" width="8" height="11" rx="1.5" fill={C.cream} transform="rotate(8 97 69)" />
      <circle cx="97" cy="66" r="0.9" fill={C.terra4} transform="rotate(8 97 69)" />
      <circle cx="64" cy="88" r="2" fill={C.ink} opacity="0.75" />
      <circle cx="96" cy="88" r="2" fill={C.ink} opacity="0.75" />
    </>
  );
}

/* ------------------------------------------------------------------- daily */
function Daily() {
  return (
    <>
      {bg(C.sand1)}
      {/* window */}
      <rect x="16" y="12" width="60" height="56" rx="2" fill={C.cream} {...ink(1.3)} />
      <rect x="20" y="16" width="52" height="48" fill={C.blue1} />
      <circle cx="52" cy="40" r="11" fill={C.sand2} opacity="0.9" />
      <path d="M20 54q14-6 26-2t26-3v15H20z" fill={C.sage2} opacity="0.8" />
      <path d="M20 58q16-4 30 0t22-1v7H20z" fill={C.sage3} opacity="0.7" />
      <path d="M46 16v48M20 40h52" stroke={C.cream} strokeWidth="2.6" />
      <rect x="12" y="66" width="68" height="4" rx="1" fill={C.sand3} opacity="0.85" />
      {/* table */}
      <path d="M0 78h160V100H0z" fill={C.sand2} />
      <path d="M0 78h160" {...ink(1.2, 0.5)} />
      <path d="M8 88h40M70 92h50" stroke={C.sand3} strokeWidth="1" opacity="0.5" strokeLinecap="round" />
      {/* mug */}
      <ellipse cx="100" cy="78" rx="13" ry="2" fill={C.ink} opacity="0.12" />
      <path d="M110 64q8 0 8 6t-8 6" fill="none" stroke={C.blue3} strokeWidth="2.6" />
      <path d="M90 58h20v16q0 4-4 4H94q-4 0-4-4z" fill={C.blue3} {...ink(1.2)} />
      <path d="M90 63h20" stroke={C.blue2} strokeWidth="1.6" />
      <path d="M96 54q-3-4 0-7t0-7M103 54q-3-4 0-7t0-7" fill="none" stroke={C.white} strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      {/* plant */}
      <path d="M137 56q-14-6-12-24 10 8 12 24z" fill={C.sage3} />
      <path d="M137 56q12-8 14-22-12 6-14 22z" fill={C.sage2} />
      <path d="M137 56q-2-16 4-28 4 14-4 28z" fill={C.sage4} />
      <path d="M128 58h18l-3 20h-12z" fill={C.terra3} {...ink(1.2)} />
      <path d="M128 62h18" stroke={C.terra4} strokeWidth="1.2" opacity="0.5" />
    </>
  );
}

/* -------------------------------------------------------------------- love */
function Love() {
  return (
    <>
      {skyGrad("ua-love-sky", C.terra1, C.sand1)}
      <rect width="160" height="100" fill="url(#ua-love-sky)" />
      <circle cx="34" cy="70" r="16" fill={C.terra2} opacity="0.45" />
      <ellipse cx="124" cy="20" rx="16" ry="3.5" fill={C.white} opacity="0.7" />
      <ellipse cx="30" cy="30" rx="12" ry="3" fill={C.white} opacity="0.6" />
      <path d="M0 74q30-16 64-8t56-6 40 2V100H0z" fill={C.sage2} />
      <path d="M0 84q40-10 84-2t76-4V100H0z" fill={C.sage3} />
      <path d="M20 84v-8M20 76q-3 2-3 5M20 76q3 2 3 5M132 80v-7" stroke={C.sage4} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M128 79l4-12 4 12z" fill={C.sage4} />
      {/* heart balloon */}
      <path d="M80 60C62 47 60 22 72 19c4-1 7 1 8 5 1-4 4-6 8-5 12 3 10 28-8 41z" fill={C.terra3} {...ink(1.3)} />
      <path d="M80 24c-3 10-3 24 0 36 3-12 3-26 0-36z" fill={C.terra2} opacity="0.7" />
      <path d="M70 24q-6 8-2 18" fill="none" stroke={C.white} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
      <path d="M76 58l1 7M84 58l-1 7" {...ink(1)} />
      <rect x="75.5" y="65" width="9" height="6" rx="1" fill={C.terra4} {...ink(1.1)} />
      {/* distant balloon */}
      <circle cx="122" cy="44" r="5" fill={C.sand2} />
      <path d="M118 46q4 6 8 0" fill={C.sand3} opacity="0.6" />
      <rect x="121" y="51" width="2.4" height="2" fill={C.terra4} />
      <path d="M40 46q2-2 4 0q2-2 4 0" fill="none" {...ink(1, 0.5)} />
    </>
  );
}

/* ----------------------------------------------------------------- friends */
function Friends() {
  const bulbs = [14, 30, 46, 62, 78, 94, 110, 126, 142];
  const y = (x: number) => 14 + 12 * Math.sin((Math.PI * x) / 160);
  return (
    <>
      {skyGrad("ua-friends-sky", C.blue3, C.blue2)}
      <rect width="160" height="100" fill="url(#ua-friends-sky)" />
      <circle cx="132" cy="40" r="6" fill={C.cream} opacity="0.85" />
      <path d="M0 60q40-8 80-4t80-2V100H0z" fill={C.sage3} />
      <path d="M0 66q50-6 100 0t60 0V100H0z" fill={C.sage2} />
      {/* tree */}
      <path d="M14 66V40" stroke={C.sage4} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="14" cy="34" rx="12" ry="16" fill={C.sage4} />
      {/* lights */}
      <path d="M0 12Q80 40 160 12" fill="none" {...ink(1, 0.7)} />
      {bulbs.map((x) => (
        <g key={x}>
          <circle cx={x} cy={y(x) + 2} r="4" fill={C.sand2} opacity="0.3" />
          <circle cx={x} cy={y(x) + 2} r="1.6" fill={C.sand1} />
        </g>
      ))}
      {/* blanket */}
      <path d="M34 92l20-22h70l14 22z" fill={C.terra1} {...ink(1.2)} />
      <path d="M47 78h80M40 85h93M72 70l-6 22M98 70l2 22M114 70l8 22M58 70l-12 22" stroke={C.terra2} strokeWidth="1.6" opacity="0.8" />
      {/* cups */}
      <path d="M66 70h8l-1 9h-6z" fill={C.cream} {...ink(1.1)} />
      <path d="M96 72h8l-1 9h-6z" fill={C.blue3} {...ink(1.1)} />
      <path d="M68 66q-1-2 0-4M100 68q-1-2 0-4" fill="none" stroke={C.white} strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      {/* basket */}
      <path d="M110 76h18l-2 9h-14z" fill={C.sand3} {...ink(1.1)} />
      <path d="M113 76q6-8 12 0" fill="none" {...ink(1.1)} />
      <circle cx="84" cy="84" r="3" fill={C.terra3} />
    </>
  );
}

/* ---------------------------------------------------------------- emotions */
function Emotions() {
  return (
    <>
      {bg(C.cream)}
      <circle cx="58" cy="40" r="20" fill={C.sand2} />
      <path d="M48 38q3-3 6 0M62 38q3-3 6 0M52 46q6 5 12 0" fill="none" {...ink(1.3, 0.75)} />
      <path d="M68 52q2-12 16-12 6-10 18-6 12-2 16 8 10 0 10 10z" fill={C.white} {...ink(1.2, 0.6)} />
      <path d="M104 22q2-6 8-6 4-4 9-1 7 0 8 7z" fill={C.blue1} />
      <path d="M110 26l-2 4M117 26l-2 4M124 26l-2 4" stroke={C.blue3} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M134 50a7 7 0 1 1-6-11 5.5 5.5 0 0 0 6 11z" fill={C.blue2} opacity="0.8" />
      {/* waves of feeling */}
      <path d="M0 62q20-8 40 0t40 0 40 0 40 0V100H0z" fill={C.sand2} opacity="0.6" />
      <path d="M0 70q20-8 40 0t40 0 40 0 40 0V100H0z" fill={C.terra2} />
      <path d="M0 78q20-8 40 0t40 0 40 0 40 0V100H0z" fill={C.blue2} />
      <path d="M0 86q20-8 40 0t40 0 40 0 40 0V100H0z" fill={C.sage3} />
      <path d="M0 94q20-6 40 0t40 0 40 0 40 0V100H0z" fill={C.blue4} />
      <path d="M10 74q10-4 20 0M90 82q10-4 20 0" fill="none" stroke={C.white} strokeWidth="1.2" opacity="0.55" strokeLinecap="round" />
    </>
  );
}

/* -------------------------------------------------------------------- food */
function Food() {
  return (
    <>
      {bg(C.terra1)}
      <rect x="0" y="0" width="160" height="10" fill={C.terra2} opacity="0.25" />
      <path d="M0 68h160V100H0z" fill={C.cream} />
      <path d="M0 68h160" {...ink(1.2, 0.4)} />
      <path d="M0 74h160M0 80h160" stroke={C.terra2} strokeWidth="0.8" opacity="0.4" />
      {/* steam */}
      <path d="M70 36q-4-6 0-12t0-12M80 34q-4-6 0-12t0-12M90 36q-4-6 0-12t0-12" fill="none" stroke={C.white} strokeWidth="2" strokeLinecap="round" />
      {/* bowl */}
      <ellipse cx="80" cy="86" rx="30" ry="3" fill={C.ink} opacity="0.12" />
      <path d="M50 52h60q0 30-30 32-30-2-30-32z" fill={C.blue3} {...ink(1.3)} />
      <path d="M54 64q26 8 52 0" fill="none" stroke={C.blue2} strokeWidth="1.6" opacity="0.8" />
      <ellipse cx="80" cy="52" rx="30" ry="6" fill={C.cream} {...ink(1.2)} />
      <ellipse cx="80" cy="52.6" rx="26" ry="4.2" fill={C.terra2} />
      <circle cx="74" cy="52" r="2" fill={C.sage3} />
      <circle cx="86" cy="53" r="1.6" fill={C.sage3} />
      <circle cx="80" cy="51" r="1.4" fill={C.sand2} />
      {/* lemon */}
      <ellipse cx="28" cy="78" rx="12" ry="9" fill={C.sand2} {...ink(1.2)} />
      <path d="M16 77l-3-1M40 77l3-1" {...ink(1.2)} />
      <path d="M22 74q4-3 8-2" fill="none" stroke={C.white} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <circle cx="44" cy="88" r="6" fill={C.sand1} stroke={C.sand2} strokeWidth="2" />
      <path d="M44 82v12M38 88h12M40 84l8 8M48 84l-8 8" stroke={C.sand2} strokeWidth="0.8" />
      {/* herbs */}
      <path d="M118 90q10-10 26-22" fill="none" stroke={C.sage4} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M126 84q-2-8 4-10 1 7-4 10zM132 79q0-8 7-9-1 7-7 9zM132 80q8 0 10 6-8 0-10-6zM124 86q8 0 9 6-7 0-9-6zM140 73q2-6 8-6-2 6-8 6z" fill={C.sage3} />
    </>
  );
}

/* ------------------------------------------------------------------- sport */
function Sport() {
  return (
    <>
      {skyGrad("ua-sport-sky", C.blue1, C.cream)}
      <rect width="160" height="100" fill="url(#ua-sport-sky)" />
      <circle cx="122" cy="26" r="12" fill={C.sand2} opacity="0.85" />
      <path d="M0 50q40-6 80-2t80-2V100H0z" fill={C.sage2} />
      {/* track curve */}
      <path d="M0 62q60-6 110 6t50 32H0z" fill={C.terra3} />
      <path d="M0 66q60-4 104 8t40 26" fill="none" stroke={C.white} strokeWidth="1" opacity="0.8" />
      <path d="M0 74q54-2 92 8t30 18" fill="none" stroke={C.white} strokeWidth="1" opacity="0.8" />
      <path d="M0 84q44 0 72 8t20 8" fill="none" stroke={C.white} strokeWidth="1" opacity="0.8" />
      <path d="M140 100q-6-24-40-34" fill="none" stroke={C.white} strokeWidth="1" opacity="0.4" />
      {/* hurdle / finish */}
      <path d="M128 52v14M146 50v14" {...ink(1.3, 0.7)} />
      <path d="M128 53h18" stroke={C.cream} strokeWidth="3" />
      <path d="M128 53h4M136 53h4M144 53h2" stroke={C.ink} strokeWidth="3" opacity="0.7" />
      {/* trainer */}
      <ellipse cx="76" cy="85" rx="28" ry="2.6" fill={C.ink} opacity="0.18" />
      <path d="M52 82V66q0-4 4-4h8q2 6 10 6l10 4 14 6q6 2 6 5v-1z" fill={C.blue3} {...ink(1.3)} />
      <path d="M52 81h52v3q0 2-2 2H54q-2 0-2-2z" fill={C.cream} {...ink(1.2)} />
      <path d="M70 69l-2 4M75 70l-2 4M80 71l-2 4" stroke={C.cream} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M52 76q14 0 26 2" fill="none" stroke={C.sand2} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M54 66h8" stroke={C.blue4} strokeWidth="2" strokeLinecap="round" />
      <path d="M36 72h8M30 77h10M38 82h6" stroke={C.cream} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
    </>
  );
}

/* ------------------------------------------------------------------ health */
function Health() {
  return (
    <>
      {bg(C.sage1)}
      <circle cx="80" cy="50" r="38" fill={C.cream} />
      <path d="M0 82q40-6 80 0t80 0V100H0z" fill={C.sage2} opacity="0.6" />
      {/* leaf */}
      <path d="M30 80Q20 46 54 30q8 32-24 50z" fill={C.sage3} {...ink(1.2)} />
      <path d="M30 80q8-22 20-42" fill="none" stroke={C.sage1} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M36 66l-4-6M40 58l-6-4M44 50l2-8" stroke={C.sage1} strokeWidth="0.9" strokeLinecap="round" />
      {/* heartbeat */}
      <path d="M50 52h18l4-8 6 18 6-26 6 22 4-6h22" fill="none" stroke={C.terra3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="116" cy="52" r="2" fill={C.terra3} />
      {/* glass of water */}
      <ellipse cx="128" cy="86" rx="12" ry="2" fill={C.ink} opacity="0.12" />
      <path d="M119.6 66h16.8l-1.6 18h-13.6z" fill={C.blue2} opacity="0.75" />
      <path d="M118 58h20l-2.4 28h-15.2z" fill={C.white} fillOpacity="0.3" {...ink(1.2)} />
      <path d="M122 70v10" stroke={C.white} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
      <path d="M140 40q4 6 0 9-4-3 0-9z" fill={C.blue3} />
    </>
  );
}

/* ------------------------------------------------------------------ nature */
function Nature() {
  const pine = (x: number, y: number, h: number, fill: string) => (
    <path key={`${x}-${y}`} d={`M${x} ${y - h}l${h * 0.32} ${h * 0.5}h-${h * 0.12}l${h * 0.22} ${h * 0.5}H${x - h * 0.42}l${h * 0.22}-${h * 0.5}h-${h * 0.12}z`} fill={fill} />
  );
  return (
    <>
      {skyGrad("ua-nature-sky", C.sand1, C.cream)}
      <rect width="160" height="100" fill="url(#ua-nature-sky)" />
      <circle cx="44" cy="30" r="11" fill={C.terra2} opacity="0.7" />
      <path d="M0 60q30-20 60-10t50-12 50 8V100H0z" fill={C.sage2} opacity="0.7" />
      <path d="M0 70q40-12 80-4t80-6V100H0z" fill={C.sage3} />
      <path d="M0 84q50-8 100 0t60 0V100H0z" fill={C.sage4} opacity="0.9" />
      {pine(118, 64, 26, C.sage4)}
      {pine(132, 66, 32, C.sage4)}
      {pine(146, 64, 22, C.sage4)}
      {pine(18, 70, 20, C.sage4)}
      {/* sitting fox */}
      <path d="M84 84q-16 2-20-6t6-12q-8 8 0 12t14 2z" fill={C.terra3} {...ink(1.1)} />
      <path d="M78 84q-4-14 4-22l10-2q6 10 2 24z" fill={C.terra3} {...ink(1.2)} />
      <path d="M86 66q4 8 2 18h6q4-12-2-24z" fill={C.cream} opacity="0.85" />
      <path d="M82 62l2-12 4 6 4-1 4-6 1 12q-2 6-8 6t-7-5z" fill={C.terra3} {...ink(1.2)} />
      <path d="M88 64l4 0-2 3z" fill={C.ink} opacity="0.8" />
      <path d="M67 76q-1 4 3 6" fill="none" stroke={C.cream} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M96 26q2-2 4 0q2-2 4 0M110 34q1.5-1.5 3 0q1.5-1.5 3 0" fill="none" {...ink(1, 0.5)} />
    </>
  );
}

/* -------------------------------------------------------------------- work */
function Work() {
  return (
    <>
      {bg(C.blue1)}
      <rect x="18" y="14" width="26" height="20" fill={C.cream} {...ink(1.1, 0.6)} />
      <path d="M20 32l8-8 6 5 4-3 6 6z" fill={C.sage2} />
      <path d="M0 52h160" stroke={C.blue2} strokeWidth="0.8" opacity="0.6" />
      {/* lamp light */}
      <path d="M118 34l-18 38h40z" fill={C.sand1} opacity="0.75" />
      {/* desk */}
      <path d="M0 72h160V100H0z" fill={C.sand3} />
      <path d="M0 72h160v4H0z" fill={C.sand2} />
      <path d="M0 72h160" {...ink(1.2, 0.5)} />
      {/* laptop */}
      <path d="M50 38h48v30H50z" fill={C.blue4} {...ink(1.3)} />
      <rect x="54" y="42" width="40" height="22" fill={C.blue3} />
      <path d="M58 47h18M58 52h26M58 57h14" stroke={C.blue1} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
      <rect x="80" y="54" width="10" height="7" rx="1" fill={C.terra2} opacity="0.9" />
      <path d="M44 68h60l-4 4H48z" fill={C.cream} {...ink(1.2)} />
      {/* notebook & pen */}
      <path d="M16 70l20-4 6 6-20 4z" fill={C.terra3} {...ink(1.1)} />
      <path d="M18 70l18-3.4" stroke={C.terra1} strokeWidth="0.8" />
      <path d="M26 82l22-4" stroke={C.blue4} strokeWidth="1.8" strokeLinecap="round" />
      {/* lamp */}
      <path d="M126 72v-2h12v2z" fill={C.ink} opacity="0.8" />
      <path d="M132 70l-6-22 -8-12" fill="none" {...ink(1.5)} />
      <path d="M110 38l8-10 8 8-6 6z" fill={C.terra3} {...ink(1.2)} />
      {/* mug */}
      <path d="M144 62h8v10h-8z" fill={C.sage3} {...ink(1)} />
    </>
  );
}

/* ------------------------------------------------------------------- money */
function Money() {
  const coin = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <path d={`M${x - 11} ${y}v3a11 3.4 0 0 0 22 0v-3z`} fill={C.sand3} />
      <ellipse cx={x} cy={y} rx="11" ry="3.4" fill={C.sand2} stroke={C.ink} strokeWidth="0.9" strokeOpacity="0.6" />
    </g>
  );
  return (
    <>
      {bg(C.cream)}
      <circle cx="122" cy="34" r="30" fill={C.sage1} />
      {/* chart */}
      <path d="M102 56V48M112 56V40M122 56V44M132 56V30M142 56V22" stroke={C.sage2} strokeWidth="6" />
      <path d="M100 46l12-10 10 4 10-12 12-8" fill="none" stroke={C.sage4} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M140 18l5-2-1 5" fill="none" stroke={C.sage4} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M0 78h160V100H0z" fill={C.sand1} />
      {/* wallet */}
      <ellipse cx="54" cy="86" rx="34" ry="3" fill={C.ink} opacity="0.12" />
      <rect x="22" y="48" width="58" height="38" rx="5" fill={C.sage3} {...ink(1.3)} />
      <path d="M26 48q8-10 26-6l20 6z" fill={C.cream} {...ink(1)} />
      <path d="M22 54q29 6 58 0" fill="none" stroke={C.sage4} strokeWidth="1.2" opacity="0.6" />
      <rect x="58" y="60" width="26" height="14" rx="4" fill={C.sage4} {...ink(1.2)} />
      <circle cx="66" cy="67" r="2.4" fill={C.sand2} />
      <path d="M26 82h50" stroke={C.sage2} strokeWidth="0.8" strokeDasharray="2 2" />
      {/* coins */}
      {[0, 1, 2, 3, 4].map((i) => coin(106, 84 - i * 4))}
      {[0, 1, 2].map((i) => coin(130, 86 - i * 4))}
      <ellipse cx="146" cy="88" rx="6" ry="2" fill={C.sand2} stroke={C.ink} strokeWidth="0.9" strokeOpacity="0.6" />
    </>
  );
}

/* ---------------------------------------------------------------- shopping */
function Shopping() {
  const garment = (x: number, fill: string, long: number) => (
    <g key={x}>
      <path d={`M${x} 26v-3q0-3 3-3`} fill="none" {...ink(1, 0.7)} />
      <path d={`M${x - 8} 30l8-4 8 4`} fill="none" {...ink(1, 0.7)} />
      <path d={`M${x - 8} 30l-4 6 4 2v${long}h16v-${long}l4-2-4-6z`} fill={fill} />
    </g>
  );
  return (
    <>
      {bg(C.terra1)}
      <rect x="96" y="0" width="64" height="100" fill={C.sand1} opacity="0.7" />
      <path d="M0 84h160V100H0z" fill={C.sand2} opacity="0.7" />
      {/* rail */}
      <path d="M14 20h96M18 20v64M106 20v64M12 84h12M100 84h12" {...ink(1.4)} />
      {garment(34, C.blue3, 34)}
      {garment(52, C.sage3, 26)}
      {garment(70, C.sand3, 38)}
      {garment(88, C.terra2, 22)}
      {/* tote bags */}
      <path d="M118 62q0-12 8-12t8 12" fill="none" {...ink(1.3)} />
      <path d="M112 62h28l-2 26h-24z" fill={C.cream} {...ink(1.3)} />
      <circle cx="126" cy="74" r="4" fill={C.terra3} opacity="0.85" />
      <path d="M138 68q0-10 7-10t7 10" fill="none" {...ink(1.3)} />
      <path d="M132 68h26l-2 20h-22z" fill={C.terra3} {...ink(1.3)} />
      <path d="M136 74h18" stroke={C.terra2} strokeWidth="1.6" />
    </>
  );
}

/* ----------------------------------------------------------------- culture */
function Culture() {
  return (
    <>
      {bg(C.sand1)}
      <path d="M0 82h160V100H0z" fill={C.sand2} />
      <path d="M0 82h160" {...ink(1.1, 0.4)} />
      {/* frame */}
      <rect x="52" y="24" width="56" height="42" fill={C.sand3} {...ink(1.3)} />
      <rect x="57" y="29" width="46" height="32" fill={C.blue1} />
      <circle cx="90" cy="38" r="5" fill={C.terra2} />
      <path d="M57 54q12-12 24-4t22-6v17H57z" fill={C.sage3} />
      <path d="M57 58q20-6 46 0v3H57z" fill={C.blue2} />
      <rect x="62" y="72" width="36" height="4" rx="1" fill={C.sand3} />
      <path d="M66 76v6M94 76v6" {...ink(1.2, 0.6)} />
      {/* curtains */}
      <path d="M0 0h38q-6 30 4 62-6 8-16 10-10 2-26-2z" fill={C.terra3} />
      <path d="M10 0q-2 36 4 72M22 0q-2 36 6 70" fill="none" stroke={C.terra4} strokeWidth="1.2" opacity="0.5" />
      <path d="M160 0h-38q6 30-4 62 6 8 16 10 10 2 26-2z" fill={C.terra3} />
      <path d="M150 0q2 36-4 72M138 0q2 36-6 70" fill="none" stroke={C.terra4} strokeWidth="1.2" opacity="0.5" />
      <path d="M0 0h160v8q-10 6-20 0-10 6-20 0-10 6-20 0-10 6-20 0-10 6-20 0-10 6-20 0-10 6-20 0-10 6-20 0z" fill={C.terra4} />
      <circle cx="38" cy="60" r="2.2" fill={C.sand2} />
      <circle cx="122" cy="60" r="2.2" fill={C.sand2} />
    </>
  );
}

/* -------------------------------------------------------------------- tech */
function Tech() {
  return (
    <>
      {bg(C.blue1)}
      <circle cx="80" cy="50" r="34" fill={C.cream} opacity="0.7" />
      <path d="M0 86h160V100H0z" fill={C.blue2} opacity="0.4" />
      {/* wifi */}
      <g fill="none" stroke={C.blue3} strokeWidth="2" strokeLinecap="round">
        <path d="M114 30a18 18 0 0 1 26 0" />
        <path d="M118 35a12 12 0 0 1 18 0" />
        <path d="M122 40a6 6 0 0 1 10 0" />
      </g>
      <circle cx="127" cy="44" r="1.8" fill={C.blue3} />
      {/* phone */}
      <ellipse cx="80" cy="90" rx="20" ry="2.4" fill={C.ink} opacity="0.15" />
      <rect x="62" y="14" width="36" height="74" rx="6" fill={C.blue4} {...ink(1.3)} />
      <rect x="65.5" y="20" width="29" height="60" rx="2" fill={C.cream} />
      <path d="M76 17h8" stroke={C.blue2} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M68 26h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-12l-4 3z" fill={C.blue2} />
      <path d="M92 42H76a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12l4 3z" fill={C.terra2} />
      <path d="M68 58h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-10l-4 3z" fill={C.blue2} />
      <circle cx="73" cy="74" r="1.2" fill={C.blue3} />
      <circle cx="77" cy="74" r="1.2" fill={C.blue3} opacity="0.6" />
      <circle cx="81" cy="74" r="1.2" fill={C.blue3} opacity="0.3" />
      {/* floating bubble */}
      <path d="M22 40h24a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H32l-6 5v-5h-4a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4z" fill={C.sage2} {...ink(1.1, 0.6)} />
      <path d="M26 46h16M26 50h10" stroke={C.cream} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="140" cy="70" r="3" fill={C.terra3} opacity="0.7" />
    </>
  );
}

/* --------------------------------------------------------------- transport */
function Transport() {
  return (
    <>
      {skyGrad("ua-transport-sky", C.sand1, C.cream)}
      <rect width="160" height="100" fill="url(#ua-transport-sky)" />
      <circle cx="30" cy="24" r="9" fill={C.sand2} opacity="0.8" />
      <path d="M0 66V50h10v-8h12v14h8V38h14v18h10v-10h12v20zM98 66V46h12v-6h10v10h8V34h12v14h20v18z" fill={C.blue2} opacity="0.45" />
      {/* overhead wire */}
      <path d="M0 14h160" {...ink(1, 0.6)} />
      <path d="M86 14l-8 16h16" fill="none" {...ink(1.1, 0.8)} />
      {/* ground & rails */}
      <path d="M0 66h160V100H0z" fill={C.sage1} />
      <path d="M0 78h160V100H0z" fill={C.sand1} />
      <path d="M0 80h160M0 86h160" {...ink(1.2, 0.7)} />
      {[6, 18, 30, 42, 54, 66, 78, 90, 102, 114, 126, 138, 150].map((x) => (
        <path key={x} d={`M${x} 80v6`} stroke={C.sand3} strokeWidth="2.4" opacity="0.6" />
      ))}
      {/* tram */}
      <path d="M44 30h76q12 0 14 12l2 34H40V36q0-6 4-6z" fill={C.blue3} {...ink(1.3)} />
      <path d="M40 64h96v6H40z" fill={C.sand2} />
      {[46, 64, 82, 100].map((x) => (
        <rect key={x} x={x} y="38" width="14" height="16" rx="2" fill={C.cream} />
      ))}
      <path d="M118 38h8q4 0 5 4l1 12h-14z" fill={C.blue1} />
      <circle cx="132" cy="64" r="1.6" fill={C.sand1} />
      <circle cx="56" cy="78" r="3.4" fill={C.ink} opacity="0.8" />
      <circle cx="120" cy="78" r="3.4" fill={C.ink} opacity="0.8" />
      {/* stop */}
      <path d="M18 78V44" {...ink(1.4)} />
      <circle cx="18" cy="42" r="6" fill={C.terra3} {...ink(1.1)} />
      <circle cx="18" cy="42" r="2.6" fill={C.cream} />
      <rect x="146" y="58" width="8" height="12" rx="1" fill={C.terra2} opacity="0.8" />
    </>
  );
}

/* -------------------------------------------------------------------- home */
function Home() {
  return (
    <>
      {bg(C.blue1)}
      <ellipse cx="130" cy="20" rx="14" ry="3.4" fill={C.white} opacity="0.8" />
      <path d="M0 84h160V100H0z" fill={C.sage2} />
      {/* tree */}
      <path d="M140 84V56" stroke={C.sage4} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="140" cy="50" r="12" fill={C.sage3} />
      {/* facade */}
      <path d="M38 40l42-26 42 26z" fill={C.terra3} {...ink(1.3)} />
      <rect x="44" y="40" width="72" height="44" fill={C.terra1} {...ink(1.3)} />
      <rect x="100" y="18" width="7" height="12" fill={C.terra4} />
      {/* door */}
      <path d="M72 84V64a8 8 0 0 1 16 0v20z" fill={C.blue3} {...ink(1.2)} />
      <circle cx="84.5" cy="74" r="0.9" fill={C.sand2} />
      {/* windows */}
      {[50, 94].map((x) => (
        <g key={x}>
          <rect x={x} y="50" width="16" height="16" fill={C.blue1} {...ink(1.1)} />
          <path d={`M${x + 8} 50v16M${x} 58h16`} stroke={C.cream} strokeWidth="1.4" />
          <rect x={x - 4} y="50" width="4" height="16" fill={C.sage3} />
          <rect x={x + 16} y="50" width="4" height="16" fill={C.sage3} />
          <rect x={x - 1} y="66" width="18" height="2" fill={C.cream} />
        </g>
      ))}
      <circle cx="80" cy="30" r="3.6" fill={C.cream} {...ink(1, 0.7)} />
      {/* plants by the door */}
      <path d="M62 84l1-7h6l1 7z" fill={C.terra3} />
      <ellipse cx="66" cy="74" rx="4" ry="5" fill={C.sage3} />
      <path d="M90 84l1-7h6l1 7z" fill={C.terra3} />
      <ellipse cx="94" cy="74" rx="4" ry="5" fill={C.sage4} />
      <path d="M72 84h16l6 16H66z" fill={C.sand1} opacity="0.8" />
    </>
  );
}

/* ------------------------------------------------------------------ debate */
function Debate() {
  return (
    <>
      {bg(C.cream)}
      <circle cx="80" cy="50" r="40" fill={C.sand1} />
      <path d="M0 88h160V100H0z" fill={C.sand2} opacity="0.4" />
      {/* left bubble */}
      <path d="M24 22h56a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8H48l-12 10 2-10h-14a8 8 0 0 1-8-8V30a8 8 0 0 1 8-8z" fill={C.blue3} {...ink(1.3)} />
      <path d="M28 34h40M28 42h48M28 50h28" stroke={C.blue1} strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
      {/* right bubble */}
      <path d="M136 38H78a8 8 0 0 0-8 8v22a8 8 0 0 0 8 8h32l14 10-3-10h15a8 8 0 0 0 8-8V46a8 8 0 0 0-8-8z" fill={C.terra2} fillOpacity="0.95" {...ink(1.3)} />
      <path d="M82 50h40M82 58h46M82 66h22" stroke={C.terra1} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="140" cy="20" r="3" fill={C.sage3} />
      <circle cx="148" cy="28" r="1.8" fill={C.sage2} />
      <circle cx="16" cy="80" r="2.4" fill={C.sand3} opacity="0.7" />
    </>
  );
}

/* ------------------------------------------------------------------ humour */
function Humour() {
  const confetti: [number, number, string, number][] = [
    [18, 18, C.terra3, 20],
    [34, 70, C.blue3, -30],
    [140, 16, C.sage3, 40],
    [146, 72, C.sand3, -10],
    [26, 44, C.sand2, 60],
    [128, 40, C.terra2, -50],
    [60, 12, C.blue2, 15],
    [104, 88, C.sage2, 30],
  ];
  return (
    <>
      {bg(C.sand1)}
      <circle cx="80" cy="50" r="36" fill={C.terra1} />
      {confetti.map(([x, y, f, r]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="5" height="2.4" rx="0.8" fill={f} transform={`rotate(${r} ${x} ${y})`} />
      ))}
      {/* ribbon */}
      <path d="M58 70q22 14 44 0" fill="none" stroke={C.terra3} strokeWidth="2" strokeLinecap="round" />
      {/* tragedy mask (back) */}
      <g transform="rotate(14 98 46)">
        <path d="M82 26h32v18q0 20-16 24-16-4-16-24z" fill={C.blue2} {...ink(1.2)} />
        <path d="M88 40q3-3 6 0-3 3-6 0zM102 40q3-3 6 0-3 3-6 0z" fill={C.blue4} />
        <path d="M91 57q7-5 14 0" fill="none" stroke={C.blue4} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M87 35l6-2M109 35l-6-2" stroke={C.blue4} strokeWidth="1.2" strokeLinecap="round" />
      </g>
      {/* comedy mask (front) */}
      <g transform="rotate(-12 62 48)">
        <path d="M46 28h32v18q0 20-16 24-16-4-16-24z" fill={C.cream} {...ink(1.3)} />
        <path d="M51 42q3.5-4 7 0-3.5-1.4-7 0zM66 42q3.5-4 7 0-3.5-1.4-7 0z" fill={C.ink} opacity="0.85" />
        <path d="M53 52q9 9 18 0-9 3-18 0z" fill={C.terra3} {...ink(1)} />
        <circle cx="50" cy="48" r="2.4" fill={C.terra2} opacity="0.6" />
        <circle cx="74" cy="48" r="2.4" fill={C.terra2} opacity="0.6" />
      </g>
    </>
  );
}

/* ------------------------------------------------------------------- admin */
function Admin() {
  return (
    <>
      {bg(C.sage1)}
      <path d="M0 0h160v12H0z" fill={C.sage2} opacity="0.35" />
      {/* envelope */}
      <g transform="rotate(-8 40 40)">
        <rect x="10" y="22" width="56" height="36" rx="2" fill={C.sand1} {...ink(1.2)} />
        <path d="M10 22l28 20 28-20" fill="none" {...ink(1.1, 0.7)} />
        <rect x="52" y="26" width="9" height="10" fill={C.terra2} />
      </g>
      {/* passport page */}
      <g transform="rotate(4 74 62)">
        <rect x="44" y="40" width="58" height="44" rx="2" fill={C.cream} {...ink(1.3)} />
        <path d="M73 40v44" stroke={C.sand2} strokeWidth="1.2" />
        <path d="M78 74h18M78 79h12M50 78h16" stroke={C.sand2} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="58" cy="58" r="9" fill="none" stroke={C.terra3} strokeWidth="1.6" />
        <circle cx="58" cy="58" r="5.6" fill="none" stroke={C.terra3} strokeWidth="0.9" />
        <path d="M55 58l2 2 4-4" fill="none" stroke={C.terra3} strokeWidth="1.2" strokeLinecap="round" />
        <rect x="78" y="48" width="18" height="14" rx="2" fill="none" stroke={C.blue3} strokeWidth="1.6" transform="rotate(-12 87 55)" />
        <path d="M82 55h10" stroke={C.blue3} strokeWidth="1.2" transform="rotate(-12 87 55)" />
      </g>
      {/* clipboard */}
      <rect x="112" y="18" width="38" height="66" rx="3" fill={C.sand3} {...ink(1.3)} />
      <rect x="116" y="26" width="30" height="54" fill={C.white} />
      <rect x="123" y="14" width="16" height="8" rx="2" fill={C.blue4} />
      {[36, 48, 60].map((y) => (
        <g key={y}>
          <rect x="119" y={y - 3} width="5" height="5" rx="1" fill="none" stroke={C.sage3} strokeWidth="1" />
          <path d={`M120 ${y}l1.4 1.4 3-3.4`} fill="none" stroke={C.sage4} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M127 ${y}h15`} stroke={C.sage2} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
      <rect x="119" y="69" width="5" height="5" rx="1" fill="none" stroke={C.sage3} strokeWidth="1" />
      <path d="M127 72h10" stroke={C.sage2} strokeWidth="1.4" strokeLinecap="round" />
    </>
  );
}

/* --------------------------------------------------------------- emergency */
function Emergency() {
  const R = 16;
  const circ = 2 * Math.PI * R;
  return (
    <>
      {skyGrad("ua-emergency-sky", C.blue1, C.cream)}
      <rect width="160" height="100" fill="url(#ua-emergency-sky)" />
      {/* lighthouse with soft beam */}
      <path d="M128 26L60 8v30z" fill={C.sand1} opacity="0.85" />
      <path d="M122 68l3-36h10l3 36z" fill={C.cream} {...ink(1.2)} />
      <path d="M123.4 52h13.2l0.6 7h-14.4zM124.6 38h10.8l0.5 6h-11.8z" fill={C.terra3} />
      <rect x="123" y="24" width="14" height="8" fill={C.sand2} {...ink(1.1)} />
      <path d="M121 24l9-6 9 6z" fill={C.blue4} />
      <path d="M116 68q8-6 28-2v4h-28z" fill={C.sage3} />
      {/* sea */}
      <path d="M0 66h160V100H0z" fill={C.blue2} />
      <path d="M0 82h160V100H0z" fill={C.blue3} opacity="0.45" />
      <path d="M8 74q6-3 12 0M96 90q6-3 12 0M134 80q6-3 12 0" fill="none" stroke={C.white} strokeWidth="1.3" opacity="0.6" strokeLinecap="round" />
      {/* lifebuoy */}
      <circle cx="60" cy="62" r={R} fill="none" stroke={C.cream} strokeWidth="9" />
      <circle cx="60" cy="62" r={R} fill="none" stroke={C.terra3} strokeWidth="9" strokeDasharray={`${circ / 8} ${circ / 8}`} transform="rotate(-22.5 60 62)" />
      <circle cx="60" cy="62" r={R + 4.5} fill="none" {...ink(1.2, 0.7)} />
      <circle cx="60" cy="62" r={R - 4.5} fill="none" {...ink(1.2, 0.7)} />
      <path d="M38 62q-6 0-8 8M82 62q6 0 8-6" fill="none" stroke={C.sand3} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M40 82q20 4 40 0" fill="none" stroke={C.white} strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
    </>
  );
}

/* ---------------------------------------------------------------- fallback */
function Fallback() {
  return (
    <>
      {bg(C.cream)}
      <circle cx="112" cy="34" r="12" fill={C.sand2} opacity="0.75" />
      <path d="M0 70q40-16 80-6t80-6V100H0z" fill={C.sage2} />
      <path d="M0 82q50-8 100 0t60 0V100H0z" fill={C.sage3} />
      <path d="M40 30q3-3 6 0q3-3 6 0" fill="none" {...ink(1, 0.5)} />
    </>
  );
}

const SCENES: Record<UniverseId, () => ReactNode> = {
  travel: Travel,
  daily: Daily,
  love: Love,
  friends: Friends,
  emotions: Emotions,
  food: Food,
  sport: Sport,
  health: Health,
  nature: Nature,
  work: Work,
  money: Money,
  shopping: Shopping,
  culture: Culture,
  tech: Tech,
  transport: Transport,
  home: Home,
  debate: Debate,
  humour: Humour,
  admin: Admin,
  emergency: Emergency,
};

export function UniverseArt({ id, className, title }: { id: string; className?: string; title?: string }): JSX.Element {
  const Scene = (SCENES as Record<string, (() => ReactNode) | undefined>)[id] ?? Fallback;
  return (
    <svg
      viewBox="0 0 160 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <Scene />
    </svg>
  );
}
