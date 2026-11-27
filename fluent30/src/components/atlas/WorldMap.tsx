"use client";
// Atlas world map: stylised continents drawn from coarse lon/lat outlines (equirectangular
// projection), so every catalogue pin sits at its real place. Cozy travel-journal style.
import { useMemo } from "react";
import type { Continent } from "@/lib/atlas/types";
import { cx } from "@/components/ui";

export const MAP_W = 1000;
export const MAP_H = 500;

export function project(lon: number, lat: number): [number, number] {
  return [((lon + 180) / 360) * MAP_W, ((90 - lat) / 180) * MAP_H];
}

type Ring = [number, number][];

// Coarse outlines (lon, lat). Simplified on purpose: readable shapes, correct positions.
const LAND: Ring[] = [
  // North America
  [[-168,66],[-162,70],[-150,71],[-140,70],[-128,70],[-115,68],[-100,69],[-90,70],[-80,73],[-70,67],[-62,60],[-56,52],[-60,47],[-66,44],[-70,42],[-74,40],[-76,36],[-80,32],[-81,27],[-80,25],[-82,26],[-84,30],[-90,30],[-95,29],[-97,26],[-97,22],[-95,19],[-91,18],[-88,21],[-87,16],[-84,15],[-83,10],[-79,9],[-77,8],[-80,7],[-83,8],[-86,12],[-92,15],[-98,16],[-105,20],[-106,23],[-110,24],[-112,29],[-114,31],[-117,32],[-120,34],[-124,40],[-124,46],[-125,49],[-130,54],[-135,58],[-142,60],[-150,60],[-152,58],[-158,57],[-163,55],[-158,59],[-165,62]],
  // Greenland
  [[-55,60],[-44,60],[-40,65],[-22,70],[-20,76],[-18,81],[-35,83],[-60,82],[-70,78],[-60,76],[-55,70],[-52,65]],
  // South America
  [[-80,9],[-75,11],[-72,12],[-64,10],[-60,8],[-52,5],[-50,0],[-44,-3],[-35,-5],[-35,-9],[-39,-15],[-41,-22],[-48,-26],[-53,-34],[-58,-38],[-62,-40],[-65,-45],[-68,-50],[-69,-55],[-72,-53],[-75,-48],[-74,-40],[-72,-30],[-71,-20],[-76,-14],[-81,-6],[-80,-2],[-78,2],[-77,7]],
  // Eurasia
  [[-10,36],[-9,43],[-2,44],[-1,46],[-5,48],[2,51],[5,53],[8,54],[8,57],[10,59],[5,59],[5,62],[12,66],[16,69],[22,70],[28,71],[40,67],[44,68],[60,69],[70,73],[80,73],[100,77],[112,74],[130,72],[140,72],[160,70],[170,70],[180,68],[180,65],[172,60],[163,58],[160,53],[156,51],[155,57],[143,59],[137,54],[141,52],[140,48],[135,43],[130,42],[129,36],[126,35],[126,38],[122,40],[121,37],[119,35],[122,31],[120,27],[117,23],[110,21],[108,21],[106,18],[109,12],[106,9],[103,10],[100,13],[99,8],[103,2],[101,3],[98,8],[98,16],[94,17],[92,22],[88,22],[85,20],[80,15],[77,8],[73,16],[72,21],[67,24],[62,25],[57,26],[56,23],[59,22],[52,17],[45,13],[43,13],[39,21],[35,28],[33,31],[35,36],[30,36],[27,37],[26,40],[23,40],[22,37],[20,40],[19,42],[13,45],[12,44],[16,40],[16,38],[15,40],[12,42],[10,44],[7,44],[3,43],[0,39],[-2,37],[-6,36]],
  // Africa
  [[-17,21],[-16,28],[-10,30],[-9,33],[-6,36],[0,36],[10,37],[11,33],[20,31],[25,32],[33,31],[35,28],[37,22],[39,15],[43,12],[51,12],[51,10],[48,5],[42,-1],[40,-5],[39,-10],[41,-15],[35,-20],[35,-24],[32,-28],[28,-33],[20,-35],[18,-33],[15,-26],[12,-18],[13,-12],[12,-5],[9,-1],[9,4],[5,6],[-2,5],[-8,4],[-13,8],[-17,14]],
  // Madagascar
  [[44,-25],[47,-25],[50,-15],[49,-12],[44,-16]],
  // Australia
  [[114,-22],[114,-34],[118,-35],[124,-34],[130,-32],[135,-35],[138,-35],[140,-38],[146,-39],[150,-37],[153,-31],[153,-25],[146,-19],[145,-15],[142,-11],[141,-15],[136,-12],[132,-11],[129,-15],[125,-14],[122,-18]],
  // New Zealand
  [[172,-34],[175,-37],[178,-38],[176,-41],[174,-41],[170,-46],[167,-46],[171,-42],[174,-39]],
  // Great Britain, Ireland, Iceland
  [[-5,50],[1,51],[2,53],[-1,55],[-2,57],[-4,59],[-6,58],[-5,55],[-3,54],[-5,52]],
  [[-10,52],[-6,52],[-6,55],[-8,55],[-10,54]],
  [[-24,64],[-14,64],[-14,66],[-22,66]],
  // Japan
  [[130,31],[134,34],[140,35],[141,38],[142,42],[145,44],[141,45],[140,41],[136,37],[132,35],[130,33]],
  // Maritime South-East Asia
  [[95,5],[98,4],[104,-2],[106,-6],[102,-4],[96,2]],
  [[106,-6],[114,-7],[115,-8.5],[106,-7.5]],
  [[109,1],[111,2],[117,7],[119,5],[118,1],[116,-4],[111,-3],[109,-1]],
  [[119,-5],[121,1],[125,1],[121,-1],[123,-5],[120,-3]],
  [[131,-1],[135,-3],[141,-3],[148,-6],[150,-10],[143,-9],[138,-8],[132,-4]],
  [[120,18],[122,18],[124,13],[126,7],[124,7],[122,10],[120,15]],
  // Sri Lanka, Taiwan, Cuba
  [[80,6],[82,7],[80,10],[79,8]],
  [[120,22],[122,25],[121,25],[120,23]],
  [[-85,22],[-80,23],[-74,20],[-78,20]],
  // Antarctica (band)
  [[-180,-72],[-120,-74],[-60,-64],[-30,-77],[30,-69],[90,-66],[150,-68],[180,-72],[180,-89],[-180,-89]],
];

function ringPath(r: Ring) {
  return r.map(([lon, lat], i) => {
    const [x, y] = project(lon, lat);
    return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join("") + "Z";
}

/** viewBox per continent zoom (x, y, w, h) in map units */
export const CONTINENT_VIEW: Record<Continent | "world", [number, number, number, number]> = {
  world: [0, 20, 1000, 445],
  europe: [440, 55, 170, 105],
  asia: [570, 40, 340, 230],
  africa: [430, 130, 230, 220],
  "north-america": [60, 40, 330, 210],
  "south-america": [230, 220, 190, 210],
  oceania: [770, 210, 230, 160],
  antarctica: [300, 380, 400, 110],
};

export type PinState = "validated" | "progress" | "available" | "coming";

export interface AtlasPin {
  id: string;
  lon: number;
  lat: number;
  label: string;
  state: PinState;
  dim?: boolean; // filtered out
}

const PIN_FILL: Record<PinState, string> = {
  validated: "var(--color-mint-600)",
  progress: "var(--color-coral-500)",
  available: "var(--color-ink-600)",
  coming: "#B9AE98",
};

export function WorldMap({
  pins, view = "world", selected, onPick, screenWidth = 360,
}: {
  pins: AtlasPin[];
  view?: Continent | "world";
  selected?: string;
  onPick: (id: string) => void;
  screenWidth?: number;
}) {
  const land = useMemo(() => LAND.map(ringPath), []);
  const [vx, vy, vw, vh] = CONTINENT_VIEW[view];
  const k = vw / screenWidth; // map units per screen px
  const sorted = useMemo(() => [...pins].sort((a, b) => order(a) - order(b)), [pins]);
  const sel = pins.find((p) => p.id === selected);

  return (
    <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} className="block h-auto w-full select-none transition-[all]" role="group" aria-label="Carte du monde des destinations">
      <defs>
        <pattern id="atlas-dots" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.7" fill="#7d6f55" opacity="0.16" />
        </pattern>
        <linearGradient id="atlas-sea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#CFE0DC" />
          <stop offset="1" stopColor="#B9D0D2" />
        </linearGradient>
      </defs>
      <rect x={-20} y={-20} width={MAP_W + 40} height={MAP_H + 40} fill="url(#atlas-sea)" className="dark:opacity-60" />
      <rect x={-20} y={-20} width={MAP_W + 40} height={MAP_H + 40} fill="url(#atlas-dots)" />
      {/* graticule */}
      <g stroke="#7FA6A4" strokeWidth={0.6 * Math.max(k, 0.15)} opacity="0.35" fill="none">
        {[-60, -30, 0, 30, 60].map((lat) => {
          const y = project(0, lat)[1];
          return <path key={lat} d={`M0 ${y}H${MAP_W}`} strokeDasharray={lat === 0 ? undefined : `${3 * k} ${4 * k}`} />;
        })}
      </g>
      <g fill="#EADFC8" stroke="#B5A384" strokeWidth={Math.max(0.5, 1.1 * k)} strokeLinejoin="round" className="dark:fill-[#3a3428] dark:stroke-[#5d5444]">
        {land.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {sorted.map((p) => {
        const [x, y] = project(p.lon, p.lat);
        const isSel = p.id === selected;
        const r = (p.state === "coming" ? 3.2 : 5) * k;
        return (
          <g
            key={p.id}
            transform={`translate(${x} ${y})`}
            role="button"
            tabIndex={p.dim ? -1 : 0}
            aria-label={`${p.label} — ${STATE_TEXT[p.state]}`}
            className={cx("cursor-pointer focus:outline-none", p.dim && "pointer-events-none")}
            opacity={p.dim ? 0.18 : 1}
            onClick={() => onPick(p.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(p.id)}
          >
            <circle r={r * 2.6} fill="transparent" />
            {isSel && <circle r={r * 2.3} fill={PIN_FILL[p.state]} opacity="0.22" />}
            <circle r={r} fill={PIN_FILL[p.state]} stroke="#FBF7EE" strokeWidth={1.4 * k} />
            {p.state === "validated" && <path d={`M${-2 * k} 0l${1.5 * k} ${1.5 * k} ${3 * k} ${-3 * k}`} stroke="#fff" strokeWidth={1.2 * k} fill="none" strokeLinecap="round" />}
          </g>
        );
      })}
      {sel && (() => {
        const [x, y] = project(sel.lon, sel.lat);
        return (
          <text x={x} y={y - 9 * k} textAnchor="middle" fontSize={12 * k} fontWeight={600} fill="#2E3A4B" stroke="#F6F0E4" strokeWidth={3.5 * k} paintOrder="stroke" fontFamily="var(--font-display)" pointerEvents="none">
            {sel.label}
          </text>
        );
      })()}
    </svg>
  );
}

const STATE_TEXT: Record<PinState, string> = {
  validated: "validée",
  progress: "en cours",
  available: "disponible",
  coming: "à venir",
};

function order(p: AtlasPin) {
  return (p.dim ? 0 : 10) + { coming: 0, available: 2, progress: 3, validated: 1 }[p.state];
}
