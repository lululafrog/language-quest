// Atlas destination rewards drawn on the avatar (same art direction as Tourist.tsx:
// warm soft outline, flat colours, a light shading pass). Each function returns null for
// kinds it doesn't know so Tourist.tsx can fall back to its own renderers.
import type { ReactNode } from "react";
import type { Spec } from "@/lib/data/shop";
import { O, W, shade, type Ctx } from "./style";

const S = { stroke: O, strokeWidth: W, strokeLinejoin: "round" as const };

// ---------- hats (head coordinate space, see literary.tsx) ----------
export function atlasHat(sp: Spec): ReactNode | null {
  const c = sp.c ?? "#7A6A55";
  switch (sp.k) {
    case "flatcap":
      // tweed flat cap: low crown pulled forward over a short stiff brim
      return (
        <g>
          <path d="M60 48 Q58 22 96 18 Q132 16 140 40 L142 48Z" fill={c} {...S} />
          <path d="M112 40 Q140 34 158 46 Q150 54 126 52 Q112 50 112 40Z" fill={shade(c, -0.18)} {...S} />
          <path d="M62 44 Q96 30 140 40" stroke={shade(c, -0.25)} strokeWidth="1.6" fill="none" />
          <g stroke={shade(c, 0.25)} strokeWidth="1" opacity="0.55">
            {[26, 32, 38].map((y) => <path key={y} d={`M${66 + (38 - y) * 0.6} ${y} L${132 - (38 - y) * 0.3} ${y - 4}`} />)}
          </g>
          <circle cx="98" cy="20" r="2.2" fill={shade(c, -0.3)} />
        </g>
      );
    case "ranger": {
      // campaign hat: wide flat brim, crown with four pinches ("Montana peak")
      const band = sp.c2 ?? "#5A3A1E";
      return (
        <g>
          <ellipse cx="100" cy="44" rx="66" ry="11" fill={shade(c, -0.08)} {...S} />
          <path d="M70 44 L76 18 L92 10 L100 4 L108 10 L124 18 L130 44Z" fill={c} {...S} />
          <path d="M100 4 L100 40 M88 12 L94 38 M112 12 L106 38" stroke={shade(c, -0.22)} strokeWidth="1.5" fill="none" />
          <rect x="70" y="35" width="60" height="7" fill={band} stroke={O} strokeWidth="1.4" />
          <path d="M46 46 Q100 56 154 46" stroke={shade(c, -0.25)} strokeWidth="1.4" fill="none" />
        </g>
      );
    }
    default:
      return null;
  }
}

// ---------- glasses ----------
export function atlasGlasses(sp: Spec): ReactNode | null {
  if (sp.k !== "glSki") return null;
  const c = sp.c ?? "#E9C46A";
  return (
    <g>
      <defs>
        <linearGradient id="atlas-ski-lens" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4A261" />
          <stop offset="0.55" stopColor="#E76F51" />
          <stop offset="1" stopColor="#4C6E8A" />
        </linearGradient>
      </defs>
      <path d="M56 66 L64 66 M136 66 L144 66" stroke={sp.c2 ?? "#2B3A55"} strokeWidth="8" strokeLinecap="round" />
      <path d="M64 58 Q64 52 72 52 L128 52 Q136 52 136 58 L136 76 Q136 84 126 84 L112 84 Q104 84 100 78 Q96 84 88 84 L74 84 Q64 84 64 76Z" fill={c} {...S} />
      <path d="M69 60 Q69 57 73 57 L127 57 Q131 57 131 60 L131 74 Q131 79 125 79 L112 79 Q105 79 100 73 Q95 79 88 79 L75 79 Q69 79 69 74Z" fill="url(#atlas-ski-lens)" stroke={O} strokeWidth="1.2" />
      <path d="M76 62 L90 60" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </g>
  );
}

// ---------- tops ----------
export function atlasTop(sp: Spec, ctx: Ctx): ReactNode | null {
  if (sp.k !== "batik") return null;
  const c = sp.c ?? "#6B4A2E";
  const c2 = sp.c2 ?? "#E6D2A8";
  const pid = `${ctx.uid}batik`;
  return (
    <g>
      <defs>
        {/* diagonal wave rows inspired by batik motifs (a respectful, generic pattern) */}
        <pattern id={pid} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <rect width="16" height="16" fill={c} />
          <path d="M0 8 Q4 2 8 8 T16 8" stroke={c2} strokeWidth="2.2" fill="none" />
          <circle cx="8" cy="13.5" r="1.3" fill={c2} />
          <circle cx="0" cy="13.5" r="1.3" fill={c2} />
          <circle cx="16" cy="13.5" r="1.3" fill={c2} />
        </pattern>
      </defs>
      <path d={ctx.torso} fill={`url(#${pid})`} stroke={O} strokeWidth={W} strokeLinejoin="round" />
      <path d="M86 101 L100 120 L114 101 L109 98 L100 110 L91 98Z" fill={shade(c, -0.15)} stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M100 120 L100 172" stroke={shade(c, -0.3)} strokeWidth="1.4" />
      {[130, 142, 154, 166].map((y) => <circle key={y} cx="103" cy={y} r="1.6" fill={c2} stroke={O} strokeWidth="0.6" />)}
      <path d="M122 118 Q130 140 126 166" stroke="#000" strokeWidth="7" opacity="0.07" fill="none" />
    </g>
  );
}

// ---------- dresses ----------
export const ATLAS_LONG_DRESSES = ["yukata"];

export function atlasDress(sp: Spec, ctx: Ctx): ReactNode | null {
  if (sp.k !== "yukata") return null;
  const c = sp.c ?? "#2B3A55";
  const c2 = sp.c2 ?? "#E9C46A";
  const pid = `${ctx.uid}yukata`;
  return (
    <g>
      <defs>
        <pattern id={pid} width="18" height="18" patternUnits="userSpaceOnUse">
          <rect width="18" height="18" fill={c} />
          <path d="M2 12 Q5 8 8 12 Q11 8 14 12" stroke="#F3E9D2" strokeWidth="1.3" fill="none" opacity="0.75" />
          <circle cx="13" cy="4" r="1.4" fill="#F3E9D2" opacity="0.7" />
        </pattern>
      </defs>
      {/* wide sleeves hanging from the shoulders */}
      <path d={`M${76 + ctx.sx} 104 Q${60 + ctx.sx} 110 ${56 + ctx.sx} 124 L${54 + ctx.sx} 150 Q${62 + ctx.sx} 156 ${72 + ctx.sx} 150 L${74 + ctx.sx} 132Z`} fill={`url(#${pid})`} {...S} />
      <path d={`M${124 - ctx.sx} 104 Q${140 - ctx.sx} 110 ${144 - ctx.sx} 124 L${146 - ctx.sx} 150 Q${138 - ctx.sx} 156 ${128 - ctx.sx} 150 L${126 - ctx.sx} 132Z`} fill={`url(#${pid})`} {...S} />
      {/* straight robe down to the ankles */}
      <path d="M70 114 Q72 102 88 100 L112 100 Q128 102 130 114 L134 150 L138 214 Q100 220 62 214 L66 150Z" fill={`url(#${pid})`} {...S} />
      {/* collar: the wearer's LEFT panel overlaps the right — seen from the front, the edge runs from the
          viewer's right side of the neck down to the viewer's left (a "y" shape) */}
      <path d="M90 100 L100 114 L110 100" stroke="#F3E9D2" strokeWidth="4" fill="none" strokeLinejoin="round" />
      <path d="M110 100 L84 150" stroke={O} strokeWidth="2.2" fill="none" />
      <path d="M108 101 L83 148" stroke="#F3E9D2" strokeWidth="3" fill="none" opacity="0.9" />
      <path d="M84 150 L80 214" stroke={shade(c, -0.35)} strokeWidth="1.6" />
      {/* obi sash */}
      <path d="M66 136 Q100 142 134 136 L134 152 Q100 158 66 152Z" fill={c2} {...S} />
      <path d="M67 144 Q100 150 133 144" stroke={shade(c2, -0.25)} strokeWidth="1.3" fill="none" />
      <path d="M124 150 L130 210" stroke="#000" strokeWidth="8" opacity="0.07" />
    </g>
  );
}

// ---------- neck ----------
export function atlasNeck(sp: Spec): ReactNode | null {
  if (sp.k !== "tenugui") return null;
  const c = sp.c ?? "#2F4A6B";
  return (
    <g>
      {/* a cotton hand towel draped around the neck */}
      <path d="M74 104 Q100 120 126 104 L126 112 Q100 128 74 112Z" fill={c} {...S} />
      <path d="M76 108 L72 146 L86 146 L86 114Z" fill={c} {...S} />
      <path d="M124 108 L128 146 L114 146 L114 114Z" fill={c} {...S} />
      <g fill="#F3E9D2" opacity="0.85">
        {[[78, 122], [82, 134], [120, 122], [118, 134], [100, 116]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.8" />)}
      </g>
      <path d="M72 142 L86 142 M114 142 L128 142" stroke="#F3E9D2" strokeWidth="1.4" />
    </g>
  );
}

// ---------- hand items (right hand ≈ 146,166 in body space) ----------
export function atlasHand(sp: Spec): ReactNode | null {
  switch (sp.k) {
    case "duffel": {
      const c = sp.c ?? "#3F6B4F";
      return (
        <g>
          <path d="M140 172 Q146 158 152 172 M156 172 Q162 158 168 172" stroke={shade(c, -0.4)} strokeWidth="3" fill="none" />
          <rect x="128" y="170" width="52" height="30" rx="13" fill={c} {...S} />
          <path d="M132 184 L176 184" stroke={shade(c, -0.25)} strokeWidth="1.6" strokeDasharray="3 3" />
          <rect x="146" y="176" width="16" height="8" rx="2" fill={sp.c2 ?? "#E9C46A"} stroke={O} strokeWidth="1.2" />
          <path d="M134 176 Q140 172 146 174" stroke="#fff" strokeWidth="2" opacity="0.35" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    case "fins": {
      const c = sp.c ?? "#E9C46A";
      return (
        <g>
          {[[-6, -6], [6, 4]].map(([dx, r], i) => (
            <g key={i} transform={`rotate(${r} ${148 + dx} 168)`}>
              <path d={`M${141 + dx} 164 L${155 + dx} 164 L${160 + dx} 214 Q${148 + dx} 220 ${136 + dx} 214Z`} fill={i ? c : shade(c, -0.15)} {...S} />
              <path d={`M${148 + dx} 172 L${148 + dx} 212 M${142 + dx} 180 L${140 + dx} 210 M${154 + dx} 180 L${156 + dx} 210`} stroke={shade(c, -0.35)} strokeWidth="1.2" />
              <rect x={141 + dx} y="160" width="14" height="10" rx="4" fill="#37474F" stroke={O} strokeWidth="1.4" />
            </g>
          ))}
        </g>
      );
    }
    case "poles":
      return (
        <g>
          {[-5, 6].map((dx, i) => (
            <g key={i}>
              <path d={`M${146 + dx} 150 L${150 + dx * 2.4} 224`} stroke="#8A93A3" strokeWidth="3.6" strokeLinecap="round" />
              <path d={`M${146 + dx} 150 L${146.8 + dx * 1.3} 164`} stroke={sp.c ?? "#C9785A"} strokeWidth="6.5" strokeLinecap="round" />
              <circle cx={150 + dx * 2.4} cy="214" r="3.2" fill="none" stroke={O} strokeWidth="1.3" />
            </g>
          ))}
        </g>
      );
    case "keepcup": {
      const c = sp.c ?? "#7F9C7A";
      return (
        <g>
          <path d="M137 152 L157 152 L154 178 L140 178Z" fill="#F4EBDD" {...S} />
          <path d="M138 160 L156 160 L155 168 L139 168Z" fill={c} stroke={O} strokeWidth="1.2" />
          <rect x="135" y="146" width="24" height="7" rx="3" fill={shade(c, -0.25)} {...S} />
          <path d="M150 146 L150 142" stroke={O} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    }
    default:
      return null;
  }
}

// ---------- decor: the learner's room with one souvenir object ----------
/** Background kind "room": the home room + a decor object (sp.t). */
export function atlasRoom(sp: Spec): ReactNode | null {
  if (sp.k !== "room") return null;
  const t = sp.t ?? "";
  const wallItem = ["fiord", "papyrus", "penguin", "roadmap", "sakura"].includes(t);
  const floorItem = ["lemon", "tropical", "surfboard", "surfwall", "coffee", "teaset", "sakura"].includes(t);
  return (
    <>
      <rect width="200" height="240" fill="#F4EBDD" />
      <rect y="190" width="200" height="50" fill="#E6D6BF" />
      <path d="M0 190 L200 190" stroke="#D8C4A6" strokeWidth="2" />
      <rect x="18" y="28" width="54" height="50" rx="6" fill="#DCE9EE" stroke="#A9BFA0" strokeWidth="4" />
      <path d="M45 28 L45 78 M18 54 L72 54" stroke="#A9BFA0" strokeWidth="3" />
      <path d="M24 72 Q36 62 48 70 Q58 64 66 72" stroke="#FBF7F0" strokeWidth="3" fill="none" opacity="0.8" />
      {!wallItem && (
        <>
          <rect x="140" y="40" width="40" height="28" rx="2" fill="#FBF7F0" stroke="#D8C4A6" strokeWidth="2" transform="rotate(-4 160 54)" />
          <path d="M146 58 Q154 46 162 54 Q168 48 174 56" stroke="#C9785A" strokeWidth="2" fill="none" />
        </>
      )}
      {!floorItem && (
        <>
          <rect x="150" y="160" width="22" height="30" rx="4" fill="#C9785A" />
          <path d="M161 160 Q150 136 140 132 M161 160 Q160 134 166 124 M161 160 Q174 140 182 138" stroke="#7F9C7A" strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      )}
      {decorObject(t)}
    </>
  );
}

function frame(children: ReactNode, x = 134, y = 30, w = 54, h = 40) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="2" fill="#8C6A4A" />
      <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} fill="#FBF7F0" />
      <g>{children}</g>
    </g>
  );
}

function decorObject(t: string): ReactNode {
  const s = { stroke: O, strokeWidth: 1.5, strokeLinejoin: "round" as const };
  switch (t) {
    case "teaset": // small side table with a teapot and cups
      return (
        <g>
          <rect x="146" y="160" width="44" height="6" rx="2" fill="#8C6A4A" {...s} />
          <path d="M152 166 L150 190 M184 166 L186 190" stroke="#8C6A4A" strokeWidth="4" strokeLinecap="round" />
          <path d="M156 160 Q154 142 166 140 Q178 142 176 160Z" fill="#FBF7F0" {...s} />
          <path d="M176 148 Q184 146 182 156" stroke={O} strokeWidth="1.5" fill="none" />
          <path d="M156 150 Q148 146 146 140" stroke={O} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="166" cy="138" r="2.5" fill="#7F9C7A" stroke={O} strokeWidth="1" />
          <path d="M160 150 L172 150" stroke="#7F9C7A" strokeWidth="2" />
          <path d="M180 158 L188 158 L187 152 L181 152Z" fill="#FBF7F0" {...s} />
        </g>
      );
    case "surfboard":
    case "surfwall": // surfboard leaning against the wall
      return (
        <g transform="rotate(-10 166 130)">
          <path d="M166 52 Q180 100 176 196 Q166 206 156 196 Q152 100 166 52Z" fill={t === "surfwall" ? "#F3E9D2" : "#E9C46A"} {...s} />
          <path d="M166 56 L166 198" stroke={t === "surfwall" ? "#C9785A" : "#4C8DA8"} strokeWidth="2.5" />
          <path d="M158 160 Q166 166 174 160" stroke={t === "surfwall" ? "#C9785A" : "#4C8DA8"} strokeWidth="2" fill="none" />
        </g>
      );
    case "tropical": // pot of tropical leaves + frangipani
      return (
        <g>
          <path d="M150 190 L154 166 L178 166 L182 190Z" fill="#C9785A" {...s} />
          <path d="M166 166 Q150 140 136 138 Q150 132 166 156 M166 166 Q168 128 176 116 Q182 132 168 160 M166 166 Q188 146 196 146 Q190 158 170 164" fill="#6F8F6A" {...s} />
          {[[146, 140], [178, 120]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              {[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-4" rx="2.6" ry="4.5" fill="#FBF7F0" stroke={O} strokeWidth="0.8" transform={`rotate(${r})`} />)}
              <circle r="2" fill="#E9C46A" />
            </g>
          ))}
        </g>
      );
    case "lantern": // silk lanterns hanging from the ceiling
      return (
        <g>
          {[[140, 36, "#C2573A"], [164, 50, "#E9C46A"], [186, 32, "#3F6B4F"]].map(([x, y, col], i) => (
            <g key={i}>
              <path d={`M${x} 0 L${x} ${Number(y) - 12}`} stroke={O} strokeWidth="1.2" />
              <rect x={Number(x) - 5} y={Number(y) - 13} width="10" height="4" fill="#8C6A4A" {...s} />
              <ellipse cx={x} cy={y} rx="11" ry="13" fill={String(col)} {...s} />
              <path d={`M${Number(x) - 6} ${Number(y) - 10} Q${Number(x) - 9} ${y} ${Number(x) - 6} ${Number(y) + 10} M${Number(x) + 6} ${Number(y) - 10} Q${Number(x) + 9} ${y} ${Number(x) + 6} ${Number(y) + 10}`} stroke="#000" strokeWidth="0.8" opacity="0.25" fill="none" />
              <path d={`M${x} ${Number(y) + 13} L${x} ${Number(y) + 20}`} stroke={String(col)} strokeWidth="2" />
            </g>
          ))}
        </g>
      );
    case "sakura": // paper lantern with cherry-blossom print + branch in a vase
      return (
        <g>
          <path d="M150 190 L154 170 L170 170 L174 190Z" fill="#E6E0D4" {...s} />
          <path d="M162 170 Q160 140 146 120 M160 146 Q172 134 186 132" stroke="#6B4A3A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {[[146, 120], [152, 132], [174, 134], [186, 132], [160, 142]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#F4C7CF" stroke={O} strokeWidth="0.8" />)}
          <path d="M164 0 L164 34" stroke={O} strokeWidth="1.2" />
          <rect x="150" y="34" width="28" height="40" rx="12" fill="#FBF7F0" {...s} />
          <path d="M152 44 L176 44 M152 64 L176 64" stroke="#C9B9A3" strokeWidth="1" />
          <circle cx="159" cy="52" r="3.4" fill="#F4C7CF" />
          <circle cx="169" cy="57" r="2.8" fill="#F4C7CF" />
          <rect x="158" y="74" width="12" height="4" fill="#8C6A4A" {...s} />
        </g>
      );
    case "coffee": // little drip-coffee corner: stool + table + filter cup
      return (
        <g>
          <rect x="146" y="166" width="40" height="5" rx="2" fill="#4C6E8A" {...s} />
          <path d="M150 171 L148 190 M182 171 L184 190" stroke="#4C6E8A" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M156 166 L170 166 L168 152 L158 152Z" fill="#FBF7F0" {...s} />
          <rect x="155" y="144" width="16" height="8" rx="1.5" fill="#B0B7C3" {...s} />
          <path d="M159 140 Q157 134 161 130 M166 140 Q164 134 168 130" stroke="#A09FC0" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <rect x="174" y="158" width="10" height="8" rx="1" fill="#C9785A" {...s} />
        </g>
      );
    case "lemon": // potted lemon tree
      return (
        <g>
          <path d="M150 190 L154 168 L178 168 L182 190Z" fill="#C9785A" {...s} />
          <path d="M166 168 L166 128" stroke="#6B4A3A" strokeWidth="3.5" />
          <circle cx="166" cy="116" r="24" fill="#6F8F6A" {...s} />
          {[[154, 108], [174, 104], [162, 124], [180, 120], [150, 122]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="4" ry="3.2" fill="#F2D16B" stroke={O} strokeWidth="0.9" />)}
        </g>
      );
    case "roadmap":
      return frame(
        <g>
          <path d="M142 62 Q150 44 160 52 Q170 60 180 38" stroke="#C2573A" strokeWidth="2" strokeDasharray="3 2" fill="none" />
          <circle cx="142" cy="62" r="2.4" fill="#2B3A55" />
          <circle cx="180" cy="38" r="2.4" fill="#2B3A55" />
          <path d="M146 40 L156 46 M168 58 L176 62" stroke="#A9BFA0" strokeWidth="3" strokeLinecap="round" />
        </g>,
        134, 28, 54, 42,
      );
    case "fiord":
      return frame(
        <g>
          <rect x="138" y="34" width="46" height="32" fill="#DCE9EE" />
          <path d="M138 66 L138 46 L150 36 L160 50 L166 42 L184 60 L184 66Z" fill="#6F8F6A" />
          <path d="M152 66 Q160 56 172 66Z" fill="#4C8DA8" />
          <path d="M148 40 L150 36 L152 40Z" fill="#FBF7F0" />
        </g>,
      );
    case "papyrus": // papyrus-style print (Nile, reeds, boat)
      return frame(
        <g>
          <rect x="138" y="34" width="46" height="32" fill="#EFDDB3" />
          <path d="M140 58 Q162 54 182 58" stroke="#4C8DA8" strokeWidth="2" fill="none" />
          <path d="M152 54 Q160 58 170 54 L168 50 L154 50Z" fill="#8C6A4A" />
          <path d="M160 50 L160 40 L166 48Z" fill="#FBF7F0" stroke={O} strokeWidth="0.6" />
          {[142, 146, 178, 182].map((x) => <path key={x} d={`M${x} 64 L${x} 44 M${x} 44 l-3 -3 M${x} 44 l3 -3`} stroke="#3F6B4F" strokeWidth="1.1" />)}
        </g>,
      );
    case "penguin":
      return frame(
        <g>
          <rect x="138" y="34" width="46" height="32" fill="#E8F1F4" />
          <path d="M138 60 Q160 56 184 60 L184 66 L138 66Z" fill="#E6D6BF" />
          <ellipse cx="161" cy="52" rx="7" ry="10" fill="#2F2A28" />
          <ellipse cx="161" cy="54" rx="4.5" ry="7.5" fill="#FBF7F0" />
          <circle cx="161" cy="41" r="4.5" fill="#2F2A28" />
          <path d="M164 41 L169 42 L164 43Z" fill="#E9C46A" />
        </g>,
      );
    default:
      return null;
  }
}
