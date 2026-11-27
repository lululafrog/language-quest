// The learner's tourist, drawn in SVG: chosen appearance + items bought in the shop.
import { useId, type ReactNode } from "react";
import { SHOP_BY_ID, type Spec } from "@/lib/data/shop";
import type { Appearance, AvatarSlot } from "@/lib/types";

const O = "#3A3352"; // soft outline ink
const W = 1.9; // outline width
// The head is drawn in its own coordinate space, then scaled down onto the neck (more human proportions).
const HEAD_T = "translate(100 94) scale(0.78) translate(-100 -108)";
const FACES: Record<NonNullable<Appearance["face"]>, string> = {
  oval: "M62 62 Q62 24 100 24 Q138 24 138 62 Q138 86 126 98 Q114 108 100 108 Q86 108 74 98 Q62 86 62 62Z",
  round: "M61 64 Q61 24 100 24 Q139 24 139 64 Q139 104 100 106 Q61 104 61 64Z",
  square: "M63 60 Q63 24 100 24 Q137 24 137 60 L136 86 Q134 102 118 106 L82 106 Q66 102 64 86Z",
  heart: "M61 58 Q61 24 100 24 Q139 24 139 58 Q139 80 123 96 Q110 108 100 110 Q90 108 77 96 Q61 80 61 58Z",
};

export const DEFAULT_APPEARANCE: Appearance = {
  gender: "male", skin: "#F9CFA8", hair: "short", hairColor: "#6B4226", face: "oval", eyes: "round", eyeColor: "#5D4037",
  brows: "normal", nose: "small", lips: "normal", facialHair: "none", freckles: false, makeup: "none", beard: false,
};

type Equipped = Partial<Record<AvatarSlot, string>>;

/** Darken (amt < 0) or lighten (amt > 0) a hex colour. */
export function shade(hex: string, amt: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt));
  return `#${ch.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

export function Tourist({ equipped = {}, appearance, className, animate = true, title, portrait }: { equipped?: Equipped; appearance?: Appearance; className?: string; animate?: boolean; title?: string; portrait?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const a = { ...DEFAULT_APPEARANCE, ...(appearance ?? {}) };
  const spec = (slot: AvatarSlot): Spec | undefined => {
    const id = equipped[slot];
    return id ? SHOP_BY_ID.get(id)?.spec : undefined;
  };
  const fem = a.gender === "female";
  const ctx: Ctx = { uid, a, skinShade: shade(a.skin, -0.16), fem, sx: fem ? 4 : 0, torso: fem ? TORSO_FEM : TORSO, facePath: FACES[a.face ?? "oval"] };
  const hat = spec("hat"), glasses = spec("glasses"), face = spec("face"), top = spec("top"), outer = spec("outer"), dress = spec("dress");
  const bottom = spec("bottom"), shoes = spec("shoes"), bag = spec("bag"), neck = spec("neck"), hand = spec("hand");
  const bg = spec("background") ?? { k: "home" };
  const topSpec: Spec = top ?? { k: "tee", c: "#FFFFFF" };
  const longSleeves = outer && ["jacket", "puffer", "trench", "tuxedo"].includes(outer.k);
  const sleeveColor = longSleeves ? outer!.c ?? "#1A1740" : dress ? undefined : topSpec.k === "tank" ? undefined : topSpec.c;

  return (
    <svg viewBox={portrait ? "52 8 96 96" : "0 0 200 240"} className={className} role="img" aria-label={title ?? "Ton touriste"}>
      <defs>
        <clipPath id={`${uid}clip`}><rect width="200" height="240" rx="28" /></clipPath>
        <radialGradient id={`${uid}skin`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor={shade(a.skin, 0.12)} />
          <stop offset="1" stopColor={a.skin} />
        </radialGradient>
        <linearGradient id={`${uid}gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${uid}clip)`}>
        {renderBackground(bg, uid)}
        <ellipse cx="100" cy="226" rx="50" ry="7" fill="#000" opacity="0.13" />
        <g className={animate ? "tourist-bob" : undefined}>
          <g transform="translate(0 -10)">
          {bag?.k === "backpack" && backpackBack(bag)}
          {hand?.k === "suitcase" && handItem(hand)}
          {hand?.k === "umbrella" && handItem(hand)}
          <g transform={HEAD_T}>{hairBack(a)}</g>
          </g>
          {/* longer legs: stretched from the ground up */}
          <g transform="translate(0 214) scale(1 1.22) translate(0 -214)">
          {/* legs */}
          <Limb d={LEG_L} w={15} color={a.skin} />
          <Limb d={LEG_R} w={15} color={a.skin} />
          {!dress && renderBottom(bottom ?? { k: "shorts", c: "#7AA6C2" }, ctx)}
          </g>
          {renderShoes(shoes ?? { k: "sneakers", c: "#FFFFFF", c2: "#CFCCFF" })}
          <g transform="translate(0 -10)">
          {dress?.k === "dressLong" && renderDress(dress, ctx)}
          {/* arms */}
          <Limb d={armL(ctx.sx)} w={ctx.fem ? 12 : 13} color={a.skin} />
          <Limb d={armR(ctx.sx)} w={ctx.fem ? 12 : 13} color={a.skin} />
          <path d="M64 124 Q59 136 57 150" stroke="#fff" strokeWidth="2.5" opacity="0.28" fill="none" strokeLinecap="round" />
          {sleeveColor && !longSleeves && (
            <>
              <Limb d={sleeveL(ctx.sx)} w={ctx.fem ? 15 : 18} color={sleeveColor} />
              <Limb d={sleeveR(ctx.sx)} w={ctx.fem ? 15 : 18} color={sleeveColor} />
            </>
          )}
          {dress ? (dress.k !== "dressLong" ? renderDress(dress, ctx) : null) : renderTop(topSpec, ctx)}
          {outer && renderOuter(outer, ctx)}
          <Hand cx={54 + ctx.sx} cy={166} skin={a.skin} />
          <Hand cx={146 - ctx.sx} cy={166} flip skin={a.skin} />
          {bag && bag.k !== "backpack" && renderBag(bag)}
          {bag?.k === "backpack" && <path d="M80 104 L82 150 M120 104 L118 150" stroke={shade(bag.c ?? "#FF7043", -0.35)} strokeWidth={6} strokeLinecap="round" />}
          {hand?.k === "duck" && handItem(hand)}
          {neck && renderNeck(neck)}
          {/* neck + head */}
          <path d="M91 84 L109 84 L110 104 Q100 110 90 104Z" fill={a.skin} stroke={O} strokeWidth={W} />
          <path d="M91 92 Q100 100 109 92 L109 98 Q100 104 91 98Z" fill={ctx.skinShade} opacity="0.7" />
          <g transform={HEAD_T}>
            <ellipse cx="61" cy="70" rx="8" ry="11" fill={a.skin} stroke={O} strokeWidth={W} />
            <ellipse cx="139" cy="70" rx="8" ry="11" fill={a.skin} stroke={O} strokeWidth={W} />
            <path d="M60 65 Q57 70 61 76 M140 65 Q143 70 139 76" stroke={ctx.skinShade} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d={ctx.facePath} fill={`url(#${uid}skin)`} stroke={O} strokeWidth={W} />
            <path d="M126 44 Q138 62 132 84 Q126 98 112 104 Q130 86 126 44Z" fill="#000" opacity="0.06" />
            {renderFace(a, face, ctx)}
            {hairFront(a)}
            {glasses && renderGlasses(glasses)}
            {hat && renderHat(hat, ctx)}
          </g>
          {hand && !["suitcase", "duck", "umbrella"].includes(hand.k) && handItem(hand)}
          </g>
        </g>
      </g>
    </svg>
  );
}

interface Ctx {
  uid: string;
  a: Appearance;
  skinShade: string;
  fem: boolean;
  sx: number;
  torso: string;
  facePath: string;
}

// ---------------- patterns ----------------
function patternDefs(id: string, p: Spec["p"], c: string, c2?: string): ReactNode {
  if (!p || p === "none") return null;
  const accent = c2 ?? "#FFFFFF";
  return (
    <defs>
      <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill={c} />
        {p === "flowers" && (
          <g>
            <circle cx="4" cy="4" r="2.6" fill={accent === "#FFFFFF" ? "#FFF8EE" : accent} />
            <circle cx="4" cy="4" r="1.1" fill="#FF7A6B" />
            <circle cx="11" cy="11" r="2.2" fill="#FFD166" />
            <circle cx="11" cy="11" r="0.9" fill="#E53935" />
          </g>
        )}
        {p === "dots" && <><circle cx="3.5" cy="3.5" r="2" fill={accent} /><circle cx="10.5" cy="10.5" r="2" fill={accent} /></>}
        {p === "stripes" && <><rect y="0" width="14" height="4" fill={accent} /><rect y="7" width="14" height="4" fill={shade(c, 0.25)} /></>}
        {p === "plaid" && <><rect x="0" width="5" height="14" fill={accent} opacity="0.35" /><rect y="0" width="14" height="5" fill={accent} opacity="0.35" /></>}
        {p === "sequins" && <><circle cx="3" cy="3" r="1.6" fill="#fff" opacity="0.8" /><circle cx="10" cy="7" r="1.3" fill="#FFD166" /><circle cx="5" cy="11" r="1.2" fill="#fff" opacity="0.6" /></>}
      </pattern>
    </defs>
  );
}
const fillOf = (id: string, p: Spec["p"], c: string) => (p && p !== "none" ? `url(#${id})` : c);

// Body geometry (organic shapes: sloping shoulders, waist, bent arms).
const TORSO = "M68 116 Q70 103 86 101 L114 101 Q130 103 132 116 L134 146 Q136 170 127 172 L73 172 Q64 170 66 146Z";
const TORSO_FEM = "M76 116 Q78 103 90 101 L110 101 Q122 103 124 116 Q125 131 120 145 Q128 160 126 172 L74 172 Q72 160 80 145 Q75 131 76 116Z";
const TORSO_L = "M68 116 Q70 103 86 101 L94 101 L94 172 L73 172 Q64 170 66 146Z";
const TORSO_R = "M132 116 Q130 103 114 101 L106 101 L106 172 L127 172 Q136 170 134 146Z";
/** Arm path from the shoulder down to y (sx = shoulder inset, 2 for a slimmer female silhouette). */
const armL = (sx: number, end = 163) => `M${74 + sx} 110 Q${61 + sx} 124 ${57 + sx} 140 Q${54 + sx} 153 ${54 + sx} ${end}`;
const armR = (sx: number, end = 163) => `M${126 - sx} 110 Q${139 - sx} 124 ${143 - sx} 140 Q${146 - sx} 153 ${146 - sx} ${end}`;
const sleeveL = (sx: number) => `M${74 + sx} 110 Q${64 + sx} 120 ${60 + sx} 132`;
const sleeveR = (sx: number) => `M${126 - sx} 110 Q${136 - sx} 120 ${140 - sx} 132`;
const LEG_L = "M89 166 Q88 192 87 214";
const LEG_R = "M111 166 Q112 192 113 214";
const torsoShade = <path d="M123 103 Q130 105 132 116 L134 146 Q136 170 127 172 L119 172 Q127 140 123 103Z" fill="#000" opacity="0.09" />;
const torsoGloss = <path d="M75 114 Q71 132 73 158" stroke="#fff" strokeWidth="4" opacity="0.25" fill="none" strokeLinecap="round" />;

/** A limb drawn as a thick rounded stroke with an outline (organic, no boxy corners). */
function Limb({ d, w, color, outline = true }: { d: string; w: number; color: string; outline?: boolean }) {
  return (
    <>
      {outline && <path d={d} stroke={O} strokeWidth={w + W * 2} strokeLinecap="round" fill="none" />}
      <path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  );
}

function Hand({ cx, cy, flip, skin }: { cx: number; cy: number; flip?: boolean; skin: string }) {
  const tx = flip ? -1 : 1;
  return (
    <g>
      <ellipse cx={cx + 4.6 * tx} cy={cy - 2.5} rx="3" ry="4.4" fill={skin} stroke={O} strokeWidth={1.6} transform={`rotate(${-30 * tx} ${cx + 4.6 * tx} ${cy - 2.5})`} />
      <ellipse cx={cx} cy={cy} rx="6.6" ry="7.6" fill={skin} stroke={O} strokeWidth={W} />
      <path d={`M${cx - 3 * tx} ${cy + 3} Q${cx} ${cy + 5} ${cx + 3 * tx} ${cy + 3}`} stroke={shade(skin, -0.2)} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </g>
  );
}

// ---------------- hair ----------------
function hairBack(a: Appearance): ReactNode {
  const c = a.hairColor;
  const s = { fill: c, stroke: O, strokeWidth: W, strokeLinejoin: "round" as const };
  switch (a.hair) {
    case "long":
      return <path d="M58 64 Q54 22 100 22 Q146 22 142 64 L150 156 Q134 168 122 150 L78 150 Q66 168 50 156Z" {...s} />;
    case "bob":
      return <path d="M58 62 Q56 24 100 23 Q144 24 142 62 L144 96 Q132 104 124 94 L76 94 Q68 104 56 96Z" {...s} />;
    case "ponytail":
      return <path d="M128 36 Q156 40 152 76 Q150 100 160 116 Q138 112 136 86 Q134 62 124 48Z" {...s} />;
    case "bun":
      return <circle cx="100" cy="26" r="15" {...s} />;
    case "braids":
      return <g {...s}><path d="M64 70 Q58 110 66 150 Q74 154 76 146 Q70 110 74 76Z" /><path d="M136 70 Q142 110 134 150 Q126 154 124 146 Q130 110 126 76Z" /></g>;
    case "wavy":
      return <path d="M58 64 Q54 22 100 22 Q146 22 142 64 Q152 90 144 112 Q150 132 136 140 L64 140 Q50 132 56 112 Q48 90 58 64Z" {...s} />;
    case "afro":
      return <circle cx="100" cy="56" r="52" {...s} />;
    case "curly":
      return (
        <g {...s}>
          {[[62, 80], [58, 62], [138, 80], [142, 62]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="11" />)}
        </g>
      );
    default:
      return null;
  }
}

function hairFront(a: Appearance): ReactNode {
  const c = a.hairColor;
  const s = { fill: c, stroke: O, strokeWidth: W, strokeLinejoin: "round" as const };
  const shine = <path d="M80 36 Q92 30 104 32" stroke="#fff" strokeWidth="3" opacity="0.35" fill="none" strokeLinecap="round" />;
  switch (a.hair) {
    case "bald":
      return <ellipse cx="86" cy="40" rx="10" ry="5" fill="#fff" opacity="0.35" transform="rotate(-20 86 40)" />;
    case "buzz":
      return <path d="M63 58 Q64 30 100 29 Q136 30 137 58 Q120 42 100 42 Q80 42 63 58Z" fill={c} opacity="0.85" stroke={O} strokeWidth={W} />;
    case "short":
      return <g><path d="M62 62 Q60 26 100 25 Q140 26 138 62 Q132 46 116 44 Q106 54 88 46 Q72 48 62 62Z" {...s} />{shine}</g>;
    case "bob":
      return <g><path d="M62 58 Q62 27 100 26 Q138 27 138 58 Q126 50 114 52 Q104 46 92 52 Q76 48 62 58Z" {...s} />{shine}</g>;
    case "long":
      return <g><path d="M62 62 Q64 26 100 25 Q136 26 138 62 Q124 40 96 44 Q76 48 62 62Z" {...s} />{shine}</g>;
    case "ponytail":
    case "bun":
      return <g><path d="M62 58 Q64 27 100 26 Q136 27 138 58 Q118 40 100 40 Q80 40 62 58Z" {...s} />{shine}</g>;
    case "curly":
      return (
        <g {...s}>
          {[[70, 44], [84, 34], [100, 30], [116, 34], [130, 44]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="12" />)}
        </g>
      );
    case "pixie":
      return <g><path d="M62 64 Q58 26 100 24 Q142 26 138 60 Q130 44 112 40 Q98 52 76 52 Q66 56 62 64Z" {...s} />{shine}</g>;
    case "braids":
    case "wavy":
      return <g><path d="M62 62 Q64 26 100 25 Q136 26 138 62 Q130 42 108 40 Q96 50 80 46 Q68 52 62 62Z" {...s} />{shine}</g>;
    case "spiky":
      return <path d="M62 60 L60 36 L72 42 L74 22 L86 34 L94 16 L102 32 L112 16 L116 34 L128 24 L128 42 L140 38 L138 60 Q120 44 100 44 Q80 44 62 60Z" {...s} />;
    case "mohawk":
      return <g><path d="M64 58 Q66 34 100 32 Q134 34 136 58 Q118 46 100 46 Q82 46 64 58Z" fill={c} opacity="0.3" /><path d="M90 46 L86 10 Q100 2 114 10 L110 46Z" {...s} /></g>;
    case "sidepart":
      return <g><path d="M62 62 Q60 26 100 25 Q140 26 138 62 Q134 48 124 42 Q100 36 84 44 Q86 36 80 34 Q66 42 62 62Z" {...s} />{shine}</g>;
    case "afro":
      return <path d="M64 52 Q80 38 100 40 Q120 38 136 52" stroke={shade(c, -0.3)} strokeWidth="3" fill="none" strokeLinecap="round" />;
    default:
      return null;
  }
}

// ---------------- face ----------------
function facialHairOf(a: Appearance): NonNullable<Appearance["facialHair"]> {
  return a.facialHair ?? (a.beard ? "full" : "none");
}

function renderFace(a: Appearance, face: Spec | undefined, ctx: Ctx): ReactNode {
  const browC = shade(a.hairColor === "#F2F2F2" ? "#9E9E9E" : a.hairColor, -0.3);
  const iris = a.eyeColor ?? "#5D4037";
  const makeup = a.makeup ?? "none";
  const lip = makeup === "lipstick" ? "#C2185B" : shade("#D9727C", a.skin < "#B0" ? -0.25 : 0);
  const fh = facialHairOf(a);
  const hairC = a.hairColor;
  const lips = a.lips ?? "normal";
  const browW = a.brows === "thin" ? 0.9 : a.brows === "thick" ? 3.4 : 1.7;
  const lashes = a.eyes === "lashes" || makeup === "eyeliner";
  const eye = (cx: number) => {
    const out = cx < 100 ? -1 : 1;
    return (
      <g key={cx}>
        <path d={`M${cx - 9} 68 Q${cx} 59 ${cx + 9} 68 Q${cx} 74 ${cx - 9} 68Z`} fill="#FFFFFF" stroke={O} strokeWidth="1.4" />
        <circle cx={cx} cy="67.5" r="4.6" fill={iris} />
        <circle cx={cx} cy="67.5" r="2.2" fill="#1B1426" />
        <circle cx={cx + 1.6} cy="65.8" r="1.4" fill="#fff" />
        <path d={`M${cx - 9.5} 67.5 Q${cx} 57.5 ${cx + 9.5} 67.5`} stroke="#2A2238" strokeWidth={makeup === "eyeliner" ? 3.4 : 2.6} fill="none" strokeLinecap="round" />
        {makeup === "eyeliner" && <path d={`M${cx + 9 * out} 67 l${4 * out} -3`} stroke="#2A2238" strokeWidth="2.4" strokeLinecap="round" />}
        {lashes && <path d={`M${cx + 9 * out} 66 l${3 * out} -3 M${cx + 6 * out} 62.5 l${2 * out} -3 M${cx + 2 * out} 60.5 l${1 * out} -3`} stroke="#2A2238" strokeWidth="1.5" strokeLinecap="round" />}
        <path d={`M${cx - 7} 72 Q${cx} 75 ${cx + 7} 72`} stroke={ctx.skinShade} strokeWidth="1.2" fill="none" opacity="0.8" />
      </g>
    );
  };
  const nose =
    a.nose === "round" ? (
      <><path d="M101 70 Q100 78 96 83 Q100 89 107 85" stroke={ctx.skinShade} strokeWidth="2" fill="none" strokeLinecap="round" /><ellipse cx="101" cy="84" rx="5" ry="3" fill={ctx.skinShade} opacity="0.3" /></>
    ) : a.nose === "long" ? (
      <><path d="M100 64 Q100 79 95 86 Q100 89 105 87" stroke={ctx.skinShade} strokeWidth="2" fill="none" strokeLinecap="round" /><ellipse cx="102" cy="85" rx="3" ry="1.8" fill={ctx.skinShade} opacity="0.35" /></>
    ) : (
      <><path d="M101 70 Q99 79 96 84 Q99 87.5 104 86" stroke={ctx.skinShade} strokeWidth="2" fill="none" strokeLinecap="round" /><ellipse cx="103" cy="83" rx="3" ry="1.8" fill={ctx.skinShade} opacity="0.35" /></>
    );
  const mouthW = lips === "full" ? 14 : lips === "thin" ? 11 : 13;
  const mouthD = lips === "full" ? 14 : lips === "thin" ? 9 : 12;
  return (
    <>
      {face?.k === "sunburn" && <path d={ctx.facePath} fill="#FF5A4A" opacity="0.25" />}
      <ellipse cx="76" cy="84" rx="8" ry="4.5" fill={makeup === "blush" ? "#FF4F7B" : "#FF7F7F"} opacity={makeup === "blush" ? 0.42 : 0.26} />
      <ellipse cx="124" cy="84" rx="8" ry="4.5" fill={makeup === "blush" ? "#FF4F7B" : "#FF7F7F"} opacity={makeup === "blush" ? 0.42 : 0.26} />
      {a.freckles && <g fill={shade(a.skin, -0.35)} opacity="0.55">{[[72, 80], [77, 83], [81, 79], [119, 79], [123, 83], [128, 80], [95, 78], [105, 78]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.1" />)}</g>}
      {face?.k === "tanline" && <><ellipse cx="85" cy="67" rx="13" ry="10" fill="#fff" opacity="0.45" /><ellipse cx="115" cy="67" rx="13" ry="10" fill="#fff" opacity="0.45" /></>}
      {face?.k === "zinc" && <><path d="M96 74 L104 74 L103 86 L97 86Z" fill="#fff" /><path d="M68 82 Q76 78 82 84" stroke="#fff" strokeWidth={5} strokeLinecap="round" fill="none" /><path d="M118 84 Q124 78 132 82" stroke="#fff" strokeWidth={5} strokeLinecap="round" fill="none" /></>}
      {/* eyebrows */}
      <path d="M74 55 Q84 49 94 53 Q84 52 75 57Z" fill={browC} stroke={browC} strokeWidth={browW} strokeLinejoin="round" />
      <path d="M126 55 Q116 49 106 53 Q116 52 125 57Z" fill={browC} stroke={browC} strokeWidth={browW} strokeLinejoin="round" />
      {/* eyes */}
      {a.eyes === "happy" ? (
        <>
          <path d="M76 68 Q85 60 94 68" stroke="#2A2238" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M106 68 Q115 60 124 68" stroke="#2A2238" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          {lashes && <path d="M76 68 l-3 -2 M124 68 l3 -2" stroke="#2A2238" strokeWidth="1.6" strokeLinecap="round" />}
        </>
      ) : (
        <>{eye(85)}{eye(115)}</>
      )}
      {nose}
      {/* facial hair (behind the mouth) */}
      {fh === "stubble" && <path d="M66 78 Q68 104 100 108 Q132 104 134 78 Q128 96 114 96 Q100 100 86 96 Q72 96 66 78Z" fill={hairC} opacity="0.28" />}
      {(fh === "short" || fh === "full") && (
        <path d={fh === "full" ? "M62 70 Q62 112 100 116 Q138 112 138 70 Q132 96 114 96 Q100 101 86 96 Q68 96 62 70Z" : "M65 76 Q67 104 100 109 Q133 104 135 76 Q129 96 114 96 Q100 101 86 96 Q71 96 65 76Z"} fill={hairC} stroke={O} strokeWidth={W} strokeLinejoin="round" />
      )}
      {fh === "goatee" && <path d="M91 99 Q100 112 109 99 Q100 103 91 99Z" fill={hairC} stroke={O} strokeWidth="1.5" />}
      {/* mouth */}
      {face?.k === "moustache" ? (
        <>
          <path d="M100 89 Q90 83 82 89 Q76 95 70 89 Q74 99 86 97 Q96 95 100 91 Q104 95 114 97 Q126 99 130 89 Q124 95 118 89 Q110 83 100 89Z" fill="#4A2C18" stroke={O} strokeWidth={1.4} />
          <path d="M92 99 Q100 102 108 99" stroke={lip} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d={`M${100 - mouthW} 92 Q100 ${92 + mouthD} ${100 + mouthW} 92 Q100 96 ${100 - mouthW} 92Z`} fill={lip} stroke={shade(lip, -0.3)} strokeWidth="1.3" strokeLinejoin="round" />
          <path d={`M${100 - mouthW + 3} 93.2 Q100 ${92 + mouthD * 0.5} ${100 + mouthW - 3} 93.2 Q100 95.4 ${100 - mouthW + 3} 93.2Z`} fill="#FFFFFF" />
          {lips === "full" && <path d="M92 90 Q100 87.5 108 90" stroke={lip} strokeWidth="2.2" fill="none" strokeLinecap="round" />}
        </>
      )}
      {(fh === "moustache" || fh === "goatee") && <path d="M86 90 Q93 85 100 88 Q107 85 114 90 Q107 89 100 91 Q93 89 86 90Z" fill={hairC} stroke={O} strokeWidth="1.3" strokeLinejoin="round" />}
      {fh === "full" && <path d="M85 90 Q93 84 100 87 Q107 84 115 90 Q107 89 100 91 Q93 89 85 90Z" fill={hairC} />}
    </>
  );
}

// ---------------- clothes ----------------
function renderTop(sp: Spec, ctx: Ctx): ReactNode {
  const c = sp.c ?? "#FFFFFF";
  const pid = `${ctx.uid}top`;
  const p = sp.k === "hawaii" ? "flowers" : sp.k === "stripes" ? "stripes" : sp.k === "plaid" ? "plaid" : sp.p;
  const fill = fillOf(pid, p, c);
  const textColor = sp.k === "tank" ? "#FFD166" : sp.c2 ?? (c === "#FFFFFF" || c.startsWith("#F") ? "#1A1740" : "#FFFFFF");
  return (
    <g>
      {patternDefs(pid, p, c, sp.c2)}
      {sp.k === "tank" ? (
        <path d="M76 102 L87 101 Q92 114 100 114 Q108 114 113 101 L124 102 Q128 112 132 118 L134 146 Q136 170 127 172 L73 172 Q64 170 66 146 L68 118 Q72 112 76 102Z" fill={fill} stroke={O} strokeWidth={W} strokeLinejoin="round" />
      ) : (
        <path d={ctx.torso} fill={fill} stroke={O} strokeWidth={W} strokeLinejoin="round" />
      )}
      {sp.k !== "tank" && <path d="M88 102 Q100 113 112 102" stroke={O} strokeWidth="2" fill={shade(c, -0.08)} />}
      {sp.k === "polo" && <><path d="M86 104 L100 116 L114 104 L110 100 L100 108 L90 100Z" fill={shade(c, -0.15)} stroke={O} strokeWidth="1.8" /><circle cx="100" cy="124" r="1.8" fill={O} /><circle cx="100" cy="132" r="1.8" fill={O} /></>}
      {sp.k === "hawaii" && <path d="M86 104 L100 122 L114 104" stroke={O} strokeWidth={W} fill={shade(c, -0.15)} strokeLinejoin="round" />}
      {sp.k === "football" && <><path d="M88 104 L100 114 L112 104" stroke="#fff" strokeWidth="4" fill="none" /><text x="100" y="152" textAnchor="middle" fontSize="24" fontWeight="900" fill="#fff" fontFamily="system-ui, sans-serif">{sp.t}</text></>}
      {sp.t && sp.k !== "football" && <text x="100" y="146" textAnchor="middle" fontSize={sp.t.length > 5 ? 10.5 : 15} fontWeight="900" fill={textColor} fontFamily="system-ui, sans-serif">{heart(sp.t)}</text>}
      {torsoShade}
      {torsoGloss}
    </g>
  );
}

function heart(t: string, color = "#E53935"): ReactNode {
  const parts = t.split("♥");
  return parts.length === 2 ? <>{parts[0]}<tspan fill={color}>♥</tspan>{parts[1]}</> : t;
}

function renderOuter(sp: Spec, ctx: Ctx): ReactNode {
  const c = sp.c ?? "#1A1740";
  const dark = shade(c, -0.25);
  const sleeves = (col: string) => (
    <>
      <Limb d={armL(ctx.sx, 156)} w={17} color={col} />
      <Limb d={armR(ctx.sx, 156)} w={17} color={col} />
      <Limb d={`M${55 + ctx.sx} 153 L${55 + ctx.sx} 157`} w={17} color={shade(col, -0.18)} outline={false} />
      <Limb d={`M${145 - ctx.sx} 153 L${145 - ctx.sx} 157`} w={17} color={shade(col, -0.18)} outline={false} />
    </>
  );
  switch (sp.k) {
    case "poncho": {
      const pid = `${ctx.uid}outer`;
      const clear = sp.t === "clear";
      return (
        <g>
          {patternDefs(pid, sp.p, c, sp.c2)}
          <path d="M100 98 L32 176 Q100 192 168 176Z" fill={fillOf(pid, sp.p, c)} opacity={clear ? 0.55 : 0.97} stroke={O} strokeWidth={W} strokeLinejoin="round" />
          <path d="M70 104 Q100 124 130 104 Q126 90 100 88 Q74 90 70 104Z" fill={clear ? "none" : shade(c, -0.12)} stroke={O} strokeWidth="2" opacity={clear ? 0.6 : 1} />
          {sp.p === "stripes" && <path d="M44 170 L156 170" stroke="#1A1740" strokeWidth="2" strokeDasharray="4 3" />}
          <path d="M60 140 Q80 150 96 140" stroke="#fff" strokeWidth="3" opacity="0.35" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    case "puffer":
      return (
        <g>
          {sleeves(c)}
          <path d={ctx.torso} fill={c} stroke={O} strokeWidth={W} strokeLinejoin="round" />
          {[122, 138, 154].map((y) => <path key={y} d={`M64 ${y} Q100 ${y + 5} 136 ${y}`} stroke={dark} strokeWidth="2" fill="none" />)}
          <path d="M100 104 L100 174" stroke={dark} strokeWidth="2.5" />
          <path d="M80 100 Q100 96 120 100 L118 110 Q100 106 82 110Z" fill={shade(c, -0.1)} stroke={O} strokeWidth="2" />
          {torsoShade}{torsoGloss}
        </g>
      );
    case "safari":
      return (
        <g>
          <path d={TORSO_L} fill={c} stroke={O} strokeWidth={W} strokeLinejoin="round" />
          <path d={TORSO_R} fill={c} stroke={O} strokeWidth={W} strokeLinejoin="round" />
          {[[70, 124], [70, 146], [110, 124], [110, 146]].map(([x, y], i) => <rect key={i} x={x} y={y} width="20" height="15" rx="3" fill={dark} stroke={O} strokeWidth="1.5" />)}
        </g>
      );
    case "trench":
      return (
        <g>
          {sleeves(c)}
          <path d="M68 116 Q70 103 86 101 L114 101 Q130 103 132 116 L140 198 L60 198Z" fill={c} stroke={O} strokeWidth={W} strokeLinejoin="round" />
          <path d="M100 106 L100 198" stroke={dark} strokeWidth="2" />
          <path d="M84 104 L100 128 L116 104" fill={shade(c, -0.12)} stroke={O} strokeWidth="2" />
          <rect x="62" y="150" width="76" height="7" fill={dark} />
          <rect x="94" y="149" width="12" height="9" rx="2" fill="#FFD166" stroke={O} strokeWidth="1.2" />
          {torsoShade}
        </g>
      );
    case "lifejacket":
      return (
        <g>
          <path d={TORSO_L} fill="#FF7A00" stroke={O} strokeWidth={W} strokeLinejoin="round" />
          <path d={TORSO_R} fill="#FF7A00" stroke={O} strokeWidth={W} strokeLinejoin="round" />
          <rect x="64" y="138" width="72" height="5" fill="#1A1740" />
          <rect x="70" y="124" width="22" height="4" fill="#E8E8E8" />
          <rect x="108" y="124" width="22" height="4" fill="#E8E8E8" />
        </g>
      );
    case "tuxedo":
      return (
        <g>
          {sleeves("#1A1740")}
          <path d={ctx.torso} fill="#1A1740" stroke={O} strokeWidth={W} strokeLinejoin="round" />
          <path d="M86 104 L100 150 L114 104Z" fill="#fff" stroke={O} strokeWidth="2" />
          <path d="M92 110 L100 114 L108 110 L108 118 L100 114 L92 118Z" fill="#E53935" stroke={O} strokeWidth="1.5" />
          <circle cx="100" cy="130" r="1.8" fill={O} />
          <circle cx="100" cy="138" r="1.8" fill={O} />
        </g>
      );
    default: {
      // jacket (open front, long sleeves)
      return (
        <g>
          {sleeves(c)}
          <path d="M68 116 Q70 103 86 101 L92 101 L92 172 L73 172 Q64 170 66 146Z" fill={c} stroke={O} strokeWidth={W} strokeLinejoin="round" />
          <path d="M132 116 Q130 103 114 101 L108 101 L108 172 L127 172 Q136 170 134 146Z" fill={c} stroke={O} strokeWidth={W} strokeLinejoin="round" />
          <path d="M80 102 L92 104 L92 122 Z M120 102 L108 104 L108 122Z" fill={dark} stroke={O} strokeWidth="1.6" />
          {sp.c2 && <rect x="63" y="146" width="74" height="6" fill={sp.c2} />}
          {sp.t && (
            <>
              <rect x="63" y="148" width="29" height="5" fill="#D9F7E6" opacity="0.9" />
              <rect x="108" y="148" width="29" height="5" fill="#D9F7E6" opacity="0.9" />
              <text x="121" y="134" textAnchor="middle" fontSize="9" fontWeight="900" fill="#fff" fontFamily="system-ui, sans-serif">{sp.t}</text>
            </>
          )}
          {c === "#4F7CAC" && <path d="M66 128 L90 128 M110 128 L134 128" stroke="#E3C08A" strokeWidth="1.5" strokeDasharray="3 2" />}
          {torsoShade}
        </g>
      );
    }
  }
}

function renderDress(sp: Spec, ctx: Ctx): ReactNode {
  const c = sp.c ?? "#E53935";
  const pid = `${ctx.uid}dress`;
  const long = sp.k === "dressLong";
  const fill = fillOf(pid, sp.p, c);
  return (
    <g>
      {patternDefs(pid, sp.p, c, sp.c2)}
      <Limb d={`M${74 + ctx.sx} 110 Q${67 + ctx.sx} 117 ${63 + ctx.sx} 124`} w={21} color={fill} />
      <Limb d={`M${126 - ctx.sx} 110 Q${133 - ctx.sx} 117 ${137 - ctx.sx} 124`} w={21} color={fill} />
      <path d={`M68 116 Q70 103 86 101 L114 101 Q130 103 132 116 L134 148 L${long ? 152 : 146} ${long ? 214 : 196} Q100 ${long ? 224 : 204} ${long ? 48 : 54} ${long ? 214 : 196} L66 148Z`} fill={fill} stroke={O} strokeWidth={W} strokeLinejoin="round" />
      <path d="M88 105 Q100 114 112 105" stroke={O} strokeWidth="2" fill="none" />
      <path d="M66 146 Q100 152 134 146" stroke={shade(c, -0.3)} strokeWidth="3" fill="none" />
      <path d="M124 150 L136 198" stroke="#000" strokeWidth="8" opacity="0.07" />
    </g>
  );
}

function renderBottom(sp: Spec, ctx: Ctx): ReactNode {
  const c = sp.c ?? "#7AA6C2";
  const pid = `${ctx.uid}bottom`;
  const fill = fillOf(pid, sp.p, c);
  const dark = shade(c, -0.2);
  const s = { stroke: O, strokeWidth: W, strokeLinejoin: "round" as const };
  const hx = ctx.fem ? 4 : 0;
  const hips = (col: string, bottomY = 176) => <path d={`M${67 + hx} 148 Q100 154 ${133 - hx} 148 L${131 - hx} ${bottomY} Q100 ${bottomY + 6} ${69 + hx} ${bottomY}Z`} fill={col} {...s} />;
  switch (sp.k) {
    case "pants": {
      const w = sp.t === "slim" ? 19 : 22;
      return (
        <g>
          <Limb d="M89 160 Q88 190 87 210" w={w} color={c} />
          <Limb d="M111 160 Q112 190 113 210" w={w} color={c} />
          {hips(c)}
          <path d="M100 152 L100 172" stroke={dark} strokeWidth="1.5" />
          {sp.t === "ripped" && <><path d="M82 186 Q87 183 92 187" stroke="#F3E5D8" strokeWidth="3" /><path d="M108 196 Q113 193 118 197" stroke="#F3E5D8" strokeWidth="3" /></>}
          {sp.t === "zip" && <path d="M77 188 L97 188 M103 188 L123 188" stroke={dark} strokeWidth="2" strokeDasharray="2 2" />}
          {(c === "#3F6FA8" || c === "#5C8BC4" || c === "#4A78B5") && <path d="M76 156 L76 166 M124 156 L124 166" stroke="#E3C08A" strokeWidth="1.5" strokeDasharray="2 2" />}
          <path d="M83 176 Q82 194 82 206" stroke="#fff" strokeWidth="2" opacity="0.2" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    case "flare":
      return (
        <g>
          <path d="M76 160 L100 160 L96 214 L70 214Z" fill={c} {...s} />
          <path d="M100 160 L124 160 L130 214 L104 214Z" fill={c} {...s} />
          {hips(c)}
        </g>
      );
    case "skirt":
      return <g><path d="M68 148 L132 148 L142 194 Q100 200 58 194Z" fill={c} {...s} />{[80, 92, 104, 116, 128].map((x) => <path key={x} d={`M${x - 4} 152 L${x - 2} 194`} stroke={dark} strokeWidth="1.5" />)}</g>;
    case "kilt":
      return (
        <g>
          <path d="M67 148 L133 148 L138 200 Q100 205 62 200Z" fill="#C62828" {...s} />
          {[74, 88, 102, 116, 130].map((x) => <path key={x} d={`M${x} 148 L${x + 2} 200`} stroke="#1B5E20" strokeWidth={4} opacity="0.7" />)}
          <path d="M66 166 L134 166 M64 184 L136 184" stroke="#1B5E20" strokeWidth={3} opacity="0.7" />
          <rect x="94" y="166" width="12" height="16" rx="3" fill="#E0E0E0" stroke={O} strokeWidth={1.5} />
        </g>
      );
    case "cargo":
      return (
        <g>
          <Limb d="M88 162 Q88 178 87 190" w={25} color={c} />
          <Limb d="M112 162 Q112 178 113 190" w={25} color={c} />
          {hips(c)}
          <rect x="74" y="174" width="13" height="13" rx="3" fill={dark} stroke={O} strokeWidth={1.5} />
          <rect x="113" y="174" width="13" height="13" rx="3" fill={dark} stroke={O} strokeWidth={1.5} />
        </g>
      );
    default:
      return (
        <g>
          {patternDefs(pid, sp.p, c, sp.c2)}
          <Limb d="M88 162 Q88 175 88 184" w={25} color={fill} />
          <Limb d="M112 162 Q112 175 112 184" w={25} color={fill} />
          {hips(fill)}
          <path d="M68 154 Q100 160 132 154" stroke={dark} strokeWidth="2" fill="none" />
        </g>
      );
  }
}

function foot(x: number, body: (x: number) => ReactNode) {
  return <g key={x}>{body(x)}</g>;
}
function renderShoes(sp: Spec): ReactNode {
  const c = sp.c ?? "#FFFFFF";
  const both = (f: (x: number) => ReactNode) => <>{foot(2, f)}{foot(28, f)}</>;
  switch (sp.k) {
    case "flipflops":
      return both((x) => <g transform={`translate(${x} 0)`}><ellipse cx="84" cy="221" rx="15" ry="5" fill={c} stroke={O} strokeWidth={2} /><path d="M78 217 L85 211 L92 217" stroke={shade(c, -0.3)} strokeWidth={3} fill="none" /></g>);
    case "crocs":
      return both((x) => <g transform={`translate(${x} 0)`}><path d="M70 220 Q70 208 84 208 Q98 208 99 220 Q98 226 84 226 Q70 226 70 220Z" fill={c} stroke={O} strokeWidth={W} />{[[78, 214], [85, 212], [92, 214]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="1.6" fill={shade(c, -0.35)} />)}<path d="M72 214 Q70 206 78 206" stroke={shade(c, -0.2)} strokeWidth="2.5" fill="none" /></g>);
    case "socksSandals":
      return both((x) => <g transform={`translate(${x} 0)`}><rect x="75" y="188" width="20" height="30" rx="6" fill="#fff" stroke={O} strokeWidth={2} /><path d="M76 194 L94 194" stroke="#E53935" strokeWidth={2.5} /><ellipse cx="84" cy="221" rx="15" ry="5" fill="#8D5524" stroke={O} strokeWidth={2} /><path d="M74 212 L94 212" stroke="#8D5524" strokeWidth={4} /></g>);
    case "boots": {
      const low = sp.t === "low";
      return both((x) => <g transform={`translate(${x} 0)`}><path d={`M74 ${low ? 204 : 186} L96 ${low ? 204 : 186} L96 214 Q101 224 88 225 L70 225 Q66 214 74 210Z`} fill={c} stroke={O} strokeWidth={W} />{low && <path d="M78 208 L92 208 M78 212 L92 212" stroke="#FFD166" strokeWidth="1.5" />}<path d="M69 222 L99 222" stroke={shade(c, -0.35)} strokeWidth="3" /></g>);
    }
    default: // sneakers
      return both((x) => <g transform={`translate(${x} 0)`}><path d="M69 220 Q69 208 80 208 L90 208 Q99 209 100 218 L100 221 Q100 225 95 225 L72 225 Q69 225 69 220Z" fill={c} stroke={O} strokeWidth={W} /><path d="M69 221 L100 221" stroke={sp.c2 ?? "#CFCCFF"} strokeWidth="3" /><path d="M78 212 Q83 210 88 212" stroke={shade(c, -0.25)} strokeWidth="1.5" fill="none" /></g>);
  }
}

function backpackBack(sp: Spec): ReactNode {
  const c = sp.c ?? "#FF7043";
  return (
    <g>
      <rect x="54" y="96" width="92" height="84" rx="20" fill={c} stroke={O} strokeWidth={W} />
      <rect x="64" y="84" width="72" height="22" rx="10" fill={shade(c, -0.15)} stroke={O} strokeWidth={W} />
      <rect x="66" y="78" width="68" height="10" rx="5" fill="#8D6E63" stroke={O} strokeWidth="1.8" />
    </g>
  );
}

function renderBag(sp: Spec): ReactNode {
  const c = sp.c ?? "#6A55F2";
  switch (sp.k) {
    case "bumbag":
      return <g><path d="M66 150 Q100 162 134 150" stroke="#1A1740" strokeWidth="4" fill="none" /><rect x="84" y="150" width="34" height="18" rx="9" fill={c} stroke={O} strokeWidth={W} /><path d="M88 157 L114 157" stroke={shade(c, -0.3)} strokeWidth="1.5" /></g>;
    case "tote":
      return <g><path d="M66 108 Q48 124 44 150" stroke={shade(c, -0.4)} strokeWidth="3" fill="none" /><path d="M30 146 L62 146 L60 186 L32 186Z" fill={c} stroke={O} strokeWidth={W} strokeLinejoin="round" />{sp.t && <text x="46" y="170" textAnchor="middle" fontSize="7" fontWeight="900" fill="#1A1740" fontFamily="system-ui, sans-serif">{heart(sp.t)}</text>}</g>;
    case "pouch":
      return <g><path d="M84 102 L94 132 M116 102 L106 132" stroke="#5D4037" strokeWidth="1.8" /><rect x="88" y="128" width="24" height="18" rx="3" fill={c} stroke={O} strokeWidth="2" /><path d="M88 134 L112 134" stroke={shade(c, -0.3)} strokeWidth="1.5" /></g>;
    default:
      return null;
  }
}

function renderNeck(sp: Spec): ReactNode {
  switch (sp.k) {
    case "lei":
      return <>{[[70, 106], [78, 115], [88, 121], [100, 123], [112, 121], [122, 115], [130, 106]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6.5" fill={["#FF7A6B", "#FFD166", "#FF8FB1", "#5FD3B5"][i % 4]} stroke={O} strokeWidth={1.5} />)}</>;
    case "camera":
      return <g><path d="M80 106 L92 138 M120 106 L108 138" stroke={O} strokeWidth={2} /><rect x="85" y="134" width="30" height="21" rx="4" fill="#424242" stroke={O} strokeWidth={W} /><circle cx="100" cy="144.5" r="6.5" fill="#90CAF9" stroke="#fff" strokeWidth={2} /><rect x="106" y="136" width="5" height="3" fill="#FFD166" /></g>;
    case "binoculars":
      return <g><path d="M80 106 L90 136 M120 106 L110 136" stroke={O} strokeWidth={2} /><rect x="84" y="132" width="14" height="20" rx="5" fill="#37474F" stroke={O} strokeWidth="2" /><rect x="102" y="132" width="14" height="20" rx="5" fill="#37474F" stroke={O} strokeWidth="2" /><rect x="96" y="136" width="8" height="6" fill="#263238" /></g>;
    case "pillow":
      return <path d="M66 100 Q66 126 100 126 Q134 126 134 100 Q124 114 100 114 Q76 114 66 100Z" fill={sp.c ?? "#8578FB"} stroke={O} strokeWidth={W} />;
    case "scarf":
      return <g><path d="M72 104 Q100 118 128 104 L128 112 Q100 128 72 112Z" fill={sp.c} stroke={O} strokeWidth="2" /><rect x="112" y="110" width="12" height="40" rx="3" fill={sp.c} stroke={O} strokeWidth="2" /><path d="M112 122 L124 122 M112 134 L124 134" stroke={sp.c2} strokeWidth="4" /></g>;
    case "badge":
      return <g><path d="M84 104 L96 130 M116 104 L104 130" stroke="#1E88E5" strokeWidth="2.5" /><rect x="88" y="128" width="24" height="17" rx="3" fill="#fff" stroke={O} strokeWidth="1.8" /><text x="100" y="140" textAnchor="middle" fontSize="5.5" fontWeight="800" fill="#1E88E5" fontFamily="system-ui, sans-serif">VISITOR</text></g>;
    default:
      return null;
  }
}

function handItem(sp: Spec): ReactNode {
  switch (sp.k) {
    case "baguette":
      return <g transform="rotate(25 146 168)"><rect x="139" y="118" width="13" height="82" rx="6.5" fill="#E0A458" stroke={O} strokeWidth={W} />{[130, 146, 162, 178].map((y) => <path key={y} d={`M142 ${y} L149 ${y - 5}`} stroke="#B9763A" strokeWidth="2" />)}</g>;
    case "map":
      return <g><rect x="130" y="134" width="46" height="34" fill="#FFF3D1" stroke={O} strokeWidth={W} transform="rotate(-8 153 151)" /><path d="M145 138 L145 168 M160 136 L160 166" stroke={O} strokeWidth={1.5} opacity="0.5" /><path d="M136 158 Q148 146 168 150" stroke="#E53935" strokeWidth={2} strokeDasharray="3 3" fill="none" /></g>;
    case "guide":
      return <g transform="rotate(-10 150 160)"><rect x="136" y="142" width="30" height="38" rx="3" fill="#FFD166" stroke={O} strokeWidth={W} /><rect x="140" y="150" width="22" height="10" fill="#E53935" /><text x="151" y="158" textAnchor="middle" fontSize="6" fontWeight="900" fill="#fff" fontFamily="system-ui, sans-serif">GUIDE</text></g>;
    case "phone":
      return <g transform="rotate(-12 146 160)"><rect x="136" y="140" width="20" height="34" rx="4" fill="#1A1740" stroke={O} strokeWidth="2" /><rect x="139" y="144" width="14" height="24" rx="2" fill="#81D4FA" /><circle cx="146" cy="154" r="3" fill="#E53935" /></g>;
    case "tea":
      return <g><path d="M134 154 L156 154 L153 174 L137 174Z" fill="#FFFFFF" stroke={O} strokeWidth={W} strokeLinejoin="round" /><path d="M156 158 Q164 160 156 168" stroke={O} strokeWidth={W} fill="none" /><path d="M140 148 Q138 142 142 138 M148 148 Q146 142 150 138" stroke="#A09FC0" strokeWidth={2} fill="none" strokeLinecap="round" /></g>;
    case "icecream":
      return <g><path d="M140 164 L152 164 L146 186Z" fill="#E0A458" stroke={O} strokeWidth="2" strokeLinejoin="round" /><circle cx="146" cy="156" r="10" fill="#FF8FB1" stroke={O} strokeWidth="2" /><path d="M138 160 Q139 168 141 166" stroke="#FF8FB1" strokeWidth="3" strokeLinecap="round" /><circle cx="143" cy="152" r="2" fill="#fff" opacity="0.6" /></g>;
    case "coconut":
      return <g><circle cx="148" cy="160" r="14" fill="#6D4C41" stroke={O} strokeWidth={W} /><ellipse cx="148" cy="150" rx="9" ry="4" fill="#FFF8EE" stroke={O} strokeWidth="1.5" /><path d="M150 150 L160 128" stroke="#FF4081" strokeWidth="3" strokeLinecap="round" /><path d="M160 128 L166 126" stroke="#FF4081" strokeWidth="3" strokeLinecap="round" /></g>;
    case "umbrella":
      return <g><path d="M148 168 L148 70" stroke="#5D4037" strokeWidth="3" /><path d="M104 74 Q148 24 192 74 Q181 66 170 74 Q159 66 148 74 Q137 66 126 74 Q115 66 104 74Z" fill={sp.c ?? "#6A55F2"} stroke={O} strokeWidth={W} strokeLinejoin="round" /><path d="M148 30 L148 74" stroke="#fff" strokeWidth="1.5" opacity="0.4" /></g>;
    case "suitcase":
      return <g><rect x="150" y="148" width="38" height="60" rx="8" fill={sp.c ?? "#FF7A6B"} stroke={O} strokeWidth={W} /><path d="M159 148 L159 136 L179 136 L179 148" stroke={O} strokeWidth={W} fill="none" /><path d="M156 166 L182 166 M156 190 L182 190" stroke="#fff" strokeWidth={3} opacity="0.7" /><rect x="156" y="174" width="12" height="8" rx="2" fill="#FFD166" stroke={O} strokeWidth="1" /><circle cx="158" cy="212" r="4" fill={O} /><circle cx="180" cy="212" r="4" fill={O} /></g>;
    case "selfie":
      return <g><path d="M146 166 L186 66" stroke="#424242" strokeWidth={4} strokeLinecap="round" /><rect x="176" y="48" width="20" height="32" rx="4" fill="#1A1740" stroke={O} strokeWidth={2} transform="rotate(20 186 64)" /></g>;
    case "duck":
      return <g><ellipse cx="100" cy="164" rx="56" ry="14" fill="#FFD166" stroke={O} strokeWidth={W} /><ellipse cx="100" cy="164" rx="36" ry="6" fill="#F5B83D" opacity="0.6" /><circle cx="154" cy="146" r="12" fill="#FFD166" stroke={O} strokeWidth={W} /><path d="M164 146 L176 149 L164 152Z" fill="#FF7A00" stroke={O} strokeWidth={1.5} /><circle cx="157" cy="143" r="2" fill={O} /></g>;
    default:
      return null;
  }
}

function renderGlasses(sp: Spec): ReactNode {
  switch (sp.k) {
    case "glHeart":
      return <g><path d="M86 80 L74 68 A6.5 6.5 0 0 1 86 60 A6.5 6.5 0 0 1 98 68Z" fill="#FF5C8A" stroke={O} strokeWidth={2} /><path d="M114 80 L102 68 A6.5 6.5 0 0 1 114 60 A6.5 6.5 0 0 1 126 68Z" fill="#FF5C8A" stroke={O} strokeWidth={2} /><path d="M98 67 L102 67" stroke={O} strokeWidth={2} /></g>;
    case "glRound":
      return <g fill="#fff" fillOpacity="0.25" stroke={O} strokeWidth="2.5"><circle cx="86" cy="69" r="11" /><circle cx="114" cy="69" r="11" /><path d="M97 68 Q100 65 103 68" fill="none" /></g>;
    case "glBig":
      return <g><rect x="68" y="57" width="31" height="25" rx="10" fill="#1A1740" stroke={O} strokeWidth={W} /><rect x="101" y="57" width="31" height="25" rx="10" fill="#1A1740" stroke={O} strokeWidth={W} /><path d="M73 63 L80 60 M106 63 L113 60" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" opacity="0.7" /></g>;
    case "glStar":
      return <g fill="#FFD166" stroke={O} strokeWidth="1.8" strokeLinejoin="round">{[86, 114].map((cx) => <path key={cx} d={`M${cx} 56 L${cx + 4} 65 L${cx + 13} 66 L${cx + 6} 72 L${cx + 8} 81 L${cx} 76 L${cx - 8} 81 L${cx - 6} 72 L${cx - 13} 66 L${cx - 4} 65Z`} />)}</g>;
    case "glAviator":
      return <g><path d="M72 61 L98 61 Q98 83 85 83 Q72 83 72 61Z" fill="#4A3B2B" opacity="0.92" stroke="#C9A227" strokeWidth={2.5} /><path d="M102 61 L128 61 Q128 83 115 83 Q102 83 102 61Z" fill="#4A3B2B" opacity="0.92" stroke="#C9A227" strokeWidth={2.5} /><path d="M98 63 L102 63" stroke="#C9A227" strokeWidth={2.5} /></g>;
    case "gl3d":
      return <g><rect x="70" y="60" width="58" height="20" rx="3" fill="#fff" stroke={O} strokeWidth="2" /><rect x="74" y="63" width="22" height="14" rx="2" fill="#E53935" opacity="0.85" /><rect x="102" y="63" width="22" height="14" rx="2" fill="#1E88E5" opacity="0.85" /></g>;
    case "glSnorkel":
      return <g><rect x="67" y="55" width="66" height="28" rx="12" fill="#9EE6FF" opacity="0.6" stroke="#1E88E5" strokeWidth={4} /><path d="M135 68 L150 68 L150 18" stroke="#FF7A6B" strokeWidth={6} fill="none" strokeLinecap="round" /></g>;
    default:
      return null;
  }
}

function renderHat(sp: Spec, ctx: Ctx): ReactNode {
  const c = sp.c ?? "#E53935";
  const dark = shade(c, -0.2);
  const s = { stroke: O, strokeWidth: W, strokeLinejoin: "round" as const };
  switch (sp.k) {
    case "cap":
      return (
        <g>
          <path d="M61 46 Q61 14 100 14 Q139 14 139 46Z" fill={c} {...s} />
          <path d="M118 44 Q152 40 164 50 Q142 56 116 50Z" fill={sp.c2 ?? dark} {...s} />
          <path d="M100 14 L100 46" stroke={dark} strokeWidth="1.5" />
          <circle cx="100" cy="15" r="3" fill={dark} />
          {sp.t && <text x="96" y="37" textAnchor="middle" fontSize={sp.t.length > 5 ? 8.5 : 11} fontWeight="900" fill={c === "#FFFFFF" ? "#C62828" : "#fff"} fontFamily="system-ui, sans-serif">{heart(sp.t, c === "#E53935" ? "#FFD166" : "#E53935")}</text>}
          <path d="M72 24 Q86 16 100 17" stroke="#fff" strokeWidth="3" opacity="0.3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "capBack":
      return <g><path d="M61 46 Q61 14 100 14 Q139 14 139 46Z" fill={c} {...s} /><path d="M82 44 Q48 40 36 50 Q58 56 84 50Z" fill={dark} {...s} /><rect x="92" y="38" width="16" height="6" rx="2" fill="#fff" opacity="0.7" /></g>;
    case "visor":
      return <g><path d="M62 40 Q100 30 138 40 L138 48 Q100 38 62 48Z" fill={c} {...s} /><path d="M100 44 Q136 40 156 52 Q130 58 100 50Z" fill="#26A69A" {...s} /></g>;
    case "bob": {
      const pid = `${ctx.uid}hat`;
      return (
        <g>
          {patternDefs(pid, sp.p, c, sp.c2)}
          <path d="M48 46 Q50 34 66 34 L134 34 Q150 34 152 46 Q140 52 100 52 Q60 52 48 46Z" fill={fillOf(pid, sp.p, c)} {...s} />
          <path d="M66 38 Q66 10 100 10 Q134 10 134 38Z" fill={fillOf(pid, sp.p, c)} {...s} />
          <path d="M66 34 Q100 40 134 34" stroke={shade(c, -0.25)} strokeWidth="2" fill="none" />
        </g>
      );
    }
    case "straw":
      return <g><ellipse cx="100" cy="40" rx="66" ry="14" fill="#F2D16B" {...s} /><path d="M70 40 Q70 10 100 10 Q130 10 130 40Z" fill="#F7DE8A" {...s} /><rect x="70" y="30" width="60" height="8" fill="#FF7A6B" stroke={O} strokeWidth={2} /><path d="M50 40 Q100 50 150 40" stroke="#D9B44A" strokeWidth="1.5" fill="none" /></g>;
    case "panama":
      return <g><ellipse cx="100" cy="40" rx="54" ry="11" fill="#F3EAD3" {...s} /><path d="M72 40 L74 14 Q100 6 126 14 L128 40Z" fill="#F8F1DE" {...s} /><rect x="72" y="30" width="56" height="8" fill="#1A1740" /></g>;
    case "beret":
      return <g><ellipse cx="96" cy="32" rx="42" ry="15" fill={c} {...s} /><path d="M96 18 L98 10" stroke={O} strokeWidth="3" strokeLinecap="round" /></g>;
    case "beanie":
      return <g><path d="M62 50 Q62 14 100 14 Q138 14 138 50Z" fill={c} {...s} /><rect x="60" y="40" width="80" height="14" rx="6" fill={sp.c2 ?? "#fff"} {...s} /><circle cx="100" cy="12" r="9" fill={sp.c2 ?? "#fff"} {...s} /></g>;
    case "bowler":
      return <g><ellipse cx="100" cy="40" rx="48" ry="9" fill="#212121" {...s} /><path d="M70 40 Q70 8 100 8 Q130 8 130 40Z" fill="#2B2B2B" {...s} /><rect x="70" y="32" width="60" height="6" fill="#4E342E" /></g>;
    case "conical":
      return <g><path d="M100 0 L162 44 Q100 54 38 44Z" fill="#E8D7A9" {...s} /><path d="M100 0 L70 46 M100 0 L130 46 M100 0 L100 50" stroke="#C9B27C" strokeWidth="1.5" /></g>;
    case "cowboy":
      return <g><path d="M34 40 Q50 52 100 50 Q150 52 166 40 Q160 56 100 58 Q40 56 34 40Z" fill="#9C6B3C" {...s} /><path d="M70 48 L74 16 Q88 8 100 18 Q112 8 126 16 L130 48Z" fill="#B5814B" {...s} /><rect x="72" y="38" width="56" height="6" fill="#5A3A1E" /></g>;
    case "sombrero":
      return <g><ellipse cx="100" cy="42" rx="92" ry="17" fill="#F4C542" {...s} /><path d="M14 44 L24 36 L34 46 L44 36 L54 46 M146 46 L156 36 L166 46 L176 36 L186 44" stroke="#E53935" strokeWidth="3" fill="none" /><path d="M76 42 Q74 0 100 0 Q126 0 124 42Z" fill="#F7D46A" {...s} /><rect x="75" y="30" width="50" height="7" fill="#2FBF9A" /></g>;
    case "viking":
      return <g><path d="M64 50 Q64 18 100 18 Q136 18 136 50Z" fill="#B0B7C3" {...s} /><rect x="62" y="44" width="76" height="9" rx="4" fill="#8A93A3" {...s} /><path d="M66 40 Q40 36 38 10 Q52 28 70 30Z" fill="#FFF8EE" {...s} /><path d="M134 40 Q160 36 162 10 Q148 28 130 30Z" fill="#FFF8EE" {...s} /></g>;
    case "crown":
      return <g><path d="M68 42 L66 12 L82 26 L100 6 L118 26 L134 12 L132 42Z" fill="#FFD166" {...s} /><circle cx="100" cy="28" r="5" fill="#E53935" stroke={O} strokeWidth={1.5} /><circle cx="80" cy="33" r="3.5" fill="#5FD3B5" stroke={O} strokeWidth={1.5} /><circle cx="120" cy="33" r="3.5" fill="#6A55F2" stroke={O} strokeWidth={1.5} /></g>;
    default:
      return null;
  }
}

// ---------------- backgrounds ----------------
function sky(uid: string, top: string, bottom: string) {
  const id = `${uid}sky`;
  return {
    id,
    def: (
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
    ),
  };
}

function renderBackground(sp: Spec, uid: string): ReactNode {
  switch (sp.k) {
    case "beach": {
      const s = sky(uid, "#7FD3FF", "#D4F3FF");
      return <>{s.def}<rect width="200" height="240" fill={`url(#${s.id})`} /><circle cx="160" cy="40" r="18" fill="#FFD166" /><circle cx="160" cy="40" r="26" fill="#FFD166" opacity="0.25" /><rect y="150" width="200" height="30" fill="#3BA7E0" /><path d="M0 152 Q25 146 50 152 T100 152 T150 152 T200 152" stroke="#fff" strokeWidth="3" fill="none" opacity="0.7" /><rect y="178" width="200" height="62" fill="#F7DE8A" /><path d="M26 180 Q22 120 36 92" stroke="#8D5524" strokeWidth="6" fill="none" /><path d="M36 92 Q12 86 4 100 M36 92 Q30 70 12 72 M36 92 Q56 74 66 86 M36 92 Q62 92 64 108" stroke="#2FBF9A" strokeWidth="7" fill="none" strokeLinecap="round" /></>;
    }
    case "airport": {
      const s = sky(uid, "#A9D8FF", "#E8F4FF");
      return <>{s.def}<rect width="200" height="240" fill={`url(#${s.id})`} /><rect y="186" width="200" height="54" fill="#8A93A3" /><path d="M0 212 L200 212" stroke="#fff" strokeWidth="3" strokeDasharray="14 10" /><g transform="translate(120 46) rotate(-12)"><rect x="0" y="0" width="64" height="12" rx="6" fill="#fff" stroke="#6A55F2" strokeWidth="2" /><path d="M24 6 L10 30 L22 30 L40 6Z" fill="#6A55F2" /><path d="M6 6 L0 -8 L8 -8 L16 4Z" fill="#6A55F2" /></g><rect x="12" y="24" width="70" height="38" rx="4" fill="#1A1740" /><text x="18" y="38" fontSize="8" fill="#FFD166" fontFamily="monospace">LDN 09:45</text><text x="18" y="52" fontSize="8" fill="#5FD3B5" fontFamily="monospace">NYC BOARD</text></>;
    }
    case "mountain": {
      const s = sky(uid, "#90CAF9", "#E3F2FD");
      return <>{s.def}<rect width="200" height="240" fill={`url(#${s.id})`} /><path d="M-10 170 L60 60 L100 120 L140 50 L210 170Z" fill="#7986CB" /><path d="M48 80 L60 60 L74 82 Q62 88 48 80Z M128 70 L140 50 L154 72 Q140 78 128 70Z" fill="#fff" /><rect y="166" width="200" height="74" fill="#E8F5E9" /><path d="M10 190 L20 166 L30 190Z M168 196 L180 170 L192 196Z" fill="#2E7D32" /></>;
    }
    case "jungle": {
      return <><rect width="200" height="240" fill="#1B5E20" /><circle cx="40" cy="30" r="40" fill="#2E7D32" /><circle cx="160" cy="40" r="46" fill="#388E3C" /><circle cx="100" cy="10" r="36" fill="#43A047" /><path d="M0 120 Q30 90 60 120 M140 110 Q170 80 200 110" stroke="#66BB6A" strokeWidth="10" fill="none" strokeLinecap="round" /><path d="M20 0 L24 140 M180 0 L176 130" stroke="#795548" strokeWidth="3" /><rect y="196" width="200" height="44" fill="#33691E" /><circle cx="170" cy="150" r="6" fill="#FF7043" /><circle cx="30" cy="170" r="5" fill="#FFD166" /></>;
    }
    case "desert": {
      const s = sky(uid, "#FFCC80", "#FFF3E0");
      return <>{s.def}<rect width="200" height="240" fill={`url(#${s.id})`} /><circle cx="150" cy="48" r="20" fill="#FF8A65" /><path d="M0 170 Q60 140 120 170 T240 170 L240 240 L0 240Z" fill="#F4C27A" /><path d="M-20 190 Q50 160 120 196 T220 190 L220 240 L-20 240Z" fill="#E9AE5E" /><path d="M30 120 L60 80 L90 120Z" fill="#D7A15A" /><path d="M170 180 L170 140 M170 156 L160 150 L160 140 M170 150 L180 144 L180 136" stroke="#558B2F" strokeWidth="7" strokeLinecap="round" fill="none" /></>;
    }
    case "london": {
      const s = sky(uid, "#B8C6DB", "#E9EEF5");
      return <>{s.def}<rect width="200" height="240" fill={`url(#${s.id})`} /><rect x="20" y="30" width="26" height="160" fill="#C9A66B" stroke="#8D6E3F" strokeWidth="2" /><path d="M18 30 L33 4 L48 30Z" fill="#5D6B7A" /><circle cx="33" cy="52" r="10" fill="#FFF8EE" stroke="#8D6E3F" strokeWidth="2" /><path d="M33 52 L33 45 M33 52 L38 54" stroke="#1A1740" strokeWidth="1.5" /><rect y="190" width="200" height="50" fill="#9AA5B1" /><g transform="translate(140 132)"><rect width="64" height="58" rx="6" fill="#E53935" stroke="#9B1C1C" strokeWidth="2" /><rect x="6" y="8" width="52" height="12" fill="#CFE9FF" /><rect x="6" y="30" width="52" height="12" fill="#CFE9FF" /><circle cx="14" cy="60" r="6" fill="#1A1740" /><circle cx="50" cy="60" r="6" fill="#1A1740" /></g><path d="M60 20 Q70 12 82 18 Q94 10 104 20 Q112 26 100 28 L64 28 Q54 26 60 20Z" fill="#fff" opacity="0.8" /></>;
    }
    case "paris": {
      const s = sky(uid, "#F8BBD0", "#FFF3E0");
      return <>{s.def}<rect width="200" height="240" fill={`url(#${s.id})`} /><g fill="#6D5D53"><path d="M151 14 L153 14 L155 40 L161 40 L163 62 L167 62 L178 186 L165 186 Q161 158 152 156 Q143 158 139 186 L126 186 L137 62 L141 62 L143 40 L149 40Z" /></g><path d="M139 62 L165 62 M136 100 L168 100 M131 140 L173 140" stroke="#4E4038" strokeWidth="3" /><path d="M142 66 L162 96 M162 66 L142 96 M138 104 L166 136 M166 104 L138 136" stroke="#8D7B6F" strokeWidth="1.2" /><rect y="186" width="200" height="54" fill="#B0A69E" /><rect x="10" y="120" width="60" height="70" fill="#E8DCCB" stroke="#C9B9A3" strokeWidth="2" />{[20, 36, 52].map((x) => <rect key={x} x={x} y="134" width="10" height="16" fill="#90A4AE" />)}<path d="M8 120 L40 104 L72 120Z" fill="#78909C" /></>;
    }
    case "lombok": {
      const s = sky(uid, "#7FD3FF", "#E6F8FF");
      return <>{s.def}<rect width="200" height="240" fill={`url(#${s.id})`} /><path d="M10 140 L90 40 L104 52 L116 40 L196 140Z" fill="#7C8BA1" /><path d="M78 56 L90 40 L104 52 L116 40 L128 56 Q104 64 78 56Z" fill="#fff" /><path d="M0 150 Q100 120 200 150 L200 240 L0 240Z" fill="#7CCF7A" /><path d="M0 175 Q100 150 200 175" stroke="#4E9E6A" strokeWidth="4" fill="none" /><path d="M0 200 Q100 178 200 200" stroke="#4E9E6A" strokeWidth="4" fill="none" /><path d="M176 200 Q172 150 182 120" stroke="#8D5524" strokeWidth="5" fill="none" /><path d="M182 120 Q162 114 156 126 M182 120 Q200 108 204 122 M182 120 Q178 100 166 102" stroke="#2FBF9A" strokeWidth="6" fill="none" strokeLinecap="round" /></>;
    }
    case "tokyo": {
      const s = sky(uid, "#B39DDB", "#FCE4EC");
      return <>{s.def}<rect width="200" height="240" fill={`url(#${s.id})`} /><circle cx="150" cy="44" r="16" fill="#fff" opacity="0.8" /><path d="M20 150 L20 90 M64 150 L64 90" stroke="#C62828" strokeWidth="7" /><path d="M10 88 Q42 80 74 88 L74 96 L10 96Z" fill="#C62828" /><rect x="14" y="104" width="56" height="6" fill="#C62828" />{[[110, 70, 26], [140, 100, 22], [166, 60, 30]].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height={190 - y} fill={i % 2 ? "#5C6BC0" : "#7986CB"} />)}<rect y="186" width="200" height="54" fill="#9FA8DA" />{[30, 60, 90].map((x) => <circle key={x} cx={x} cy={40 + (x % 20)} r="4" fill="#F8BBD0" />)}</>;
    }
    case "nyc": {
      const s = sky(uid, "#FFB38A", "#FFE5C7");
      return <>{s.def}<rect width="200" height="240" fill={`url(#${s.id})`} />{[[0, 90, 30], [28, 50, 26], [52, 110, 24], [150, 70, 28], [176, 100, 24], [128, 120, 22]].map(([x, y, w], i) => <g key={i}><rect x={x} y={y} width={w} height={240 - y} fill={i % 2 ? "#4A4E69" : "#5C607E"} />{Array.from({ length: 6 }, (_, k) => <rect key={k} x={x + 5} y={y + 10 + k * 16} width={w - 10} height="5" fill="#FFD166" opacity="0.7" />)}</g>)}<path d="M36 50 L41 20 L46 50" fill="#5C607E" /><rect y="200" width="200" height="40" fill="#4A4E69" /><g transform="translate(130 188)"><rect width="56" height="22" rx="6" fill="#FFD166" stroke="#1A1740" strokeWidth="2" /><rect x="12" y="-8" width="30" height="12" rx="4" fill="#FFD166" stroke="#1A1740" strokeWidth="2" /><circle cx="12" cy="24" r="5" fill="#1A1740" /><circle cx="44" cy="24" r="5" fill="#1A1740" /></g></>;
    }
    case "space":
      return <><rect width="200" height="240" fill="#0F0E2A" />{Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 47) % 200} cy={(i * 83) % 240} r={i % 3 ? 1 : 1.8} fill="#fff" opacity="0.8" />)}<circle cx="160" cy="50" r="22" fill="#FF7A6B" /><ellipse cx="160" cy="50" rx="36" ry="7" fill="none" stroke="#FFD166" strokeWidth="3" transform="rotate(-18 160 50)" /><circle cx="30" cy="40" r="10" fill="#5FD3B5" opacity="0.8" /><rect y="200" width="200" height="40" fill="#2E2A6B" /></>;
    default: // home
      return <><rect width="200" height="240" fill="#F1EEFF" /><rect y="190" width="200" height="50" fill="#E3DDFB" /><rect x="18" y="30" width="54" height="48" rx="6" fill="#CFE9FF" stroke="#CFCCFF" strokeWidth="4" /><path d="M45 30 L45 78 M18 54 L72 54" stroke="#CFCCFF" strokeWidth="3" /><rect x="150" y="150" width="20" height="40" rx="4" fill="#FF8F80" /><circle cx="160" cy="142" r="16" fill="#5FD3B5" /><circle cx="170" cy="34" r="10" fill="#FFD166" opacity="0.6" /></>;
  }
}
