// Original line illustrations for the world map (cozy travel-journal style).
// Pure SVG paths on small grids: light, crisp at any size, theme-aware via currentColor.
import type { Landmark } from "@/lib/data/destinations";
import type { PlaceKind, SouvenirMotif, WorldDestination } from "@/lib/data/world";
import { cx } from "@/components/ui";

// ---------- souvenirs (32×32) ----------
const SOUVENIR: Record<SouvenirMotif, string> = {
  cup: "M7 12h15v7a6 6 0 01-6 6h-3a6 6 0 01-6-6zM22 14h2a3 3 0 010 6h-2M10 8c0-2 2-2 2-4M15 8c0-2 2-2 2-4",
  mug: "M8 9h14v14a3 3 0 01-3 3h-8a3 3 0 01-3-3zM22 12h2a3 3 0 013 3v2a3 3 0 01-3 3h-2M11 14v6",
  umbrella: "M4 15a12 12 0 0124 0zM16 15v10a2 2 0 01-4 0M16 3v2M10 15c0-4 3-8 6-10M22 15c0-4-3-8-6-10",
  ticket: "M5 9h22v4a3 3 0 000 6v4H5v-4a3 3 0 000-6zM19 9v14M9 14h6M9 18h4",
  map: "M4 8l8-3 8 3 8-3v19l-8 3-8-3-8 3zM12 5v19M20 8v19",
  postcard: "M4 8h24v17H4zM17 11v11M20 11h5v5h-5zM7 13h7M7 17h7M7 21h5",
  bagel: "M16 6a10 9 0 100 18 10 9 0 100-18zM16 12a4 3 0 100 6 4 3 0 100-6M10 9l1 1M21 9l-1 1M8 16h1M23 16h1M12 22l1-1M20 22l-1-1",
  badge: "M9 4h14v24H9zM13 4V2h6v2M12 10h8v6h-8zM12 20h8M12 23h5",
  camera: "M4 11h6l2-3h8l2 3h6v14H4zM16 13a5 5 0 100 10 5 5 0 100-10M24 14h1",
  sarong: "M7 5h18l-2 22H9zM7 5c3 3 15 3 18 0M11 11c2 2 4-2 6 0s4-2 6 0M10 17c2 2 4-2 6 0s4-2 6 0M10 23c2 2 4-2 6 0s4-2 5 0",
  shell: "M16 27L5 14a11 11 0 0122 0zM16 27V8M16 27l-6-14M16 27l6-14M16 27l-10-9M16 27l10-9",
  surfboard: "M22 4c4 4 2 14-6 22l-4 2-2-2 2-4C20 14 18 6 22 4zM13 21l4 4M18 10l4 4",
  coconut: "M16 8a10 10 0 100 20 10 10 0 100-20M12 13h.01M16 12h.01M14 16h.01M16 8c1-3 4-5 7-5",
  sunhat: "M3 20c0 2 6 4 13 4s13-2 13-4-4-3-6-3H9c-2 0-6 1-6 3zM9 17c0-6 3-9 7-9s7 3 7 9M9 15h14",
  towel: "M8 4h16v24H8zM8 9h16M8 14h16M8 19h16M8 24h16",
  kite: "M16 3l8 11-8 11-8-11zM16 3v22M8 14h16M16 25c-2 2 0 4-2 6",
  crane: "M4 18l9-4 3-9 3 9 9 4-9 2-3 7-3-7zM16 5v15M13 14l3 6 3-6",
  lantern: "M16 3v3M12 6h8M10 9c0-2 2-3 6-3s6 1 6 3v12c0 2-2 3-6 3s-6-1-6-3zM10 12h12M10 18h12M12 24h8v2h-8z",
  fan: "M16 26L4 12a17 17 0 0124 0zM16 26L9 8M16 26l7-18M16 26V6M16 26l-10-12M16 26l10-12",
  leaf: "M16 28v-6M16 22l-9 3 2-5-6-4 4-1-2-6 6 2 1-4 4 5 4-5 1 4 6-2-2 6 4 1-6 4 2 5z",
  notebook: "M8 4h16v24H8zM8 4v24M12 4v24M15 10h6M15 14h6M5 8h5M5 14h5M5 20h5",
  key: "M10 16a5 5 0 110-.1M15 16h13M24 16v4M28 16v3M8 16h.01",
  scarf: "M9 4h14v8l-3 3v13h-5V15l-6-3zM9 8h14M15 18h5M15 22h5M15 26h5",
  compass: "M16 4a12 12 0 100 24 12 12 0 100-24M20 12l-6 3-2 5 6-3zM16 6v2M16 24v2M6 16h2M24 16h2",
  pin: "M16 3a8 8 0 00-8 8c0 6 8 15 8 15s8-9 8-15a8 8 0 00-8-8zM16 8a3 3 0 100 6 3 3 0 100-6",
  bracelet: "M16 6c7 0 11 4 11 10s-4 10-11 10S5 22 5 16 9 6 16 6zM16 10c4 0 7 3 7 6s-3 6-7 6-7-3-7-6 3-6 7-6M8 10l1 1M23 10l-1 1M8 22l1-1M23 22l-1-1",
};

export function SouvenirArt({ motif, size = 40, className, color }: { motif: SouvenirMotif; size?: number; className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" stroke={color ?? "currentColor"} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={SOUVENIR[motif]} />
    </svg>
  );
}

// ---------- places (24×24) ----------
const PLACE: Record<PlaceKind, string> = {
  cafe: "M4 9h12v6a5 5 0 01-5 5H9a5 5 0 01-5-5zM16 11h2a2 2 0 010 4h-2M8 3v3M12 3v3",
  restaurant: "M6 3v8a2 2 0 004 0V3M8 11v10M15 21V3c3 1 4 4 4 8h-4",
  airport: "M2 15l20-6-2-2-6 2-6-6H6l3 7-5 2-2-1z M3 21h18",
  hotel: "M3 21V5h12v16M15 10h6v11M6 9h2M10 9h2M6 13h2M10 13h2M8 21v-4h2v4",
  beach: "M3 19c3 2 6-2 9 0s6-2 9 0M12 17V6M12 6C9 3 5 4 4 7M12 6c3-3 7-2 8 1M12 6c0-3 2-4 4-4",
  market: "M3 9l2-5h14l2 5M3 9h18M3 9c0 2 2 3 3 3s3-1 3-3c0 2 2 3 3 3s3-1 3-3c0 2 2 3 3 3s3-1 3-3M5 12v9h14v-9M10 21v-5h4v5",
  station: "M7 3h10a3 3 0 013 3v9a3 3 0 01-3 3H7a3 3 0 01-3-3V6a3 3 0 013-3zM4 10h16M8 14h.01M16 14h.01M7 21l2-3M17 21l-2-3",
  library: "M4 4h4v16H4zM9 6h4v14H9zM14 5l4-1 3 15-4 1z",
  park: "M12 21v-6M12 15a5 5 0 100-10 5 5 0 000 10zM5 21h14M6 18a2 2 0 100-4 2 2 0 000 4M6 18v3",
  gym: "M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12",
  hostel: "M3 11l9-7 9 7M5 10v10h14V10M9 20v-5h6v5M9 11h6",
  culture: "M3 21h18M5 18h14M6 18V10M10 18V10M14 18V10M18 18V10M3 10h18L12 4z",
  office: "M4 21V7l8-4 8 4v14M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4",
};

export function PlaceGlyph({ place, size = 22, className }: { place: PlaceKind; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={PLACE[place]} />
    </svg>
  );
}

// ---------- landmark scenes (destination header, 360×160) ----------
const LANDMARK: Partial<Record<Landmark, string>> = {
  clock: "M168 150V62l12-18 12 18v88M168 76h24M180 70a7 7 0 100 .1M156 150h48M174 150v-22h12v22M150 150V100h18M192 100h18v50",
  statue: "M174 150v-46h12v46M168 104h24M174 104l-3-34 16-6 2 40M187 64l5-22M190 42l-7-2 10-9 3 10M160 150h40M163 150v-10h34v10",
  palm: "M182 150c-6-30-2-60 4-80M186 70c-16-12-34-8-44 2M186 70c16-12 34-8 44 2M186 70c-6-18-22-24-34-20M186 70c6-18 22-24 34-20M186 70c0-14 4-24 10-30M140 150h90",
  opera: "M120 140h140M130 140c8-34 26-40 38-42-4 22 2 36 6 42M160 140c8-38 28-44 40-46-4 26 2 40 6 46M192 140c8-30 26-36 38-38-4 20 0 32 2 38M110 150c20 6 40-6 60 0s40-6 60 0 40-6 60 0",
  temple: "M130 150h100M136 142h88M142 142V108M158 142V108M174 142V108M190 142V108M206 142V108M222 142V108M128 108h104l-52-30zM150 84h60l-30-22zM180 62v-10",
  maple: "M180 150v-26M180 124l-22 8 4-13-17-9 8-4-4-17 15 6 4-11 12 14V60M180 124l22 8-4-13 17-9-8-4 4-17-15 6-4-11-12 14",
};

export function DestinationScene({ dest, className }: { dest: WorldDestination; className?: string }) {
  const p = dest.palette;
  return (
    <svg viewBox="0 0 360 160" className={cx("block h-auto w-full", className)} role="img" aria-label={`${dest.nameFr} — illustration`}>
      <rect width="360" height="160" fill={p.sky} />
      <circle cx="292" cy="40" r="18" fill="#F6E7C1" opacity="0.9" />
      <path d="M0 118c40-14 80-10 120-2s90 10 130-2 80-12 110-4v50H0z" fill={p.ground} />
      <path d="M0 132c50-10 100-6 150 2s110 8 150-2 50-6 60-4v32H0z" fill={p.ground} opacity="0.7" style={{ mixBlendMode: "multiply" }} />
      <g fill="none" stroke={p.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.88">
        <path d={LANDMARK[dest.landmark] ?? LANDMARK.clock} />
      </g>
      <g stroke={p.accent} strokeWidth="2" strokeLinecap="round" opacity="0.7">
        <path d="M40 40q8-6 16 0M52 34q6-5 12 0M300 80q6-4 12 0" fill="none" />
      </g>
    </svg>
  );
}

// ---------- the stylised world map (1000×560) ----------
// Hand-simplified continents: evocative, not geographically exact.
const LAND = [
  // North America
  "M110 120c40-40 120-60 200-40 40 10 70 30 70 60-10 30-40 40-60 70-20 30-50 50-90 60-30 8-40 30-60 30-20-20-10-50-30-70-30-30-60-60-30-110z",
  // South America
  "M300 330c30-10 60 0 70 30 10 40-10 80-30 120-10 20-30 30-40 20-10-30 0-70-10-100-10-30-20-60 10-70z",
  // Europe
  "M450 120c20-20 60-30 90-20 20 6 30 20 20 34-10 16-30 14-50 24-20 10-30 26-50 20-20-8-30-40-10-58z",
  // Africa
  "M470 230c40-20 90-14 110 14 20 30 10 70-10 110-14 30-34 60-60 60-20-10-20-50-34-80-14-30-40-80-6-104z",
  // Asia
  "M580 100c60-40 160-50 240-20 50 20 70 60 50 90-20 30-60 30-90 50-30 20-40 50-80 50-40 0-60-30-90-40-30-10-60-20-60-50s0-60 30-80z",
  // Indonesia / islands
  "M760 360c14-6 30-4 40 4-6 8-24 10-40 6zM810 372c10-4 22-2 28 4-6 6-18 6-28 2zM730 350c10-4 20-2 24 4-6 4-16 4-24 0z",
  // Australia
  "M820 410c30-20 90-20 120 0 20 14 16 44-6 58-30 18-80 20-110 4-24-14-24-46-4-62z",
  // Japan & UK slivers
  "M872 196c6-10 14-18 20-16 2 10-8 24-18 30zM466 150c4-12 12-20 18-18 0 10-6 22-16 26z",
];

export interface MapPin {
  id: string;
  x: number;
  y: number;
  label: string;
  state: "locked" | "open" | "visited" | "done";
  color: string;
}

export function WorldMapArt({ pins, onPick, selected }: { pins: MapPin[]; onPick: (id: string) => void; selected?: string }) {
  const visited = pins.filter((p) => p.state === "visited" || p.state === "done");
  return (
    <svg viewBox="0 0 1000 560" className="block h-auto w-full select-none" role="group" aria-label="Carte du monde des destinations">
      <defs>
        <pattern id="paper-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.9" fill="#8a7a5c" opacity="0.18" />
        </pattern>
        <linearGradient id="sea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#CFE0DC" />
          <stop offset="1" stopColor="#BCD3D4" />
        </linearGradient>
      </defs>
      <rect width="1000" height="560" rx="26" fill="url(#sea)" className="dark:opacity-60" />
      <rect width="1000" height="560" rx="26" fill="url(#paper-dots)" />
      {/* soft wave strokes */}
      <g stroke="#8FB3B0" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round">
        <path d="M60 470q14-8 28 0t28 0M400 520q14-8 28 0t28 0M640 300q14-8 28 0t28 0M150 300q14-8 28 0t28 0M920 300q10-6 20 0" />
      </g>
      <g fill="#E9DFC9" stroke="#B9A88A" strokeWidth="1.5" strokeLinejoin="round">
        {LAND.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {/* dotted journey line between visited destinations */}
      {visited.length > 1 && (
        <path d={visited.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ")} stroke="#B5523B" strokeWidth="2.5" strokeDasharray="2 9" strokeLinecap="round" fill="none" opacity="0.75" />
      )}
      {/* compass rose */}
      <g transform="translate(70 90)" stroke="#6E6450" fill="none" strokeWidth="1.6" opacity="0.7">
        <circle r="24" />
        <path d="M0-30L5 0 0 30-5 0zM-30 0L0 5 30 0 0-5z" />
        <text y="-36" textAnchor="middle" fontSize="13" fill="#6E6450" stroke="none" fontFamily="var(--font-display)">N</text>
      </g>
      {pins.map((p) => {
        const locked = p.state === "locked";
        const isSel = selected === p.id;
        return (
          <g
            key={p.id}
            transform={`translate(${p.x} ${p.y})`}
            className="cursor-pointer focus:outline-none"
            role="button"
            tabIndex={0}
            aria-label={`${p.label} — ${locked ? "verrouillée" : p.state === "done" ? "terminée" : p.state === "visited" ? "en cours" : "disponible"}`}
            onClick={() => onPick(p.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(p.id)}
          >
            <circle r={isSel ? 30 : 0} fill={p.color} opacity="0.18" />
            <path d="M0 0c-10-14-16-22-16-30a16 16 0 0132 0c0 8-6 16-16 30z" fill={locked ? "#CFC6B4" : p.color} stroke="#fff" strokeWidth="2.5" />
            {p.state === "done" ? (
              <path d="M-6-30l4 4 8-8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : locked ? (
              <path d="M-5-29h10v8h-10zM-3-29v-3a3 3 0 016 0v3" stroke="#fff" strokeWidth="2" fill="none" />
            ) : (
              <circle cy="-30" r="5" fill="#fff" />
            )}
            <text y="18" textAnchor="middle" fontSize="17" fontWeight="600" fill="#2E3A4B" stroke="#F4EEE2" strokeWidth="4" paintOrder="stroke" fontFamily="var(--font-display)">
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
