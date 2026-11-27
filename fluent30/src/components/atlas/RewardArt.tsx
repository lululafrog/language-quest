// Illustration of an Atlas reward. Wearables / decor reuse the avatar renderer (same art as the
// dressing), stamps reuse the passport stamp, and souvenirs, postcards and trophies get original
// line-and-flat-colour drawings in the cozy travel-journal style.
import type { ReactNode } from "react";
import type { AtlasReward } from "@/lib/atlas/types";
import { SHOP_BY_ID } from "@/lib/data/shop";
import { DESTINATIONS } from "@/lib/data/destinations";
import { Tourist } from "@/components/avatar/Tourist";
import { Stamp } from "@/components/passport/Stamp";
import { cx } from "@/components/ui";

const O = "#3B2E2C";
const S = { stroke: O, strokeWidth: 1.6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export function RewardArt({ reward, destId, accent = "#C9785A", locked, size = 56, className }: {
  reward: AtlasReward;
  destId?: string;
  accent?: string;
  locked?: boolean;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size, filter: locked ? "grayscale(1)" : undefined, opacity: locked ? 0.55 : 1 };
  const item = reward.shopItem ? SHOP_BY_ID.get(reward.shopItem) : undefined;
  if (item) {
    return (
      <span className={cx("inline-block overflow-hidden rounded-xl", className)} style={{ ...style, background: item.slot === "background" ? undefined : "#F4EBDD" }}>
        <Tourist equipped={{ [item.slot]: item.id }} mannequin={item.slot} animate={false} className="h-full w-full" title={reward.fr} />
      </span>
    );
  }
  if (reward.kind === "stamp") {
    const id = destId ?? (reward.id.startsWith("nz-") ? "new-zealand" : undefined);
    const dest = DESTINATIONS.find((d) => d.atlas && (id ? d.atlas === id : reward.id.startsWith(`${d.atlas}-`)));
    if (dest) return <span className={cx("inline-block", className)} style={style}><Stamp dest={dest} size={size} tilt={-6} /></span>;
  }
  const motif = reward.motif ?? "";
  let body: ReactNode;
  if (reward.kind === "postcard") body = postcard(motif, accent);
  else if (reward.kind === "trophy") body = trophy(motif, accent);
  else body = SOUVENIRS[motif]?.(accent) ?? fallback(reward.kind, accent);
  return (
    <svg viewBox="0 0 64 64" className={cx("inline-block", className)} style={style} role="img" aria-label={reward.fr}>
      {body}
    </svg>
  );
}

// ---------- souvenirs ----------
const SOUVENIRS: Record<string, (a: string) => ReactNode> = {
  turtle: () => (
    <g>
      <ellipse cx="32" cy="34" rx="15" ry="11" fill="#6F8F6A" {...S} />
      <path d="M24 30l8-5 8 5-3 8h-10z" fill="#8FAF8A" stroke={O} strokeWidth="1.1" />
      <ellipse cx="50" cy="31" rx="5.5" ry="4" fill="#A9BFA0" {...S} />
      <path d="M20 26l-6-5M20 42l-6 5M42 25l4-6M42 43l4 6" stroke="#A9BFA0" strokeWidth="4" strokeLinecap="round" />
      <circle cx="52" cy="30" r="0.9" fill={O} />
    </g>
  ),
  ticket: (a) => (
    <g transform="rotate(-10 32 32)">
      <path d="M10 22h44v7a3 3 0 0 0 0 6v7H10v-7a3 3 0 0 0 0-6z" fill="#F3E9D2" {...S} />
      <path d="M42 22v20" stroke={O} strokeWidth="1" strokeDasharray="2 2" />
      <rect x="15" y="27" width="22" height="4" rx="1" fill={a} />
      <path d="M15 35h16M15 38h10" stroke="#8C7A66" strokeWidth="1.4" />
      <circle cx="48" cy="32" r="3" fill={a} opacity="0.8" />
    </g>
  ),
  map: (a) => (
    <g>
      <path d="M10 18l14-5 16 5 14-5v33l-14 5-16-5-14 5z" fill="#F3E9D2" {...S} />
      <path d="M24 13v33M40 18v33" stroke="#C9B9A3" strokeWidth="1.2" />
      <path d="M15 40q8-14 17-6t16-14" stroke={a} strokeWidth="2" strokeDasharray="3 2.5" fill="none" />
      <path d="M46 18l2 4 2-4a2 2 0 1 0-4 0z" fill="#B23A3A" stroke={O} strokeWidth="1" />
    </g>
  ),
  notebook: (a) => (
    <g>
      <rect x="16" y="12" width="32" height="40" rx="3" fill="#8C5A3C" {...S} />
      <path d="M21 12v40" stroke="#6B4430" strokeWidth="1.6" />
      <path d="M16 30h32" stroke={a} strokeWidth="3" />
      <rect x="27" y="18" width="16" height="7" rx="1" fill="#F3E9D2" stroke={O} strokeWidth="0.8" />
      <circle cx="42" cy="38" r="2.5" fill={a} stroke={O} strokeWidth="1" />
    </g>
  ),
  book: (a) => (
    <g>
      <path d="M8 18q12-4 24 2q12-6 24-2v30q-12-4-24 2q-12-6-24-2z" fill="#FBF7F0" {...S} />
      <path d="M32 20v30" stroke={O} strokeWidth="1.4" />
      <path d="M13 25q7-2 14 1M13 31q7-2 14 1M13 37q7-2 14 1M37 26q7-3 14-1M37 32q7-3 14-1" stroke="#B9A88F" strokeWidth="1.1" fill="none" />
      <path d="M42 14v10l3-2 3 2V14" fill={a} stroke={O} strokeWidth="1" />
    </g>
  ),
  print: (a) => (
    <g>
      <rect x="10" y="12" width="44" height="40" rx="2" fill="#8C6A4A" {...S} />
      <rect x="15" y="17" width="34" height="30" fill="#FBF7F0" />
      <path d="M15 40l9-10 7 7 6-5 12 10v5H15z" fill={a} opacity="0.8" />
      <circle cx="40" cy="25" r="3.5" fill="#E9C46A" />
    </g>
  ),
  poster: (a) => (
    <g>
      <rect x="14" y="10" width="36" height="46" rx="2" fill="#FBF7F0" {...S} />
      <circle cx="32" cy="26" r="8" fill={a} />
      <path d="M18 44h28M22 49h20" stroke={O} strokeWidth="2" />
      <path d="M14 10l4 3M50 10l-4 3" stroke="#C9B9A3" strokeWidth="1.4" />
    </g>
  ),
  recipe: (a) => (
    <g>
      <rect x="14" y="12" width="36" height="42" rx="3" fill="#FBF7F0" {...S} />
      <path d="M20 22h16M20 30h24M20 36h20M20 42h22M20 48h12" stroke="#B9A88F" strokeWidth="1.4" />
      <path d="M40 14q4 4 0 8q-4-4 0-8z" fill={a} />
      <path d="M44 12q3 5-1 9" stroke={O} strokeWidth="1" fill="none" />
    </g>
  ),
  mug: (a) => (
    <g>
      <path d="M16 22h26v22a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z" fill="#FBF7F0" {...S} />
      <path d="M42 26h4a5 5 0 0 1 0 12h-4" stroke={O} strokeWidth="1.8" fill="none" />
      <path d="M16 32h26" stroke={a} strokeWidth="4" />
      <path d="M24 18q-2-4 1-7M32 18q-2-4 1-7" stroke="#B9A88F" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  ),
  "espresso-cup": (a) => (
    <g>
      <ellipse cx="32" cy="46" rx="18" ry="4" fill="#E6DCCB" {...S} />
      <path d="M20 28h22l-2 13a5 5 0 0 1-5 4h-8a5 5 0 0 1-5-4z" fill="#FBF7F0" {...S} />
      <path d="M42 31h3a4 4 0 0 1 0 8h-4" stroke={O} strokeWidth="1.6" fill="none" />
      <ellipse cx="31" cy="28" rx="11" ry="2" fill="#6B4430" />
      <path d="M22 35h18" stroke={a} strokeWidth="2" />
    </g>
  ),
  phin: (a) => (
    // Vietnamese drip filter on a glass
    <g>
      <path d="M22 34h20l-2 18h-16z" fill="#E8F1F4" {...S} />
      <path d="M23 42h18l-1 9h-16z" fill="#8C5A3C" opacity="0.85" />
      <path d="M20 30h24v4H20z" fill="#B0B7C3" {...S} />
      <path d="M24 18h16l-2 12H26z" fill="#C3CAD3" {...S} />
      <rect x="22" y="14" width="20" height="4" rx="1.5" fill="#B0B7C3" {...S} />
      <circle cx="32" cy="12" r="1.6" fill={a} />
    </g>
  ),
  pottery: (a) => (
    <g>
      <path d="M24 14h16v4q8 6 8 16q0 14-16 16q-16-2-16-16q0-10 8-16z" fill="#C9785A" {...S} />
      <path d="M18 32q14 4 28 0" stroke="#F3E9D2" strokeWidth="2" fill="none" />
      <path d="M20 39q12 3 24 0" stroke={a} strokeWidth="1.6" fill="none" />
    </g>
  ),
  indigo: () => (
    <g>
      <path d="M12 16h40v32H12z" fill="#2F4A6B" {...S} />
      <g fill="#DCE9EE" opacity="0.85">{[[20, 24], [32, 24], [44, 24], [26, 34], [38, 34], [20, 42], [32, 42], [44, 42]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" />)}</g>
      <path d="M12 16q20 6 40 0" stroke="#4C6E8A" strokeWidth="1.4" fill="none" />
    </g>
  ),
  batik: (a) => (
    <g>
      <rect x="12" y="14" width="40" height="36" rx="2" fill="#6B4A2E" {...S} />
      <path d="M12 26q5-6 10 0t10 0t10 0t10 0M12 38q5-6 10 0t10 0t10 0t10 0" stroke="#E6D2A8" strokeWidth="2" fill="none" />
      <g fill={a}>{[17, 27, 37, 47].map((x) => <circle key={x} cx={x} cy="32" r="1.6" />)}</g>
    </g>
  ),
  furoshiki: (a) => (
    // a wrapping cloth tied around a box
    <g>
      <path d="M14 30h36v20H14z" fill={a} {...S} />
      <path d="M24 30q-6-10 4-12q4 6 4 12q0-6 4-12q10 2 4 12" fill={a} {...S} />
      <path d="M18 36q14 4 28 0M18 44q14 4 28 0" stroke="#F3E9D2" strokeWidth="1.2" fill="none" opacity="0.8" />
    </g>
  ),
  lantern: (a) => (
    <g>
      <path d="M32 6v8" stroke={O} strokeWidth="1.4" />
      <rect x="26" y="12" width="12" height="4" fill="#8C6A4A" {...S} />
      <ellipse cx="32" cy="32" rx="15" ry="17" fill={a} {...S} />
      <path d="M24 18q-4 14 0 28M40 18q4 14 0 28M32 15v34" stroke="#000" strokeWidth="1" opacity="0.2" fill="none" />
      <rect x="27" y="48" width="10" height="4" fill="#8C6A4A" {...S} />
      <path d="M32 52v7" stroke={a} strokeWidth="2.4" />
    </g>
  ),
  kiwi: () => (
    <g>
      <ellipse cx="30" cy="36" rx="16" ry="12" fill="#8C6A4A" {...S} />
      <circle cx="44" cy="30" r="6" fill="#8C6A4A" {...S} />
      <path d="M49 31q8 4 11 12" stroke={O} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="45.5" cy="29" r="1" fill={O} />
      <path d="M24 47l-2 7M34 47l2 7" stroke={O} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 32q4-2 8 0M24 38q4-2 8 0" stroke="#6B4A3A" strokeWidth="1" fill="none" />
    </g>
  ),
  basket: (a) => (
    // a woven flax-style basket (a craft object, not a ceremonial one)
    <g>
      <path d="M12 26h40l-5 24H17z" fill="#C9A66B" {...S} />
      <path d="M14 32h36M15 38h34M16 44h32" stroke="#8C6A4A" strokeWidth="1.2" />
      <path d="M20 26v24M28 26v24M36 26v24M44 26v24" stroke="#8C6A4A" strokeWidth="1" opacity="0.7" />
      <path d="M22 26q10-16 20 0" stroke={O} strokeWidth="2" fill="none" />
      <path d="M12 26h40" stroke={a} strokeWidth="2" />
    </g>
  ),
  beads: (a) => (
    <g>
      {Array.from({ length: 14 }, (_, i) => {
        const t = (i / 14) * Math.PI * 2;
        return <circle key={i} cx={32 + Math.cos(t) * 16} cy={32 + Math.sin(t) * 12} r="3.2" fill={["#B23A3A", "#E9C46A", "#2E6B4F", a, "#FBF7F0"][i % 5]} stroke={O} strokeWidth="0.9" />;
      })}
    </g>
  ),
  boat: (a) => (
    // felucca with a triangular sail
    <g>
      <path d="M6 48q26 6 52 0" stroke="#4C8DA8" strokeWidth="2.2" fill="none" />
      <path d="M12 42h40l-6 6H18z" fill="#8C5A3C" {...S} />
      <path d="M30 42V10M30 10l18 28H30z" fill="#FBF7F0" {...S} />
      <path d="M30 14L14 38h16" fill={a} opacity="0.85" stroke={O} strokeWidth="1.2" />
    </g>
  ),
  bottle: (a) => (
    // reusable water bottle
    <g>
      <rect x="22" y="16" width="20" height="38" rx="7" fill={a} {...S} />
      <rect x="26" y="9" width="12" height="7" rx="2" fill="#37474F" {...S} />
      <path d="M22 30h20" stroke="#FBF7F0" strokeWidth="2" opacity="0.7" />
      <path d="M26 22v24" stroke="#fff" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
    </g>
  ),
  clapper: (a) => (
    <g>
      <rect x="12" y="26" width="40" height="26" rx="2" fill="#2F2A28" {...S} />
      <path d="M12 18l38-8 2 8-38 8z" fill="#2F2A28" {...S} />
      <path d="M18 17l6 5M28 15l6 5M38 13l6 5" stroke="#FBF7F0" strokeWidth="3" />
      <path d="M17 34h30M17 42h20" stroke={a} strokeWidth="2" />
    </g>
  ),
  onigiri: () => (
    <g>
      <path d="M32 12q18 22 16 34q-2 6-16 6t-16-6q-2-12 16-34z" fill="#FBF7F0" {...S} />
      <path d="M22 38h20v14H22z" fill="#2F3A2E" stroke={O} strokeWidth="1.3" />
      <circle cx="28" cy="28" r="1" fill="#C9B9A3" />
      <circle cx="36" cy="32" r="1" fill="#C9B9A3" />
    </g>
  ),
  paddle: (a) => (
    <g transform="rotate(-30 32 32)">
      <rect x="30" y="6" width="4" height="34" rx="2" fill="#8C6A4A" {...S} />
      <path d="M26 38h12l-1 16q-5 4-10 0z" fill={a} {...S} />
      <rect x="28" y="4" width="8" height="5" rx="2" fill="#37474F" {...S} />
    </g>
  ),
  "rolling-pin": (a) => (
    <g transform="rotate(-20 32 32)">
      <rect x="16" y="26" width="32" height="12" rx="6" fill="#D9B98A" {...S} />
      <rect x="6" y="29" width="10" height="6" rx="3" fill="#8C6A4A" {...S} />
      <rect x="48" y="29" width="10" height="6" rx="3" fill="#8C6A4A" {...S} />
      <path d="M20 48q6-4 12 0t12 0" stroke={a} strokeWidth="2" fill="none" />
    </g>
  ),
  strap: (a) => (
    // a jump/harness strap badge (activity souvenir)
    <g>
      <path d="M16 12l12 40M48 12L36 52" stroke={a} strokeWidth="7" strokeLinecap="round" />
      <rect x="23" y="27" width="18" height="12" rx="3" fill="#B0B7C3" {...S} />
      <rect x="27" y="30" width="10" height="6" rx="1.5" fill="#37474F" />
    </g>
  ),
  van: (a) => (
    <g>
      <path d="M8 44V24q0-6 6-6h28l12 12v14z" fill={a} {...S} />
      <path d="M42 18v12h12" stroke={O} strokeWidth="1.4" fill="none" />
      <rect x="14" y="22" width="10" height="8" rx="1.5" fill="#DCE9EE" stroke={O} strokeWidth="1.1" />
      <rect x="28" y="22" width="10" height="8" rx="1.5" fill="#DCE9EE" stroke={O} strokeWidth="1.1" />
      <path d="M8 36h46" stroke="#FBF7F0" strokeWidth="2.4" />
      <circle cx="18" cy="46" r="5" fill="#37474F" {...S} />
      <circle cx="44" cy="46" r="5" fill="#37474F" {...S} />
    </g>
  ),
  volcano: (a) => (
    <g>
      <path d="M6 52l18-26h16l18 26z" fill="#8C7A66" {...S} />
      <path d="M24 26q8 6 16 0" stroke={a} strokeWidth="2.4" fill="none" />
      <path d="M28 20q-4-6 0-10M34 18q2-6 6-8" stroke="#B9A88F" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M6 52h52" stroke="#6F8F6A" strokeWidth="3" />
    </g>
  ),
  pin: (a) => (
    <g>
      <circle cx="32" cy="30" r="16" fill={a} {...S} />
      <circle cx="32" cy="30" r="11" fill="#FBF7F0" stroke={O} strokeWidth="1.2" />
      <path d="M32 22l2.4 5 5.6.6-4.2 3.8 1.2 5.4L32 34l-5 2.8 1.2-5.4L24 27.6l5.6-.6z" fill={a} />
      <path d="M32 46v10" stroke="#B0B7C3" strokeWidth="2" />
    </g>
  ),
};

function fallback(kind: AtlasReward["kind"], a: string): ReactNode {
  if (kind === "souvenir-activity") return SOUVENIRS.ticket(a);
  // souvenir box with ribbon (culture & others)
  return (
    <g>
      <rect x="14" y="26" width="36" height="26" rx="2" fill={a} {...S} />
      <rect x="12" y="20" width="40" height="8" rx="2" fill={a} {...S} />
      <path d="M32 20v32" stroke="#F3E9D2" strokeWidth="4" />
      <path d="M32 20q-12-12-12-2q4 4 12 2q12 2 12-2q0-10-12 2z" fill="#F3E9D2" stroke={O} strokeWidth="1.2" />
    </g>
  );
}

// ---------- trophies ----------
function trophy(motif: string, a: string): ReactNode {
  const emblem =
    motif === "obelisk" ? <path d="M30 14h4l2 18h-8zM30 14l2-3 2 3" fill="#E9C46A" stroke={O} strokeWidth="1.1" />
    : motif === "protea" ? (
      <g>{[0, 40, 80, 120, 160, 200, 240, 280, 320].map((r) => <ellipse key={r} cx="32" cy="18" rx="2.6" ry="6" fill="#E8A0A8" stroke={O} strokeWidth="0.7" transform={`rotate(${r} 32 23)`} />)}<circle cx="32" cy="23" r="3.6" fill="#F3E9D2" stroke={O} strokeWidth="0.8" /></g>
    ) : <path d="M32 13l2.6 5.4 6 .8-4.4 4.2 1 6L32 26.6l-5.2 2.8 1-6-4.4-4.2 6-.8z" fill="#FBF7F0" stroke={O} strokeWidth="1" />;
  return (
    <g>
      <path d="M18 8h28v12q0 14-14 16q-14-2-14-16z" fill="#E9C46A" {...S} />
      <path d="M18 12h-6q0 10 8 12M46 12h6q0 10-8 12" stroke={O} strokeWidth="1.8" fill="none" />
      <rect x="28" y="36" width="8" height="8" fill="#D4A64A" {...S} />
      <rect x="18" y="44" width="28" height="10" rx="2" fill={a} {...S} />
      <path d="M22 49h20" stroke="#F3E9D2" strokeWidth="1.6" />
      <path d="M24 12q-2 10 4 16" stroke="#fff" strokeWidth="2" opacity="0.4" fill="none" strokeLinecap="round" />
      {emblem}
    </g>
  );
}

// ---------- postcards (mini scene in a card frame) ----------
function postcard(motif: string, a: string): ReactNode {
  const scene: Record<string, ReactNode> = {
    "rice-terraces": <g><path d="M10 26l10-10 8 6 10-8 16 12v26H10z" fill="#6F8F6A" /><path d="M10 34q22-6 44 0M10 40q22-6 44 0M10 46q22-6 44 0" stroke="#A9BFA0" strokeWidth="1.6" fill="none" /></g>,
    "lantern-river": <g><rect x="10" y="40" width="44" height="12" fill="#2F4A6B" />{[18, 30, 42].map((x, i) => <g key={x}><ellipse cx={x} cy={22 + (i % 2) * 4} rx="4" ry="5" fill={["#C2573A", "#E9C46A", "#C2573A"][i]} /><ellipse cx={x} cy="45" rx="2.4" ry="1.2" fill="#E9C46A" opacity="0.8" /></g>)}</g>,
    torii: <g><path d="M10 36l12-14 8 6 10-12 14 20v16H10z" fill="#8FA9B8" /><path d="M20 52V30M44 52V30" stroke="#B23A3A" strokeWidth="3" /><path d="M15 28q17-5 34 0M17 34h30" stroke="#B23A3A" strokeWidth="3" /></g>,
    harbour: <g><rect x="10" y="42" width="44" height="10" fill="#4C8DA8" /><path d="M16 42q4-14 10-14q-2 8 0 14M26 42q4-16 12-16q-2 10 0 16M38 42q4-12 10-12q-2 8 0 12" fill="#FBF7F0" stroke={O} strokeWidth="1" /></g>,
    road: <g><rect x="10" y="12" width="44" height="40" fill="#E9C9A0" /><path d="M10 30h10v-6h8v6M54 28h-8v-8h-6v10" fill="#C9785A" /><path d="M28 52l3-22h2l3 22z" fill="#5A5A5A" /><path d="M32 50v-4M32 42v-4M32 36v-3" stroke="#E9C46A" strokeWidth="1" /></g>,
    arches: <g><rect x="10" y="12" width="44" height="40" fill="#F3E2C6" /><path d="M10 52V30q22-8 44 0v22" fill="#D9A777" /><path d="M14 52v-10a3 3 0 0 1 6 0v10M24 52v-11a3 3 0 0 1 6 0v11M34 52v-11a3 3 0 0 1 6 0v11M44 52v-10a3 3 0 0 1 6 0v10" fill="#F3E2C6" stroke={O} strokeWidth="0.8" /></g>,
    "castle-rooftops": <g><path d="M10 52V34h8v-6h6v6h6V24l4-6 4 6v10h6v-4h10v22z" fill="#8C7A66" /><path d="M10 44h44" stroke="#6B5A48" strokeWidth="1" /></g>,
    fiord: <g><path d="M10 52V24l10-10 8 12 6-6 10 12 10-6v26z" fill="#6F8F6A" /><path d="M24 52q8-16 16 0z" fill="#4C8DA8" /><path d="M18 18l2-4 2 4z" fill="#FBF7F0" /></g>,
    pyramids: <g><rect x="10" y="40" width="44" height="12" fill="#E9C9A0" /><path d="M14 44l12-22 12 22zM32 44l10-16 10 16z" fill="#D9A777" stroke={O} strokeWidth="1" /><circle cx="46" cy="20" r="3" fill="#E9C46A" /></g>,
    "table-mountain": <g><rect x="10" y="44" width="44" height="8" fill="#4C8DA8" /><path d="M10 44l8-12h4l4-6h16l4 6h2l6 12z" fill="#7A8F6E" stroke={O} strokeWidth="1" /><path d="M24 22q4-3 8 0q4-3 8 0" stroke="#FBF7F0" strokeWidth="3" fill="none" strokeLinecap="round" /></g>,
  };
  return (
    <g transform="rotate(-6 32 32)">
      <rect x="6" y="8" width="52" height="48" rx="2" fill="#FBF7F0" {...S} />
      <clipPath id={`pc-${motif}`}><rect x="10" y="12" width="44" height="40" /></clipPath>
      <rect x="10" y="12" width="44" height="40" fill="#DCE9EE" />
      <g clipPath={`url(#pc-${motif})`}>{scene[motif] ?? <path d="M10 40l12-12 10 8 8-6 14 10v12H10z" fill={a} />}</g>
      <rect x="44" y="14" width="8" height="9" fill={a} stroke={O} strokeWidth="0.8" />
    </g>
  );
}
