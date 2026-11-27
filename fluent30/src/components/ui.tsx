"use client";
import Link from "next/link";
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { speak } from "@/lib/speech";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
const variants: Record<Variant, string> = {
  primary: "bg-ink-600 text-white hover:bg-ink-700 shadow-sm shadow-ink-600/20",
  secondary: "bg-surface-2 text-fg hover:bg-ink-100 dark:hover:bg-ink-900/60",
  ghost: "text-fg hover:bg-surface-2",
  danger: "bg-coral-600 text-white hover:bg-coral-500",
  success: "bg-mint-600 text-white hover:bg-mint-500",
  outline: "border border-line text-fg hover:bg-surface-2",
};

export function Button({ variant = "primary", size = "md", className, loading, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg"; loading?: boolean }) {
  const sizes = { sm: "h-8 px-3 text-sm rounded-lg", md: "h-11 px-4 text-[15px] rounded-xl", lg: "h-13 px-6 text-base rounded-2xl" };
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cx("inline-flex items-center justify-center gap-2 font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none", variants[variant], sizes[size], className)}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function LinkButton({ href, variant = "primary", size = "md", className, children }: { href: string; variant?: Variant; size?: "sm" | "md" | "lg"; className?: string; children: ReactNode }) {
  const sizes = { sm: "h-8 px-3 text-sm rounded-lg", md: "h-11 px-4 text-[15px] rounded-xl", lg: "h-13 px-6 text-base rounded-2xl" };
  return (
    <Link href={href} className={cx("inline-flex items-center justify-center gap-2 font-medium transition active:scale-[0.98] select-none", variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}

export function Panel({ className, children, as: As = "div", ...rest }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <As {...rest} className={cx("rounded-2xl border border-line bg-surface p-4 sm:p-5", className)}>
      {children}
    </As>
  );
}

export function Badge({ children, tone = "ink", className }: { children: ReactNode; tone?: "ink" | "coral" | "mint" | "sun" | "gray"; className?: string }) {
  const tones = {
    ink: "bg-ink-100 text-ink-800 dark:bg-ink-900/70 dark:text-ink-200",
    coral: "bg-coral-100 text-coral-600 dark:bg-coral-600/20 dark:text-coral-400",
    mint: "bg-mint-100 text-mint-600 dark:bg-mint-600/20 dark:text-mint-400",
    sun: "bg-sun-100 text-amber-700 dark:bg-sun-500/20 dark:text-sun-400",
    gray: "bg-surface-2 text-muted",
  };
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

export function ProgressBar({ value, max = 1, tone = "ink", className }: { value: number; max?: number; tone?: "ink" | "mint" | "coral" | "sun"; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const tones = { ink: "bg-ink-500", mint: "bg-mint-500", coral: "bg-coral-500", sun: "bg-sun-500" };
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("h-full rounded-full transition-all duration-500", tones[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, max = 1, size = 72, stroke = 8, children, tone = "#6a55f2" }: { value: number; max?: number; size?: number; stroke?: number; children?: ReactNode; tone?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={tone} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 0.6s" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cx("inline-block animate-spin rounded-full border-2 border-current border-t-transparent", className ?? "h-5 w-5")} aria-label="Chargement" />;
}

export function PageHeader({ title, subtitle, back, action }: { title: ReactNode; subtitle?: ReactNode; back?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {back && (
        <Link href={back} className="mt-1 -ml-1 rounded-lg p-1.5 text-muted hover:bg-surface-2" aria-label="Retour">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon = "✨", title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <p className="font-medium">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

/** Explains clearly that a feature needs an external service (never pretend it works). */
export function ServiceNotice({ service, envVar, children }: { service: string; envVar: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-sun-400/60 bg-sun-100/60 p-3 text-sm text-amber-900 dark:bg-sun-500/10 dark:text-sun-100">
      <p className="font-medium">🔑 {service} nécessite une clé API</p>
      <p className="mt-1 opacity-90">
        Ajoutez <code className="rounded bg-black/5 px-1 dark:bg-white/10">{envVar}</code> dans les variables d&apos;environnement du serveur (voir README).{" "}
        {children}
      </p>
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <div className="rounded-xl border border-coral-400/50 bg-coral-100/60 p-3 text-sm text-coral-600 dark:bg-coral-600/10 dark:text-coral-400">{children}</div>;
}

export function Segmented<T extends string | number>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div className={cx("inline-flex rounded-xl bg-surface-2 p-1", className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx("rounded-lg px-3 py-1.5 text-sm font-medium transition", value === o.value ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span>
        <span className="block text-[15px]">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={cx("relative h-7 w-12 shrink-0 rounded-full transition", checked ? "bg-ink-600" : "bg-line")}>
        <span className={cx("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all", checked ? "left-5.5" : "left-0.5")} />
      </button>
    </label>
  );
}

export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cx("relative max-h-[88vh] w-full animate-slide-up overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 shadow-2xl sm:rounded-3xl safe-bottom", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" />
        {title && (
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="text-lg font-semibold">{title}</div>
            <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-2" aria-label="Fermer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function SpeakButton({ text, accent, rate, className, label, size = 18 }: { text: string; accent?: string; rate?: number; className?: string; label?: string; size?: number }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setOn(true);
        const u = speak(text, { accent, rate, onEnd: () => setOn(false) });
        if (!u) setOn(false);
      }}
      className={cx("inline-flex items-center gap-1.5 rounded-full p-2 text-ink-600 transition hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-900/60", on && "animate-pulse", className)}
      aria-label={label ?? `Écouter « ${text} »`}
      title={label ?? "Écouter"}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" /></svg>
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}

export function StatTile({ label, value, sub, icon, href }: { label: string; value: ReactNode; sub?: ReactNode; icon?: string; href?: string }) {
  const inner = (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition hover:border-ink-300">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
        {icon && <span className="text-base normal-case">{icon}</span>}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ---- Toasts ----
type ToastItem = { id: number; text: string; tone: "ok" | "err" | "info" };
let listeners: ((t: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];
let tid = 0;
export function toast(text: string, tone: ToastItem["tone"] = "ok") {
  const t = { id: ++tid, text, tone };
  toasts = [...toasts, t];
  listeners.forEach((l) => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    listeners.forEach((l) => l(toasts));
  }, 3200);
}
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((l) => l !== setItems);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
      {items.map((t) => (
        <div key={t.id} className={cx("animate-pop rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg", t.tone === "ok" ? "bg-ink-900" : t.tone === "err" ? "bg-coral-600" : "bg-ink-600")}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
