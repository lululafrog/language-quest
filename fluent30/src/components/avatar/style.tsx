// Shared drawing primitives for the avatar (kept separate to avoid circular imports).
import type { Appearance } from "@/lib/types";

export const O = "#3A3352"; // soft outline ink
export const W = 1.9; // outline width

/** Darken (amt < 0) or lighten (amt > 0) a hex colour. */
export function shade(hex: string, amt: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt));
  return `#${ch.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

/** Arm path; with `up` the arms are raised (celebration pose). */
export const armL = (sx: number, end = 163, up = false) =>
  up ? `M${74 + sx} 110 Q${60 + sx} 100 ${56 + sx} 84 Q${53 + sx} 72 ${52 + sx} ${58 + (163 - end)}` : `M${74 + sx} 110 Q${61 + sx} 124 ${57 + sx} 140 Q${54 + sx} 153 ${54 + sx} ${end}`;
export const armR = (sx: number, end = 163, up = false) =>
  up ? `M${126 - sx} 110 Q${140 - sx} 100 ${144 - sx} 84 Q${147 - sx} 72 ${148 - sx} ${58 + (163 - end)}` : `M${126 - sx} 110 Q${139 - sx} 124 ${143 - sx} 140 Q${146 - sx} 153 ${146 - sx} ${end}`;

/** A limb drawn as a thick rounded stroke with an outline (organic, no boxy corners). */
export function Limb({ d, w, color, outline = true }: { d: string; w: number; color: string; outline?: boolean }) {
  return (
    <>
      {outline && <path d={d} stroke={O} strokeWidth={w + W * 2} strokeLinecap="round" fill="none" />}
      <path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  );
}

export interface Ctx {
  uid: string;
  a: Appearance;
  skinShade: string;
  fem: boolean;
  sx: number;
  torso: string;
  facePath: string;
  up: boolean;
}
