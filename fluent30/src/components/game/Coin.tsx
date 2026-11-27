import { cx } from "@/components/ui";

export function CoinIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#FFD166" stroke="#E0A800" strokeWidth="2" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#F5B83D" strokeWidth="1.5" />
      <path d="M12 8.5v7M10 10.5h3a1.5 1.5 0 010 3h-2" stroke="#B07800" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Coins({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full bg-sun-100 px-2.5 py-1 text-sm font-bold tabular-nums text-amber-800 dark:bg-sun-500/20 dark:text-sun-100", className)}>
      <CoinIcon size={16} />
      {amount}
    </span>
  );
}
