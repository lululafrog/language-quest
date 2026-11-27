"use client";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import { speak } from "@/lib/speech";
import type { ExerciseOutcome } from "@/components/lesson/Exercises";

export type OnDone = (o: ExerciseOutcome) => void;

/** Calls onDone at most once (the player counts the first answer). */
export function useOnce(onDone: OnDone) {
  const sent = useRef(false);
  const cb = useRef(onDone);
  useEffect(() => {
    cb.current = onDone;
  });
  return useCallback((o: ExerciseOutcome) => {
    if (sent.current) return;
    sent.current = true;
    cb.current(o);
  }, []);
}

export function Verdict({ ok, title, children }: { ok: boolean; title?: string; children?: ReactNode }) {
  return (
    <div role="status" className={cx("animate-fade rounded-2xl border p-4 text-[15px] leading-relaxed", ok ? "border-mint-500/30 bg-mint-500/10" : "border-coral-500/30 bg-coral-500/10")}>
      <p className={cx("flex items-center gap-2 font-semibold", ok ? "text-mint-600 dark:text-mint-400" : "text-coral-600 dark:text-coral-400")}>
        <Icon name={ok ? "check" : "eye"} size={18} />
        {title ?? (ok ? "Bien joué" : "Pas tout à fait")}
      </p>
      {children && <div className="mt-1.5 space-y-1.5 text-fg/85">{children}</div>}
    </div>
  );
}

export function Why({ children }: { children: ReactNode }) {
  return (
    <p>
      <span className="font-semibold">Pourquoi ? </span>
      {children}
    </p>
  );
}

export function MechTitle({ title, brief }: { title: string; brief?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">{title}</p>
      {brief && <p className="text-[15.5px] leading-relaxed">{brief}</p>}
    </div>
  );
}

export function AudioButtons({ text, accent }: { text: string; accent?: string }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => speak(text, { accent })} className="grid h-14 w-14 place-items-center rounded-full bg-ink-600 text-white shadow-sm transition hover:bg-ink-700" aria-label="Écouter">
        <Icon name="headphones" size={24} />
      </button>
      <button type="button" onClick={() => speak(text, { accent, rate: 0.7 })} className="text-sm font-medium text-ink-600 underline-offset-2 hover:underline dark:text-ink-300">
        Plus lentement
      </button>
    </div>
  );
}

export const chip = (on: boolean) =>
  cx(
    "rounded-xl border px-3 py-2 text-left text-[15px] font-medium transition",
    on ? "border-ink-500 bg-ink-600 text-white dark:bg-ink-500" : "border-line bg-surface hover:border-ink-300",
  );
