"use client";
import { useMediaUrl } from "@/lib/media";
import { cx } from "@/components/ui";

export function MediaThumb({ mediaKey, className }: { mediaKey: string; className?: string }) {
  const url = useMediaUrl(mediaKey);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" className={cx("object-cover", className)} /> : <div className={cx("animate-pulse bg-surface-2", className)} />;
}
