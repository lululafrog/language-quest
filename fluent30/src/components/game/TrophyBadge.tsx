// Trophy medallion (tier colour + engraved icon).
import type { AchievementDef } from "@/lib/achievements";
import { cx } from "@/components/ui";

const TIER: Record<AchievementDef["tier"], [string, string, string]> = {
  bronze: ["#F0B27A", "#B87333", "#7A4A22"],
  silver: ["#F4F6F9", "#AEB6C2", "#6B7480"],
  gold: ["#FFE38A", "#E0B84A", "#9A7410"],
  platinum: ["#E9F7FF", "#9BD4F5", "#5B7CFA"],
};

const ICON: Record<AchievementDef["icon"], string> = {
  book: "M-11 -8 L0 -5 L11 -8 L11 9 L0 12 L-11 9Z M0 -5 L0 12",
  books: "M-12 10 L-12 -8 L-6 -8 L-6 10Z M-4 10 L-4 -11 L2 -11 L2 10Z M5 10 L9 -9 L14 -8 L10 11Z",
  brain: "M-2 -11 Q-12 -11 -12 -2 Q-14 6 -6 10 Q-2 12 0 9 Q2 12 6 10 Q14 6 12 -2 Q12 -11 2 -11 Q0 -12 -2 -11Z M0 -10 L0 9",
  star: "M0 -12 L3.5 -4 L12 -3.5 L5.5 2.5 L7.5 11 L0 6.5 L-7.5 11 L-5.5 2.5 L-12 -3.5 L-3.5 -4Z",
  globe: "M0 -12 A12 12 0 1 0 0.01 -12Z M-12 0 L12 0 M0 -12 Q-7 0 0 12 Q7 0 0 -12",
  compass: "M0 -12 A12 12 0 1 0 0.01 -12Z M4 -4 L-6 6 M-4 -4 L4 4 L-2 2Z M0 -12 L0 -8",
  crown: "M-12 8 L-12 -6 L-5 0 L0 -10 L5 0 L12 -6 L12 8Z",
  flame: "M0 12 Q-10 10 -9 1 Q-8 -6 -2 -12 Q-1 -5 3 -3 Q5 -7 4 -10 Q11 -3 9 4 Q8 11 0 12Z",
  feather: "M10 -12 Q-8 -8 -9 8 L-11 12 M10 -12 Q8 6 -9 8 M-4 2 L4 -4",
  medal: "M-6 -12 L0 -2 L6 -12 M0 -2 A8 8 0 1 0 0.01 -2Z",
  quiz: "M-5 -6 Q-5 -12 0 -12 Q6 -12 6 -6 Q6 -2 0 0 L0 4 M0 9 L0 10",
  shelf: "M-12 10 L12 10 M-10 10 L-10 -4 L-5 -4 L-5 10 M-3 10 L-3 -8 L2 -8 L2 10 M4 10 L8 -6 L12 -5 L9 10",
};

export function TrophyBadge({ a, locked, className }: { a: AchievementDef; locked?: boolean; className?: string }) {
  const [hi, mid, lo] = locked ? ["#E4E2EE", "#C9C6D8", "#9C98B3"] : TIER[a.tier];
  const id = `tb-${a.id}`;
  return (
    <svg viewBox="-40 -40 80 92" className={cx(className, locked && "opacity-60")} aria-label={a.fr}>
      <defs>
        <radialGradient id={id} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={hi} />
          <stop offset="0.6" stopColor={mid} />
          <stop offset="1" stopColor={lo} />
        </radialGradient>
      </defs>
      <path d="M-14 22 L-20 50 L-8 44 L-2 52 L2 26Z" fill={locked ? "#C9C6D8" : "#6A55F2"} />
      <path d="M14 22 L20 50 L8 44 L2 52 L-2 26Z" fill={locked ? "#B5B1C8" : "#FF7A6B"} />
      <circle r="30" fill={`url(#${id})`} stroke={lo} strokeWidth="2.5" />
      <circle r="23" fill="none" stroke={hi} strokeWidth="1.5" opacity="0.8" />
      <path d={ICON[a.icon]} fill="none" stroke={locked ? "#8D89A6" : lo} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {!locked && <path d="M-20 -14 Q-10 -26 4 -26" stroke="#fff" strokeWidth="3" opacity="0.5" fill="none" strokeLinecap="round" />}
    </svg>
  );
}
