"use client";
// Import panel: choose a source, paste/type text, pick a screenshot/photo or record a voice message.
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CAPTURE_KINDS, createCapture, takeSharedFile } from "@/lib/reallife";
import { compressImage } from "@/lib/media";
import { postForm, errorMessage } from "@/lib/api";
import { useStatus } from "@/hooks/useStatus";
import { usePersonalAiConsent } from "@/components/privacy/ConsentDialog";
import { Button, ErrorNote, FilterChips, Panel, ServiceNotice, cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import type { CaptureKind } from "@/lib/types";

const PLACEHOLDER: Record<CaptureKind, string> = {
  text: "Colle un message ou une conversation… ex. « I'm up for it, but let's play it by ear. »",
  screenshot: "Note facultative : ce que tu veux comprendre ou répondre",
  photo: "Note facultative : ce que tu veux savoir sur ce menu, ce panneau…",
  voice: "La transcription apparaîtra ici (tu peux la corriger)",
  french: "Ex. « J'aurais voulu lui dire que j'étais partant mais pas ce soir. »",
  film: "Ex. « You can't handle the truth! » — et le contexte si tu t'en souviens",
  book: "Colle le passage qui t'intéresse",
};

export function ImportPanel() {
  const router = useRouter();
  const params = useSearchParams();
  const status = useStatus();
  const { ask, dialog } = usePersonalAiConsent();
  const [kind, setKind] = useState<CaptureKind>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // voice
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [transcribing, setTranscribing] = useState(false);

  // Content shared from another app (PWA share target)
  useEffect(() => {
    const t = params.get("text");
    if (t) {
      setKind("text");
      setText(t);
    }
    if (params.get("shareFailed")) setNotice("L'image partagée n'a pas pu être reçue. Ouvre l'app une fois puis réessaie, ou importe-la ici.");
    if (params.get("shared") || params.get("sharedFile")) {
      void takeSharedFile().then(({ file: f, text: tx }) => {
        if (f) {
          setKind("screenshot");
          setFile(f);
          setPreview(URL.createObjectURL(f));
        }
        if (tx) {
          if (!f) setKind("text");
          setText(tx);
        }
      });
    }
  }, [params]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const pickImage = async (f: File | undefined) => {
    if (!f) return;
    setErr("");
    const small = await compressImage(f);
    setFile(small);
    setPreview(URL.createObjectURL(small));
  };

  const switchKind = (k: CaptureKind) => {
    setKind(k);
    setErr("");
    if (k !== "screenshot" && k !== "photo" && k !== "voice") {
      setFile(null);
      setPreview(null);
    }
  };

  const transcribe = async (blob: Blob) => {
    setTranscribing(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("audio", blob, "voice.webm");
      const r = await postForm<{ text: string }>("/api/transcribe", fd);
      setText(r.text);
      if (!r.text) setErr("Aucune parole reconnue. Tu peux taper le message à la main.");
    } catch (e) {
      setErr(`${errorMessage(e)} Tu peux taper le message à la main.`);
    } finally {
      setTranscribing(false);
    }
  };

  const startRec = async () => {
    setErr("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setErr("L'enregistrement n'est pas disponible dans ce navigateur. Importe un fichier audio ou tape le message.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
        setFile(blob);
        setRec(null);
        void (async () => {
          if (await ask()) void transcribe(blob);
        })();
      };
      r.start();
      setRec(r);
    } catch {
      setErr("Accès au micro refusé. Autorise le micro dans les réglages du navigateur.");
    }
  };

  const isImage = kind === "screenshot" || kind === "photo";
  const canSubmit = !busy && !transcribing && (isImage ? !!file : !!text.trim());

  const submit = async () => {
    setErr("");
    if (!(await ask())) return;
    setBusy(true);
    try {
      const id = await createCapture({ kind, text, media: isImage || kind === "voice" ? file ?? undefined : undefined });
      router.push(`/practice/real-life/${id}`);
    } catch (e) {
      setErr(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Panel className="space-y-4">
      {dialog}
      <FilterChips value={kind} onChange={switchKind} options={CAPTURE_KINDS.map((k) => ({ value: k.id, label: k.label }))} />
      <p className="text-sm text-muted">{CAPTURE_KINDS.find((k) => k.id === kind)?.hint}</p>

      {status && !status.ai && <ServiceNotice service="L'analyse par l'IA" envVar="ANTHROPIC_API_KEY" />}
      {notice && <ErrorNote>{notice}</ErrorNote>}

      {isImage && (
        <div>
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => void pickImage(e.target.files?.[0])} />
          {preview ? (
            <div className="relative overflow-hidden rounded-2xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
              <img src={preview} alt="Image à analyser" className="max-h-72 w-full object-contain bg-surface-2" />
              <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5 text-white" aria-label="Retirer l'image">
                <Icon name="trash" size={16} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInput.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-200 px-4 py-8 text-sm font-medium text-fg/70 transition hover:border-ink-400 dark:border-ink-800">
              <Icon name="image" size={28} className="text-ink-500" />
              {kind === "photo" ? "Prendre ou choisir une photo" : "Choisir une capture d'écran"}
            </button>
          )}
        </div>
      )}

      {kind === "voice" && (
        <div className="flex flex-wrap items-center gap-2">
          {rec ? (
            <Button variant="secondary" onClick={() => rec.stop()}>
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-coral-500" /> Arrêter
            </Button>
          ) : (
            <Button variant="secondary" onClick={startRec} disabled={transcribing}>
              <Icon name="mic" size={18} /> Enregistrer
            </Button>
          )}
          <label className={cx("inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-line px-4 py-2.5 text-sm font-medium", transcribing && "pointer-events-none opacity-50")}>
            <Icon name="inbox" size={17} /> Fichier audio
            <input type="file" accept="audio/*" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFile(f);
              if (await ask()) void transcribe(f);
            }} />
          </label>
          {transcribing && <span className="text-sm text-muted">Transcription…</span>}
          {status && !status.transcription && <p className="w-full text-xs text-muted">La transcription audio nécessite <code>OPENAI_API_KEY</code> sur le serveur. Sans elle, tape le message ci-dessous.</p>}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={isImage ? 2 : 4}
        maxLength={8000}
        placeholder={PLACEHOLDER[kind]}
        lang={kind === "french" ? "fr" : "en"}
        className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-[16px] outline-none transition focus:border-ink-400 focus:ring-2 focus:ring-ink-200 dark:focus:ring-ink-800"
      />

      {err && <ErrorNote>{err}</ErrorNote>}
      <Button size="lg" className="w-full" onClick={submit} disabled={!canSubmit} loading={busy}>
        <Icon name="sparkle" size={18} /> Analyser et créer ma leçon
      </Button>
      <p className="text-center text-xs text-muted">Privé par défaut : tes imports restent sur ton appareil et sont supprimables à tout moment.</p>
    </Panel>
  );
}
