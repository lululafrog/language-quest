"use client";
// Voice recording kept on the device (MediaRecorder → db.media). Never uploaded.
import { useEffect, useRef, useState } from "react";
import { saveMedia, useMediaUrl } from "@/lib/media";
import { Button, cx } from "@/components/ui";
import { Icon } from "@/components/icons";

export function recorderSupported() {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

export function AudioRecorder({ onSaved, maxSeconds = 300, label = "Enregistrer ma voix" }: { onSaved: (key: string) => void; maxSeconds?: number; label?: string }) {
  const [state, setState] = useState<"idle" | "rec" | "saving">("idle");
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState("");
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    rec.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  if (!recorderSupported()) return <p className="text-sm text-muted">L&apos;enregistrement audio n&apos;est pas disponible dans ce navigateur.</p>;

  const start = async () => {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timer.current) clearInterval(timer.current);
        setState("saving");
        const blob = new Blob(chunks, { type: r.mimeType || "audio/webm" });
        const key = await saveMedia(blob, "audio");
        setState("idle");
        onSaved(key);
      };
      rec.current = r;
      r.start();
      setSecs(0);
      setState("rec");
      timer.current = setInterval(() => {
        setSecs((s) => {
          if (s + 1 >= maxSeconds && r.state === "recording") r.stop();
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      const m = e instanceof Error ? e.name : "";
      setErr(m === "NotAllowedError" ? "Accès au micro refusé. Autorise le micro dans les réglages du navigateur." : "Impossible d'accéder au micro.");
    }
  };

  return (
    <div className="space-y-1.5">
      {state === "rec" ? (
        <Button variant="danger" className="w-full" onClick={() => rec.current?.stop()}>
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" /> Arrêter · {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
        </Button>
      ) : (
        <Button variant="outline" className="w-full" onClick={start} loading={state === "saving"}>
          <Icon name="mic" size={18} /> {label}
        </Button>
      )}
      {err && <p className="text-sm text-coral-600">{err}</p>}
    </div>
  );
}

export function AudioPlayer({ mediaKey, className }: { mediaKey: string; className?: string }) {
  const url = useMediaUrl(mediaKey);
  if (!url) return <div className={cx("h-10 animate-pulse rounded-full bg-surface-2", className)} />;
  return <audio controls src={url} className={cx("h-10 w-full", className)} preload="metadata" />;
}
