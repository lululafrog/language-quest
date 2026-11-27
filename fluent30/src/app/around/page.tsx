"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, todayKey, uid } from "@/lib/db";
import { nameThing, type Named } from "@/lib/around";
import { enrichTerm, cardFromEnrichment, ensureImage, findDuplicate, guessKind, lemmaOf, saveCard } from "@/lib/cards";
import { guessThemes } from "@/lib/autotheme";
import { postApi, errorMessage } from "@/lib/api";
import { trackActivity } from "@/lib/track";
import { speak } from "@/lib/speech";
import { themeEmoji, themeLabel } from "@/lib/data/types";
import { useSettings } from "@/hooks/useSettings";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { Badge, Button, ErrorNote, PageHeader, Panel, ProgressBar, SpeakButton, cx, toast } from "@/components/ui";
import type { Card } from "@/lib/types";

const GOAL = 5;

export default function AroundPage() {
  const t = useT();
  const s = useSettings();
  const status = useStatus();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<(Named & { card: Card; duplicate?: Card }) | null>(null);
  const [objects, setObjects] = useState<{ en: string; fr: string; pos: string; example: string }[] | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = useLiveQuery(async () => {
    const db = getDb();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const cards = await db.cards.where("createdAt").aboveOrEqual(start.getTime()).toArray();
    return { cards: cards.filter((c) => c.source === "around").sort((a, b) => b.createdAt - a.createdAt), activity: await db.activity.get(todayKey()) };
  }, []);
  const count = today?.activity?.around ?? 0;

  const buildCard = (n: Named): Card => {
    const now = Date.now();
    return {
      id: uid("c"), term: n.en, lemma: lemmaOf(n.en), kind: guessKind(n.en, n.pos), fr: n.fr, pos: n.pos, example: n.example, exampleFr: n.exampleFr,
      themes: guessThemes(n.en, n.pos), source: "around", enriched: n.source !== "traduction", createdAt: now, updatedAt: now,
    };
  };

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      let named: Named | null = null;
      let card: Card | null = null;
      if (status?.ai) {
        try {
          const en = await enrichTerm(input.trim());
          card = { ...cardFromEnrichment(en, "user"), source: "around" };
          named = { en: card.term, fr: card.fr, pos: card.pos, example: card.example, exampleFr: card.exampleFr, source: "ia" };
        } catch {
          /* fall back to the free path below */
        }
      }
      if (!named) named = await nameThing(input);
      if (!named) throw new Error(t("Je n'ai pas trouvé ce mot.", "Word not found."));
      card = card ?? buildCard(named);
      const duplicate = await findDuplicate(card.term);
      setResult({ ...named, card, duplicate });
      speak(named.en);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const add = async (card: Card) => {
    const r = await saveCard(card);
    await trackActivity({ around: 1, xp: 3 });
    if (s.autoImages && status?.images && !r.merged) void ensureImage(r.card);
    setAdded((a) => [...a, card.lemma]);
    toast(r.merged ? t("Déjà dans tes mots — remis en révision", "Already in your words") : t(`« ${card.term} » ajouté ✓`, `“${card.term}” added ✓`));
  };

  const addCurrent = async () => {
    if (!result) return;
    await add(result.card);
    setResult(null);
    setInput("");
    inputRef.current?.focus();
  };

  const onPhoto = async (file: File) => {
    setBusy(true);
    setError("");
    setObjects(null);
    try {
      const data = await downscale(file);
      const r = await postApi<{ objects: { en: string; fr: string; pos: string; example: string }[] }>("/api/ai/identify", { image: { data, mediaType: "image/jpeg" } });
      setObjects(r.objects);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title={t("Autour de moi", "Around me")} subtitle={t("Mets un mot anglais sur tout ce que tu vois. Tape-le en français ou en anglais.", "Name everything you see in English.")} back="/" />

      <Panel className="bg-gradient-to-br from-mint-400 to-mint-600 !text-white">
        <div className="flex items-center justify-between text-sm font-medium"><span>👀 {t("Défi du jour : nomme 5 choses", "Today: name 5 things")}</span><span className="tabular-nums">{Math.min(count, GOAL)}/{GOAL}</span></div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.min(100, (count / GOAL) * 100)}%` }} /></div>
        <p className="mt-2 text-sm text-white/85">{count >= GOAL ? t("Défi réussi ! Va récupérer tes pièces dans les quêtes du jour 🎉", "Done! Claim your coins in daily quests 🎉") : t("Regarde autour de toi : la tasse, la fenêtre, le chargeur…", "Look around: the mug, the window, the charger…")}</p>
      </Panel>

      <Panel>
        <form onSubmit={search} className="flex gap-2">
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Ex. : bouilloire, rideau, tasse…", "E.g. kettle, curtain, mug…")} autoCapitalize="off" className="h-12 flex-1 rounded-xl border border-line bg-surface-2 px-4 text-lg outline-none focus:border-ink-400" />
          <Button type="submit" size="lg" loading={busy} disabled={!input.trim()} className="h-12">{t("Traduire", "Go")}</Button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={busy || !status?.ai}>📸 {t("Prendre une photo", "Take a photo")}</Button>
          {!status?.ai && <span className="text-xs text-muted">{t("La photo nécessite la clé IA ; la saisie fonctionne sans.", "Photo needs the AI key; typing works without it.")}</span>}
        </div>
        <ErrorNote>{error}</ErrorNote>

        {result && (
          <div className="mt-4 animate-pop rounded-2xl border border-line bg-surface-2 p-4">
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{result.card.term}</p>
              <SpeakButton text={result.card.term} />
            </div>
            <p className="mt-1 text-lg text-ink-700 dark:text-ink-200">{result.card.fr}</p>
            {result.card.example && <p className="mt-2 text-sm italic text-muted">“{result.card.example}”</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.card.themes.map((th) => <Badge key={th} tone="gray">{themeEmoji(th)} {themeLabel(th, s.immersion)}</Badge>)}
              <Badge tone={result.source === "traduction" ? "sun" : "mint"}>{result.source === "ia" ? "IA" : result.source === "lexique" ? t("lexique vérifié", "verified lexicon") : t("traduction automatique", "machine translation")}</Badge>
            </div>
            {result.duplicate && <p className="mt-2 text-sm text-amber-700">{t("Déjà dans tes mots : il sera remis en révision.", "Already in your words.")}</p>}
            <p className="mt-3 rounded-xl bg-surface p-2.5 text-sm">💡 {t("Dis-le à voix haute en le montrant :", "Say it out loud:")} <b>“This is a {result.card.term}.”</b> <button className="ml-1 text-ink-600 underline" onClick={() => speak(`This is a ${result.card.term}.`)}>{t("écouter", "listen")}</button></p>
            <div className="mt-3 flex gap-2">
              <Button onClick={addCurrent} className="flex-1">+ {t("Ajouter à mes mots", "Add to my words")}</Button>
              <Button variant="ghost" onClick={() => setResult(null)}>{t("Annuler", "Cancel")}</Button>
            </div>
          </div>
        )}

        {objects && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">{t("Ce que je vois sur ta photo :", "What I can see:")}</p>
            {objects.map((o) => {
              const done = added.includes(lemmaOf(o.en));
              return (
                <div key={o.en} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                  <button onClick={() => speak(o.en)} className="min-w-0 flex-1 text-left">
                    <span className="block font-semibold">{o.en} 🔊</span>
                    <span className="block text-sm text-muted">{o.fr}</span>
                  </button>
                  <Button size="sm" variant={done ? "ghost" : "primary"} disabled={done} onClick={() => add(buildCard({ en: o.en, fr: o.fr, pos: o.pos, example: o.example, source: "ia" }))}>{done ? "✓" : "+"}</Button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel>
        <h2 className="mb-2 font-semibold">{t("Nommés aujourd'hui", "Named today")}</h2>
        {today?.cards.length ? (
          <div className="flex flex-wrap gap-2">
            {today.cards.map((c) => (
              <button key={c.id} onClick={() => speak(c.term)} className={cx("rounded-xl border border-line bg-surface-2 px-3 py-1.5 text-sm")}>
                <b>{c.term}</b> <span className="text-muted">· {c.fr}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{t("Rien pour l'instant. Commence par l'objet le plus proche de toi !", "Nothing yet. Start with the closest object!")}</p>
        )}
        <ProgressBar value={Math.min(count, GOAL)} max={GOAL} tone="mint" className="mt-3" />
        <p className="mt-3 text-xs text-muted">{t("Ces mots rejoignent tes révisions et sont rangés automatiquement par thème.", "These words join your reviews, sorted by theme.")} <Link href="/cards" className="underline">{t("Voir mes mots", "See my words")}</Link></p>
      </Panel>

      <Panel>
        <h2 className="mb-2 font-semibold">{t("Pourquoi ça marche", "Why it works")}</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted">
          <li>{t("Tu associes le mot à un objet réel que tu revois chaque jour : la mémoire visuelle fait le reste.", "You link the word to a real object you see every day.")}</li>
          <li>{t("Ce sont des mots dont tu as vraiment besoin, pas ceux d'un manuel.", "These are words you actually need.")}</li>
          <li>{t("Astuce : colle des post-it en anglais sur les objets de ta maison !", "Tip: put English sticky notes on things at home!")}</li>
        </ul>
      </Panel>
    </div>
  );
}

/** Downscales a photo before sending it (faster, cheaper) — returns base64 JPEG without prefix. */
async function downscale(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82).replace(/^data:[^,]+,/, "");
}
