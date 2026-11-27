"use client";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { cardFromEnrichment, deleteCard, enrichTerm, ensureImage, setCardImageFromFile } from "@/lib/cards";
import { formatInterval, State } from "@/lib/srs";
import { THEMES, themeEmoji, themeLabel } from "@/lib/data/types";
import { errorMessage } from "@/lib/api";
import { useSettings } from "@/hooks/useSettings";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { Badge, Button, EmptyState, ErrorNote, PageHeader, Panel, SpeakButton, Toggle, toast } from "@/components/ui";
import { WordImage } from "@/components/WordImage";
import type { Card } from "@/lib/types";

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const s = useSettings();
  const status = useStatus();
  const data = useLiveQuery(async () => {
    const db = getDb();
    const card = await db.cards.get(id);
    if (!card) return null;
    const [srs, logs] = await Promise.all([db.srs.where("cardId").equals(id).toArray(), db.reviewLogs.where("cardId").equals(id).toArray()]);
    return { card, srs, logs: logs.sort((a, b) => b.at - a.at) };
  }, [id]);
  const [edit, setEdit] = useState<Card | null>(null);
  const [now] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (data === undefined) return null;
  if (data === null) return <EmptyState icon="🔍" title={t("Carte introuvable", "Card not found")} />;
  const { card, srs, logs } = data;
  const c = edit ?? card;

  const save = async () => {
    if (!edit) return;
    await getDb().cards.put({ ...edit, updatedAt: Date.now() });
    setEdit(null);
    toast(t("Modifications enregistrées", "Saved"));
  };

  const reEnrich = async () => {
    setBusy("enrich");
    setError("");
    try {
      const e = await enrichTerm(card.term, card.example);
      const fresh = cardFromEnrichment(e, card.source);
      setEdit({ ...card, ...fresh, id: card.id, createdAt: card.createdAt, themes: [...new Set([...card.themes, ...fresh.themes])], imageKey: card.imageKey, variants: card.variants });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const regenImage = async () => {
    setBusy("image");
    setError("");
    if (card.imageKey) await getDb().images.delete(card.imageKey);
    await getDb().cards.update(card.id, { imageKey: undefined });
    const r = await ensureImage({ ...card, imageKey: undefined });
    if (!r) setError(t("Impossible de générer l'illustration (service d'images non configuré ou indisponible).", "Could not generate the illustration."));
    setBusy(null);
  };

  const field = (key: keyof Card, label: string, multiline = false) => (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      {multiline ? (
        <textarea value={String(c[key] ?? "")} onChange={(e) => setEdit({ ...c, [key]: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 outline-none focus:border-ink-400" />
      ) : (
        <input value={String(c[key] ?? "")} onChange={(e) => setEdit({ ...c, [key]: e.target.value })} className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 outline-none focus:border-ink-400" />
      )}
    </label>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={card.term} subtitle={`${card.pos ?? card.kind}${card.variants?.length ? ` · ${t("formes regroupées", "grouped forms")} : ${card.variants.join(", ")}` : ""}`} back="/cards" action={<SpeakButton text={card.term} />} />
      <ErrorNote>{error}</ErrorNote>
      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <div className="space-y-2">
          <WordImage term={card.term} card={card} className="aspect-square w-full" allowGenerate={!!status?.images} />
          <div className="flex flex-wrap gap-2">
            {status?.images && <Button size="sm" variant="outline" onClick={regenImage} loading={busy === "image"}>{t("Nouvelle image", "New image")}</Button>}
            <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>{t("Importer", "Upload")}</Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await setCardImageFromFile(card, f); toast(t("Image enregistrée", "Image saved")); } }} />
          </div>
        </div>
        <Panel className="space-y-3">
          {edit ? (
            <>
              {field("term", t("Anglais", "English"))}
              {field("fr", t("Traduction", "Translation"))}
              {field("definition", t("Définition", "Definition"), true)}
              {field("ipa", "IPA (UK)")}
              {field("example", t("Exemple", "Example"), true)}
              {field("exampleFr", t("Traduction de l'exemple", "Example translation"), true)}
              {field("notes", t("Notes", "Notes"), true)}
              <div className="flex gap-2"><Button onClick={save}>{t("Enregistrer", "Save")}</Button><Button variant="ghost" onClick={() => setEdit(null)}>{t("Annuler", "Cancel")}</Button></div>
            </>
          ) : (
            <>
              <p className="text-xl text-ink-700 dark:text-ink-200">{card.fr}</p>
              {(card.ipa || card.ipaUS) && (
                <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
                  {card.ipa && <span>UK <span className="font-mono">{card.ipa}</span><SpeakButton text={card.term} accent="en-GB" size={14} /></span>}
                  {card.ipaUS && <span>US <span className="font-mono">{card.ipaUS}</span><SpeakButton text={card.term} accent="en-US" size={14} /></span>}
                </p>
              )}
              {card.definition && <p>{card.definition}</p>}
              {card.example && (
                <div className="rounded-xl bg-surface-2 p-3"><div className="flex items-start gap-2"><p className="flex-1">{card.example}</p><SpeakButton text={card.example} size={15} /></div>{card.exampleFr && <p className="text-sm text-muted">{card.exampleFr}</p>}</div>
              )}
              {card.synonyms?.length ? <p className="text-sm"><span className="text-muted">{t("Synonymes", "Synonyms")} :</span> {card.synonyms.join(", ")}</p> : null}
              {card.antonyms?.length ? <p className="text-sm"><span className="text-muted">{t("Antonymes", "Antonyms")} :</span> {card.antonyms.join(", ")}</p> : null}
              {card.forms && Object.keys(card.forms).length ? <p className="text-sm"><span className="text-muted">{t("Formes", "Forms")} :</span> {Object.entries(card.forms).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p> : null}
              {card.notes && <p className="text-sm">💡 {card.notes}</p>}
              <p className="text-xs text-muted">
                {card.frequencyRank ? t(`Fréquence : n°${card.frequencyRank}`, `Frequency rank #${card.frequencyRank}`) + " · " : ""}
                {card.difficulty ? t(`Difficulté ${card.difficulty}/5`, `Difficulty ${card.difficulty}/5`) + " · " : ""}
                {card.register ? `${t("Registre", "Register")} : ${card.register}` : ""}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setEdit(card)}>{t("Modifier", "Edit")}</Button>
                {status?.ai && <Button size="sm" variant="outline" onClick={reEnrich} loading={busy === "enrich"}>✨ {t("Compléter avec l'IA", "Complete with AI")}</Button>}
              </div>
            </>
          )}
        </Panel>
      </div>

      <Panel className="mt-4">
        <h2 className="mb-2 font-semibold">{t("Thèmes", "Themes")}</h2>
        <div className="flex flex-wrap gap-1.5">
          {card.themes.map((th) => (
            <button key={th} onClick={() => getDb().cards.update(card.id, { themes: card.themes.filter((x) => x !== th) })}><Badge>{themeEmoji(th)} {themeLabel(th, s.immersion)} ✕</Badge></button>
          ))}
          <select value="" onChange={(e) => e.target.value && getDb().cards.update(card.id, { themes: [...card.themes, e.target.value] })} className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs">
            <option value="">+ {t("thème", "theme")}</option>
            {THEMES.filter((x) => !card.themes.includes(x.id)).map((x) => <option key={x.id} value={x.id}>{x.emoji} {s.immersion ? x.en : x.fr}</option>)}
          </select>
        </div>
      </Panel>

      <Panel className="mt-4">
        <h2 className="mb-3 font-semibold">{t("Mémorisation", "Memory")}</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {(["recognition", "production", "listening"] as const).map((sk) => {
            const st = srs.find((x) => x.skill === sk);
            const label = sk === "recognition" ? t("Reconnaissance", "Recognition") : sk === "production" ? t("Production", "Production") : t("Écoute", "Listening");
            return (
              <div key={sk} className="rounded-xl bg-surface-2 p-3 text-sm">
                <p className="font-medium">{label}</p>
                {st ? (
                  <>
                    <p className="text-muted">{st.state === State.New ? t("Nouvelle", "New") : `${t("Stabilité", "Stability")} ${st.stability.toFixed(1)} ${t("j", "d")}`}</p>
                    <p className="text-muted">{st.due <= now ? t("À réviser maintenant", "Due now") : `${t("Dans", "In")} ${formatInterval(st.due - now)}`}</p>
                    <p className="text-muted">{st.reps} {t("révisions", "reviews")} · {st.lapses} {t("oublis", "lapses")}</p>
                  </>
                ) : <p className="text-muted">—</p>}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">{t(`${logs.length} révisions enregistrées`, `${logs.length} reviews logged`)}{logs[0] ? ` · ${t("dernière", "last")} ${new Date(logs[0].at).toLocaleDateString()}` : ""}</p>
        <Toggle checked={!!card.suspended} onChange={(v) => getDb().cards.update(card.id, { suspended: v })} label={t("Suspendre la carte", "Suspend card")} hint={t("Elle ne sera plus proposée en révision", "It won't be shown in reviews")} />
      </Panel>

      <div className="mt-6 flex justify-end">
        <Button variant="danger" size="sm" onClick={async () => { if (confirm(t("Supprimer définitivement cette carte ?", "Delete this card permanently?"))) { await deleteCard(card.id); router.push("/cards"); } }}>{t("Supprimer", "Delete")}</Button>
      </div>
    </div>
  );
}
