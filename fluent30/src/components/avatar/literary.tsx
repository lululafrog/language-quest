// Literary & travel outfits (Sherlock, Alice, Dracula, Treasure Island, Regency, 1920s…).
// Same art direction as Tourist.tsx: soft outline, flat colours with a light shading pass.
import type { ReactNode } from "react";
import type { Spec } from "@/lib/data/shop";
import { armL, armR, Limb, O, W, shade, type Ctx } from "./Tourist";

export const LONG_LITERARY_DRESSES = ["regency"];

const S = { stroke: O, strokeWidth: W, strokeLinejoin: "round" as const };

// ---------- hats (head coordinate space) ----------
export function literaryHat(sp: Spec): ReactNode | null {
  switch (sp.k) {
    case "deerstalker": {
      const c = "#8B6B4A";
      return (
        <g>
          <path d="M58 52 Q44 54 38 64 Q54 62 66 54Z" fill={shade(c, -0.12)} {...S} />
          <path d="M142 52 Q156 54 162 64 Q146 62 134 54Z" fill={shade(c, -0.12)} {...S} />
          <path d="M60 50 Q58 12 100 11 Q142 12 140 50Z" fill={c} {...S} />
          <g stroke={shade(c, -0.35)} strokeWidth="1.2" opacity="0.55">
            {[72, 86, 100, 114, 128].map((x) => <path key={x} d={`M${x} ${x === 100 ? 12 : 16} L${x} 50`} />)}
            {[24, 34, 44].map((y) => <path key={y} d={`M${62 + (44 - y) * 0.2} ${y} L${138 - (44 - y) * 0.2} ${y}`} />)}
          </g>
          <path d="M88 13 Q94 4 100 11 Q106 4 112 13" stroke={O} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M64 44 Q100 36 136 44" stroke="#fff" strokeWidth="2.5" opacity="0.2" fill="none" />
        </g>
      );
    }
    case "tricorn":
      return (
        <g>
          <path d="M70 38 Q70 12 100 10 Q130 12 130 38Z" fill="#212121" {...S} />
          <path d="M36 40 Q68 20 100 30 Q132 20 164 40 Q142 54 100 50 Q58 54 36 40Z" fill="#2B2B2B" {...S} />
          <path d="M40 41 Q68 24 100 33 Q132 24 160 41" stroke="#E0B84A" strokeWidth="2.5" fill="none" />
          <circle cx="100" cy="36" r="5" fill="#F5F5F5" stroke={O} strokeWidth="1.4" />
          <path d="M97 34 L103 38 M103 34 L97 38" stroke={O} strokeWidth="1.2" />
        </g>
      );
    case "headband":
      return (
        <g>
          <path d="M60 50 Q100 14 140 50" stroke="#1A1A1A" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M126 30 Q140 18 146 30 Q140 38 126 30Z M126 30 Q118 16 110 26 Q116 36 126 30Z" fill="#1A1A1A" />
          <circle cx="126" cy="30" r="3" fill="#333" />
        </g>
      );
    case "bonnet":
      return (
        <g>
          <path d="M54 74 Q46 18 100 14 Q154 18 146 74 Q140 48 100 42 Q60 48 54 74Z" fill="#F3E2B8" {...S} />
          <path d="M60 52 Q100 30 140 52" stroke="#D9C38E" strokeWidth="2" fill="none" />
          <path d="M58 60 Q100 40 142 60" stroke="#E88FA8" strokeWidth="5" fill="none" />
          <path d="M60 70 Q64 98 92 108 M140 70 Q136 98 108 108" stroke="#E88FA8" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M100 108 Q88 100 86 112 Q94 116 100 108 Q106 116 114 112 Q112 100 100 108Z" fill="#E88FA8" stroke={O} strokeWidth="1.2" />
          <circle cx="132" cy="44" r="5" fill="#FF8FB1" stroke={O} strokeWidth="1.2" />
          <circle cx="124" cy="40" r="4" fill="#FFF8EE" stroke={O} strokeWidth="1.2" />
        </g>
      );
    case "featherband":
      return (
        <g>
          <path d="M124 44 Q148 8 140 -4 Q152 20 130 42Z" fill="#F7F3EA" {...S} />
          <path d="M128 40 Q140 20 141 2" stroke="#D8CFBF" strokeWidth="1.2" fill="none" />
          <path d="M61 48 Q100 36 139 48" stroke="#111" strokeWidth="5" fill="none" strokeLinecap="round" />
          {[72, 86, 100, 114].map((x) => <circle key={x} cx={x} cy={x === 100 || x === 86 ? 41.5 : 43.5} r="1.6" fill="#E8D7A9" />)}
          <circle cx="126" cy="44" r="5" fill="#2E7D6B" stroke="#E0B84A" strokeWidth="2" />
        </g>
      );
    case "boater":
      return (
        <g>
          <ellipse cx="100" cy="40" rx="54" ry="9" fill="#EAD08A" {...S} />
          <path d="M72 40 L72 20 Q100 14 128 20 L128 40Z" fill="#F0D98F" {...S} />
          <rect x="72" y="30" width="56" height="7" fill="#1A237E" />
          <path d="M76 24 L124 24" stroke="#D9B44A" strokeWidth="1.2" />
        </g>
      );
    case "fedora":
      return (
        <g>
          <path d="M40 44 Q100 30 160 44 Q150 56 100 52 Q50 56 40 44Z" fill="#6D4C41" {...S} />
          <path d="M70 42 Q70 14 100 16 Q130 14 130 42Z" fill="#7B5A4C" {...S} />
          <path d="M94 18 Q100 26 106 18" stroke={shade("#7B5A4C", -0.3)} strokeWidth="2" fill="none" />
          <rect x="70" y="33" width="60" height="7" fill="#3E2723" />
        </g>
      );
    case "pith":
      return (
        <g>
          <ellipse cx="100" cy="44" rx="56" ry="11" fill="#D9CBA8" {...S} />
          <path d="M62 44 Q62 6 100 6 Q138 6 138 44Z" fill="#E8DCC0" {...S} />
          <path d="M100 6 L100 44 M80 9 Q76 26 74 44 M120 9 Q124 26 126 44" stroke="#CDBE98" strokeWidth="1.3" fill="none" />
          <rect x="62" y="34" width="76" height="6" fill="#8D6E63" />
        </g>
      );
    default:
      return null;
  }
}

// ---------- face (head space) ----------
export function literaryFace(sp: Spec): ReactNode | null {
  switch (sp.k) {
    case "pipe":
      return (
        <g>
          <path d="M108 95 Q122 102 132 100" stroke="#5D4037" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M128 88 L140 88 L139 102 Q134 106 129 102Z" fill="#6D4C41" {...S} />
          <path d="M134 82 Q130 76 135 70 Q140 64 136 58" stroke="#C9C9D6" strokeWidth="2" fill="none" opacity="0.8" strokeLinecap="round" />
        </g>
      );
    case "eyepatch":
      return (
        <g>
          <path d="M62 54 L140 78" stroke="#1A1A1A" strokeWidth="2.6" />
          <ellipse cx="115" cy="68" rx="11" ry="9" fill="#1A1A1A" {...S} />
        </g>
      );
    default:
      return null;
  }
}

// ---------- neck / shoulder (body space) ----------
export function literaryNeck(sp: Spec): ReactNode | null {
  switch (sp.k) {
    case "pocketwatch":
      return (
        <g>
          <path d="M90 112 Q96 130 106 138" stroke="#E0B84A" strokeWidth="1.8" fill="none" strokeDasharray="2 1.5" />
          <circle cx="110" cy="146" r="9" fill="#E0B84A" {...S} />
          <circle cx="110" cy="146" r="6.2" fill="#FFF8EE" />
          <path d="M110 146 L110 141.5 M110 146 L113.5 147.5" stroke={O} strokeWidth="1.2" strokeLinecap="round" />
          <rect x="108" y="134.5" width="4" height="3" rx="1" fill="#E0B84A" stroke={O} strokeWidth="1" />
        </g>
      );
    case "parrot":
      return (
        <g>
          <path d="M132 100 L128 122 L134 124 L138 104Z" fill="#1E88E5" {...S} />
          <ellipse cx="136" cy="92" rx="10" ry="13" fill="#E53935" {...S} />
          <path d="M130 86 Q124 96 130 106 Q138 100 136 88Z" fill="#43A047" stroke={O} strokeWidth="1.4" />
          <circle cx="139" cy="76" r="8" fill="#E53935" {...S} />
          <path d="M145 74 Q152 76 148 84 Q146 80 144 80Z" fill="#FFD166" stroke={O} strokeWidth="1.3" />
          <circle cx="140.5" cy="74" r="2.6" fill="#fff" />
          <circle cx="141" cy="74" r="1.3" fill={O} />
          <path d="M130 106 L128 108 M136 106 L136 109" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

// ---------- hand items (right hand at 146,166) ----------
export function literaryHand(sp: Spec): ReactNode | null {
  switch (sp.k) {
    case "magnifier":
      return (
        <g>
          <path d="M146 168 L160 148" stroke="#6D4C41" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="167" cy="138" r="13" fill="#BFE6FF" fillOpacity="0.45" stroke="#B8860B" strokeWidth="4" />
          <path d="M160 132 Q163 128 168 128" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>
      );
    default:
      return null;
  }
}

// ---------- coats & capes (body space) ----------
const BODY = "M68 116 Q70 103 86 101 L114 101 Q130 103 132 116 L134 146 Q136 170 127 172 L73 172 Q64 170 66 146Z";
const LONGCOAT = "M68 116 Q70 103 86 101 L114 101 Q130 103 132 116 L140 198 L60 198Z";

function longSleeves(ctx: Ctx, col: string) {
  return (
    <>
      <Limb d={armL(ctx.sx, 156, ctx.up)} w={17} color={col} />
      <Limb d={armR(ctx.sx, 156, ctx.up)} w={17} color={col} />
    </>
  );
}

export function literaryOuter(sp: Spec, ctx: Ctx): ReactNode | null {
  switch (sp.k) {
    case "inverness": {
      const c = "#8B6B4A";
      const d = shade(c, -0.2);
      return (
        <g>
          {longSleeves(ctx, c)}
          <path d={LONGCOAT} fill={c} {...S} />
          <path d="M100 104 L100 198" stroke={d} strokeWidth="2" />
          {[118, 134, 150, 166, 182].map((y) => <path key={y} d={`M62 ${y} L138 ${y}`} stroke={d} strokeWidth="1.1" opacity="0.5" />)}
          <path d={ctx.up ? "M70 104 Q100 96 130 104 L136 130 Q100 138 64 130Z" : "M56 106 Q100 92 144 106 L152 152 Q100 164 48 152Z"} fill={shade(c, 0.06)} {...S} />
          {[66, 82, 100, 118, 134].map((x) => <path key={x} d={`M${x} ${ctx.up ? 102 : 100} L${x + (x - 100) * 0.12} ${ctx.up ? 134 : 156}`} stroke={d} strokeWidth="1.1" opacity="0.5" />)}
          <path d="M84 100 L100 114 L116 100" fill={d} {...S} />
        </g>
      );
    }
    case "vampcape":
      return (
        <g>
          <path d="M62 112 L46 58 L84 98Z" fill="#B71C1C" {...S} />
          <path d="M138 112 L154 58 L116 98Z" fill="#B71C1C" {...S} />
          <path d="M66 110 L54 66 L82 100Z" fill="#1A1A2E" />
          <path d="M134 110 L146 66 L118 100Z" fill="#1A1A2E" />
          {longSleeves(ctx, "#1A1A2E")}
          <path d="M70 104 L36 216 Q100 228 164 216 L130 104Z" fill="#1A1A2E" {...S} />
          <path d="M70 104 L36 216 L48 217 L80 108Z" fill="#B71C1C" />
          <path d="M130 104 L164 216 L152 217 L120 108Z" fill="#B71C1C" />
          <path d={BODY} fill="#26263A" {...S} />
          <path d="M88 102 L100 132 L112 102Z" fill="#FFFFFF" stroke={O} strokeWidth="1.5" />
          <circle cx="100" cy="124" r="5" fill="#B71C1C" stroke="#E0B84A" strokeWidth="2" />
        </g>
      );
    case "piratecoat": {
      const c = "#8E1B1B";
      return (
        <g>
          {longSleeves(ctx, c)}
          {!ctx.up && <><rect x={46 + ctx.sx} y="146" width="18" height="10" rx="3" fill="#E0B84A" stroke={O} strokeWidth="1.4" /><rect x={136 - ctx.sx} y="146" width="18" height="10" rx="3" fill="#E0B84A" stroke={O} strokeWidth="1.4" /></>}
          <path d="M68 116 Q70 103 86 101 L92 101 L92 198 L60 198Z" fill={c} {...S} />
          <path d="M132 116 Q130 103 114 101 L108 101 L108 198 L140 198Z" fill={c} {...S} />
          <path d="M92 102 L92 198 M108 102 L108 198" stroke="#E0B84A" strokeWidth="2.5" />
          {[118, 132, 146].map((y) => <g key={y}><circle cx="86" cy={y} r="2.6" fill="#E0B84A" /><circle cx="114" cy={y} r="2.6" fill="#E0B84A" /></g>)}
          <rect x="62" y="156" width="76" height="8" fill="#3E2723" />
          <rect x="93" y="154" width="14" height="12" rx="2" fill="none" stroke="#E0B84A" strokeWidth="2.5" />
        </g>
      );
    }
    case "tailcoat": {
      const c = "#1F2A44";
      return (
        <g>
          <path d="M78 150 L70 202 L94 196 L96 150Z" fill={shade(c, -0.15)} {...S} />
          <path d="M122 150 L130 202 L106 196 L104 150Z" fill={shade(c, -0.15)} {...S} />
          {longSleeves(ctx, c)}
          <path d="M68 116 Q70 103 86 101 L94 101 L94 152 L70 152 Q66 146 66 140Z" fill={c} {...S} />
          <path d="M132 116 Q130 103 114 101 L106 101 L106 152 L130 152 Q134 146 134 140Z" fill={c} {...S} />
          <path d="M90 102 Q100 116 110 102 L107 120 Q100 125 93 120Z" fill="#FFFFFF" stroke={O} strokeWidth="1.5" />
          <path d="M80 100 L92 104 L90 126 Z M120 100 L108 104 L110 126Z" fill={shade(c, 0.12)} stroke={O} strokeWidth="1.3" />
          {[132, 144].map((y) => <g key={y}><circle cx="98" cy={y} r="2" fill="#E0B84A" /><circle cx="102" cy={y} r="2" fill="#E0B84A" /></g>)}
        </g>
      );
    }
    case "creamsuit": {
      const c = "#F1E6CC";
      return (
        <g>
          {longSleeves(ctx, c)}
          <path d={BODY} fill={c} {...S} />
          <path d="M88 102 L100 140 L112 102Z" fill="#FFFFFF" stroke={O} strokeWidth="1.4" />
          <path d="M98 106 L102 106 L104 134 L100 140 L96 134Z" fill="#8D6E63" stroke={O} strokeWidth="1.2" />
          <path d="M84 100 L100 142 L92 104Z M116 100 L100 142 L108 104Z" fill={shade(c, -0.1)} stroke={O} strokeWidth="1.4" />
          <path d="M116 122 L126 120 L126 126 L116 127Z" fill="#E88FA8" />
          <circle cx="100" cy="150" r="2" fill="#B8A98A" />
          <circle cx="100" cy="160" r="2" fill="#B8A98A" />
          <path d="M124 104 Q130 106 132 116 L134 146 Q136 170 127 172 L119 172 Q127 140 124 104Z" fill="#000" opacity="0.06" />
        </g>
      );
    }
    default:
      return null;
  }
}

// ---------- dresses (body space) ----------
export function literaryDress(sp: Spec, ctx: Ctx): ReactNode | null {
  switch (sp.k) {
    case "aliceDress": {
      const c = "#6FA8DC";
      return (
        <g>
          <Limb d={`M${74 + ctx.sx} 110 Q${66 + ctx.sx} 117 ${62 + ctx.sx} 126`} w={22} color={c} />
          <Limb d={`M${126 - ctx.sx} 110 Q${134 - ctx.sx} 117 ${138 - ctx.sx} 126`} w={22} color={c} />
          <path d="M68 116 Q70 103 86 101 L114 101 Q130 103 132 116 L134 148 L146 198 Q100 206 54 198 L66 148Z" fill={c} {...S} />
          <path d="M84 104 Q100 112 116 104 L115 146 L85 146Z" fill="#FFFFFF" stroke={O} strokeWidth="1.6" />
          <path d="M78 146 L122 146 L132 194 Q100 200 68 194Z" fill="#FFFFFF" {...S} />
          <path d="M70 190 Q74 196 78 191 Q82 197 86 192 Q90 198 94 192 Q98 198 102 192 Q106 198 110 192 Q114 197 118 191 Q122 196 126 191 Q129 195 131 190" stroke={O} strokeWidth="1.3" fill="none" />
          <path d="M86 104 L80 104 M114 104 L120 104" stroke="#FFFFFF" strokeWidth="4" />
          <path d="M90 101 Q100 108 110 101" stroke={O} strokeWidth="1.6" fill="none" />
        </g>
      );
    }
    case "flapper": {
      const c = sp.c ?? "#C9A227";
      return (
        <g>
          <path d="M80 102 L84 102 L86 112 L80 112Z M120 102 L116 102 L114 112 L120 112Z" fill={c} />
          <path d="M76 110 Q100 104 124 110 L130 170 L70 170Z" fill={c} {...S} />
          <g fill="#fff" opacity="0.55">{Array.from({ length: 18 }, (_, i) => <circle key={i} cx={78 + (i % 6) * 9 + (Math.floor(i / 6) % 2) * 4} cy={120 + Math.floor(i / 6) * 16} r="1.3" />)}</g>
          <path d="M70 166 L130 166" stroke={shade(c, -0.35)} strokeWidth="3" />
          {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${71 + i * 3.8} 168 L${70 + i * 3.8 + (i % 2)} 198`} stroke={shade(c, i % 2 ? -0.15 : 0.1)} strokeWidth="2.6" strokeLinecap="round" />)}
          <path d="M86 112 Q100 120 114 112" stroke="#fff" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M92 104 Q100 124 108 104" stroke="#F5F0E6" strokeWidth="2.4" fill="none" strokeDasharray="0.1 4" strokeLinecap="round" />
        </g>
      );
    }
    case "regency": {
      const c = sp.c ?? "#EAF2FB";
      return (
        <g>
          <Limb d={`M${74 + ctx.sx} 110 Q${66 + ctx.sx} 116 ${62 + ctx.sx} 122`} w={20} color={c} />
          <Limb d={`M${126 - ctx.sx} 110 Q${134 - ctx.sx} 116 ${138 - ctx.sx} 122`} w={20} color={c} />
          <path d="M74 112 Q76 102 88 101 L112 101 Q124 102 126 112 L127 128 L73 128Z" fill={c} {...S} />
          <path d="M73 128 L127 128 L146 214 Q100 224 54 214Z" fill={c} {...S} />
          <rect x="72" y="125" width="56" height="6" rx="2" fill="#8FB3DE" stroke={O} strokeWidth="1.2" />
          <path d="M86 132 L80 210 M100 132 L100 214 M114 132 L120 210" stroke={shade(c, -0.12)} strokeWidth="1.5" />
          <path d="M88 102 Q100 112 112 102" stroke={O} strokeWidth="1.5" fill="none" />
        </g>
      );
    }
    default:
      return null;
  }
}
