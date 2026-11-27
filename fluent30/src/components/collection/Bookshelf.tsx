// The personal bookshelf, drawn in SVG (also exported as a PNG for sharing).
import { forwardRef } from "react";
import { LIBRARY } from "@/lib/data/library";
import { BOOKS_PER_SHELF, SHELF_STYLES } from "@/lib/collection";
import type { CollectionEntry } from "@/lib/types";
import { DECOR_ART } from "./Decor";

const W = 360;
const SH = 128; // shelf height
const PAD = 14;

function hashColor(s: string) {
  const h = [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;
  return `hsl(${h} 45% 42%)`;
}

export const Bookshelf = forwardRef<SVGSVGElement, {
  entries: CollectionEntry[];
  style: string;
  placed: Record<string, string>;
  shelves: number;
  editable?: boolean;
  onBook?: (e: CollectionEntry) => void;
  onSlot?: (slot: string) => void;
}>(function Bookshelf({ entries, style, placed, shelves, editable, onBook, onSlot }, ref) {
  const st = SHELF_STYLES.find((x) => x.id === style) ?? SHELF_STYLES[0];
  const H = shelves * SH + PAD * 2;
  const sorted = [...entries].sort((a, b) => a.finishedAt - b.finishedAt);
  const rows = Array.from({ length: shelves }, (_, i) => sorted.slice(i * BOOKS_PER_SHELF, (i + 1) * BOOKS_PER_SHELF));
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="h-auto w-full select-none" role="img" aria-label="Ma bibliothèque">
      <defs>
        <linearGradient id="shelf-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={st.back} />
          <stop offset="1" stopColor={st.back} stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="spine-gloss" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
        {st.glow && (
          <filter id="neon" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>
      <rect width={W} height={H} rx="18" fill={st.edge} />
      <rect x="8" y="8" width={W - 16} height={H - 16} rx="12" fill="url(#shelf-back)" />
      {rows.map((row, i) => {
        const base = PAD + (i + 1) * SH - 10;
        let x = 62;
        return (
          <g key={i}>
            {/* books */}
            {row.map((e) => {
              const lib = e.libraryId ? LIBRARY.find((b) => b.id === e.libraryId) : undefined;
              const words = e.stats.wordsRead || 40000;
              const w = Math.max(14, Math.min(28, 10 + words / 12000));
              const h = 70 + ((words / 3000) % 26);
              const color = lib?.cover?.palette?.[0] ?? hashColor(e.title);
              const accent = lib?.cover?.palette?.[2] ?? "#FFD166";
              const golden = e.level === "C1" || e.level === "C2";
              const y = base - h;
              const bx = x;
              x += w + 3;
              return (
                <g key={e.bookId} onClick={() => onBook?.(e)} style={{ cursor: onBook ? "pointer" : undefined }}>
                  <rect x={bx} y={y} width={w} height={h} rx="2.5" fill={color} stroke="#2A2238" strokeWidth="1.2" />
                  <rect x={bx} y={y} width={w} height={h} rx="2.5" fill="url(#spine-gloss)" />
                  <rect x={bx} y={y + 8} width={w} height="4" fill={golden ? "#E0B84A" : accent} opacity="0.9" />
                  <rect x={bx} y={y + h - 12} width={w} height="4" fill={golden ? "#E0B84A" : accent} opacity="0.9" />
                  {golden && <rect x={bx + 0.6} y={y + 0.6} width={w - 1.2} height={h - 1.2} rx="2" fill="none" stroke="#E0B84A" strokeWidth="1.4" />}
                  {e.card === "holo" && <rect x={bx} y={y + 20} width={w} height="3" fill="#FF4FD8" opacity="0.7" />}
                  <text x={bx + w / 2 + 2.5} y={y + h / 2} transform={`rotate(-90 ${bx + w / 2 + 2.5} ${y + h / 2})`} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#fff" fontFamily="Georgia, serif">{e.title.length > 20 ? `${e.title.slice(0, 19)}…` : e.title}</text>
                </g>
              );
            })}
            {/* decoration slots at both ends */}
            {(["L", "R"] as const).map((side) => {
              const key = `${i}-${side}`;
              const d = placed[key];
              const sx = side === "L" ? 10 : W - 58;
              return (
                <g key={key} transform={`translate(${sx} ${base - 50})`} onClick={() => editable && onSlot?.(key)} style={{ cursor: editable ? "pointer" : undefined }}>
                  {d ? (
                    <g transform="scale(0.8) translate(0 2)">{DECOR_ART[d]}</g>
                  ) : editable ? (
                    <g>
                      <rect x="4" y="10" width="40" height="38" rx="8" fill="none" stroke="#9A93B8" strokeWidth="1.5" strokeDasharray="4 3" />
                      <path d="M24 22 L24 36 M17 29 L31 29" stroke="#9A93B8" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  ) : null}
                </g>
              );
            })}
            {/* board */}
            <g filter={st.glow ? "url(#neon)" : undefined}>
              <rect x="8" y={base} width={W - 16} height="12" fill={st.board} />
              <rect x="8" y={base + 10} width={W - 16} height="3" fill={st.glow ?? st.edge} />
            </g>
            <rect x="8" y={base + 12} width={W - 16} height="5" fill="#000" opacity="0.08" />
          </g>
        );
      })}
    </svg>
  );
});

/** Renders the shelf SVG into a PNG blob (for sharing). */
export async function shelfToPng(svg: SVGSVGElement, scale = 2): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(svg);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("render"));
    img.src = url;
  });
  const w = svg.viewBox.baseVal.width;
  const h = svg.viewBox.baseVal.height;
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = (h + 40) * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#1A1740";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, w * scale, h * scale);
  ctx.fillStyle = "#fff";
  ctx.font = `${13 * scale}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Ma bibliothèque en anglais — Fluent30", (w * scale) / 2, (h + 26) * scale);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("png"))), "image/png"));
}
