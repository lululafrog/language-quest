"use client";
// Create a Memory Card: personal photo → (consent) AI vocabulary → pick words → flashcards with the photo.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, errorMessage } from "@/lib/api";
import { analysePhoto, createMemory, type PhotoVocab } from "@/lib/memories";
import { useSettings } from "@/hooks/useSettings";
import { usePersonalAiConsent } from "@/components/privacy/ConsentDialog";
import { Button, ErrorNote, Panel, ServiceNotice, SpeakButton, cx, toast } from "@/components/ui";
import { Icon } from "@/components/icons";

type Word = { en: string; fr: string; pos?: string; why?: string; keep: boolean };

const field =
  "w-full rounded-2xl border border-line bg-surface px-4 py-2.5 text-[15px] outline-none transition focus:border-ink-400 focus:ring-2 focus:ring-ink-200 dark:focus:ring-ink-800";

export function NewMemory({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const s = useSettings();
  const consent = usePersonalAiConsent();
  const [photo, setPhoto] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ msg: string; notConfigured?: boolean } | null>(null);
  const [vocab, setVocab] = useState<PhotoVocab | null>(null);
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [words, setWords] = useState<Word[]>([]);
  const [manual, setManual] = useState(false);
  const [newEn, setNewEn] = useState("");
  const [newFr, setNewFr] = useState("");
  const [customSentence, setCustomSentence] = useState({ en: "", fr: "" });
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const analyse = async () => {
    if (!photo) return;
    setError(null);
    if (!(await consent.ask())) return;
    setBusy(true);
    try {
      const v = await analysePhoto(photo, s.pathLevel ?? "A2", note);
      setVocab(v);
      setTitle((t) => t || v.title);
      setWords(v.words.map((w, i) => ({ ...w, keep: i < 6 })));
      setManual(false);
    } catch (e) {
      setError({ msg: errorMessage(e), notConfigured: e instanceof ApiError && e.notConfigured });
    } finally {
      setBusy(false);
    }
  };

  const addWord = () => {
    if (!newEn.trim()) return;
    setWords((w) => [...w, { en: newEn.trim(), fr: newFr.trim(), keep: true }]);
    setNewEn("");
    setNewFr("");
  };

  const sentences = vocab?.sentences ?? [];
  const chosenSentence = customSentence.en.trim() ? customSentence : sentences[sentenceIdx];
  const kept = words.filter((w) => w.keep && w.en.trim());
  const canSave = !!photo && kept.length > 0 && kept.every((w) => w.fr.trim()) && !saving;

  const save = async () => {
    if (!photo || !canSave) return;
    setSaving(true);
    try {
      const m = await createMemory({ photo, title: title || "Souvenir", place, sentence: chosenSentence, words: kept });
      toast(`Souvenir enregistré · ${kept.length} carte${kept.length > 1 ? "s" : ""}`);
      router.push(`/practice/memories/${m.id}`);
    } catch (e) {
      setError({ msg: errorMessage(e) });
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {consent.dialog}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setPhoto(f);
            setVocab(null);
            setWords([]);
            setError(null);
          }
          e.target.value = "";
        }}
      />

      {!photo ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line bg-surface px-6 py-10 text-center transition hover:border-ink-300"
        >
          <Icon name="camera" size={30} className="text-ink-500" />
          <span className="text-[15px] font-semibold">Choisir une photo</span>
          <span className="text-sm text-muted">Un voyage, un repas, un moment avec des amis… Elle reste sur ton appareil.</span>
        </button>
      ) : (
        <Panel className="space-y-3 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Aperçu" className="max-h-80 w-full rounded-2xl object-cover" />}
          <div className="flex items-center justify-between gap-2 px-1">
            <button type="button" onClick={() => input.current?.click()} className="text-sm font-medium text-ink-600 hover:underline dark:text-ink-300">
              Changer de photo
            </button>
            <button type="button" onClick={onCancel} className="text-sm text-muted hover:underline">
              Annuler
            </button>
          </div>
        </Panel>
      )}

      {photo && !vocab && !manual && (
        <Panel className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Un mot sur ce souvenir ? (facultatif)</span>
            <input className={field} value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex. plongée à Bali avec mon frère" maxLength={300} />
          </label>
          <Button className="w-full" onClick={analyse} loading={busy} disabled={busy}>
            <Icon name="sparkle" size={18} /> Trouver le vocabulaire de ma photo
          </Button>
          <button type="button" onClick={() => setManual(true)} className="w-full text-center text-sm text-muted hover:underline">
            Ajouter mes mots moi-même (sans IA)
          </button>
          <p className="text-[12.5px] text-muted">Une copie réduite de la photo est envoyée à l&apos;IA le temps de l&apos;analyse, uniquement si tu l&apos;acceptes.</p>
        </Panel>
      )}

      {error && (error.notConfigured ? <ServiceNotice service="L'analyse de photo">Tu peux quand même ajouter tes mots toi-même.</ServiceNotice> : <ErrorNote>{error.msg}</ErrorNote>)}

      {photo && (vocab || manual) && (
        <>
          <Panel className="space-y-3">
            {vocab && <p className="text-sm text-muted">{vocab.sceneFr}</p>}
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Titre</span>
              <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Plongée à Bali" maxLength={80} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Lieu (facultatif)</span>
              <input className={field} value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Amed, Bali" maxLength={80} />
            </label>
          </Panel>

          <Panel className="space-y-2">
            <p className="text-sm font-semibold">Ta phrase pour ce souvenir</p>
            {sentences.map((st, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSentenceIdx(i);
                  setCustomSentence({ en: "", fr: "" });
                }}
                className={cx(
                  "flex w-full items-start gap-2 rounded-2xl border px-3 py-2.5 text-left transition",
                  !customSentence.en && sentenceIdx === i ? "border-ink-500 bg-ink-50 dark:bg-ink-900/50" : "border-line hover:border-ink-300",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">{st.en}</span>
                  <span className="block text-[13px] text-muted">{st.fr}</span>
                </span>
                <SpeakButton text={st.en} size={16} className="-my-1 shrink-0" />
              </button>
            ))}
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={field} value={customSentence.en} onChange={(e) => setCustomSentence((c) => ({ ...c, en: e.target.value }))} placeholder="Ou écris ta propre phrase (anglais)" maxLength={200} />
              <input className={field} value={customSentence.fr} onChange={(e) => setCustomSentence((c) => ({ ...c, fr: e.target.value }))} placeholder="Traduction (facultatif)" maxLength={200} />
            </div>
          </Panel>

          <Panel className="space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">Mots à garder</p>
              <span className="text-xs text-muted">{kept.length} sélectionné{kept.length > 1 ? "s" : ""}</span>
            </div>
            {words.map((w, i) => (
              <label key={i} className={cx("flex items-start gap-3 rounded-2xl border px-3 py-2.5 transition", w.keep ? "border-ink-300 bg-ink-50/50 dark:bg-ink-900/30" : "border-line")}>
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-ink-600)]" checked={w.keep} onChange={(e) => setWords((ws) => ws.map((x, j) => (j === i ? { ...x, keep: e.target.checked } : x)))} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1">
                    <span className="text-[15px] font-medium">{w.en}</span>
                    {w.pos && <span className="text-[11px] text-muted">{w.pos}</span>}
                    <SpeakButton text={w.en} size={14} className="-my-1 p-1" />
                  </span>
                  <input
                    className="mt-0.5 w-full bg-transparent text-[13.5px] text-muted outline-none focus:text-fg"
                    value={w.fr}
                    onChange={(e) => setWords((ws) => ws.map((x, j) => (j === i ? { ...x, fr: e.target.value } : x)))}
                    placeholder="traduction"
                    aria-label={`Traduction de ${w.en}`}
                  />
                  {w.why && <span className="block text-[12.5px] text-muted/80">{w.why}</span>}
                </span>
              </label>
            ))}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 pt-1">
              <input className={field} value={newEn} onChange={(e) => setNewEn(e.target.value)} placeholder="anglais" maxLength={60} />
              <input className={field} value={newFr} onChange={(e) => setNewFr(e.target.value)} placeholder="français" maxLength={80} onKeyDown={(e) => e.key === "Enter" && addWord()} />
              <Button variant="secondary" onClick={addWord} aria-label="Ajouter ce mot" disabled={!newEn.trim()}>
                <Icon name="plus" size={18} />
              </Button>
            </div>
          </Panel>

          <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+88px)] z-20 md:bottom-4">
            <Button size="lg" className="w-full shadow-lg" onClick={save} disabled={!canSave} loading={saving}>
              Créer mon souvenir · {kept.length} carte{kept.length > 1 ? "s" : ""}
            </Button>
            {kept.some((w) => !w.fr.trim()) && <p className="mt-1 text-center text-xs text-muted">Ajoute une traduction à chaque mot gardé.</p>}
          </div>
        </>
      )}
    </div>
  );
}
