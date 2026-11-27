// Bookshelf decorations, drawn in SVG (box 0 0 60 60, objects stand on y = 60).
import type { ReactNode } from "react";

const O = "#3A3352";
const s = { stroke: O, strokeWidth: 1.8, strokeLinejoin: "round" as const };

export const DECOR_ART: Record<string, ReactNode> = {
  plant: (
    <g>
      <path d="M20 44 L40 44 L37 60 L23 60Z" fill="#E07A5F" {...s} />
      <path d="M30 44 Q14 34 12 18 Q26 22 30 40Z" fill="#5FB36B" {...s} />
      <path d="M30 44 Q46 32 48 14 Q34 20 30 40Z" fill="#4E9E5C" {...s} />
      <path d="M30 44 Q28 24 32 8 Q38 24 31 42Z" fill="#6CC47A" {...s} />
    </g>
  ),
  cactus: (
    <g>
      <path d="M22 48 L38 48 L36 60 L24 60Z" fill="#F2C14E" {...s} />
      <rect x="25" y="16" width="10" height="34" rx="5" fill="#4E9E5C" {...s} />
      <path d="M25 34 Q16 34 16 24" stroke={O} strokeWidth="8.5" fill="none" strokeLinecap="round" />
      <path d="M25 34 Q16 34 16 24" stroke="#4E9E5C" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="15" r="3" fill="#FF8FB1" {...s} />
    </g>
  ),
  candle: (
    <g>
      <rect x="22" y="34" width="16" height="26" rx="3" fill="#FFF3D6" {...s} />
      <path d="M30 34 L30 28" stroke={O} strokeWidth="1.5" />
      <path d="M30 18 Q36 26 30 30 Q24 26 30 18Z" fill="#FFB347" stroke="#E0851F" strokeWidth="1.2" />
      <circle cx="30" cy="25" r="9" fill="#FFD166" opacity="0.25" />
    </g>
  ),
  globe: (
    <g>
      <path d="M22 60 L38 60 L34 54 L26 54Z" fill="#8D6E63" {...s} />
      <path d="M30 54 L30 48" stroke={O} strokeWidth="2" />
      <circle cx="30" cy="30" r="17" fill="#5DADE2" {...s} />
      <path d="M20 24 Q26 18 32 22 Q34 30 26 32 Q20 30 20 24Z M34 34 Q42 30 44 36 Q40 44 34 42Z" fill="#7DCE82" />
      <path d="M12 30 Q30 52 48 30" stroke="#C9A227" strokeWidth="2" fill="none" />
    </g>
  ),
  lamp: (
    <g>
      <rect x="20" y="56" width="20" height="4" rx="2" fill="#3E3A50" {...s} />
      <path d="M30 56 L30 30 L42 22" stroke={O} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M34 14 L52 14 L48 26 L38 26Z" fill="#6A55F2" {...s} />
      <path d="M38 26 L48 26 L58 50 L28 50Z" fill="#FFD166" opacity="0.2" />
    </g>
  ),
  vinyl: (
    <g>
      <rect x="6" y="42" width="48" height="18" rx="3" fill="#8D6E63" {...s} />
      <ellipse cx="28" cy="42" rx="18" ry="5" fill="#1A1A1A" {...s} />
      <ellipse cx="28" cy="42" rx="5" ry="1.6" fill="#E53935" />
      <path d="M48 36 L42 42" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  cat: (
    <g>
      <ellipse cx="30" cy="52" rx="20" ry="9" fill="#F4A259" {...s} />
      <circle cx="16" cy="46" r="8" fill="#F4A259" {...s} />
      <path d="M10 41 L11 33 L16 39Z M19 39 L22 33 L23 41Z" fill="#F4A259" {...s} />
      <path d="M12 46 Q14 48 16 46 M17 46 Q19 48 21 46" stroke={O} strokeWidth="1.2" fill="none" />
      <path d="M48 54 Q58 54 54 44" stroke={O} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M48 54 Q58 54 54 44" stroke="#F4A259" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M26 46 L26 58 M34 46 L34 58" stroke="#D98A45" strokeWidth="2" />
    </g>
  ),
  snowglobe: (
    <g>
      <path d="M18 52 L42 52 L44 60 L16 60Z" fill="#8D6E63" {...s} />
      <circle cx="30" cy="34" r="18" fill="#D6EEFF" fillOpacity="0.8" {...s} />
      <path d="M24 46 L30 30 L36 46Z" fill="#4E9E5C" />
      {[[20, 26], [38, 24], [27, 20], [34, 38], [22, 38]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" fill="#fff" />)}
      <path d="M18 28 Q20 20 26 18" stroke="#fff" strokeWidth="2" fill="none" opacity="0.8" />
    </g>
  ),
  bigben: (
    <g>
      <rect x="22" y="22" width="16" height="38" fill="#C9A66B" {...s} />
      <path d="M21 22 L30 6 L39 22Z" fill="#5D6B7A" {...s} />
      <circle cx="30" cy="30" r="5" fill="#FFF8EE" stroke={O} strokeWidth="1.2" />
      <path d="M30 30 L30 27 M30 30 L32 31" stroke={O} strokeWidth="1" />
      <path d="M24 42 L36 42 M24 50 L36 50" stroke="#8D6E3F" strokeWidth="1.2" />
    </g>
  ),
  eiffel: (
    <g>
      <path d="M29 4 L31 4 L33 20 L36 20 L38 34 L41 34 L48 60 L40 60 Q37 50 30 49 Q23 50 20 60 L12 60 L19 34 L22 34 L24 20 L27 20Z" fill="#6D5D53" stroke={O} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M22 34 L38 34 M19 46 L41 46" stroke="#4E4038" strokeWidth="2" />
    </g>
  ),
  trophy: (
    <g>
      <rect x="20" y="54" width="20" height="6" rx="1.5" fill="#6D4C41" {...s} />
      <path d="M27 54 L27 44 L33 44 L33 54Z" fill="#E0B84A" {...s} />
      <path d="M16 12 L44 12 L42 28 Q40 42 30 42 Q20 42 18 28Z" fill="#FFD166" {...s} />
      <path d="M16 16 Q6 16 8 24 Q10 30 18 30 M44 16 Q54 16 52 24 Q50 30 42 30" stroke={O} strokeWidth="1.8" fill="none" />
      <path d="M23 16 Q22 28 26 36" stroke="#fff" strokeWidth="2" opacity="0.6" fill="none" />
    </g>
  ),
  hourglass: (
    <g>
      <rect x="16" y="8" width="28" height="4" rx="2" fill="#8D6E63" {...s} />
      <rect x="16" y="56" width="28" height="4" rx="2" fill="#8D6E63" {...s} />
      <path d="M20 12 Q20 30 30 34 Q20 38 20 56 L40 56 Q40 38 30 34 Q40 30 40 12Z" fill="#E3F2FD" fillOpacity="0.85" {...s} />
      <path d="M24 50 Q30 42 36 50 L37 54 L23 54Z M25 18 L35 18 Q34 26 30 30 Q26 26 25 18Z" fill="#F2C14E" />
    </g>
  ),
};

export function DecorIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      {DECOR_ART[id]}
    </svg>
  );
}
