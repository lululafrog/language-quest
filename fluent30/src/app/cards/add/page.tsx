"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, todayKey } from "@/lib/db";
import { cardFromEnrichment, cardFromLocal, enrichTerm, ensureImage, findDuplicate, guessKind, lemmaOf, saveCard, type EnrichResponse } from "@/lib/cards";
import { postApi, errorMessage } from "@/lib/api";
import { THEMES, themeEmoji, themeLabel } from "@/lib/data/types";
import { tokenize } from "@/lib/text";
import { useStatus } from "@/hooks/useStatus";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { Badge, Button, ErrorNote, PageHeader, Panel, ProgressBar, Segmented, ServiceNotice, SpeakButton, Spinner, cx, toast } from "@/components/ui";
import type { Card } from "@/lib/types";
import { uid } from "@/lib/db";

interface Draft {
  key: string;
  input: string;
  status: "loading" | "ready" | "error";
  card?: Card;
  enrichment?: EnrichResponse;
  duplicate?: Card;
  error?: string;
}

export default function AddCardPage() {
  const t = useT();
  const s = useSettings();
  const status = useStatus();
  const router = useRouter();
  const today = useLiveQuery(() => getDb().activity.get(todayKey()), []);
  const [mode, setMode] = useState<"text" | "image" | "manual">("text");
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [saving, setSaving] = useState(false);

  const newToday = today?.newWords ?? 0;

  const enrichAll = async (inputs: string[]) => {
    const items = inputs.map((i) => i.trim()).filter(Boolean).slice(0, 30);
    if (!items.length) return;
    const fresh: Draft[] = items.map((input) => ({ key: uid("d"), input, status: "loading" }));
    setDrafts((d) => [...fresh, ...d]);
    setText("");
    await Promise.all(
      fresh.map(async (d) => {
        try {
          const e = await enrichTerm(d.input, context || undefined);
          const card = cardFromEnrichment(e, "user");
          const duplicate = await findDuplicate(card.term);
          update(d.key, { status: "ready", card, enrichment: e, duplicate });
        } catch (err) {
          update(d.key, { status: "error", error: errorMessage(err) });
        }
      }),
    );
  };

  const update = (key: string, patch: Partial<Draft>) => setDrafts((ds) => ds.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const saveAll = async () => {
    setSaving(true);
    let n = 0;
    for (const d of drafts) {
      if (d.status !== "ready" || !d.card) continue;
      const r = await saveCard(d.card);
      if (s.autoImages && status?.images) void ensureImage(r.card, d.enrichment?.imagePrompt);
      n++;
    }
    setSaving(false);
    setDrafts((ds) => ds.filter((d) => d.status !== "ready"));
    toast(t(`${n} carte${n > 1 ? "s" : ""} enregistrée${n > 1 ? "s" : ""}`, `${n} card${n > 1 ? "s" : ""} saved`));
  };

  const readyCount = drafts.filter((d) => d.status === "ready").length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("Ajouter du vocabulaire", "Add vocabulary")} subtitle={t("Mot, verbe, expression, phrase — en anglais ou en français. L'IA complète tout et classe par thème.", "Word, verb, expression or sentence — in English or French. AI completes and sorts it.")} back="/cards" />
      <Panel className="mb-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-muted">{t("Objectif du jour", "Today's goal")}</span>
          <span className="tabular-nums">{newToday}/{s.dailyNewWords}</span>
        </div>
        <ProgressBar value={newToday} max={s.dailyNewWords} tone="sun" />
      </Panel>

      <Segmented
        className="mb-4"
        value={mode}
        onChange={setMode}
        options={[
          { value: "text", label: t("✨ Saisie intelligente", "✨ Smart input") },
          { value: "image", label: t("📸 Capture d'écran", "📸 Screenshot") },
          { value: "manual", label: t("✍️ Manuel", "✍️ Manual") },
        ]}
      />

      {status && !status.ai && mode !== "manual" && (
        <div className="mb-4"><ServiceNotice service={t("L'enrichissement automatique", "Automatic enrichment")} envVar="ANTHROPIC_API_KEY">{t("En attendant, utilisez l'ajout manuel : les mots présents dans le lexique intégré sont complétés automatiquement.", "Meanwhile use manual mode.")}</ServiceNotice></div>
      )}

      {mode === "text" && (
        <Panel>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={t("Un élément par ligne, par ex. :\nget along\nméfiant\nI'm running late\nto be honest", "One item per line")}
            className="w-full resize-y rounded-xl border border-line bg-surface-2 p-3 outline-none focus:border-ink-400"
          />
          <input value={context} onChange={(e) => setContext(e.target.value)} placeholder={t("Contexte (facultatif) : la phrase où vous l'avez vu", "Context (optional): the sentence where you saw it")} className="mt-2 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-ink-400" />
          <Button className="mt-3 w-full sm:w-auto" disabled={!text.trim() || !status?.ai} onClick={() => enrichAll(text.split("\n"))}>{t("Enrichir avec l'IA", "Enrich with AI")}</Button>
        </Panel>
      )}

      {mode === "image" && <ScreenshotImport onPick={(items) => enrichAll(items)} disabled={!status?.ai} />}
      {mode === "manual" && <ManualAdd onSaved={() => router.refresh()} />}

      {drafts.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("Aperçu", "Preview")}</h2>
            <Button onClick={saveAll} loading={saving} disabled={!readyCount}>{t(`Enregistrer (${readyCount})`, `Save (${readyCount})`)}</Button>
          </div>
          {drafts.map((d) => (
            <DraftCard key={d.key} d={d} onChange={(card) => update(d.key, { card })} onRemove={() => setDrafts((ds) => ds.filter((x) => x.key !== d.key))} immersion={s.immersion} />
          ))}
        </div>
      )}
    </div>
  );
}

function DraftCard({ d, onChange, onRemove, immersion }: { d: Draft; onChange: (c: Card) => void; onRemove: () => void; immersion: boolean }) {
  const t = useT();
  const [custom, setCustom] = useState("");
  if (d.status === "loading")
    return (
      <Panel className="flex items-center gap-3"><Spinner /><span className="text-muted">{d.input}</span></Panel>
    );
  if (d.status === "error")
    return (
      <Panel className="flex items-center justify-between gap-3"><div><p className="font-medium">{d.input}</p><p className="text-sm text-coral-600">{d.error}</p></div><Button variant="ghost" size="sm" onClick={onRemove}>✕</Button></Panel>
    );
  const c = d.card!;
  const e = d.enrichment!;
  const toggleTheme = (th: string) => onChange({ ...c, themes: c.themes.includes(th) ? c.themes.filter((x) => x !== th) : [...c.themes, th] });
  return (
    <Panel className="animate-pop">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <input value={c.term} onChange={(ev) => onChange({ ...c, term: ev.target.value, lemma: lemmaOf(ev.target.value) })} className="min-w-0 bg-transparent text-xl font-semibold outline-none" />
            <SpeakButton text={c.term} accent="en-GB" label="UK" size={15} />
            <SpeakButton text={c.term} accent="en-US" label="US" size={15} />
          </div>
          <p className="text-sm text-muted"><span className="font-mono">{e.ipaUK}</span> · <span className="font-mono">{e.ipaUS}</span> · {c.pos} · {e.frequency} · {t("niveau", "level")} {c.difficulty}/5 · {c.register}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} aria-label={t("Retirer", "Remove")}>✕</Button>
      </div>
      {d.duplicate && <p className="mt-2 rounded-lg bg-sun-100 px-3 py-2 text-sm text-amber-800 dark:bg-sun-500/15 dark:text-sun-100">{t(`Doublon : « ${d.duplicate.term} » existe déjà. Il sera regroupé avec cette carte (formes : ${c.term}).`, `Duplicate of “${d.duplicate.term}” — will be merged.`)}</p>}
      <label className="mt-3 block text-xs font-medium text-muted">{t("Traduction", "Translation")}</label>
      <input value={c.fr} onChange={(ev) => onChange({ ...c, fr: ev.target.value })} className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 outline-none focus:border-ink-400" />
      <p className="mt-2 text-sm">{c.definition}</p>
      <div className="mt-2 rounded-xl bg-surface-2 p-3 text-sm">
        <p>{c.example}</p>
        <p className="text-muted">{c.exampleFr}</p>
      </div>
      <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
        {c.synonyms?.length ? <p><span className="text-muted">{t("Synonymes", "Synonyms")} :</span> {c.synonyms.join(", ")}</p> : null}
        {c.antonyms?.length ? <p><span className="text-muted">{t("Antonymes", "Antonyms")} :</span> {c.antonyms.join(", ")}</p> : null}
        {c.forms && Object.keys(c.forms).length ? <p className="sm:col-span-2"><span className="text-muted">{t("Formes", "Forms")} :</span> {Object.entries(c.forms).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p> : null}
      </div>
      {c.notes && <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">💡 {c.notes}</p>}
      <div className="mt-3">
        <p className="mb-1.5 text-xs font-medium text-muted">{t("Thèmes (classement automatique, modifiable)", "Themes (auto, editable)")}</p>
        <div className="flex flex-wrap gap-1.5">
          {c.themes.map((th) => (
            <button key={th} onClick={() => toggleTheme(th)}><Badge>{themeEmoji(th)} {themeLabel(th, immersion)} ✕</Badge></button>
          ))}
          <select value="" onChange={(ev) => ev.target.value && toggleTheme(ev.target.value)} className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs">
            <option value="">+ {t("thème", "theme")}</option>
            {THEMES.filter((x) => !c.themes.includes(x.id)).map((x) => <option key={x.id} value={x.id}>{x.emoji} {immersion ? x.en : x.fr}</option>)}
          </select>
          <form onSubmit={(ev) => { ev.preventDefault(); if (custom.trim()) { toggleTheme(`custom:${custom.trim()}`); setCustom(""); } }}>
            <input value={custom} onChange={(ev) => setCustom(ev.target.value)} placeholder={t("nouveau thème…", "new theme…")} className="w-28 rounded-full border border-line bg-surface px-2 py-0.5 text-xs outline-none" />
          </form>
        </div>
      </div>
    </Panel>
  );
}

function ScreenshotImport({ onPick, disabled }: { onPick: (items: string[]) => void; disabled: boolean }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [extracted, setExtracted] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [phrase, setPhrase] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) return setError(t("Ce fichier n'est pas une image.", "Not an image."));
    setBusy(true);
    try {
      const data = await fileToBase64(file);
      const r = await postApi<{ text: string }>("/api/ai/ocr", { image: { data, mediaType: file.type } });
      setExtracted(r.text);
      setSelected([]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith("image/"));
      if (f && !disabled) void handleFile(f);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  const words = [...new Set(tokenize(extracted).filter((x) => x.word && x.text.length > 1).map((x) => x.text))];

  return (
    <Panel>
      <p className="text-sm text-muted">{t("Importez ou collez une capture d'écran d'une conversation en anglais. Le texte est extrait par l'IA ; l'image n'est pas conservée.", "Import or paste a screenshot. The image is not stored.")}</p>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <Button className="mt-3" variant="outline" disabled={disabled || busy} loading={busy} onClick={() => fileRef.current?.click()}>{t("Choisir une image", "Choose an image")}</Button>
      <ErrorNote>{error}</ErrorNote>
      {extracted && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">{t("Touchez les mots à apprendre :", "Tap words to learn:")}</p>
          <div className="flex flex-wrap gap-1.5">
            {words.map((w) => (
              <button key={w} onClick={() => setSelected((s) => (s.includes(w) ? s.filter((x) => x !== w) : [...s, w]))} className={cx("rounded-lg border px-2 py-1 text-sm", selected.includes(w) ? "border-ink-500 bg-ink-600 text-white" : "border-line bg-surface-2")}>{w}</button>
            ))}
          </div>
          <input value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder={t("…ou copiez une expression entière ici", "…or paste a whole expression here")} className="mt-3 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm outline-none" />
          <details className="mt-3 text-sm text-muted"><summary className="cursor-pointer">{t("Texte extrait", "Extracted text")}</summary><pre className="mt-2 whitespace-pre-wrap font-sans">{extracted}</pre></details>
          <Button className="mt-3" disabled={!selected.length && !phrase.trim()} onClick={() => onPick([...selected, ...(phrase.trim() ? [phrase.trim()] : [])])}>{t(`Enrichir la sélection (${selected.length + (phrase.trim() ? 1 : 0)})`, `Enrich selection`)}</Button>
        </div>
      )}
    </Panel>
  );
}

function ManualAdd({ onSaved }: { onSaved: () => void }) {
  const t = useT();
  const [term, setTerm] = useState("");
  const [fr, setFr] = useState("");
  const [example, setExample] = useState("");
  const [msg, setMsg] = useState("");
  const local = term.trim() ? cardFromLocal(term.trim()) : null;

  const save = async () => {
    const base = cardFromLocal(term.trim(), fr.trim() || undefined) ?? {
      id: uid("c"), term: term.trim(), lemma: lemmaOf(term), kind: guessKind(term), fr: fr.trim(), themes: ["daily"], source: "user" as const, enriched: false, createdAt: Date.now(), updatedAt: Date.now(),
    };
    if (example.trim()) base.example = example.trim();
    const r = await saveCard(base);
    setMsg(r.merged ? t(`Regroupé avec « ${r.duplicateOf?.term} »`, `Merged with “${r.duplicateOf?.term}”`) : t("Carte enregistrée ✓", "Card saved ✓"));
    setTerm("");
    setFr("");
    setExample("");
    onSaved();
  };

  return (
    <Panel>
      <label className="text-xs font-medium text-muted">{t("Anglais", "English")}</label>
      <input value={term} onChange={(e) => setTerm(e.target.value)} className="mb-1 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 outline-none focus:border-ink-400" />
      {local?.enriched && <p className="mb-2 text-xs text-mint-600">{t(`Trouvé dans le lexique intégré : ${local.fr}`, `Found in built-in lexicon: ${local.fr}`)}</p>}
      <label className="text-xs font-medium text-muted">{t("Français", "French")}</label>
      <input value={fr} onChange={(e) => setFr(e.target.value)} placeholder={local?.fr} className="mb-2 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 outline-none focus:border-ink-400" />
      <label className="text-xs font-medium text-muted">{t("Exemple (facultatif)", "Example (optional)")}</label>
      <input value={example} onChange={(e) => setExample(e.target.value)} className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 outline-none focus:border-ink-400" />
      <Button className="mt-3" disabled={!term.trim() || (!fr.trim() && !local?.fr)} onClick={save}>{t("Enregistrer", "Save")}</Button>
      {msg && <p className="mt-2 text-sm text-mint-600">{msg}</p>}
    </Panel>
  );
}


function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).replace(/^data:[^,]+,/, ""));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

