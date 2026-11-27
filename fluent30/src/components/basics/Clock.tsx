"use client";
import { useRef } from "react";

const O = "#3A3352";

/** Interactive analogue clock: drag the big hand, or use the buttons. Controlled component (minutes since midnight). */
export function Clock({ minutes, onChange, size = 220, interactive = true }: { minutes: number; onChange?: (m: number) => void; size?: number; interactive?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const minAngle = m * 6;
  const hourAngle = (h % 12) * 30 + m * 0.5;
  const night = h < 6 || h >= 20;

  const dragTo = (clientX: number, clientY: number) => {
    if (!ref.current || !onChange) return;
    const r = ref.current.getBoundingClientRect();
    const x = clientX - (r.left + r.width / 2);
    const y = clientY - (r.top + r.height / 2);
    let deg = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    const newM = Math.round(deg / 6 / 5) * 5 % 60;
    // Crossing 12 o'clock moves the hour forward/backward.
    let hour = h;
    if (m >= 45 && newM <= 15) hour = (h + 1) % 24;
    else if (m <= 15 && newM >= 45) hour = (h + 23) % 24;
    onChange(hour * 60 + newM);
  };

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={interactive ? "cursor-grab touch-none select-none active:cursor-grabbing" : undefined}
      onPointerDown={(e) => {
        if (!interactive) return;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        dragTo(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => interactive && e.buttons === 1 && dragTo(e.clientX, e.clientY)}
      role="img"
      aria-label="clock"
    >
      <circle cx="100" cy="100" r="94" fill={night ? "#2E2A6B" : "#FFF8EE"} stroke={O} strokeWidth="5" />
      <circle cx="100" cy="100" r="86" fill={night ? "#3C3480" : "#FFFFFF"} />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 * Math.PI) / 180;
        const big = i % 5 === 0;
        return <line key={i} x1={100 + Math.sin(a) * (big ? 72 : 78)} y1={100 - Math.cos(a) * (big ? 72 : 78)} x2={100 + Math.sin(a) * 83} y2={100 - Math.cos(a) * 83} stroke={night ? "#CFCCFF" : O} strokeWidth={big ? 3 : 1.2} strokeLinecap="round" />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const a = (n * 30 * Math.PI) / 180;
        return <text key={n} x={100 + Math.sin(a) * 58} y={100 - Math.cos(a) * 58 + 6} textAnchor="middle" fontSize="17" fontWeight="800" fill={night ? "#FFFFFF" : O} fontFamily="system-ui, sans-serif">{n}</text>;
      })}
      <text x="100" y="140" textAnchor="middle" fontSize="13" fill={night ? "#FFD166" : "#FF7A6B"} fontFamily="system-ui">{night ? "☾" : "☀"}</text>
      <line x1="100" y1="100" x2={100 + Math.sin((hourAngle * Math.PI) / 180) * 42} y2={100 - Math.cos((hourAngle * Math.PI) / 180) * 42} stroke={night ? "#FFFFFF" : O} strokeWidth="8" strokeLinecap="round" />
      <line x1="100" y1="100" x2={100 + Math.sin((minAngle * Math.PI) / 180) * 70} y2={100 - Math.cos((minAngle * Math.PI) / 180) * 70} stroke="#FF7A6B" strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy="100" r="7" fill="#FFD166" stroke={O} strokeWidth="2.5" />
    </svg>
  );
}
