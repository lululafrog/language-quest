"use client";
// Illustrated postcard (pure SVG with explicit colours, so it can be exported to PNG and shared).
import { forwardRef } from "react";
import type { Continent } from "@/lib/atlas/types";
import { Landscape, type LandscapePalette } from "./Landscape";
import { Tourist } from "@/components/avatar/Tourist";
import type { Appearance, GameState } from "@/lib/types";

export interface PostcardData {
  nameEn: string;
  nameFr: string;
  continent: Continent;
  motif?: string;
  palette?: LandscapePalette;
  message: string;
  date: number;
  skills: string[];
  souvenirs: string[];
  band?: string;
  equipped?: GameState["equipped"];
  appearance?: Appearance;
}

function wrap(text: string, max: number, lines: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if ((cur + " " + w).trim().length > max) {
      out.push(cur.trim());
      cur = w;
    } else cur = `${cur} ${w}`;
  }
  if (cur.trim()) out.push(cur.trim());
  if (out.length > lines) {
    const kept = out.slice(0, lines);
    kept[lines - 1] = kept[lines - 1].replace(/\s*\S*$/, "") + "…";
    return kept;
  }
  return out;
}

const INK = "#2E3A4B";
const MUTED = "#7A705E";
const FONT = "Georgia, 'Times New Roman', serif";
const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

export const Postcard = forwardRef<SVGSVGElement, { data: PostcardData; className?: string }>(function Postcard({ data, className }, ref) {
  const msg = wrap(data.message || "…", 30, 6);
  const date = new Date(data.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const accent = data.palette?.accent ?? "#C9764F";
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" className={className} role="img" aria-label={`Carte postale : ${data.nameFr}`}>
      <rect x="2" y="2" width="596" height="396" rx="18" fill="#FBF6EA" stroke="#D9CDB6" strokeWidth="2" />
      {/* picture side */}
      <svg x="20" y="20" width="280" height="200">
        <Landscape motif={data.motif} continent={data.continent} palette={data.palette} />
      </svg>
      <rect x="20" y="20" width="280" height="200" rx="2" fill="none" stroke="#D9CDB6" strokeWidth="1.5" />
      <text x="32" y="50" fontFamily={FONT} fontSize="15" fontStyle="italic" fill="#FBF6EA" stroke={INK} strokeWidth="3" paintOrder="stroke">Greetings from</text>
      <text x="32" y="80" fontFamily={FONT} fontSize="28" fontWeight="700" fill="#FBF6EA" stroke={INK} strokeWidth="4" paintOrder="stroke">{data.nameEn}</text>
      <svg x="34" y="214" width="120" height="144">
        <Tourist equipped={data.equipped} appearance={data.appearance} animate={false} expression="smile" />
      </svg>
      <text x="170" y="250" fontFamily={SANS} fontSize="11" fill={MUTED} letterSpacing="1">SKILLS</text>
      {data.skills.slice(0, 4).map((s, i) => (
        <text key={s} x="170" y={268 + i * 17} fontFamily={SANS} fontSize="12" fill={INK}>• {s.length > 22 ? s.slice(0, 21) + "…" : s}</text>
      ))}
      {data.souvenirs.length > 0 && (
        <text x="170" y="350" fontFamily={SANS} fontSize="11" fill={MUTED}>
          {data.souvenirs.slice(0, 2).join(" · ").slice(0, 34)}
        </text>
      )}
      {/* writing side */}
      <path d="M318 30V370" stroke="#D9CDB6" strokeWidth="1.5" />
      {/* stamp */}
      <g transform="translate(524 70) rotate(-8)">
        <circle r="44" fill="none" stroke={accent} strokeWidth="3" />
        <circle r="36" fill="none" stroke={accent} strokeWidth="1.2" strokeDasharray="3 3" />
        <text textAnchor="middle" y="-6" fontFamily={SANS} fontSize={data.nameEn.length > 10 ? 9 : 11} fontWeight="700" fill={accent} letterSpacing="1">{data.nameEn.toUpperCase()}</text>
        <text textAnchor="middle" y="10" fontFamily={SANS} fontSize="8" fill={accent}>{new Date(data.date).toLocaleDateString("en-GB")}</text>
        {data.band && <text textAnchor="middle" y="24" fontFamily={SANS} fontSize="9" fontWeight="700" fill={accent}>{data.band}</text>}
      </g>
      {msg.map((l, i) => (
        <text key={i} x="336" y={150 + i * 30} fontFamily={FONT} fontSize="17" fontStyle="italic" fill={INK}>{l}</text>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M336 ${156 + i * 30}H570`} stroke="#E6DCC8" strokeWidth="1" />)}
      <text x="336" y="356" fontFamily={SANS} fontSize="12" fill={MUTED}>{date}</text>
      <text x="570" y="356" textAnchor="end" fontFamily={SANS} fontSize="11" fill={MUTED}>Fluent30</text>
    </svg>
  );
});

/** Serialises the postcard SVG and renders it to a PNG blob (no network, no personal data besides the card). */
export async function postcardToPng(svg: SVGSVGElement, scale = 2): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("render"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 600 * scale;
    canvas.height = 400 * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob) throw new Error("render");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
