// Original destination landscapes (flat travel-journal style). Each motif depicts a real,
// characteristic landscape of the destination — never a random scene.
import type { Continent } from "@/lib/atlas/types";
import { cx } from "@/components/ui";

export interface LandscapePalette {
  sky: string;
  land: string;
  sea: string;
  accent: string;
  ink: string;
}

const W = 400;
const H = 180;

type Motif = (p: LandscapePalette) => React.ReactNode;

const sun = (p: LandscapePalette, x = 320, y = 48, r = 20) => <circle cx={x} cy={y} r={r} fill={p.accent} opacity="0.85" />;
const birds = (ink: string) => (
  <path d="M60 40q6-6 12 0q6-6 12 0M96 30q4-4 8 0q4-4 8 0" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.55" />
);

const MOTIFS: Record<string, Motif> = {
  // United Kingdom: rolling green hills, a terrace of houses and a clock tower on a river
  uk: (p) => (
    <>
      <path d="M0 118q60-26 120-8t130-6 150 10v66H0z" fill={p.land} opacity="0.7" />
      <path d="M0 140q80-14 170 0t230-6v46H0z" fill={p.land} />
      <path d="M0 150h400v30H0z" fill={p.sea} opacity="0.8" />
      <g fill={p.ink} opacity="0.85">
        <path d="M250 150V74l8-14 8 14v76z" />
        <rect x="254" y="80" width="8" height="8" rx="4" fill={p.sky} />
        <path d="M150 150v-28l12-10 12 10v28zM174 150v-24l10-8 10 8v24zM194 150v-30l11-9 11 9v30z" opacity="0.75" />
      </g>
      <path d="M40 150q20-6 40 0M300 160q24-6 48 0" stroke="#fff" strokeWidth="2" opacity="0.6" fill="none" />
      <g fill={p.ink} opacity="0.25"><ellipse cx="90" cy="40" rx="34" ry="10" /><ellipse cx="200" cy="30" rx="28" ry="8" /></g>
    </>
  ),
  // Italy: Dolomite peaks above a coastal village
  italy: (p) => (
    <>
      {sun(p)}
      <path d="M0 120l40-50 20 24 30-56 26 44 18-20 34 58z" fill={p.ink} opacity="0.55" />
      <path d="M150 120l34-46 22 30 26-38 30 54z" fill={p.ink} opacity="0.4" />
      <path d="M90 38l6 10-8 2zM166 82l6 8-7 1" fill="#fff" opacity="0.8" />
      <path d="M0 120h400v60H0z" fill={p.sea} />
      <path d="M240 120q40-30 90-24t70 6v18z" fill={p.land} />
      <g>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={262 + i * 22} y={98 - (i % 2) * 8} width="18" height={22 + (i % 2) * 8} rx="2" fill={[p.accent, "#E8C9A0", "#D9A27C", "#F0DDB8", "#C98E6B"][i]} />
        ))}
      </g>
      <path d="M30 150q20-6 40 0M140 162q20-6 40 0" stroke="#fff" strokeWidth="2" opacity="0.55" fill="none" />
    </>
  ),
  // Indonesia (Bali): stepped rice terraces under a volcano
  indonesia: (p) => (
    <>
      {sun(p, 70, 46)}
      <path d="M180 120l70-80 20 0 70 80z" fill={p.ink} opacity="0.45" />
      <path d="M250 40q10-12 20 0" stroke={p.ink} strokeWidth="3" fill="none" opacity="0.5" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M0 ${110 + i * 15}q100 -${18 - i * 2} 200 0t200 0v${70 - i * 15}H0z`} fill={p.land} opacity={0.45 + i * 0.13} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M0 ${116 + i * 15}q100 -${18 - i * 2} 200 0t200 0`} stroke="#fff" strokeWidth="1.2" opacity="0.4" fill="none" />
      ))}
      <path d="M40 150v-30M40 120q-10 0-16 6M40 120q10 0 16 6M40 122q-8-8-14-6M40 122q8-8 14-6" stroke={p.ink} strokeWidth="2.4" fill="none" opacity="0.7" />
    </>
  ),
  // Vietnam: limestone karsts rising from a bay, with a small sailing boat
  vietnam: (p) => (
    <>
      {sun(p, 330, 54, 16)}
      <path d="M20 130q4-70 22-80t20 40q6-40 20-30t10 70z" fill={p.ink} opacity="0.5" />
      <path d="M130 130q2-50 18-58t16 30q8-50 26-46t12 74z" fill={p.ink} opacity="0.38" />
      <path d="M250 130q6-60 24-64t14 64z" fill={p.ink} opacity="0.3" />
      <path d="M0 128h400v52H0z" fill={p.sea} />
      <path d="M300 150h46l-8 8h-30z" fill={p.ink} opacity="0.8" />
      <path d="M322 148V112l20 30zM320 148l-16-28 16 4z" fill={p.accent} />
      <path d="M40 160q20-6 40 0M190 150q20-6 40 0" stroke="#fff" strokeWidth="2" opacity="0.55" fill="none" />
    </>
  ),
  // Japan: snow-capped volcanic cone and a high-speed train crossing
  japan: (p) => (
    <>
      {sun(p, 80, 50, 18)}
      <path d="M100 128L200 40l100 88z" fill={p.ink} opacity="0.45" />
      <path d="M174 63l26-23 26 23-10 4-8-6-8 8-8-6-8 6z" fill="#fff" opacity="0.9" />
      <path d="M0 128h400v52H0z" fill={p.land} />
      <path d="M0 140h400" stroke={p.ink} strokeWidth="2" opacity="0.6" />
      <path d="M60 138h170q30 0 40-12H90q-20 0-30 12z" fill="#F7F4EC" stroke={p.ink} strokeWidth="1.5" />
      <path d="M70 136h190" stroke={p.accent} strokeWidth="2.5" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={100 + i * 26} y="128" width="14" height="5" rx="1.5" fill={p.ink} opacity="0.7" />)}
      <path d="M330 128v-26M322 110q8-14 16 0M318 120q12-18 24 0" stroke="#D98FA0" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
    </>
  ),
  // Australia: sandstone cliffs, a beach and the reef
  australia: (p) => (
    <>
      {sun(p, 320, 44)}
      <path d="M0 96h120l10 30H0z" fill={p.accent} opacity="0.8" />
      <path d="M0 96h120l10 30" stroke={p.ink} strokeWidth="1.5" opacity="0.4" fill="none" />
      <path d="M0 126q150-6 400 4v50H0z" fill={p.sea} />
      <path d="M130 126q80 4 150 0v8q-80 6-150 0z" fill={p.land} />
      <g fill={p.accent} opacity="0.55">
        <circle cx="200" cy="160" r="6" /><circle cx="214" cy="164" r="4" /><circle cx="300" cy="156" r="5" /><circle cx="90" cy="166" r="5" />
      </g>
      <path d="M260 150q20-8 40 0M40 150q20-8 40 0" stroke="#fff" strokeWidth="2.4" opacity="0.6" fill="none" />
      <path d="M350 126v-28M350 98q-12-4-18 4M350 98q12-4 18 4M350 100q-4-10-12-12M350 100q4-10 12-12" stroke={p.ink} strokeWidth="2.4" fill="none" opacity="0.6" />
    </>
  ),
  // United States: canyon walls and an open road
  usa: (p) => (
    <>
      {sun(p, 300, 44)}
      <path d="M0 70h60v20h40v-14h50v40H0z" fill={p.accent} opacity="0.75" />
      <path d="M260 60h60v16h40v-10h40v60H260z" fill={p.accent} opacity="0.6" />
      <path d="M0 116h400v64H0z" fill={p.land} />
      <path d="M170 180l20-64h20l20 64z" fill={p.ink} opacity="0.7" />
      <path d="M200 120v8M200 140v10M200 162v12" stroke="#F3E7C9" strokeWidth="3" />
      <path d="M60 116v-24M52 100h16M300 116v-30M292 98h16" stroke={p.ink} strokeWidth="3" opacity="0.5" strokeLinecap="round" />
    </>
  ),
  // New Zealand: alpine lake under snowy mountains
  "new-zealand": (p) => (
    <>
      <path d="M0 110l70-60 40 30 50-50 60 52 50-36 60 40 70-26v50H0z" fill={p.ink} opacity="0.5" />
      <path d="M150 30l10 10-12 6zM270 46l10 8-12 4" fill="#fff" opacity="0.85" />
      <path d="M0 110h400v24H0z" fill={p.land} />
      <path d="M0 132h400v48H0z" fill={p.sea} />
      <path d="M0 132l70 20 40-14 50 26 60-22 50 16 60-12 70 10" stroke="#fff" strokeWidth="1.2" opacity="0.35" fill="none" />
      {[30, 60, 340, 370].map((x) => <path key={x} d={`M${x} 112l8-22 8 22z`} fill={p.ink} opacity="0.7" />)}
    </>
  ),
  // Egypt: the Nile with a felucca and the pyramids on the desert edge
  egypt: (p) => (
    <>
      {sun(p, 70, 48, 18)}
      <path d="M200 120l50-60 50 60z" fill={p.accent} opacity="0.85" />
      <path d="M250 60l50 60h-50z" fill={p.ink} opacity="0.18" />
      <path d="M300 120l30-34 30 34z" fill={p.accent} opacity="0.7" />
      <path d="M0 120h400v20H0z" fill={p.land} />
      <path d="M0 140h400v40H0z" fill={p.sea} />
      <path d="M60 150h50l-8 8H68z" fill={p.ink} opacity="0.8" />
      <path d="M84 148V104l24 40z" fill="#F7F1E3" stroke={p.ink} strokeWidth="1" />
      {[150, 170].map((x) => <path key={x} d={`M${x} 140v-24M${x} 116q-10-2-14 6M${x} 116q10-2 14 6M${x} 118q-6-8-12-8M${x} 118q6-8 12-8`} stroke="#5F7A4C" strokeWidth="2.4" fill="none" />)}
    </>
  ),
  // South Africa: the flat-topped mountain above a coastal city and the ocean
  "south-africa": (p) => (
    <>
      {sun(p, 330, 46, 16)}
      <path d="M40 118l40-44h180l40 44z" fill={p.ink} opacity="0.5" />
      <path d="M80 74h180" stroke="#fff" strokeWidth="3" opacity="0.6" />
      <path d="M0 110l40 8h260l100-12v20H0z" fill={p.land} />
      <g fill="#F2EBDD" opacity="0.9">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={110 + i * 20} y={108 - (i % 3) * 6} width="14" height={14 + (i % 3) * 6} rx="1.5" />)}
      </g>
      <path d="M0 126h400v54H0z" fill={p.sea} />
      <path d="M40 150q20-6 40 0M220 160q20-6 40 0" stroke="#fff" strokeWidth="2" opacity="0.6" fill="none" />
    </>
  ),
  // Canada: lake ringed by conifers
  canada: (p) => (
    <>
      <path d="M0 110l80-50 60 30 70-46 80 50 110-30v46H0z" fill={p.ink} opacity="0.4" />
      <path d="M0 116h400v18H0z" fill={p.land} />
      <path d="M0 132h400v48H0z" fill={p.sea} />
      {[20, 40, 64, 300, 324, 352, 378].map((x, i) => <path key={x} d={`M${x} ${134 - (i % 2) * 4}l9-30 9 30z`} fill="#3F5E46" />)}
      <path d="M150 150q20-6 40 0" stroke="#fff" strokeWidth="2" opacity="0.55" fill="none" />
    </>
  ),
};

const CONTINENT_MOTIF: Record<Continent, Motif> = {
  europe: (p) => (
    <>
      {sun(p)}
      <path d="M0 120q100-30 200-10t200 0v70H0z" fill={p.land} />
      <path d="M150 120v-40l20-16 20 16v40zM200 120v-30h40v30z" fill={p.ink} opacity="0.5" />
    </>
  ),
  asia: (p) => (
    <>
      {sun(p, 70, 48)}
      <path d="M0 130l90-70 60 40 80-60 90 70 80-30v50H0z" fill={p.ink} opacity="0.4" />
      <path d="M0 130h400v50H0z" fill={p.land} />
    </>
  ),
  africa: (p) => (
    <>
      {sun(p, 300, 50, 24)}
      <path d="M0 130h400v50H0z" fill={p.land} />
      <path d="M90 130v-40M60 92q30-16 60 0" stroke={p.ink} strokeWidth="5" fill="none" opacity="0.6" strokeLinecap="round" />
    </>
  ),
  "north-america": (p) => (
    <>
      <path d="M0 120l80-50 70 30 80-40 90 50 80-20v50H0z" fill={p.ink} opacity="0.4" />
      <path d="M0 120h400v60H0z" fill={p.land} />
    </>
  ),
  "south-america": (p) => (
    <>
      <path d="M0 126l60-70 40 40 70-56 60 60 50-30 120 56z" fill={p.ink} opacity="0.4" />
      <path d="M0 126h400v54H0z" fill={p.land} />
    </>
  ),
  oceania: (p) => (
    <>
      {sun(p)}
      <path d="M0 126h400v54H0z" fill={p.sea} />
      <path d="M140 126q60-26 120 0z" fill={p.land} />
      <path d="M200 116v-26M200 90q-12-4-18 4M200 90q12-4 18 4" stroke={p.ink} strokeWidth="2.4" fill="none" opacity="0.6" />
    </>
  ),
  antarctica: (p) => (
    <>
      <path d="M0 120l70-40 60 20 70-30 80 30 120-20v40z" fill="#F4F7F8" stroke={p.ink} strokeWidth="1" opacity="0.9" />
      <path d="M0 120h400v60H0z" fill={p.sea} />
    </>
  ),
};

export const CONTINENT_PALETTE: Record<Continent, LandscapePalette> = {
  europe: { sky: "#DCE6EA", land: "#9DB38A", sea: "#7FA4B4", accent: "#E3B062", ink: "#3D4A57" },
  asia: { sky: "#EAE0D2", land: "#9DB07F", sea: "#79A2A7", accent: "#D98C5F", ink: "#46473F" },
  africa: { sky: "#F1DEC2", land: "#D4B07A", sea: "#7FA9A8", accent: "#D9783F", ink: "#5A4433" },
  "north-america": { sky: "#DDE7EC", land: "#A7B98E", sea: "#7EA1B5", accent: "#E0A85C", ink: "#3C4852" },
  "south-america": { sky: "#E4EAD9", land: "#8FB07B", sea: "#76A5A4", accent: "#E09A55", ink: "#3E4B3F" },
  oceania: { sky: "#DCEDEE", land: "#E5D3A8", sea: "#5FA3B1", accent: "#E7A15A", ink: "#35505A" },
  antarctica: { sky: "#E5EEF2", land: "#F4F7F8", sea: "#8CAFC0", accent: "#B7C9D3", ink: "#4A5C67" },
};

export function hasLandscape(motif?: string) {
  return !!motif && motif in MOTIFS;
}

/** motif: destination id or AtlasDestination.landscape; falls back to the continent scene. */
export function Landscape({ motif, continent, palette, className, title }: { motif?: string; continent: Continent; palette?: LandscapePalette; className?: string; title?: string }) {
  const p = palette ?? CONTINENT_PALETTE[continent];
  const draw = (motif && MOTIFS[motif]) || CONTINENT_MOTIF[continent];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cx("block h-auto w-full", className)} role="img" aria-label={title ?? "Paysage de la destination"} preserveAspectRatio="xMidYMid slice">
      <rect width={W} height={H} fill={p.sky} />
      {birds(p.ink)}
      {draw(p)}
    </svg>
  );
}
