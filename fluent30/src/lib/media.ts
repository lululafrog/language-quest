"use client";
// Local-only media store (photos, voice notes). Blobs never leave the device unless the learner
// explicitly sends one to an AI analysis (with consent). Not synced to the cloud.
import { useEffect, useState } from "react";
import { getDb, uid } from "./db";

/** Downscale + JPEG-compress an image file (default max 1600 px, ~0.82 quality). */
export async function compressImage(file: Blob, maxSide = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
  return out && out.size < file.size ? out : file;
}

export async function saveMedia(blob: Blob, prefix = "m"): Promise<string> {
  const key = uid(prefix);
  await getDb().media.put({ key, blob, mime: blob.type || "application/octet-stream", size: blob.size, createdAt: Date.now() });
  return key;
}

export async function getMedia(key: string): Promise<Blob | undefined> {
  return (await getDb().media.get(key))?.blob;
}

export async function deleteMedia(...keys: (string | undefined)[]) {
  const k = keys.filter((x): x is string => !!x);
  if (k.length) await getDb().media.bulkDelete(k);
}

/** base64 (no data: prefix) for sending an image to an AI route. */
export async function blobToBase64(blob: Blob): Promise<{ data: string; mediaType: string }> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { data: btoa(bin), mediaType: blob.type || "image/jpeg" };
}

/** Object URL for a stored media key (revoked automatically). */
export function useMediaUrl(key?: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!key) return;
    let u: string | null = null;
    let alive = true;
    void getMedia(key).then((b) => {
      if (!alive || !b) return;
      u = URL.createObjectURL(b);
      setUrl(u);
    });
    return () => {
      alive = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [key]);
  return key ? url : null;
}
