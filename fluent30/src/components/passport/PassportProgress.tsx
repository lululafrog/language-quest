"use client";
// Compact passport card for hubs (home / profile): stamps collected and the next destination.
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { passportState, nextDestination } from "@/lib/passport";
import { DESTINATIONS } from "@/lib/data/destinations";
import { Icon } from "@/components/icons";
import { ProgressBar, cx } from "@/components/ui";
import { Stamp } from "./Stamp";

export function PassportProgress({ className }: { className?: string }) {
  const data = useLiveQuery(() => passportState(), []);
  if (!data) return <div className={cx("h-28 animate-pulse rounded-2xl bg-surface-2", className)} />;
  const got = data.stamps.filter((s) => s.unlockedAt);
  const next = nextDestination(data.stamps);
  const last = [...got].sort((a, b) => (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0)).slice(0, 3);
  return (
    <Link href="/profile/passport" className={cx("block rounded-2xl border border-line bg-surface p-4 card-shadow transition hover:border-ink-300", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon name="passport" size={20} className="text-ink-600" />
          <span className="font-semibold">Mon passeport</span>
        </div>
        <span className="text-sm tabular-nums text-muted">
          {got.length}/{DESTINATIONS.length} tampons
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex shrink-0 -space-x-4">
          {last.length ? last.map((s, i) => <Stamp key={s.dest.id} dest={s.dest} size={48} tilt={(i - 1) * 8} />) : next && <Stamp dest={next.dest} locked size={48} />}
        </div>
        {next ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">
              Prochaine escale : <span className="font-medium">{next.dest.nameFr}</span>
            </p>
            <p className="truncate text-xs text-muted">{next.dest.rule.fr}</p>
            <ProgressBar value={next.value} max={next.target} tone="ink" className="mt-1.5" />
          </div>
        ) : (
          <p className="text-sm text-muted">Tour du monde terminé. Bravo !</p>
        )}
      </div>
    </Link>
  );
}
