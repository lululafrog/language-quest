"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { useMediaUrl } from "@/lib/media";
import { cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import type { Memory } from "@/lib/types";

/** The original photo (local), or the generated illustration when `illustration` is set. */
export function MemoryPhoto({ memory, illustration, className }: { memory: Memory; illustration?: boolean; className?: string }) {
  const url = useMediaUrl(illustration ? undefined : memory.photoKey);
  const illus = useLiveQuery(async () => (illustration && memory.illustrationKey ? (await getDb().images.get(memory.illustrationKey)) ?? null : null), [illustration, memory.illustrationKey]);
  const src = illustration ? illus?.data : url;
  if (!src) {
    return (
      <div className={cx("flex items-center justify-center bg-surface-2 text-muted", className)}>
        <Icon name="image" size={28} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={memory.title} className={cx("object-cover", className)} draggable={false} />;
}
