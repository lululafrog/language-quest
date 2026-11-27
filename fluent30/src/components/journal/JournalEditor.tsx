"use client";
// Write (or dictate, or record) today's entry. Everything stays private on the device until the learner asks for an analysis.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MONTHLY_TOPIC, MOODS, PROMPTS, saveEntry } from "@/lib/journal";
import { listenOnce, recognitionErrorFr, recognitionSupported } from "@/lib/speech";
import { compressImage, saveMedia } from "@/lib/media";
import { Button, Panel, SpeakButton, cx, toast } from "@/components/ui";
import { Icon } from "@/components/icons";
import { AudioPlayer, AudioRecorder } from "./Audio";
import { MediaThumb } from "./MediaThumb";

const field =
  "w-full rounded-2xl border border-line bg-surface px-4 py-2.5 text-[15px] outline-none transition focus:border-ink-400 focus:ring-2 focus:ring-ink-200 dark:focus:ring-ink-800";

export function JournalEditor({ monthly = false, onCancel }: { monthly?: boolean; onCancel?: () => void }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<string | undefined>(monthly ? MONTHLY_TOPIC.en : undefined);
  const [text, setText] = useState("");
  const [mood, setMood] = useState<string | undefined>();
  const [place, setPlace] = useState("");
  const [audioKey, setAudioKey] = useState<string | undefined>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);

  const dictate = async () => {
    setErr("");
    setListening(true);
    try {
      const r = await listenOnce("en-US").promise;
      if (r.transcript) setText((t) => (t.trim() ? `${t.trim()} ${r.transcript}` : r.transcript));
    } catch (e) {
      setErr(recognitionErrorFr(e));
    } finally {
      setListening(false);
    }
  };

  const addPhoto = async (f: File) => {
    const key = await saveMedia(await compressImage(f, 1600, 0.82), "photo");
    setPhotos((p) => [...p, key]);
  };

  const canSave = text.trim().length > 0 || !!audioKey;
  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const e = await saveEntry({ text: text.trim(), prompt, mood, place: place.trim() || undefined, audioKey, mediaKeys: photos.length ? photos : undefined, monthly: monthly || undefined });
    toast("Entrée enregistrée");
    router.push(`/practice/journal/${e.id}`);
  };

  return (
    <Panel className="space-y-4">
      <div className="space-y-2">
        {prompt ? (
          <div className="flex items-start gap-1 rounded-2xl bg-ink-50 px-3 py-2.5 dark:bg-ink-900/50">
            <div className="min-w-0 flex-1">
              <p className="text-[15.5px] font-semibold">{prompt}</p>
              <p className="text-[13px] text-muted">{[...PROMPTS, MONTHLY_TOPIC].find((p) => p.en === prompt)?.fr}</p>
            </div>
            <SpeakButton text={prompt} size={16} className="-my-1 shrink-0" />
            {!monthly && (
              <button type="button" onClick={() => setPrompt(undefined)} className="shrink-0 p-1 text-sm text-muted hover:underline">
                Retirer
              </button>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => setShowPrompts((v) => !v)} className="text-sm font-medium text-ink-600 hover:underline dark:text-ink-300">
            {showPrompts ? "Masquer les idées" : "Pas d'idée ? Choisis un sujet"}
          </button>
        )}
        {showPrompts && !prompt && (
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <button
                key={p.en}
                type="button"
                onClick={() => {
                  setPrompt(p.en);
                  setShowPrompts(false);
                }}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-left text-[13.5px] hover:border-ink-300"
                title={p.fr}
              >
                {p.en}
              </button>
            ))}
          </div>
        )}
      </div>

      {monthly && (
        <div className="space-y-2">
          <p className="text-sm text-muted">Bilan oral du mois : réponds au même sujet chaque mois pour entendre tes progrès. L&apos;enregistrement reste sur ton appareil.</p>
          {audioKey ? <AudioPlayer mediaKey={audioKey} /> : <AudioRecorder onSaved={setAudioKey} label="Enregistrer ma réponse orale" />}
        </div>
      )}

      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={monthly ? 4 : 7}
          placeholder={monthly ? "Tu peux aussi écrire ce que tu as dit (facultatif)…" : "Write in English, even simply. Tu peux glisser un mot en français si tu ne le connais pas."}
          className={cx(field, "resize-y leading-relaxed")}
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center gap-2">
          {recognitionSupported() && (
            <Button variant="outline" size="sm" onClick={dictate} disabled={listening}>
              <Icon name="mic" size={16} /> {listening ? "Je t'écoute…" : "Dicter"}
            </Button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface-2">
            <Icon name="image" size={16} /> Photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void addPhoto(f); e.target.value = ""; }} />
          </label>
          <span className="ml-auto text-xs tabular-nums text-muted">{text.trim() ? text.trim().split(/\s+/).length : 0} mots</span>
        </div>
        {err && <p className="text-sm text-coral-600">{err}</p>}
        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {photos.map((k) => <MediaThumb key={k} mediaKey={k} className="h-20 w-20 shrink-0 rounded-xl" />)}
          </div>
        )}
        {!monthly && (audioKey ? <AudioPlayer mediaKey={audioKey} /> : <AudioRecorder onSaved={setAudioKey} label="Ou raconte ta journée à voix haute" />)}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Humeur (facultatif)</p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(mood === m ? undefined : m)}
              className={cx("rounded-full border px-3 py-1 text-[13.5px] transition", mood === m ? "border-ink-600 bg-ink-600 text-white" : "border-line bg-surface hover:border-ink-300")}
            >
              {m}
            </button>
          ))}
        </div>
        <input className={field} value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Lieu (facultatif, uniquement si tu le souhaites)" maxLength={80} />
      </div>

      <div className="flex gap-2">
        {onCancel && <Button variant="secondary" onClick={onCancel}>Annuler</Button>}
        <Button className="flex-1" onClick={save} disabled={!canSave} loading={saving}>
          Enregistrer
        </Button>
      </div>
      <p className="text-[12.5px] text-muted">Ton journal est privé. Rien n&apos;est envoyé tant que tu ne demandes pas une correction.</p>
    </Panel>
  );
}
