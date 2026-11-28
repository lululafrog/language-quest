"use client";
import Link from "next/link";
import { cx } from "@/components/ui";
import type { CollectionProgress } from "@/lib/vocab/space";
import { UniverseArt } from "./UniverseArt";
import { HUE } from "./Plant";

export function CollectionCard({ p, large }: { p: CollectionProgress; large?: boolean }) {
  const h = HUE[p.c.hue] ?? HUE.sage;
  const pct = p.total ? p.consolidated / p.total : 0;
  return (
    <Link href={`/vocab/collections/${p.c.id}`} className="group block overflow-hidden rounded-3xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]">
      <div className="relative" style={{ background: h.soft }}>
        <UniverseArt id={p.c.art} className={cx("block w-full opacity-90 mix-blend-multiply dark:mix-blend-normal", large ? "h-40" : "h-24")} />
        <span className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: h.deep }}>Collection</span>
        {p.done && <span className="absolute right-3 top-3 rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-mint-700">Terminée</span>}
      </div>
      <div className="p-3.5">
        <p className="font-display text-[16px] font-semibold leading-snug">{p.c.title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{p.c.tagline}</p>
        <div className="relative mt-3 h-2 rounded-full bg-surface-2">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct * 100}%`, background: h.main }} />
          {[0.25, 0.5, 0.75].map((m) => (
            <span key={m} className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface" style={{ left: `${m * 100}%`, background: pct >= m ? h.main : "var(--color-line)" }} />
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          <span className="font-semibold text-fg">{p.consolidated}</span> / {p.total} mots appris
        </p>
      </div>
    </Link>
  );
}
