// Original book covers, drawn procedurally in SVG (no third-party artwork → no rights issue).
// Each book has its own palette + motif (lib/data/library.ts); imported books and AI novels get a
// deterministic hash-based design. Looks good from ~110px to 300px wide.
import { useId, type ReactNode } from "react";
import type { LibraryBook, LibraryCategory } from "@/lib/data/library";

export interface CoverInput {
  title: string;
  author?: string;
  cat?: LibraryCategory | string;
  level?: string;
  cover?: LibraryBook["cover"];
}

const FALLBACK_PALETTES: [string, string, string][] = [
  ["#2e2a6b", "#6a55f2", "#ffd166"],
  ["#0f4c5c", "#1b8a8f", "#ffd166"],
  ["#6d213c", "#c9506b", "#ffe3e3"],
  ["#1f2433", "#3b4256", "#e9c46a"],
  ["#1b4332", "#40916c", "#f4a261"],
  ["#3c2a63", "#8c6bc2", "#ffe066"],
  ["#023047", "#219ebc", "#ffb703"],
  ["#7f4f24", "#d4a373", "#fefae0"],
  ["#9a031e", "#fb8b24", "#ffe8a3"],
  ["#344e41", "#a3b18a", "#fefae0"],
];

const CAT_MOTIF: Record<string, string> = {
  romance: "rose", thriller: "magnifier", fantastique: "planet", aventure: "compass", devperso: "sun",
  horreur: "bats", classiques: "quill", courtes: "lantern",
};

export const COVER_MOTIFS = [
  "anchor", "balloon", "bats", "candle", "castle", "compass", "crown", "eye", "heart", "key", "lantern", "lotus",
  "magnifier", "mask", "mirror", "moon", "mountain", "paw", "planet", "potion", "quill", "rabbit", "raven", "rose",
  "ship", "skull", "skyline", "star", "sun", "swords", "teacup", "tentacles", "train", "tree", "whale",
] as const;

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/** Splits a title into at most `max` balanced lines. */
function wrap(title: string, maxChars: number, max = 4): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  if (lines.length > max) {
    const kept = lines.slice(0, max);
    kept[max - 1] = kept[max - 1].replace(/\s*\S*$/, "") + "…";
    return kept;
  }
  return lines;
}

export function BookCover({ book, className, showText = true, showLevel = false }: { book: CoverInput; className?: string; showText?: boolean; showLevel?: boolean }) {
  const h = hash(`${book.title}|${book.author ?? ""}`);
  // useId alone can repeat across separately rendered trees: suffix with a content hash.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "") + h.toString(36);
  const pal = book.cover?.palette ?? FALLBACK_PALETTES[h % FALLBACK_PALETTES.length];
  const neutral = COVER_MOTIFS.filter((m) => book.cat === "horreur" || !["skull", "tentacles", "bats", "potion"].includes(m));
  const motif = book.cover?.motif ?? (book.cat && CAT_MOTIF[book.cat] && h % 3 === 0 ? CAT_MOTIF[book.cat] : neutral[h % neutral.length]);
  const [dark, mid, accent] = pal;
  const title = book.title.replace(/^(The|A|An) /, (m) => m);
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  const maxChars = longest > 13 ? longest : title.length > 40 ? 15 : title.length > 22 ? 13 : 11;
  const lines = wrap(title.toUpperCase(), maxChars);
  const longestLine = Math.max(...lines.map((l) => l.length));
  const n = lines.length;
  // Title block lives between the motif (y≈250) and the author line (y≈410).
  const fs = Math.max(15, Math.min(34, 236 / (longestLine * 0.62), (374 - 256) / ((n - 1) * 1.12 + 1)));
  const lh = fs * 1.12;
  const titleTop = Math.min(318 - ((n - 1) * lh) / 2, 374 - (n - 1) * lh);
  const author = (book.author ?? "").toUpperCase();

  return (
    <svg viewBox="0 0 300 450" className={className} role="img" aria-label={`${book.title}${book.author ? ` — ${book.author}` : ""}`}>
      <defs>
        <linearGradient id={`${uid}bg`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={mid} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <radialGradient id={`${uid}glow`} cx="0.5" cy="0.38" r="0.55">
          <stop offset="0" stopColor={accent} stopOpacity="0.32" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}spine`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.38" />
          <stop offset="0.6" stopColor="#000" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.06" />
        </linearGradient>
        <pattern id={`${uid}tex`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="6" height="6" fill="none" />
          <path d="M0 0 L0 6" stroke="#fff" strokeWidth="0.6" opacity="0.07" />
        </pattern>
        <clipPath id={`${uid}clip`}><rect width="300" height="450" rx="10" /></clipPath>
      </defs>
      <g clipPath={`url(#${uid}clip)`}>
        <rect width="300" height="450" fill={`url(#${uid}bg)`} />
        <rect width="300" height="450" fill={`url(#${uid}tex)`} />
        <rect width="300" height="450" fill={`url(#${uid}glow)`} />
        {/* decorative frame */}
        <rect x="18" y="18" width="264" height="414" rx="6" fill="none" stroke={accent} strokeOpacity="0.55" strokeWidth="1.5" />
        <rect x="24" y="24" width="252" height="402" rx="4" fill="none" stroke={accent} strokeOpacity="0.25" strokeWidth="0.8" />
        {[[24, 24], [276, 24], [24, 426], [276, 426]].map(([x, y], i) => (
          <path key={i} d={`M${x - 5} ${y} L${x} ${y - 5} L${x + 5} ${y} L${x} ${y + 5}Z`} fill={accent} opacity="0.8" />
        ))}
        {/* halo + motif */}
        <circle cx="150" cy="166" r="92" fill={accent} opacity="0.1" />
        <circle cx="150" cy="166" r="92" fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 5" />
        <g transform={lines.length >= 3 ? "translate(84 92) scale(0.82)" : "translate(70 86)"}>{drawMotif(motif, { a: accent, d: dark, m: mid, uid })}</g>
        {showText && (
          <>
            <path d={`M110 ${titleTop - lh + 2} L190 ${titleTop - lh + 2}`} stroke={accent} strokeOpacity="0.6" strokeWidth="1" />
            <text x="150" y={titleTop} textAnchor="middle" fill="#fff" fontFamily="'Playfair Display', 'Iowan Old Style', Georgia, 'Times New Roman', serif" fontWeight="700" fontSize={fs} letterSpacing="1.2">
              {lines.map((l, i) => (
                <tspan key={i} x="150" dy={i === 0 ? 0 : lh}>{l}</tspan>
              ))}
            </text>
            <g transform={`translate(150 ${titleTop + (lines.length - 1) * lh + 22})`}>
              <path d="M-34 0 L-8 0 M8 0 L34 0" stroke={accent} strokeWidth="1.2" opacity="0.8" />
              <path d="M0 -4 L4 0 L0 4 L-4 0Z" fill={accent} />
            </g>
            {author && (
              <text x="150" y="410" textAnchor="middle" fill={accent} fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" fontWeight="600" fontSize={author.length > 26 ? 11 : 13} letterSpacing="2.4">
                {author.length > 34 ? author.slice(0, 33) + "…" : author}
              </text>
            )}
          </>
        )}
        {showLevel && book.level && (
          <g transform="translate(244 38)">
            <rect x="0" y="0" width="34" height="20" rx="10" fill="#fff" opacity="0.92" />
            <text x="17" y="14" textAnchor="middle" fontSize="11" fontWeight="800" fill={dark} fontFamily="ui-sans-serif, system-ui, sans-serif">{book.level}</text>
          </g>
        )}
        <rect width="16" height="450" fill={`url(#${uid}spine)`} />
        <rect x="0" y="0" width="300" height="70" fill="#fff" opacity="0.04" />
      </g>
    </svg>
  );
}

type C = { a: string; d: string; m: string; uid: string };

/** Motifs are drawn in a 160×160 box. */
function drawMotif(motif: string, c: C): ReactNode {
  const { a, d } = c;
  const hl = "#ffffff";
  const sw = { stroke: d, strokeWidth: 2.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (motif) {
    case "anchor":
      return (
        <g>
          <circle cx="80" cy="24" r="12" fill="none" stroke={a} strokeWidth="8" />
          <rect x="74" y="34" width="12" height="96" rx="5" fill={a} />
          <rect x="46" y="50" width="68" height="11" rx="5.5" fill={a} />
          <path d="M26 98 Q30 142 80 146 Q130 142 134 98" fill="none" stroke={a} strokeWidth="11" strokeLinecap="round" />
          <path d="M14 104 L28 86 L38 108Z M146 104 L132 86 L122 108Z" fill={a} />
          <path d="M77 40 L77 120" stroke={hl} strokeWidth="2" opacity="0.4" />
        </g>
      );
    case "balloon":
      return (
        <g>
          <path d="M80 4 C38 4 18 40 28 72 C34 94 60 108 68 118 L92 118 C100 108 126 94 132 72 C142 40 122 4 80 4Z" fill={a} />
          <path d="M80 4 C64 30 62 80 70 118 M80 4 C96 30 98 80 90 118" stroke={d} strokeWidth="2.5" fill="none" opacity="0.5" />
          <path d="M30 60 Q80 74 130 60" stroke={d} strokeWidth="2.5" fill="none" opacity="0.35" />
          <path d="M68 118 L66 134 M92 118 L94 134" stroke={a} strokeWidth="2" />
          <rect x="62" y="132" width="36" height="22" rx="4" fill={a} />
          <path d="M62 140 L98 140" stroke={d} strokeWidth="2" opacity="0.5" />
          <ellipse cx="56" cy="40" rx="9" ry="16" fill={hl} opacity="0.25" transform="rotate(20 56 40)" />
        </g>
      );
    case "bats": {
      const bat = (x: number, y: number, s: number) => (
        <path key={`${x}${y}`} transform={`translate(${x} ${y}) scale(${s})`} d="M0 0 Q8 -10 14 -3 Q18 -12 24 -4 Q28 -12 34 -3 Q40 -10 48 0 Q40 2 36 10 Q30 4 24 12 Q18 4 12 10 Q8 2 0 0Z" fill={d} />
      );
      return (
        <g>
          <path d="M108 18 A58 58 0 1 0 140 112 A46 46 0 1 1 108 18Z" fill={a} />
          {bat(18, 40, 1.3)}
          {bat(96, 92, 1)}
          {bat(62, 128, 0.8)}
          <circle cx="132" cy="30" r="2.5" fill={a} />
          <circle cx="146" cy="56" r="1.8" fill={a} />
        </g>
      );
    }
    case "candle":
      return (
        <g>
          <circle cx="80" cy="44" r="34" fill={a} opacity="0.18" />
          <path d="M80 16 Q94 38 80 58 Q66 38 80 16Z" fill={a} />
          <path d="M80 30 Q86 42 80 52 Q74 42 80 30Z" fill={hl} opacity="0.7" />
          <path d="M80 58 L80 66" stroke={d} strokeWidth="2.5" />
          <rect x="58" y="64" width="44" height="76" rx="6" fill={a} />
          <path d="M58 72 Q64 82 66 72 Q70 92 76 72 L102 70" fill={a} stroke={d} strokeWidth="2" opacity="0.6" />
          <rect x="40" y="138" width="80" height="12" rx="6" fill={a} />
          <path d="M64 80 L64 132" stroke={hl} strokeWidth="3" opacity="0.3" />
        </g>
      );
    case "castle":
      return (
        <g fill={a}>
          <rect x="14" y="44" width="34" height="106" />
          <rect x="112" y="44" width="34" height="106" />
          <rect x="44" y="76" width="72" height="74" />
          {[14, 26, 38, 112, 124, 136].map((x) => <rect key={x} x={x} y="34" width="9" height="12" />)}
          {[44, 58, 72, 86, 100].map((x) => <rect key={x} x={x} y="66" width="10" height="12" />)}
          <path d="M66 150 L66 116 Q80 98 94 116 L94 150Z" fill={d} />
          <rect x="24" y="70" width="12" height="18" rx="6" fill={d} />
          <rect x="124" y="70" width="12" height="18" rx="6" fill={d} />
          <path d="M31 34 L31 10 L48 16 L31 22" />
          <path d="M129 34 L129 6 L146 12 L129 18" />
        </g>
      );
    case "compass":
      return (
        <g>
          <circle cx="80" cy="80" r="70" fill="none" stroke={a} strokeWidth="6" />
          <circle cx="80" cy="80" r="58" fill="none" stroke={a} strokeWidth="1.5" strokeDasharray="3 6" />
          <path d="M80 14 L92 80 L80 146 L68 80Z" fill={a} />
          <path d="M14 80 L80 70 L146 80 L80 90Z" fill={a} opacity="0.65" />
          <path d="M80 14 L92 80 L80 80Z" fill={d} opacity="0.35" />
          <circle cx="80" cy="80" r="7" fill={d} />
          <text x="80" y="10" textAnchor="middle" fontSize="14" fontWeight="800" fill={a} fontFamily="Georgia, serif">N</text>
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M14 120 L22 40 L52 82 L80 24 L108 82 L138 40 L146 120Z" fill={a} />
          <rect x="12" y="118" width="136" height="22" rx="4" fill={a} />
          <path d="M12 128 L148 128" stroke={d} strokeWidth="2" opacity="0.4" />
          {[[22, 38], [80, 22], [138, 38]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill={a} stroke={d} strokeWidth="2" />)}
          <circle cx="80" cy="100" r="9" fill={d} opacity="0.6" />
          <circle cx="44" cy="104" r="6" fill={d} opacity="0.5" />
          <circle cx="116" cy="104" r="6" fill={d} opacity="0.5" />
        </g>
      );
    case "eye":
      return (
        <g>
          <path d="M6 80 Q80 6 154 80 Q80 154 6 80Z" fill={a} />
          <circle cx="80" cy="80" r="34" fill={d} />
          <circle cx="80" cy="80" r="16" fill={a} opacity="0.85" />
          <circle cx="80" cy="80" r="8" fill={d} />
          <circle cx="90" cy="70" r="5" fill={hl} opacity="0.8" />
          {[-60, -30, 0, 30, 60].map((r) => <path key={r} d="M80 30 L80 14" stroke={a} strokeWidth="4" strokeLinecap="round" transform={`rotate(${r} 80 80)`} />)}
        </g>
      );
    case "heart":
      return (
        <g>
          <path d="M80 146 C20 104 6 70 22 44 C38 18 70 22 80 48 C90 22 122 18 138 44 C154 70 140 104 80 146Z" fill={a} />
          <path d="M42 50 Q34 60 38 74" stroke={hl} strokeWidth="5" opacity="0.35" fill="none" strokeLinecap="round" />
          <path d="M120 16 C110 8 100 14 104 22 L120 34 L136 22 C140 14 130 8 120 16Z" fill={a} opacity="0.6" transform="scale(0.8) translate(40 0)" />
        </g>
      );
    case "key":
      return (
        <g transform="rotate(-35 80 80)">
          <circle cx="40" cy="80" r="30" fill={a} />
          <circle cx="40" cy="80" r="13" fill={d} />
          <rect x="64" y="73" width="88" height="14" rx="5" fill={a} />
          <rect x="124" y="86" width="10" height="20" rx="2" fill={a} />
          <rect x="140" y="86" width="10" height="14" rx="2" fill={a} />
          <path d="M24 70 Q22 60 32 56" stroke={hl} strokeWidth="4" opacity="0.35" fill="none" strokeLinecap="round" />
        </g>
      );
    case "lantern":
      return (
        <g>
          <circle cx="80" cy="90" r="46" fill={a} opacity="0.18" />
          <path d="M70 14 Q80 2 90 14" fill="none" stroke={a} strokeWidth="5" />
          <path d="M50 30 L110 30 L100 46 L60 46Z" fill={a} />
          <rect x="58" y="46" width="44" height="78" rx="4" fill={a} opacity="0.35" stroke={a} strokeWidth="5" />
          <path d="M80 70 Q92 88 80 104 Q68 88 80 70Z" fill={a} />
          <path d="M80 82 Q84 90 80 98 Q76 90 80 82Z" fill={hl} opacity="0.8" />
          <path d="M80 46 L80 124" stroke={a} strokeWidth="2" opacity="0.6" />
          <path d="M50 124 L110 124 L104 140 L56 140Z" fill={a} />
        </g>
      );
    case "lotus":
      return (
        <g fill={a}>
          <path d="M80 22 Q102 62 80 110 Q58 62 80 22Z" />
          <path d="M80 110 Q48 92 30 50 Q66 58 80 110Z" opacity="0.85" />
          <path d="M80 110 Q112 92 130 50 Q94 58 80 110Z" opacity="0.85" />
          <path d="M80 110 Q36 108 10 80 Q52 76 80 110Z" opacity="0.65" />
          <path d="M80 110 Q124 108 150 80 Q108 76 80 110Z" opacity="0.65" />
          <path d="M20 128 Q50 118 80 128 T140 128" stroke={a} strokeWidth="3" fill="none" />
          <path d="M34 142 Q60 134 80 142 T126 142" stroke={a} strokeWidth="2.5" fill="none" opacity="0.6" />
          <path d="M80 36 L80 98" stroke={d} strokeWidth="2" opacity="0.35" />
        </g>
      );
    case "magnifier":
      return (
        <g>
          <circle cx="64" cy="64" r="44" fill={a} opacity="0.2" />
          <circle cx="64" cy="64" r="44" fill="none" stroke={a} strokeWidth="11" />
          <path d="M36 46 Q44 30 62 28" stroke={hl} strokeWidth="6" opacity="0.5" fill="none" strokeLinecap="round" />
          <rect x="96" y="92" width="22" height="64" rx="10" fill={a} transform="rotate(-45 107 124)" />
          <rect x="96" y="92" width="22" height="14" rx="4" fill={d} opacity="0.4" transform="rotate(-45 107 124)" />
        </g>
      );
    case "mask":
      return (
        <g>
          <path d="M8 56 Q80 30 152 56 Q150 110 108 112 Q88 112 80 96 Q72 112 52 112 Q10 110 8 56Z" fill={a} />
          <path d="M36 70 Q52 60 66 74 Q52 84 36 70Z M94 74 Q108 60 124 70 Q108 84 94 74Z" fill={d} />
          <path d="M8 56 Q0 40 10 30 M152 56 Q160 40 150 30" stroke={a} strokeWidth="3" fill="none" />
          <path d="M80 96 Q84 126 72 150" stroke={a} strokeWidth="3" fill="none" />
          <path d="M80 96 Q92 120 100 150" stroke={a} strokeWidth="3" fill="none" />
          <path d="M24 52 Q40 44 58 46" stroke={hl} strokeWidth="3" opacity="0.4" fill="none" />
        </g>
      );
    case "mirror":
      return (
        <g>
          <ellipse cx="80" cy="64" rx="48" ry="58" fill={a} />
          <ellipse cx="80" cy="64" rx="38" ry="48" fill={d} opacity="0.85" />
          <path d="M60 34 Q54 52 58 72" stroke={hl} strokeWidth="5" opacity="0.4" fill="none" strokeLinecap="round" />
          <rect x="72" y="120" width="16" height="34" rx="6" fill={a} />
          {[0, 60, 120, 180, 240, 300].map((r) => <circle key={r} cx="80" cy="4" r="4" fill={a} transform={`rotate(${r} 80 64)`} />)}
        </g>
      );
    case "moon":
      return (
        <g>
          <path d="M100 12 A68 68 0 1 0 146 118 A54 54 0 1 1 100 12Z" fill={a} />
          {[[130, 30, 4], [148, 64, 2.5], [120, 70, 2]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={a} />)}
          <circle cx="44" cy="92" r="8" fill={d} opacity="0.25" />
          <circle cx="62" cy="122" r="5" fill={d} opacity="0.2" />
        </g>
      );
    case "mountain":
      return (
        <g>
          <circle cx="118" cy="34" r="16" fill={a} opacity="0.7" />
          <path d="M0 150 L56 40 L112 150Z" fill={a} />
          <path d="M60 150 L108 64 L160 150Z" fill={a} opacity="0.75" />
          <path d="M56 40 L42 68 L52 62 L60 72 L70 64Z" fill={hl} opacity="0.85" />
          <path d="M108 64 L96 86 L106 80 L114 88 L120 82Z" fill={hl} opacity="0.7" />
          <path d="M0 150 L160 150" stroke={a} strokeWidth="3" />
        </g>
      );
    case "paw":
      return (
        <g fill={a}>
          <path d="M80 72 C56 72 36 100 40 124 C44 144 66 140 80 134 C94 140 116 144 120 124 C124 100 104 72 80 72Z" />
          <ellipse cx="34" cy="70" rx="14" ry="19" transform="rotate(-20 34 70)" />
          <ellipse cx="62" cy="40" rx="14" ry="20" transform="rotate(-8 62 40)" />
          <ellipse cx="98" cy="40" rx="14" ry="20" transform="rotate(8 98 40)" />
          <ellipse cx="126" cy="70" rx="14" ry="19" transform="rotate(20 126 70)" />
        </g>
      );
    case "planet":
      return (
        <g>
          <ellipse cx="80" cy="84" rx="76" ry="20" fill="none" stroke={a} strokeWidth="5" opacity="0.6" transform="rotate(-18 80 84)" />
          <circle cx="80" cy="80" r="48" fill={a} />
          <path d="M38 66 Q80 56 122 70 M36 90 Q80 82 124 96" stroke={d} strokeWidth="5" opacity="0.25" fill="none" />
          <path d="M8 104 A76 20 -18 0 0 152 60" fill="none" stroke={a} strokeWidth="5" transform="rotate(0)" />
          <circle cx="62" cy="62" r="10" fill={hl} opacity="0.25" />
          {[[16, 22], [140, 18], [146, 140], [22, 136]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 5} L${x + 1.5} ${y - 1.5} L${x + 5} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 5} L${x - 1.5} ${y + 1.5} L${x - 5} ${y} L${x - 1.5} ${y - 1.5}Z`} fill={a} />)}
        </g>
      );
    case "potion":
      return (
        <g>
          <rect x="66" y="8" width="28" height="16" rx="4" fill={a} />
          <path d="M68 24 L68 56 Q24 76 30 116 Q38 152 80 152 Q122 152 130 116 Q136 76 92 56 L92 24Z" fill={a} opacity="0.35" stroke={a} strokeWidth="5" />
          <path d="M34 104 Q80 92 126 104 Q124 146 80 146 Q36 146 34 104Z" fill={a} />
          {[[64, 96, 5], [92, 84, 4], [78, 70, 3]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={a} />)}
          <path d="M44 86 Q42 106 50 124" stroke={hl} strokeWidth="4" opacity="0.4" fill="none" strokeLinecap="round" />
        </g>
      );
    case "quill":
      return (
        <g>
          <path d="M146 6 C100 20 62 56 44 112 L52 116 C70 64 104 34 146 6Z" fill={a} />
          <path d="M146 6 C118 46 92 70 52 116 C76 72 108 38 146 6Z" fill={d} opacity="0.3" />
          <path d="M44 112 L34 134 L52 116Z" fill={a} />
          <path d="M100 40 L120 44 M86 56 L106 62 M74 72 L92 80" stroke={d} strokeWidth="2" opacity="0.4" />
          <path d="M14 132 L58 132 L54 154 L18 154Z" fill={a} />
          <ellipse cx="36" cy="132" rx="22" ry="5" fill={d} opacity="0.5" />
        </g>
      );
    case "rabbit":
      return (
        <g>
          <circle cx="112" cy="112" r="34" fill="none" stroke={a} strokeWidth="6" />
          <path d="M112 90 L112 112 L126 120" stroke={a} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M112 74 L112 66" stroke={a} strokeWidth="5" />
          <path d="M44 150 Q30 124 40 98 Q46 84 58 82 Q52 50 50 18 Q60 14 64 48 Q66 30 76 10 Q84 14 74 56 Q72 70 70 82 Q86 92 84 118 Q82 142 66 150Z" fill={a} />
          <circle cx="62" cy="96" r="3" fill={d} />
        </g>
      );
    case "raven":
      return (
        <g>
          <path d="M6 132 Q80 118 154 136" stroke={a} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M120 140 Q126 150 136 152" stroke={a} strokeWidth="4" fill="none" />
          <path d="M36 128 Q30 96 54 76 Q58 46 86 40 Q104 38 112 52 L130 56 L112 62 Q114 80 100 96 Q90 116 68 128 L50 132 L36 150 L40 128Z" fill={a} />
          <path d="M60 86 Q80 92 96 82" stroke={d} strokeWidth="2.5" fill="none" opacity="0.4" />
          <circle cx="98" cy="50" r="4" fill={d} />
          <circle cx="99" cy="49" r="1.4" fill={hl} />
        </g>
      );
    case "rose":
      return (
        <g>
          <path d="M80 96 Q76 124 80 154" stroke={a} strokeWidth="5" fill="none" />
          <path d="M80 126 Q56 112 44 124 Q60 138 80 130Z M80 140 Q104 126 116 138 Q100 150 80 144Z" fill={a} opacity="0.75" />
          <circle cx="80" cy="60" r="42" fill={a} />
          <path d="M80 30 Q104 36 102 58 Q100 78 80 80 Q62 78 62 62 Q62 48 76 46 Q90 46 88 60 Q86 68 78 66" stroke={d} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d="M40 54 Q52 90 80 100 Q108 90 120 54" stroke={d} strokeWidth="3" fill="none" opacity="0.35" />
        </g>
      );
    case "ship":
      return (
        <g>
          <path d="M18 112 L142 112 L124 140 L34 140Z" fill={a} />
          <path d="M80 10 L80 112 M48 36 L48 112 M112 40 L112 112" stroke={a} strokeWidth="4" />
          <path d="M84 16 Q118 46 84 96Z" fill={a} opacity="0.9" />
          <path d="M52 40 Q78 62 52 96Z" fill={a} opacity="0.75" />
          <path d="M116 44 Q138 66 116 98Z" fill={a} opacity="0.7" />
          <path d="M80 10 L98 16 L80 22" fill={a} />
          <path d="M0 150 Q20 140 40 150 T80 150 T120 150 T160 150" stroke={a} strokeWidth="4" fill="none" />
          {[46, 70, 94, 118].map((x) => <circle key={x} cx={x} cy="124" r="3.5" fill={d} opacity="0.6" />)}
        </g>
      );
    case "skull":
      return (
        <g>
          <path d="M80 12 C38 12 20 44 24 74 C26 94 40 102 44 112 L44 134 L116 134 L116 112 C120 102 134 94 136 74 C140 44 122 12 80 12Z" fill={a} />
          <ellipse cx="56" cy="78" rx="15" ry="17" fill={d} />
          <ellipse cx="104" cy="78" rx="15" ry="17" fill={d} />
          <path d="M80 96 L72 112 L88 112Z" fill={d} />
          {[56, 70, 84, 98].map((x) => <rect key={x} x={x} y="120" width="6" height="14" rx="2" fill={d} opacity="0.6" />)}
          <path d="M42 40 Q56 24 76 22" stroke={hl} strokeWidth="5" opacity="0.35" fill="none" strokeLinecap="round" />
        </g>
      );
    case "skyline":
      return (
        <g>
          <circle cx="122" cy="30" r="14" fill={a} opacity="0.8" />
          {[[4, 80, 28], [30, 44, 26], [54, 92, 22], [74, 26, 30], [102, 70, 24], [124, 98, 32]].map(([x, y, w], i) => (
            <g key={i}>
              <rect x={x} y={y} width={w} height={156 - y} fill={a} opacity={i % 2 ? 0.85 : 1} />
              {Array.from({ length: Math.floor((150 - y) / 16) }, (_, k) => (
                <rect key={k} x={x + 5} y={y + 8 + k * 16} width={w - 10} height="5" fill={d} opacity="0.35" />
              ))}
            </g>
          ))}
          <path d="M89 26 L89 4" stroke={a} strokeWidth="3" />
        </g>
      );
    case "star":
      return (
        <g>
          <path d="M80 6 L98 58 L154 60 L110 94 L126 148 L80 116 L34 148 L50 94 L6 60 L62 58Z" fill={a} />
          <path d="M80 6 L98 58 L80 80Z M154 60 L110 94 L80 80Z" fill={hl} opacity="0.2" />
          {[[18, 20], [146, 128], [136, 18]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2}Z`} fill={a} opacity="0.8" />)}
        </g>
      );
    case "sun":
      return (
        <g>
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d="M80 2 L86 24 L74 24Z" fill={a} opacity={i % 2 ? 0.55 : 1} transform={`rotate(${i * 22.5} 80 80)`} />
          ))}
          <circle cx="80" cy="80" r="42" fill={a} />
          <circle cx="80" cy="80" r="30" fill="none" stroke={d} strokeWidth="2" opacity="0.3" />
          <path d="M58 64 Q66 52 80 50" stroke={hl} strokeWidth="5" opacity="0.35" fill="none" strokeLinecap="round" />
        </g>
      );
    case "swords":
      return (
        <g>
          {[-40, 40].map((r) => (
            <g key={r} transform={`rotate(${r} 80 80)`}>
              <path d="M76 2 L84 2 L86 108 L74 108Z" fill={a} />
              <path d="M80 2 L80 106" stroke={d} strokeWidth="1.5" opacity="0.35" />
              <rect x="54" y="108" width="52" height="9" rx="4" fill={a} />
              <rect x="75" y="117" width="10" height="26" rx="3" fill={a} />
              <circle cx="80" cy="148" r="7" fill={a} />
            </g>
          ))}
        </g>
      );
    case "teacup":
      return (
        <g>
          <path d="M60 30 Q50 18 60 8 M80 30 Q70 18 80 8 M100 30 Q90 18 100 8" stroke={a} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M24 52 L136 52 Q132 112 80 116 Q28 112 24 52Z" fill={a} />
          <path d="M134 62 Q160 62 156 84 Q152 102 124 98" stroke={a} strokeWidth="9" fill="none" />
          <ellipse cx="80" cy="132" rx="66" ry="12" fill={a} />
          <ellipse cx="80" cy="52" rx="56" ry="8" fill={d} opacity="0.4" />
          <path d="M40 66 Q44 92 60 104" stroke={hl} strokeWidth="5" opacity="0.35" fill="none" strokeLinecap="round" />
        </g>
      );
    case "tentacles":
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M20 156 Q10 100 46 86 Q70 78 64 52 Q60 36 44 40" stroke={a} strokeWidth="13" />
          <path d="M80 156 Q90 104 70 80 Q56 62 76 40 Q90 26 104 38" stroke={a} strokeWidth="13" />
          <path d="M140 156 Q150 104 120 92 Q100 84 112 60 Q120 46 134 54" stroke={a} strokeWidth="13" />
          {[[30, 120], [26, 104], [84, 118], [80, 100], [134, 118], [130, 102]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={d} opacity="0.5" />)}
        </g>
      );
    case "train":
      return (
        <g>
          {[[28, 20, 10], [44, 10, 13], [64, 6, 9]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={a} opacity={0.4 + i * 0.15} />)}
          <rect x="16" y="56" width="92" height="56" rx="10" fill={a} />
          <rect x="22" y="30" width="16" height="28" fill={a} />
          <rect x="100" y="34" width="46" height="78" rx="4" fill={a} />
          <rect x="110" y="44" width="26" height="22" rx="3" fill={d} opacity="0.5" />
          <path d="M8 112 L4 124 L24 124" fill={a} />
          {[34, 70, 124].map((x) => <circle key={x} cx={x} cy="128" r="16" fill={a} stroke={d} strokeWidth="3" />)}
          {[34, 70, 124].map((x) => <circle key={`h${x}`} cx={x} cy="128" r="4" fill={d} />)}
          <path d="M0 150 L160 150" stroke={a} strokeWidth="3" />
        </g>
      );
    case "tree":
      return (
        <g>
          <path d="M72 156 L74 104 Q60 96 50 100 Q66 88 76 92 L76 82 L86 82 L86 92 Q98 86 112 96 Q100 96 88 104 L90 156Z" fill={a} />
          <circle cx="80" cy="56" r="40" fill={a} />
          <circle cx="44" cy="76" r="26" fill={a} />
          <circle cx="116" cy="76" r="26" fill={a} />
          <circle cx="62" cy="34" r="22" fill={a} />
          <circle cx="100" cy="34" r="22" fill={a} />
          <circle cx="66" cy="46" r="10" fill={hl} opacity="0.2" />
          <path d="M40 156 L120 156" stroke={a} strokeWidth="3" />
        </g>
      );
    case "whale":
      return (
        <g>
          <path d="M64 24 Q58 8 46 6 M64 24 Q70 8 82 6 M64 24 L64 40" stroke={a} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M10 96 Q14 50 66 48 Q120 46 132 86 Q150 72 158 58 Q156 88 140 100 Q150 112 158 132 Q138 122 128 108 Q108 132 66 132 Q12 132 10 96Z" fill={a} />
          <path d="M24 108 Q66 124 110 110" stroke={d} strokeWidth="2.5" fill="none" opacity="0.4" />
          <circle cx="38" cy="84" r="4.5" fill={d} />
          <path d="M30 66 Q44 56 62 56" stroke={hl} strokeWidth="5" opacity="0.3" fill="none" strokeLinecap="round" />
          <path d="M0 150 Q20 142 40 150 T80 150 T120 150 T160 150" stroke={a} strokeWidth="3" fill="none" opacity="0.7" />
        </g>
      );
    default:
      return <circle cx="80" cy="80" r="56" fill={a} {...sw} />;
  }
}
