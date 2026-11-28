"use client";
// Interactive mind map of the learner's vocabulary: "Mon anglais" at the centre, the 20 universes around it.
// Tapping a universe moves it smoothly to the centre and unfolds only ITS sub-themes (never all of them at once).
// Layout is computed in screen pixels from the container size (labels never shrink below a readable size and are
// kept inside the frame); the whole map can still be dragged and zoomed (pinch, wheel, buttons).
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, cx } from "@/components/ui";
import { UNIVERSES } from "@/lib/vocab/universes";
import type { SpaceStats } from "@/lib/vocab/space";
import { UniverseArt } from "./UniverseArt";
import { HUE } from "./Plant";
import { CountsLine } from "./common";

const SHORT: Record<string, string> = {
  travel: "Voyage", daily: "Quotidien", love: "Amour", friends: "Amitié", emotions: "Émotions", food: "Cuisine", sport: "Sport", health: "Santé",
  nature: "Nature", work: "Travail", money: "Argent", shopping: "Shopping", culture: "Culture", tech: "Technologie", transport: "Transports",
  home: "Maison", debate: "Débats", humour: "Humour", admin: "Administratif", emergency: "Urgences",
};

/** diameter of a universe node in the overview (touch target ≥ 44 px with its label) */
const NODE = 42;

interface Pos {
  x: number;
  y: number;
}

function ringPositions(n: number, w: number, h: number, padX: number, padY: number, startAngle = -Math.PI / 2): (Pos & { ring: number })[] {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 - padX;
  const ry = h / 2 - padY;
  // two rings when crowded: ~40 % of the nodes on an inner ring, the rest on the outer ring, angles interleaved
  const innerN = n > 9 ? Math.round(n * 0.4) : 0;
  const outerN = n - innerN;
  return Array.from({ length: n }, (_, i) => {
    const inner = i >= outerN;
    const k = inner ? 0.52 : 1;
    const idx = inner ? i - outerN : i;
    const cnt = inner ? innerN : outerN;
    const a = startAngle + ((idx + (inner ? 0.5 : 0)) / cnt) * Math.PI * 2;
    return { x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k, ring: inner ? 1 : 0 };
  });
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

let measureCtx: CanvasRenderingContext2D | null = null;
/** Width of a text in the app font (labels are measured, never guessed, so nothing gets clipped). */
function textWidth(text: string, font: string): number {
  if (typeof document === "undefined") return text.length * 7;
  measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!measureCtx) return text.length * 7;
  measureCtx.font = font;
  return measureCtx.measureText(text).width * 1.06;
}

/**
 * Pushes overlapping boxes apart (axis of least overlap), keeps them inside the frame and away from fixed zones
 * (centre node, corner buttons). Deterministic and fast enough for 20 nodes.
 */
function relax(boxes: Box[], W: number, H: number, fixed: Box[], gap = 8, iters = 260): Box[] {
  const b = boxes.map((x) => ({ ...x }));
  const clamp = (x: Box) => {
    x.x = Math.min(W - x.w / 2 - 4, Math.max(x.w / 2 + 4, x.x));
    x.y = Math.min(H - x.h / 2 - 4, Math.max(x.h / 2 + 4, x.y));
  };
  /** overlap of a and o (with gap) → displacement to apply to a (or to split between both) */
  const overlap = (a: Box, o: Box) => {
    const dx = (a.w + o.w) / 2 + gap - Math.abs(a.x - o.x);
    const dy = (a.h + o.h) / 2 + gap - Math.abs(a.y - o.y);
    if (dx <= 0 || dy <= 0) return null;
    return dx < dy ? { x: (a.x < o.x ? -1 : 1) * dx, y: 0 } : { x: 0, y: (a.y < o.y ? -1 : 1) * dy };
  };
  for (let it = 0; it < iters; it++) {
    let moved = false;
    for (let i = 0; i < b.length; i++) {
      for (const f of fixed) {
        const d = overlap(b[i], f);
        if (d) {
          b[i].x += d.x;
          b[i].y += d.y;
          moved = true;
        }
      }
      for (let j = i + 1; j < b.length; j++) {
        const d = overlap(b[i], b[j]);
        if (!d) continue;
        b[i].x += d.x / 2;
        b[i].y += d.y / 2;
        b[j].x -= d.x / 2;
        b[j].y -= d.y / 2;
        moved = true;
      }
    }
    for (const x of b) clamp(x);
    if (!moved) break;
  }
  return b;
}

export function VocabMap({ stats, onLearn }: { stats: SpaceStats; garden?: boolean; onLearn?: (u: string, sub?: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 360, h: 460 });
  const [focus, setFocus] = useState<string | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [animate, setAnimate] = useState(true);
  const pointers = useRef(new Map<number, Pos>());
  const gesture = useRef<{ x: number; y: number; k: number; dist?: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const uni = focus ? UNIVERSES.find((u) => u.id === focus) : undefined;
  const W = size.w;
  const H = size.h;
  // corner buttons are no-go zones for nodes
  const corners = useMemo<Box[]>(() => [{ x: W - 26, y: 76, w: 52, h: 152 }, ...(focus ? [{ x: 80, y: 26, w: 160, h: 52 }] : [])], [W, focus]);
  const overview = useMemo(() => {
    const start = ringPositions(UNIVERSES.length, W, H, Math.min(56, W * 0.15), 50);
    const boxes = UNIVERSES.map((u, i) => {
      const lw = Math.min(92, textWidth(SHORT[u.id], "500 11.5px Inter, ui-sans-serif, system-ui, sans-serif") + 10);
      const h = NODE + 3 + 16;
      return { x: start[i].x, y: start[i].y + (h / 2 - NODE / 2), w: Math.max(NODE + 4, lw), h };
    });
    const out = relax(boxes, W, H, [{ x: W / 2, y: H / 2, w: 100, h: 100 }, ...corners], 5, 400);
    return out.map((bx, i) => ({ x: bx.x, y: bx.y - (boxes[i].h / 2 - NODE / 2), w: bx.w, ring: start[i].ring }));
  }, [W, H, corners]);
  const subPos = useMemo(() => {
    if (!uni) return [];
    const start = ringPositions(uni.subs.length, W, H, Math.min(70, W * 0.2), 44, -Math.PI / 2 + 0.2);
    const boxes = uni.subs.map((sb, i) => {
      const maxW = start[i].ring ? 104 : 120;
      const tw = textWidth(sb.fr, "500 12.5px Inter, ui-sans-serif, system-ui, sans-serif") + 22 + (stats.universes[uni.id].subs[sb.id].toReview ? 12 : 0);
      const lines = tw > maxW ? 2 : 1;
      return { x: start[i].x, y: start[i].y, w: Math.min(maxW, tw), h: lines * 16 + 14 };
    });
    const centreLabel = Math.min(170, textWidth(uni.fr, "600 16px Georgia, serif") + 16);
    const out = relax(boxes, W, H, [{ x: W / 2, y: H / 2, w: Math.max(96, centreLabel), h: 144 }, ...corners], 6, 400);
    return out.map((bx, i) => ({ x: bx.x, y: bx.y, w: bx.w, ring: start[i].ring }));
  }, [uni, W, H, stats, corners]);

  const reset = useCallback(() => {
    setAnimate(true);
    setView({ x: 0, y: 0, k: 1 });
  }, []);

  function open(id: string) {
    setFocus(id);
    setSub(null);
    reset();
  }
  function back() {
    if (sub) return setSub(null);
    setFocus(null);
    reset();
  }

  // ---- pan & zoom (drag on the background, pinch, wheel)
  function down(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button,a")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setAnimate(false);
    const pts = [...pointers.current.values()];
    gesture.current = { x: view.x, y: view.y, k: view.k, moved: false, dist: pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : undefined };
  }
  function move(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2 && gesture.current.dist) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      setView((v) => ({ ...v, k: Math.min(2.6, Math.max(0.7, (gesture.current!.k * d) / gesture.current!.dist!)) }));
    } else {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 1) gesture.current.moved = true;
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    }
  }
  function up(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (!pointers.current.size) gesture.current = null;
  }
  function wheel(e: React.WheelEvent) {
    setAnimate(false);
    setView((v) => ({ ...v, k: Math.min(2.6, Math.max(0.7, v.k * (e.deltaY > 0 ? 0.92 : 1.08))) }));
  }
  const zoom = (f: number) => {
    setAnimate(true);
    setView((v) => ({ ...v, k: Math.min(2.6, Math.max(0.7, v.k * f)) }));
  };

  const c = { x: W / 2, y: H / 2 };
  const total = stats.all;
  const selSub = uni?.subs.find((s) => s.id === sub);
  const subCounts = uni && selSub ? stats.universes[uni.id].subs[selSub.id] : undefined;
  const tr = animate ? "transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s" : "none";

  return (
    <div>
      <div
        ref={box}
        className="relative h-[min(80vh,640px)] min-h-[460px] touch-none select-none overflow-hidden rounded-3xl border border-line bg-[radial-gradient(ellipse_at_center,var(--color-sun-100),transparent_70%)]"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onWheel={wheel}
      >
        <div className="absolute inset-0" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, transformOrigin: "50% 50%", transition: tr }}>
          {/* branches */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            {!uni &&
              UNIVERSES.map((u, i) => (
                <path key={u.id} d={`M${c.x},${c.y} Q${(c.x + overview[i].x) / 2 + (overview[i].y - c.y) * 0.12},${(c.y + overview[i].y) / 2 - (overview[i].x - c.x) * 0.12} ${overview[i].x},${overview[i].y}`} stroke={HUE[u.hue].main} strokeOpacity={0.35} strokeWidth={stats.universes[u.id].discovered ? 2.4 : 1.2} fill="none" />
              ))}
            {uni &&
              uni.subs.map((s, i) => {
                const cc = stats.universes[uni.id].subs[s.id];
                return <line key={s.id} x1={c.x} y1={c.y} x2={subPos[i].x} y2={subPos[i].y} stroke={HUE[uni.hue].main} strokeOpacity={cc.discovered ? 0.5 : 0.2} strokeWidth={cc.consolidated ? 2.4 : 1.2} />;
              })}
          </svg>

          {/* centre */}
          {!uni && (
            <div className="absolute flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-ink-700 text-center text-white shadow-lg" style={{ left: c.x, top: c.y }}>
              <span className="font-display text-[15px] font-semibold leading-tight">Mon anglais</span>
              <span className="mt-0.5 text-[11px] opacity-80">{total.consolidated} mots appris</span>
            </div>
          )}

          {/* universes (overview) or the focused universe at the centre */}
          {UNIVERSES.map((u, i) => {
            const focused = u.id === focus;
            const hidden = !!uni && !focused;
            const p = focused ? { x: c.x, y: c.y - 22 } : overview[i];
            const cnt = stats.universes[u.id];
            const size = focused ? 84 : NODE;
            return (
              <button
                key={u.id}
                onClick={() => (focused ? setSub(null) : !gesture.current?.moved && open(u.id))}
                aria-label={`${u.fr} : ${cnt.consolidated} mots appris, ${cnt.toReview} à réviser`}
                className={cx("absolute flex flex-col items-center", hidden && "pointer-events-none")}
                style={{ left: 0, top: 0, transform: `translate(${p.x}px, ${p.y - size / 2}px) translateX(-50%)`, transition: tr, opacity: hidden ? 0 : 1, width: focused ? 170 : (overview[i]?.w ?? 86) }}
              >
                <span className="relative block overflow-hidden rounded-full border-2 bg-surface shadow-md transition-[width,height] duration-500" style={{ width: size, height: size, borderColor: HUE[u.hue].main }}>
                  <UniverseArt id={u.id} className="h-full w-full scale-150" />
                  {cnt.toReview > 0 && !focused && <span className="absolute -right-0 -top-0 h-3 w-3 rounded-full border-2 border-surface bg-coral-500" />}
                </span>
                <span className={cx("mt-[3px] whitespace-nowrap rounded-full bg-surface/85 px-1 text-center font-medium leading-4 backdrop-blur-sm", focused ? "font-display text-base" : "text-[11.5px]")}>{focused ? u.fr : SHORT[u.id]}</span>
              </button>
            );
          })}

          {/* sub-themes of the focused universe */}
          {uni &&
            uni.subs.map((s, i) => {
              const cc = stats.universes[uni.id].subs[s.id];
              const ratio = cc.total ? cc.consolidated / cc.total : 0;
              const p = subPos[i];
              return (
                <button
                  key={s.id}
                  onClick={() => !gesture.current?.moved && setSub(s.id)}
                  className={cx(
                    "absolute -translate-x-1/2 -translate-y-1/2 animate-pop rounded-2xl border px-2.5 py-1.5 text-center text-[12.5px] font-medium leading-tight shadow-sm transition active:scale-95",
                    sub === s.id ? "ring-2 ring-offset-1" : "",
                  )}
                  style={{
                    left: p.x, top: p.y, width: p.w, animationDelay: `${i * 30}ms`,
                    background: ratio > 0 ? `color-mix(in srgb, ${HUE[uni.hue].main} ${Math.round(12 + ratio * 55)}%, var(--color-surface))` : "var(--color-surface)",
                    borderColor: HUE[uni.hue].main + "55",
                    ["--tw-ring-color" as string]: HUE[uni.hue].main,
                  }}
                >
                  {s.fr}
                  {cc.toReview > 0 && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-coral-500 align-middle" aria-label={`${cc.toReview} à réviser`} />}
                </button>
              );
            })}
        </div>

        {/* controls (outside the zoom layer) */}
        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <button onClick={() => zoom(1.2)} className="h-10 w-10 rounded-full border border-line bg-surface/90 text-lg shadow-sm" aria-label="Zoomer">+</button>
          <button onClick={() => zoom(1 / 1.2)} className="h-10 w-10 rounded-full border border-line bg-surface/90 text-lg shadow-sm" aria-label="Dézoomer">−</button>
          <button onClick={reset} className="h-10 w-10 rounded-full border border-line bg-surface/90 text-xs shadow-sm" aria-label="Recentrer">⤢</button>
        </div>
        {uni && (
          <button onClick={back} className="absolute left-2 top-2 flex h-10 items-center gap-1 rounded-full border border-line bg-surface/90 px-3 text-sm font-medium shadow-sm">
            ‹ {sub ? uni.fr.split(" ")[0] : "Mon anglais"}
          </button>
        )}
      </div>

      {/* details & actions for the focused universe / sub-theme */}
      {uni && (
        <div className="mt-3 animate-slide-up rounded-3xl border border-line bg-surface p-4">
          <p className="font-display text-lg font-semibold">{selSub ? selSub.fr : uni.fr}</p>
          <CountsLine c={subCounts ?? stats.universes[uni.id]} className="mt-0.5" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Link href={`/vocab/play?mode=new&universe=${uni.id}${selSub ? `&sub=${selSub.id}` : ""}&size=10`} onClick={() => onLearn?.(uni.id, selSub?.id)}>
              <Button className="w-full" size="sm">Apprendre</Button>
            </Link>
            <Link href={`/vocab/play?mode=review&universe=${uni.id}${selSub ? `&sub=${selSub.id}` : ""}&size=10`}>
              <Button className="w-full" size="sm" variant="secondary">Flashcards</Button>
            </Link>
            <Link href={`/games/pairs?mode=${(subCounts ?? stats.universes[uni.id]).discovered >= 4 ? "review" : "new"}&theme=${uni.id}`}>
              <Button className="w-full" size="sm" variant="outline">Jouer</Button>
            </Link>
          </div>
          {!selSub && (
            <Link href={`/vocab/u/${uni.id}`} className="mt-3 block text-center text-sm font-medium text-ink-600 underline-offset-2 hover:underline dark:text-ink-300">
              Ouvrir l&apos;univers ›
            </Link>
          )}
        </div>
      )}
      {!uni && <p className="mt-2 text-center text-xs text-muted">Touche un univers pour l&apos;ouvrir. Fais glisser ou pince pour te déplacer.</p>}
    </div>
  );
}
