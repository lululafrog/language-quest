// Family tree and time-line diagrams for the basic lessons.
import { cx } from "@/components/ui";

const O = "#3A3352";

function Person({ x, y, label, fr, color, onClick, active }: { x: number; y: number; label: string; fr: string; color: string; onClick?: () => void; active?: boolean }) {
  return (
    <g onClick={onClick} className="cursor-pointer">
      <circle cx={x} cy={y} r="17" fill={color} stroke={active ? "#FF7A6B" : O} strokeWidth={active ? 4 : 2.5} />
      <circle cx={x} cy={y - 3} r="7" fill="#FFE3CC" stroke={O} strokeWidth="1.5" />
      <path d={`M${x - 10} ${y + 12} Q${x} ${y + 2} ${x + 10} ${y + 12}`} fill="#FFE3CC" stroke={O} strokeWidth="1.5" />
      <text x={x} y={y + 31} textAnchor="middle" fontSize="10" fontWeight="800" fill={O} fontFamily="system-ui">{label}</text>
      <text x={x} y={y + 42} textAnchor="middle" fontSize="8.5" fill="#6b6a85" fontFamily="system-ui">{fr}</text>
    </g>
  );
}

export const FAMILY_NODES = [
  { id: "grandfather", x: 70, y: 30, en: "grandfather", fr: "grand-père", color: "#B0BEC5" },
  { id: "grandmother", x: 130, y: 30, en: "grandmother", fr: "grand-mère", color: "#F8BBD0" },
  { id: "uncle", x: 30, y: 108, en: "uncle", fr: "oncle", color: "#90CAF9" },
  { id: "father", x: 90, y: 108, en: "father (dad)", fr: "père (papa)", color: "#90CAF9" },
  { id: "mother", x: 150, y: 108, en: "mother (mum)", fr: "mère (maman)", color: "#F8BBD0" },
  { id: "aunt", x: 210, y: 108, en: "aunt", fr: "tante", color: "#F8BBD0" },
  { id: "cousin", x: 30, y: 186, en: "cousin", fr: "cousin(e)", color: "#C5E1A5" },
  { id: "brother", x: 90, y: 186, en: "brother", fr: "frère", color: "#90CAF9" },
  { id: "me", x: 150, y: 186, en: "me", fr: "moi", color: "#FFD166" },
  { id: "sister", x: 210, y: 186, en: "sister", fr: "sœur", color: "#F8BBD0" },
] as const;

export function FamilyTree({ active, onPick }: { active?: string; onPick?: (id: string) => void }) {
  const n = Object.fromEntries(FAMILY_NODES.map((p) => [p.id, p]));
  const line = (a: string, b: string) => <path d={`M${n[a].x} ${n[a].y + 17} L${n[a].x} ${(n[a].y + n[b].y) / 2 + 6} L${n[b].x} ${(n[a].y + n[b].y) / 2 + 6} L${n[b].x} ${n[b].y - 17}`} fill="none" stroke="#CFCCFF" strokeWidth="2.5" />;
  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-sm">
      <line x1="87" y1="30" x2="113" y2="30" stroke="#CFCCFF" strokeWidth="2.5" />
      <line x1="107" y1="108" x2="133" y2="108" stroke="#CFCCFF" strokeWidth="2.5" />
      {line("grandfather", "uncle")}
      {line("grandfather", "father")}
      {line("grandmother", "aunt")}
      {line("father", "brother")}
      {line("mother", "me")}
      {line("mother", "sister")}
      {line("uncle", "cousin")}
      {FAMILY_NODES.map((p) => <Person key={p.id} x={p.x} y={p.y} label={p.en.split(" ")[0]} fr={p.fr} color={p.color} active={active === p.id} onClick={() => onPick?.(p.id)} />)}
    </svg>
  );
}

export const TIMELINE_MARKS = [
  { at: -3, en: "the day before yesterday", fr: "avant-hier" },
  { at: -2, en: "yesterday", fr: "hier" },
  { at: 0, en: "today / now", fr: "aujourd'hui / maintenant" },
  { at: 2, en: "tomorrow", fr: "demain" },
  { at: 3, en: "the day after tomorrow", fr: "après-demain" },
];

/** Horizontal time line: past ← now → future. */
export function TimeLine({ active, onPick }: { active?: number; onPick?: (i: number) => void }) {
  const x = (at: number) => 150 + at * 42;
  return (
    <svg viewBox="0 0 300 110" className="w-full">
      <defs>
        <linearGradient id="tl-g" x1="0" x2="1">
          <stop offset="0" stopColor="#B0BEC5" />
          <stop offset="0.5" stopColor="#6A55F2" />
          <stop offset="1" stopColor="#5FD3B5" />
        </linearGradient>
      </defs>
      <line x1="12" y1="50" x2="288" y2="50" stroke="url(#tl-g)" strokeWidth="6" strokeLinecap="round" />
      <text x="16" y="28" fontSize="10" fill="#6b6a85" fontFamily="system-ui">← passé / past</text>
      <text x="284" y="28" textAnchor="end" fontSize="10" fill="#6b6a85" fontFamily="system-ui">future / futur →</text>
      {TIMELINE_MARKS.map((mk, i) => (
        <g key={mk.en} onClick={() => onPick?.(i)} className="cursor-pointer">
          <circle cx={x(mk.at)} cy="50" r={mk.at === 0 ? 11 : 8} fill={active === i ? "#FF7A6B" : mk.at === 0 ? "#6A55F2" : "#fff"} stroke={O} strokeWidth="2.5" />
          <text x={x(mk.at)} y={i % 2 ? 84 : 80} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={O} fontFamily="system-ui">{mk.en.replace("the day ", "day ")}</text>
          <text x={x(mk.at)} y={i % 2 ? 96 : 92} textAnchor="middle" fontSize="8.5" fill="#6b6a85" fontFamily="system-ui">{mk.fr.split(" / ")[0]}</text>
        </g>
      ))}
    </svg>
  );
}

export function cls(...c: (string | false | undefined)[]) {
  return cx(...c);
}
