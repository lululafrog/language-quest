// The learner's tourist, drawn in SVG, dressed with the items they bought.
import type { ReactNode } from "react";
import type { AvatarSlot } from "@/lib/types";

const O = "#2E2A6B"; // outline
const SKIN = "#FFD9B8";
const sw = 2.5;

type Equipped = Partial<Record<AvatarSlot, string>>;

export function Tourist({ equipped = {}, className, animate = true, title }: { equipped?: Equipped; className?: string; animate?: boolean; title?: string }) {
  const e = equipped;
  return (
    <svg viewBox="0 0 200 240" className={className} role="img" aria-label={title ?? "Ton touriste"}>
      <defs>
        <clipPath id="tour-clip"><rect width="200" height="240" rx="28" /></clipPath>
      </defs>
      <g clipPath="url(#tour-clip)">
        {BACKGROUNDS[e.background ?? "bg-home"] ?? BACKGROUNDS["bg-home"]}
        <ellipse cx="100" cy="226" rx="48" ry="7" fill="#000" opacity="0.12" />
        <g className={animate ? "tourist-bob" : undefined}>
          {/* hand item drawn behind the body when it's big */}
          {e.hand === "hand-suitcase" && ITEMS["hand-suitcase"]}
          {/* legs */}
          <rect x="76" y="170" width="18" height="46" rx="8" fill={SKIN} stroke={O} strokeWidth={sw} />
          <rect x="106" y="170" width="18" height="46" rx="8" fill={SKIN} stroke={O} strokeWidth={sw} />
          {e.shoes ? ITEMS[e.shoes] : DEFAULT.shoes}
          {e.bottom ? ITEMS[e.bottom] : DEFAULT.bottom}
          {/* arms */}
          <rect x="44" y="116" width="22" height="50" rx="11" fill={SKIN} stroke={O} strokeWidth={sw} />
          <rect x="134" y="116" width="22" height="50" rx="11" fill={SKIN} stroke={O} strokeWidth={sw} />
          {e.top ? ITEMS[e.top] : DEFAULT.top}
          <circle cx="55" cy="168" r="10" fill={SKIN} stroke={O} strokeWidth={sw} />
          <circle cx="145" cy="168" r="10" fill={SKIN} stroke={O} strokeWidth={sw} />
          {e.hand === "hand-duck" && ITEMS["hand-duck"]}
          {e.neck && ITEMS[e.neck]}
          {/* head */}
          <circle cx="61" cy="72" r="8" fill={SKIN} stroke={O} strokeWidth={sw} />
          <circle cx="139" cy="72" r="8" fill={SKIN} stroke={O} strokeWidth={sw} />
          <circle cx="100" cy="68" r="40" fill={SKIN} stroke={O} strokeWidth={sw} />
          <path d="M61 62 Q62 26 100 26 Q138 26 139 62 Q128 44 104 46 Q84 42 72 52 Q66 56 61 62Z" fill="#6B4226" stroke={O} strokeWidth={sw} strokeLinejoin="round" />
          <ellipse cx="78" cy="84" rx="7" ry="4" fill="#FF8A8A" opacity="0.45" />
          <ellipse cx="122" cy="84" rx="7" ry="4" fill="#FF8A8A" opacity="0.45" />
          {e.face && ITEMS[e.face]}
          <circle cx="86" cy="72" r="5" fill={O} />
          <circle cx="114" cy="72" r="5" fill={O} />
          <circle cx="87.8" cy="70" r="1.8" fill="#fff" />
          <circle cx="115.8" cy="70" r="1.8" fill="#fff" />
          {e.face !== "face-moustache" && <path d="M91 88 Q100 97 109 88" stroke={O} strokeWidth={sw} fill="none" strokeLinecap="round" />}
          {e.face === "face-moustache" && ITEMS["face-moustache-top"]}
          {e.glasses && ITEMS[e.glasses]}
          {e.hat && ITEMS[e.hat]}
          {e.hand && e.hand !== "hand-suitcase" && e.hand !== "hand-duck" && ITEMS[e.hand]}
        </g>
      </g>
    </svg>
  );
}

const DEFAULT = {
  shoes: (
    <>
      <ellipse cx="84" cy="218" rx="14" ry="7" fill="#fff" stroke={O} strokeWidth={sw} />
      <ellipse cx="116" cy="218" rx="14" ry="7" fill="#fff" stroke={O} strokeWidth={sw} />
    </>
  ),
  bottom: <rect x="70" y="156" width="60" height="34" rx="10" fill="#7AA6C2" stroke={O} strokeWidth={sw} />,
  top: (
    <>
      <rect x="64" y="108" width="72" height="62" rx="22" fill="#FFFFFF" stroke={O} strokeWidth={sw} />
      <rect x="44" y="114" width="22" height="24" rx="10" fill="#FFFFFF" stroke={O} strokeWidth={sw} />
      <rect x="134" y="114" width="22" height="24" rx="10" fill="#FFFFFF" stroke={O} strokeWidth={sw} />
    </>
  ),
};

const shirt = (fill: string, extra?: ReactNode, sleeve = fill) => (
  <>
    <rect x="64" y="108" width="72" height="62" rx="22" fill={fill} stroke={O} strokeWidth={sw} />
    <rect x="43" y="113" width="24" height="30" rx="11" fill={sleeve} stroke={O} strokeWidth={sw} />
    <rect x="133" y="113" width="24" height="30" rx="11" fill={sleeve} stroke={O} strokeWidth={sw} />
    {extra}
  </>
);

const ITEMS: Record<string, ReactNode> = {
  // ---- hats
  "hat-bob": (
    <>
      <ellipse cx="100" cy="40" rx="50" ry="11" fill="#C9B27C" stroke={O} strokeWidth={sw} />
      <path d="M68 40 Q68 12 100 12 Q132 12 132 40Z" fill="#D8C38E" stroke={O} strokeWidth={sw} />
    </>
  ),
  "hat-straw": (
    <>
      <ellipse cx="100" cy="40" rx="66" ry="14" fill="#F2D16B" stroke={O} strokeWidth={sw} />
      <path d="M70 40 Q70 10 100 10 Q130 10 130 40Z" fill="#F7DE8A" stroke={O} strokeWidth={sw} />
      <rect x="70" y="30" width="60" height="8" fill="#FF7A6B" stroke={O} strokeWidth={2} />
    </>
  ),
  "hat-london": (
    <>
      <path d="M62 46 Q62 16 100 16 Q138 16 138 46Z" fill="#E53935" stroke={O} strokeWidth={sw} />
      <path d="M120 44 Q150 42 160 50 Q140 54 118 50Z" fill="#C62828" stroke={O} strokeWidth={sw} />
      <text x="100" y="38" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="sans-serif">I♥LDN</text>
    </>
  ),
  "hat-cowboy": (
    <>
      <path d="M34 40 Q50 52 100 50 Q150 52 166 40 Q160 56 100 58 Q40 56 34 40Z" fill="#9C6B3C" stroke={O} strokeWidth={sw} />
      <path d="M70 48 L74 16 Q88 8 100 18 Q112 8 126 16 L130 48Z" fill="#B5814B" stroke={O} strokeWidth={sw} strokeLinejoin="round" />
      <rect x="72" y="38" width="56" height="6" fill="#5A3A1E" />
    </>
  ),
  "hat-sombrero": (
    <>
      <ellipse cx="100" cy="42" rx="92" ry="17" fill="#F4C542" stroke={O} strokeWidth={sw} />
      <path d="M14 44 L24 36 L34 46 L44 36 L54 46 M146 46 L156 36 L166 46 L176 36 L186 44" stroke="#E53935" strokeWidth="3" fill="none" />
      <path d="M76 42 Q74 0 100 0 Q126 0 124 42Z" fill="#F7D46A" stroke={O} strokeWidth={sw} />
      <rect x="75" y="30" width="50" height="7" fill="#2FBF9A" />
    </>
  ),
  "hat-viking": (
    <>
      <path d="M64 50 Q64 18 100 18 Q136 18 136 50Z" fill="#B0B7C3" stroke={O} strokeWidth={sw} />
      <rect x="62" y="44" width="76" height="9" rx="4" fill="#8A93A3" stroke={O} strokeWidth={sw} />
      <path d="M66 40 Q40 36 38 10 Q52 28 70 30Z" fill="#FFF8EE" stroke={O} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M134 40 Q160 36 162 10 Q148 28 130 30Z" fill="#FFF8EE" stroke={O} strokeWidth={sw} strokeLinejoin="round" />
    </>
  ),
  "hat-crown": (
    <>
      <path d="M68 42 L66 14 L82 28 L100 8 L118 28 L134 14 L132 42Z" fill="#FFD166" stroke={O} strokeWidth={sw} strokeLinejoin="round" />
      <circle cx="100" cy="30" r="5" fill="#E53935" stroke={O} strokeWidth={1.5} />
      <circle cx="80" cy="34" r="3.5" fill="#5FD3B5" stroke={O} strokeWidth={1.5} />
      <circle cx="120" cy="34" r="3.5" fill="#6A55F2" stroke={O} strokeWidth={1.5} />
    </>
  ),
  // ---- glasses
  "gl-heart": (
    <>
      <path d="M86 82 L75 71 A6 6 0 0 1 86 64 A6 6 0 0 1 97 71Z" fill="#FF5C8A" stroke={O} strokeWidth={2} />
      <path d="M114 82 L103 71 A6 6 0 0 1 114 64 A6 6 0 0 1 125 71Z" fill="#FF5C8A" stroke={O} strokeWidth={2} />
      <path d="M97 70 L103 70" stroke={O} strokeWidth={2} />
    </>
  ),
  "gl-big": (
    <>
      <rect x="68" y="60" width="30" height="24" rx="10" fill="#1A1740" stroke={O} strokeWidth={sw} />
      <rect x="102" y="60" width="30" height="24" rx="10" fill="#1A1740" stroke={O} strokeWidth={sw} />
      <path d="M98 68 L102 68" stroke={O} strokeWidth={sw} />
      <path d="M73 66 L80 63" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" opacity="0.7" />
      <path d="M107 66 L114 63" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" opacity="0.7" />
    </>
  ),
  "gl-aviator": (
    <>
      <path d="M72 64 L98 64 Q98 86 85 86 Q72 86 72 64Z" fill="#4A3B2B" opacity="0.9" stroke="#C9A227" strokeWidth={2.5} />
      <path d="M102 64 L128 64 Q128 86 115 86 Q102 86 102 64Z" fill="#4A3B2B" opacity="0.9" stroke="#C9A227" strokeWidth={2.5} />
      <path d="M98 66 L102 66" stroke="#C9A227" strokeWidth={2.5} />
    </>
  ),
  "gl-snorkel": (
    <>
      <rect x="68" y="58" width="64" height="28" rx="12" fill="#9EE6FF" opacity="0.6" stroke="#1E88E5" strokeWidth={4} />
      <path d="M134 70 L150 70 L150 22" stroke="#FF7A6B" strokeWidth={6} fill="none" strokeLinecap="round" />
    </>
  ),
  // ---- face
  "face-sunburn": (
    <>
      <circle cx="100" cy="68" r="38" fill="#FF5A4A" opacity="0.28" />
      <ellipse cx="100" cy="80" rx="8" ry="5" fill="#E53935" opacity="0.6" />
    </>
  ),
  "face-zinc": (
    <>
      <path d="M95 76 L105 76 L103 86 L97 86Z" fill="#fff" />
      <path d="M70 82 Q78 78 84 84" stroke="#fff" strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M116 84 Q122 78 130 82" stroke="#fff" strokeWidth={5} strokeLinecap="round" fill="none" />
    </>
  ),
  "face-moustache": null,
  "face-moustache-top": (
    <>
      <path d="M100 86 Q90 80 82 86 Q76 92 70 86 Q74 96 86 94 Q96 92 100 88 Q104 92 114 94 Q126 96 130 86 Q124 92 118 86 Q110 80 100 86Z" fill="#4A2C18" stroke={O} strokeWidth={1.5} />
      <path d="M94 98 Q100 101 106 98" stroke={O} strokeWidth={2} fill="none" strokeLinecap="round" />
    </>
  ),
  // ---- tops
  "top-ilove": shirt("#FFFFFF", <text x="100" y="146" textAnchor="middle" fontSize="15" fontWeight="900" fill="#1A1740" fontFamily="sans-serif">I<tspan fill="#E53935">♥</tspan>NY</text>),
  "top-hawaii": shirt(
    "#1E88E5",
    <>
      {[[78, 124], [118, 128], [92, 150], [124, 156], [74, 158], [54, 126], [146, 126]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5" fill="#FFD166" />
          <circle cx={x} cy={y} r="2" fill="#FF7A6B" />
        </g>
      ))}
      <path d="M86 108 L100 124 L114 108" stroke={O} strokeWidth={sw} fill="#5FD3B5" strokeLinejoin="round" />
    </>,
  ),
  "top-grab": shirt(
    "#00B14F",
    <>
      <path d="M100 110 L100 170" stroke="#008A3D" strokeWidth={3} />
      <path d="M86 108 L100 118 L114 108" stroke={O} strokeWidth={sw} fill="#008A3D" strokeLinejoin="round" />
      <rect x="64" y="146" width="72" height="6" fill="#D9F7E6" opacity="0.9" />
      <rect x="43" y="132" width="24" height="5" fill="#D9F7E6" opacity="0.9" />
      <rect x="133" y="132" width="24" height="5" fill="#D9F7E6" opacity="0.9" />
      <text x="117" y="134" textAnchor="middle" fontSize="9" fontWeight="900" fill="#fff" fontFamily="sans-serif">Grab</text>
    </>,
  ),
  "top-rain": (
    <>
      <path d="M100 100 L36 172 Q100 184 164 172Z" fill="#FFE066" opacity="0.92" stroke={O} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M78 108 Q100 120 122 108" stroke={O} strokeWidth={2} fill="none" />
    </>
  ),
  "top-lifejacket": shirt(
    "#FFFFFF",
    <>
      <path d="M66 112 Q80 106 94 112 L94 168 L70 168 Q64 166 64 158Z" fill="#FF7A00" stroke={O} strokeWidth={sw} />
      <path d="M134 112 Q120 106 106 112 L106 168 L130 168 Q136 166 136 158Z" fill="#FF7A00" stroke={O} strokeWidth={sw} />
      <rect x="64" y="140" width="72" height="5" fill="#1A1740" />
      <rect x="70" y="126" width="22" height="4" fill="#E8E8E8" />
      <rect x="108" y="126" width="22" height="4" fill="#E8E8E8" />
    </>,
  ),
  "top-tuxedo": shirt(
    "#1A1740",
    <>
      <path d="M86 108 L100 150 L114 108Z" fill="#fff" stroke={O} strokeWidth={2} />
      <path d="M92 114 L100 118 L108 114 L108 122 L100 118 L92 122Z" fill="#E53935" stroke={O} strokeWidth={1.5} />
      <circle cx="100" cy="134" r="2" fill={O} />
      <circle cx="100" cy="142" r="2" fill={O} />
    </>,
  ),
  // ---- bottoms
  "bot-cargo": (
    <>
      <rect x="70" y="156" width="60" height="40" rx="9" fill="#BFA77A" stroke={O} strokeWidth={sw} />
      <rect x="73" y="172" width="14" height="14" rx="3" fill="#A88F62" stroke={O} strokeWidth={1.5} />
      <rect x="113" y="172" width="14" height="14" rx="3" fill="#A88F62" stroke={O} strokeWidth={1.5} />
    </>
  ),
  "bot-flower": (
    <>
      <rect x="70" y="156" width="60" height="34" rx="10" fill="#FF8FB1" stroke={O} strokeWidth={sw} />
      {[[80, 166], [100, 178], [120, 166], [88, 184], [114, 184]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#FFF8EE" stroke="#FFD166" strokeWidth={2} />)}
    </>
  ),
  "bot-kilt": (
    <>
      <path d="M68 156 L132 156 L138 204 L62 204Z" fill="#C62828" stroke={O} strokeWidth={sw} strokeLinejoin="round" />
      {[74, 88, 102, 116, 130].map((x) => <path key={x} d={`M${x} 156 L${x + 2} 204`} stroke="#1B5E20" strokeWidth={4} opacity="0.7" />)}
      <path d="M66 172 L134 172 M64 188 L136 188" stroke="#1B5E20" strokeWidth={3} opacity="0.7" />
      <rect x="94" y="172" width="12" height="16" rx="3" fill="#E0E0E0" stroke={O} strokeWidth={1.5} />
    </>
  ),
  // ---- shoes
  "sh-flipflops": (
    <>
      <ellipse cx="84" cy="220" rx="15" ry="5" fill="#2FBF9A" stroke={O} strokeWidth={2} />
      <ellipse cx="116" cy="220" rx="15" ry="5" fill="#2FBF9A" stroke={O} strokeWidth={2} />
      <path d="M78 216 L85 210 L92 216 M110 216 L117 210 L124 216" stroke="#1F9C7C" strokeWidth={3} fill="none" />
    </>
  ),
  "sh-boots": (
    <>
      <path d="M74 190 L96 190 L96 214 Q100 224 88 224 L72 224 Q68 214 74 210Z" fill="#FFD166" stroke={O} strokeWidth={sw} />
      <path d="M104 190 L126 190 L126 210 Q132 214 128 224 L112 224 Q100 224 104 214Z" fill="#FFD166" stroke={O} strokeWidth={sw} />
    </>
  ),
  "sh-sockssandals": (
    <>
      <rect x="75" y="190" width="20" height="28" rx="6" fill="#fff" stroke={O} strokeWidth={2} />
      <rect x="105" y="190" width="20" height="28" rx="6" fill="#fff" stroke={O} strokeWidth={2} />
      <path d="M76 196 L94 196 M106 196 L124 196" stroke="#E53935" strokeWidth={2.5} />
      <ellipse cx="84" cy="221" rx="15" ry="5" fill="#8D5524" stroke={O} strokeWidth={2} />
      <ellipse cx="116" cy="221" rx="15" ry="5" fill="#8D5524" stroke={O} strokeWidth={2} />
      <path d="M74 212 L94 212 M106 212 L126 212" stroke="#8D5524" strokeWidth={4} />
    </>
  ),
  "sh-golden": (
    <>
      <ellipse cx="84" cy="218" rx="15" ry="8" fill="#FFD166" stroke={O} strokeWidth={sw} />
      <ellipse cx="116" cy="218" rx="15" ry="8" fill="#FFD166" stroke={O} strokeWidth={sw} />
      <path d="M76 214 L82 212 M108 214 L114 212" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M150 200 l3 -6 l3 6 l-6 -3 h6z" fill="#FFD166" />
    </>
  ),
  // ---- neck / accessories
  "neck-banana": (
    <>
      <path d="M68 116 L132 160" stroke="#1A1740" strokeWidth={4} />
      <rect x="90" y="150" width="34" height="16" rx="8" fill="#6A55F2" stroke={O} strokeWidth={sw} transform="rotate(-8 107 158)" />
    </>
  ),
  "neck-lei": (
    <>
      {[[72, 112], [80, 120], [90, 125], [100, 127], [110, 125], [120, 120], [128, 112]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="6" fill={["#FF7A6B", "#FFD166", "#FF8FB1", "#5FD3B5"][i % 4]} stroke={O} strokeWidth={1.5} />
      ))}
    </>
  ),
  "neck-pillow": <path d="M66 104 Q66 128 100 128 Q134 128 134 104 Q124 116 100 116 Q76 116 66 104Z" fill="#8578FB" stroke={O} strokeWidth={sw} />,
  "neck-camera": (
    <>
      <path d="M78 110 L92 142 M122 110 L108 142" stroke={O} strokeWidth={2} />
      <rect x="86" y="138" width="28" height="20" rx="4" fill="#424242" stroke={O} strokeWidth={sw} />
      <circle cx="100" cy="148" r="6" fill="#90CAF9" stroke="#fff" strokeWidth={2} />
      <rect x="106" y="140" width="5" height="3" fill="#FFD166" />
    </>
  ),
  // ---- hand items (right hand at 145,168)
  "hand-baguette": <rect x="138" y="120" width="12" height="78" rx="6" fill="#E0A458" stroke={O} strokeWidth={sw} transform="rotate(25 145 168)" />,
  "hand-map": (
    <>
      <rect x="132" y="136" width="44" height="34" fill="#FFF3D1" stroke={O} strokeWidth={sw} transform="rotate(-8 154 153)" />
      <path d="M146 140 L146 170 M160 138 L160 168" stroke={O} strokeWidth={1.5} opacity="0.5" />
      <path d="M138 160 Q150 148 168 152" stroke="#E53935" strokeWidth={2} strokeDasharray="3 3" fill="none" />
    </>
  ),
  "hand-tea": (
    <>
      <path d="M134 156 L156 156 L153 176 L137 176Z" fill="#FFFFFF" stroke={O} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M156 160 Q164 162 156 170" stroke={O} strokeWidth={sw} fill="none" />
      <path d="M140 150 Q138 144 142 140 M148 150 Q146 144 150 140" stroke="#A09FC0" strokeWidth={2} fill="none" strokeLinecap="round" />
    </>
  ),
  "hand-suitcase": (
    <>
      <rect x="150" y="150" width="36" height="58" rx="7" fill="#FF7A6B" stroke={O} strokeWidth={sw} />
      <path d="M158 150 L158 138 L178 138 L178 150" stroke={O} strokeWidth={sw} fill="none" />
      <path d="M156 166 L180 166 M156 190 L180 190" stroke="#fff" strokeWidth={3} opacity="0.7" />
      <circle cx="158" cy="212" r="4" fill={O} />
      <circle cx="178" cy="212" r="4" fill={O} />
    </>
  ),
  "hand-selfie": (
    <>
      <path d="M145 166 L184 70" stroke="#424242" strokeWidth={4} strokeLinecap="round" />
      <rect x="174" y="52" width="20" height="32" rx="4" fill="#1A1740" stroke={O} strokeWidth={2} transform="rotate(20 184 68)" />
    </>
  ),
  "hand-duck": (
    <>
      <ellipse cx="100" cy="166" rx="54" ry="14" fill="#FFD166" stroke={O} strokeWidth={sw} />
      <ellipse cx="100" cy="166" rx="34" ry="6" fill="#F5B83D" opacity="0.6" />
      <circle cx="152" cy="148" r="12" fill="#FFD166" stroke={O} strokeWidth={sw} />
      <path d="M162 148 L174 151 L162 154Z" fill="#FF7A00" stroke={O} strokeWidth={1.5} />
      <circle cx="155" cy="145" r="2" fill={O} />
    </>
  ),
};

const sky = (top: string, bottom: string, id: string) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={top} />
      <stop offset="1" stopColor={bottom} />
    </linearGradient>
  </defs>
);

const BACKGROUNDS: Record<string, ReactNode> = {
  "bg-home": (
    <>
      <rect width="200" height="240" fill="#F1EEFF" />
      <rect y="190" width="200" height="50" fill="#E3DDFB" />
      <rect x="18" y="30" width="54" height="48" rx="6" fill="#CFE9FF" stroke="#CFCCFF" strokeWidth="4" />
      <path d="M45 30 L45 78 M18 54 L72 54" stroke="#CFCCFF" strokeWidth="3" />
      <rect x="150" y="150" width="20" height="40" rx="4" fill="#FF8F80" />
      <circle cx="160" cy="142" r="16" fill="#5FD3B5" />
      <circle cx="170" cy="34" r="10" fill="#FFD166" opacity="0.6" />
    </>
  ),
  "bg-beach": (
    <>
      {sky("#7FD3FF", "#CFF1FF", "bg-beach-sky")}
      <rect width="200" height="240" fill="url(#bg-beach-sky)" />
      <circle cx="160" cy="40" r="18" fill="#FFD166" />
      <rect y="150" width="200" height="30" fill="#3BA7E0" />
      <path d="M0 152 Q25 146 50 152 T100 152 T150 152 T200 152" stroke="#fff" strokeWidth="3" fill="none" opacity="0.7" />
      <rect y="178" width="200" height="62" fill="#F7DE8A" />
      <path d="M26 180 Q22 120 36 92" stroke="#8D5524" strokeWidth="6" fill="none" />
      <path d="M36 92 Q12 86 4 100 M36 92 Q30 70 12 72 M36 92 Q56 74 66 86 M36 92 Q62 92 64 108" stroke="#2FBF9A" strokeWidth="7" fill="none" strokeLinecap="round" />
    </>
  ),
  "bg-airport": (
    <>
      {sky("#A9D8FF", "#E8F4FF", "bg-air-sky")}
      <rect width="200" height="240" fill="url(#bg-air-sky)" />
      <rect y="186" width="200" height="54" fill="#8A93A3" />
      <path d="M0 212 L200 212" stroke="#fff" strokeWidth="3" strokeDasharray="14 10" />
      <g transform="translate(120 46) rotate(-12)">
        <rect x="0" y="0" width="64" height="12" rx="6" fill="#fff" stroke="#6A55F2" strokeWidth="2" />
        <path d="M24 6 L10 30 L22 30 L40 6Z" fill="#6A55F2" />
        <path d="M6 6 L0 -8 L8 -8 L16 4Z" fill="#6A55F2" />
      </g>
      <rect x="12" y="24" width="70" height="38" rx="4" fill="#1A1740" />
      <text x="18" y="38" fontSize="8" fill="#FFD166" fontFamily="monospace">LDN 09:45</text>
      <text x="18" y="52" fontSize="8" fill="#5FD3B5" fontFamily="monospace">NYC BOARD</text>
    </>
  ),
  "bg-london": (
    <>
      {sky("#B8C6DB", "#E9EEF5", "bg-ldn-sky")}
      <rect width="200" height="240" fill="url(#bg-ldn-sky)" />
      <rect x="20" y="30" width="26" height="160" fill="#C9A66B" stroke="#8D6E3F" strokeWidth="2" />
      <path d="M18 30 L33 4 L48 30Z" fill="#5D6B7A" />
      <circle cx="33" cy="52" r="10" fill="#FFF8EE" stroke="#8D6E3F" strokeWidth="2" />
      <path d="M33 52 L33 45 M33 52 L38 54" stroke="#1A1740" strokeWidth="1.5" />
      <rect y="190" width="200" height="50" fill="#9AA5B1" />
      <g transform="translate(140 132)">
        <rect width="64" height="58" rx="6" fill="#E53935" stroke="#9B1C1C" strokeWidth="2" />
        <rect x="6" y="8" width="52" height="12" fill="#CFE9FF" />
        <rect x="6" y="30" width="52" height="12" fill="#CFE9FF" />
        <circle cx="14" cy="60" r="6" fill="#1A1740" />
        <circle cx="50" cy="60" r="6" fill="#1A1740" />
      </g>
      <path d="M60 20 Q70 12 82 18 Q94 10 104 20 Q112 26 100 28 L64 28 Q54 26 60 20Z" fill="#fff" opacity="0.8" />
    </>
  ),
  "bg-lombok": (
    <>
      {sky("#7FD3FF", "#E6F8FF", "bg-lmb-sky")}
      <rect width="200" height="240" fill="url(#bg-lmb-sky)" />
      <path d="M10 140 L90 40 L104 52 L116 40 L196 140Z" fill="#7C8BA1" />
      <path d="M78 56 L90 40 L104 52 L116 40 L128 56 Q104 64 78 56Z" fill="#fff" />
      <path d="M0 150 Q100 120 200 150 L200 240 L0 240Z" fill="#7CCF7A" />
      <path d="M0 175 Q100 150 200 175" stroke="#4E9E6A" strokeWidth="4" fill="none" />
      <path d="M0 200 Q100 178 200 200" stroke="#4E9E6A" strokeWidth="4" fill="none" />
      <path d="M176 200 Q172 150 182 120" stroke="#8D5524" strokeWidth="5" fill="none" />
      <path d="M182 120 Q162 114 156 126 M182 120 Q200 108 204 122 M182 120 Q178 100 166 102" stroke="#2FBF9A" strokeWidth="6" fill="none" strokeLinecap="round" />
    </>
  ),
  "bg-nyc": (
    <>
      {sky("#FFB38A", "#FFE5C7", "bg-nyc-sky")}
      <rect width="200" height="240" fill="url(#bg-nyc-sky)" />
      {[[0, 90, 30], [28, 50, 26], [52, 110, 24], [150, 70, 28], [176, 100, 24], [128, 120, 22]].map(([x, y, w], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={240 - y} fill={i % 2 ? "#4A4E69" : "#5C607E"} />
          {Array.from({ length: 6 }, (_, k) => <rect key={k} x={x + 5} y={y + 10 + k * 16} width={w - 10} height="5" fill="#FFD166" opacity="0.7" />)}
        </g>
      ))}
      <path d="M36 50 L41 20 L46 50" fill="#5C607E" />
      <rect y="200" width="200" height="40" fill="#4A4E69" />
      <g transform="translate(130 188)">
        <rect width="56" height="22" rx="6" fill="#FFD166" stroke="#1A1740" strokeWidth="2" />
        <rect x="12" y="-8" width="30" height="12" rx="4" fill="#FFD166" stroke="#1A1740" strokeWidth="2" />
        <circle cx="12" cy="24" r="5" fill="#1A1740" />
        <circle cx="44" cy="24" r="5" fill="#1A1740" />
      </g>
    </>
  ),
  "bg-space": (
    <>
      <rect width="200" height="240" fill="#0F0E2A" />
      {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 47) % 200} cy={(i * 83) % 240} r={i % 3 ? 1 : 1.8} fill="#fff" opacity="0.8" />)}
      <circle cx="160" cy="50" r="22" fill="#FF7A6B" />
      <ellipse cx="160" cy="50" rx="36" ry="7" fill="none" stroke="#FFD166" strokeWidth="3" transform="rotate(-18 160 50)" />
      <circle cx="30" cy="40" r="10" fill="#5FD3B5" opacity="0.8" />
      <rect y="200" width="200" height="40" fill="#2E2A6B" />
    </>
  ),
};
