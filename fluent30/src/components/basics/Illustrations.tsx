// Original SVG illustrations for the basic lessons (emotions, weather, shapes, colours, body).
import type { ReactNode } from "react";

const O = "#3A3352";

export type Emotion =
  | "happy" | "sad" | "angry" | "scared" | "surprised" | "tired" | "bored" | "excited" | "worried" | "proud"
  | "embarrassed" | "in-love" | "nervous" | "relaxed" | "disgusted" | "confused" | "jealous" | "lonely" | "grateful" | "shocked";

/** Cute expressive face, one variant per emotion. */
export function EmotionFace({ emotion, className }: { emotion: Emotion; className?: string }) {
  const skin = emotion === "angry" ? "#FFB199" : emotion === "embarrassed" ? "#FFC7B8" : emotion === "disgusted" ? "#D7EBB8" : emotion === "scared" || emotion === "shocked" ? "#F3F0FF" : "#FFD9B8";
  const eyes: ReactNode = (() => {
    switch (emotion) {
      case "happy":
      case "grateful":
      case "relaxed":
        return <><path d="M34 46 Q40 39 46 46" /><path d="M54 46 Q60 39 66 46" /></>;
      case "excited":
        return <><path d="M34 40 L40 45 L34 50" /><path d="M66 40 L60 45 L66 50" /></>;
      case "tired":
      case "bored":
        return <><path d="M33 46 L47 46" /><path d="M53 46 L67 46" /><path d="M33 42 Q40 44 47 42" opacity="0.5" /><path d="M53 42 Q60 44 67 42" opacity="0.5" /></>;
      case "in-love":
        return <><path d="M40 50 L34 44 A3.5 3.5 0 0 1 40 40 A3.5 3.5 0 0 1 46 44Z" fill="#FF4F7B" stroke="none" /><path d="M60 50 L54 44 A3.5 3.5 0 0 1 60 40 A3.5 3.5 0 0 1 66 44Z" fill="#FF4F7B" stroke="none" /></>;
      case "surprised":
      case "scared":
      case "shocked":
        return <><circle cx="40" cy="44" r="6" fill="#fff" /><circle cx="60" cy="44" r="6" fill="#fff" /><circle cx="40" cy="44" r="2.6" fill={O} stroke="none" /><circle cx="60" cy="44" r="2.6" fill={O} stroke="none" /></>;
      case "confused":
        return <><circle cx="40" cy="45" r="3" fill={O} stroke="none" /><circle cx="60" cy="43" r="4.5" fill={O} stroke="none" /></>;
      default:
        return <><circle cx="40" cy="45" r="3.4" fill={O} stroke="none" /><circle cx="60" cy="45" r="3.4" fill={O} stroke="none" /><circle cx="41.2" cy="43.8" r="1.1" fill="#fff" stroke="none" /><circle cx="61.2" cy="43.8" r="1.1" fill="#fff" stroke="none" /></>;
    }
  })();
  const brows: ReactNode = (() => {
    switch (emotion) {
      case "angry":
      case "jealous":
        return <><path d="M32 34 L46 39" /><path d="M68 34 L54 39" /></>;
      case "sad":
      case "worried":
      case "lonely":
      case "nervous":
        return <><path d="M33 38 L46 34" /><path d="M67 38 L54 34" /></>;
      case "surprised":
      case "scared":
      case "shocked":
        return <><path d="M33 31 Q40 27 47 31" /><path d="M53 31 Q60 27 67 31" /></>;
      case "confused":
        return <><path d="M33 37 Q40 33 47 37" /><path d="M53 31 Q60 28 67 33" /></>;
      case "proud":
        return <><path d="M33 36 Q40 32 47 35" /><path d="M53 35 Q60 32 67 36" /></>;
      default:
        return null;
    }
  })();
  const mouth: ReactNode = (() => {
    switch (emotion) {
      case "happy":
      case "grateful":
        return <path d="M38 60 Q50 72 62 60 Z" fill="#8A2B3A" />;
      case "excited":
        return <path d="M36 58 Q50 76 64 58 Z" fill="#8A2B3A" />;
      case "sad":
      case "lonely":
        return <path d="M40 66 Q50 58 60 66" />;
      case "angry":
        return <path d="M38 66 L62 66" />;
      case "scared":
      case "shocked":
        return <ellipse cx="50" cy="64" rx="7" ry="9" fill="#8A2B3A" />;
      case "surprised":
        return <circle cx="50" cy="63" r="5" fill="#8A2B3A" />;
      case "tired":
        return <ellipse cx="50" cy="64" rx="5" ry="6" fill="#8A2B3A" />;
      case "bored":
        return <path d="M40 63 L60 63" />;
      case "worried":
      case "nervous":
        return <path d="M38 64 Q42 60 46 64 Q50 68 54 64 Q58 60 62 64" />;
      case "proud":
        return <path d="M40 60 Q52 68 62 58" />;
      case "embarrassed":
        return <path d="M42 63 Q50 66 58 63" />;
      case "in-love":
        return <path d="M40 60 Q50 70 60 60" />;
      case "relaxed":
        return <path d="M40 61 Q50 67 60 61" />;
      case "disgusted":
        return <path d="M38 64 Q44 58 50 64 Q56 70 62 62" />;
      case "confused":
        return <path d="M40 64 Q48 60 60 65" />;
      case "jealous":
        return <path d="M42 64 Q52 60 60 62" />;
      default:
        return <path d="M40 60 Q50 68 60 60" />;
    }
  })();
  const extra: ReactNode = (() => {
    switch (emotion) {
      case "sad":
        return <path d="M40 52 Q38 58 40 60 Q42 58 40 52Z" fill="#7CC4FF" stroke="none" />;
      case "worried":
      case "nervous":
        return <path d="M74 26 Q70 34 74 37 Q78 34 74 26Z" fill="#7CC4FF" stroke="none" />;
      case "embarrassed":
      case "in-love":
        return <><ellipse cx="30" cy="56" rx="7" ry="4" fill="#FF4F7B" opacity="0.5" stroke="none" /><ellipse cx="70" cy="56" rx="7" ry="4" fill="#FF4F7B" opacity="0.5" stroke="none" /></>;
      case "angry":
        return <path d="M74 20 l6 0 M77 17 l0 6 M80 24 l4 4" stroke="#E53935" />;
      case "tired":
        return <text x="70" y="26" fontSize="12" fontWeight="800" fill={O} stroke="none" fontFamily="system-ui">z</text>;
      case "confused":
        return <text x="72" y="28" fontSize="16" fontWeight="800" fill={O} stroke="none" fontFamily="system-ui">?</text>;
      case "excited":
        return <path d="M16 22 l3 6 l6 1 l-5 4 l2 6 l-6 -3 l-6 3 l2 -6 l-5 -4 l6 -1z" fill="#FFD166" stroke="none" />;
      case "proud":
        return <path d="M76 18 l2.4 5 l5.4 .6 l-4 3.6 l1.2 5.4 l-5 -2.8 l-5 2.8 l1.2 -5.4 l-4 -3.6 l5.4 -.6z" fill="#FFD166" stroke="none" />;
      case "relaxed":
        return <text x="70" y="26" fontSize="11" fill={O} stroke="none" fontFamily="system-ui">♪</text>;
      default:
        return null;
    }
  })();
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={emotion}>
      <circle cx="50" cy="52" r="38" fill={skin} stroke={O} strokeWidth="3" />
      {emotion !== "embarrassed" && emotion !== "in-love" && emotion !== "angry" && <><ellipse cx="28" cy="58" rx="6" ry="3.5" fill="#FF8A8A" opacity="0.35" /><ellipse cx="72" cy="58" rx="6" ry="3.5" fill="#FF8A8A" opacity="0.35" /></>}
      <g stroke={O} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {brows}
        {eyes}
        {mouth}
        {extra}
      </g>
    </svg>
  );
}

export type Weather = "sunny" | "cloudy" | "rainy" | "snowy" | "windy" | "stormy" | "foggy" | "hot" | "cold" | "rainbow";

export function WeatherIcon({ weather, className }: { weather: Weather; className?: string }) {
  const sun = (cx = 50, cy = 46, r = 16) => (
    <g>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <line key={i} x1={cx + Math.cos(a) * (r + 5)} y1={cy + Math.sin(a) * (r + 5)} x2={cx + Math.cos(a) * (r + 12)} y2={cy + Math.sin(a) * (r + 12)} stroke="#F5B83D" strokeWidth="4" strokeLinecap="round" />;
      })}
      <circle cx={cx} cy={cy} r={r} fill="#FFD166" stroke="#F5B83D" strokeWidth="3" />
    </g>
  );
  const cloud = (dx = 0, dy = 0, fill = "#fff") => (
    <path transform={`translate(${dx} ${dy})`} d="M24 66 Q14 66 14 56 Q14 46 26 46 Q28 32 44 32 Q58 32 62 44 Q76 42 78 54 Q86 56 84 64 Q82 70 74 70 L28 70 Q24 70 24 66Z" fill={fill} stroke="#9AA5B1" strokeWidth="3" strokeLinejoin="round" />
  );
  switch (weather) {
    case "sunny":
      return <svg viewBox="0 0 100 100" className={className} role="img" aria-label="sunny">{sun()}</svg>;
    case "hot":
      return <svg viewBox="0 0 100 100" className={className} role="img" aria-label="hot"><rect x="44" y="14" width="12" height="54" rx="6" fill="#fff" stroke="#9AA5B1" strokeWidth="3" /><circle cx="50" cy="76" r="12" fill="#E53935" stroke="#9AA5B1" strokeWidth="3" /><rect x="47" y="34" width="6" height="40" fill="#E53935" /><circle cx="78" cy="26" r="9" fill="#FFD166" /></svg>;
    case "cold":
      return <svg viewBox="0 0 100 100" className={className} role="img" aria-label="cold"><rect x="44" y="14" width="12" height="54" rx="6" fill="#fff" stroke="#9AA5B1" strokeWidth="3" /><circle cx="50" cy="76" r="12" fill="#1E88E5" stroke="#9AA5B1" strokeWidth="3" /><rect x="47" y="58" width="6" height="16" fill="#1E88E5" /><path d="M76 20 L76 40 M67 25 L85 35 M85 25 L67 35" stroke="#7CC4FF" strokeWidth="3" strokeLinecap="round" /></svg>;
    case "cloudy":
      return <svg viewBox="0 0 100 100" className={className} role="img" aria-label="cloudy">{sun(66, 34, 12)}{cloud(-4, 6)}</svg>;
    case "rainy":
      return <svg viewBox="0 0 100 100" className={className} role="img" aria-label="rainy">{cloud(0, -8, "#E3E8EF")}{[30, 46, 62, 78].map((x, i) => <line key={x} x1={x} y1={70 + (i % 2) * 4} x2={x - 6} y2={84 + (i % 2) * 4} stroke="#1E88E5" strokeWidth="4" strokeLinecap="round" />)}</svg>;
    case "snowy":
      return <svg viewBox="0 0 100 100" className={className} role="img" aria-label="snowy">{cloud(0, -8, "#F1F4F8")}{[28, 48, 68].map((x) => <g key={x} stroke="#7CC4FF" strokeWidth="2.5" strokeLinecap="round"><line x1={x} y1="72" x2={x} y2="88" /><line x1={x - 7} y1="76" x2={x + 7} y2="84" /><line x1={x + 7} y1="76" x2={x - 7} y2="84" /></g>)}</svg>;
    case "windy":
      return <svg viewBox="0 0 100 100" className={className} role="img" aria-label="windy"><g stroke="#7C8BA1" strokeWidth="5" strokeLinecap="round" fill="none"><path d="M12 36 L62 36 Q76 36 76 26 Q76 16 66 18" /><path d="M12 52 L80 52 Q92 52 92 62 Q92 72 80 70" /><path d="M12 68 L48 68" /></g></svg>;
    case "stormy":
      return <svg viewBox="0 0 100 100" className={className} role="img" aria-label="stormy">{cloud(0, -10, "#B0B7C3")}<path d="M52 62 L42 78 L52 78 L44 94 L64 72 L54 72 L62 62Z" fill="#FFD166" stroke="#F5B83D" strokeWidth="2" strokeLinejoin="round" /></svg>;
    case "foggy":
      return <svg viewBox="0 0 100 100" className={className} role="img" aria-label="foggy"><g stroke="#B0B7C3" strokeWidth="6" strokeLinecap="round"><line x1="16" y1="34" x2="84" y2="34" /><line x1="24" y1="50" x2="76" y2="50" /><line x1="12" y1="66" x2="70" y2="66" /><line x1="30" y1="82" x2="88" y2="82" /></g></svg>;
    case "rainbow":
      return <svg viewBox="0 0 100 100" className={className} role="img" aria-label="rainbow"><g fill="none" strokeWidth="6">{["#E53935", "#FF9800", "#FFD166", "#43A047", "#1E88E5", "#7E57C2"].map((c, i) => <path key={c} d={`M${12 + i * 6} 78 A${38 - i * 6} ${38 - i * 6} 0 0 1 ${88 - i * 6} 78`} stroke={c} />)}</g></svg>;
  }
}

export type Shape = "circle" | "square" | "triangle" | "rectangle" | "star" | "heart" | "oval" | "diamond";
export function ShapeIcon({ shape, color = "#6A55F2", className }: { shape: Shape; color?: string; className?: string }) {
  const s = { fill: color, stroke: O, strokeWidth: 3, strokeLinejoin: "round" as const };
  const body: Record<Shape, ReactNode> = {
    circle: <circle cx="50" cy="50" r="32" {...s} />,
    square: <rect x="20" y="20" width="60" height="60" rx="4" {...s} />,
    triangle: <path d="M50 16 L84 80 L16 80Z" {...s} />,
    rectangle: <rect x="12" y="30" width="76" height="42" rx="4" {...s} />,
    star: <path d="M50 12 L60 38 L88 38 L65 55 L74 84 L50 66 L26 84 L35 55 L12 38 L40 38Z" {...s} />,
    heart: <path d="M50 84 L18 50 A16 16 0 0 1 50 26 A16 16 0 0 1 82 50Z" {...s} />,
    oval: <ellipse cx="50" cy="50" rx="38" ry="24" {...s} />,
    diamond: <path d="M50 12 L84 50 L50 88 L16 50Z" {...s} />,
  };
  return <svg viewBox="0 0 100 100" className={className} role="img" aria-label={shape}>{body[shape]}</svg>;
}

export function ColorSwatch({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img">
      <path d="M50 10 C72 10 90 26 90 46 C90 60 80 64 70 62 C62 61 58 66 62 74 C66 84 58 90 50 90 C28 90 10 72 10 50 C10 28 28 10 50 10Z" fill={color} stroke={O} strokeWidth="3" />
      <circle cx="34" cy="34" r="6" fill="#fff" opacity="0.35" />
    </svg>
  );
}

/** Simple body outline with a highlighted part. */
export type BodyPart = "head" | "hair" | "eye" | "ear" | "nose" | "mouth" | "neck" | "shoulder" | "arm" | "hand" | "finger" | "back" | "stomach" | "leg" | "knee" | "foot" | "toe";
const PART_SHAPES: Record<BodyPart, ReactNode> = {
  head: <circle cx="50" cy="22" r="13" />,
  hair: <path d="M37 20 Q38 6 50 6 Q62 6 63 20 Q56 12 50 13 Q44 12 37 20Z" />,
  eye: <><circle cx="45" cy="21" r="2.5" /><circle cx="55" cy="21" r="2.5" /></>,
  ear: <><ellipse cx="36" cy="23" rx="2.5" ry="4" /><ellipse cx="64" cy="23" rx="2.5" ry="4" /></>,
  nose: <path d="M50 22 L47 28 L52 28Z" />,
  mouth: <path d="M45 30 Q50 34 55 30Z" />,
  neck: <rect x="46" y="34" width="8" height="6" />,
  shoulder: <><circle cx="37" cy="44" r="5" /><circle cx="63" cy="44" r="5" /></>,
  arm: <><rect x="27" y="44" width="7" height="30" rx="3" /><rect x="66" y="44" width="7" height="30" rx="3" /></>,
  hand: <><circle cx="30" cy="78" r="4.5" /><circle cx="70" cy="78" r="4.5" /></>,
  finger: <><rect x="27" y="81" width="2" height="6" /><rect x="31" y="81" width="2" height="6" /><rect x="67" y="81" width="2" height="6" /><rect x="71" y="81" width="2" height="6" /></>,
  back: <rect x="38" y="40" width="24" height="18" rx="4" />,
  stomach: <ellipse cx="50" cy="62" rx="10" ry="7" />,
  leg: <><rect x="40" y="72" width="8" height="24" rx="3" /><rect x="52" y="72" width="8" height="24" rx="3" /></>,
  knee: <><circle cx="44" cy="84" r="3.5" /><circle cx="56" cy="84" r="3.5" /></>,
  foot: <><ellipse cx="42" cy="98" rx="6" ry="2.5" /><ellipse cx="58" cy="98" rx="6" ry="2.5" /></>,
  toe: <><circle cx="37" cy="98" r="1.6" /><circle cx="63" cy="98" r="1.6" /></>,
};
export function BodyFigure({ part, className }: { part: BodyPart; className?: string }) {
  return (
    <svg viewBox="0 0 100 102" className={className} role="img" aria-label={part}>
      <g fill="#FFE3CC" stroke={O} strokeWidth="1.8">
        <circle cx="50" cy="22" r="13" />
        <rect x="46" y="34" width="8" height="6" />
        <path d="M36 42 Q50 38 64 42 L62 72 L38 72Z" />
        <rect x="27" y="44" width="7" height="30" rx="3" />
        <rect x="66" y="44" width="7" height="30" rx="3" />
        <rect x="40" y="72" width="8" height="25" rx="3" />
        <rect x="52" y="72" width="8" height="25" rx="3" />
      </g>
      <g fill="#FF7A6B" stroke="#C62828" strokeWidth="1.2">{PART_SHAPES[part]}</g>
    </svg>
  );
}
