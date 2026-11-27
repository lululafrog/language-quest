"use client";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { ApiError, errorMessage, getApi, postApi } from "@/lib/api";
import { lookupLocal } from "@/lib/lexicon";
import { findDuplicate, imageKeyFor, lemmaOf, quickAdd } from "@/lib/cards";
import { normalize } from "@/lib/text";
import { speak } from "@/lib/speech";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { Badge, Button, ErrorNote, ServiceNotice, Sheet, SpeakButton, Spinner, toast } from "@/components/ui";

export interface DictResult {
  word: string;
  ipa: string | null;
  audioUK: string | null;
  audioUS: string | null;
  meanings: { pos: string; definitions: { definition: string; example: string | null }[]; synonyms: string[]; antonyms: string[] }[];
}

interface Lookup {
  word: string;
  lemma: string;
  isInflected: boolean;
  inflectionNote: string;
  contextualFr: string;
  definition: string;
  ipa: string;
  pos: string;
  example: string;
  exampleFr: string;
  otherSenses: { fr: string; definition: string }[];
  isPartOfExpression: string;
  expressionFr: string;
  imageWorthy: boolean;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const POS_FR: Record<string, string> = {
  noun: "nom", verb: "verbe", adj: "adjectif", adjective: "adjectif", adv: "adverbe", adverb: "adverbe", pron: "pronom", pronoun: "pronom",
  prep: "préposition", preposition: "préposition", conj: "conjonction", conjunction: "conjonction", det: "déterminant", interj: "interjection",
  num: "nombre", modal: "modal", expr: "expression",
};

export function WordPopup({ word, sentence, onClose }: { word: string; sentence: string; onClose: () => void }) {
  const t = useT();
  const status = useStatus();
  const local = lookupLocal(word);
  const baseLemma = local?.lemma ?? lemmaOf(word);
  const [dict, setDict] = useState<DictResult | null>(null);
  const [dictState, setDictState] = useState<"loading" | "ok" | "none">("loading");
  const [ai, setAi] = useState<Lookup | null>(null);
  const [aiError, setAiError] = useState<ApiError | Error | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const [img, setImg] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);

  const lemma = ai?.lemma?.toLowerCase() || baseLemma;
  const existing = useLiveQuery(() => findDuplicate(lemma), [lemma]);
  const existingImg = useLiveQuery(async () => (existing?.imageKey ? (await getDb().images.get(existing.imageKey))?.data ?? null : null), [existing?.imageKey]);

  // Free dictionary (phonetics, audio, definitions, synonyms)
  useEffect(() => {
    let alive = true;
    getApi<DictResult>(`/api/dictionary?word=${encodeURIComponent(baseLemma)}`, { cacheKey: `dict:${baseLemma}` })
      .then((d) => alive && (setDict(d), setDictState("ok")))
      .catch(() => alive && setDictState("none"));
    return () => {
      alive = false;
    };
  }, [baseLemma]);

  // AI contextual translation
  useEffect(() => {
    if (status && !status.ai) return;
    if (!status) return;
    let alive = true;
    postApi<Lookup>("/api/ai/lookup", { word, sentence }, { cacheKey: `lookup:${normalize(word)}:${hash(normalize(sentence))}` })
      .then((r) => alive && setAi(r))
      .catch((e) => alive && setAiError(e));
    return () => {
      alive = false;
    };
  }, [word, sentence, status]);

  const aiLoading = !!status?.ai && !ai && !aiError;
  const fr = ai?.contextualFr || local?.fr || "";
  const ipa = ai?.ipa || dict?.ipa || local?.ipa;
  const pos = ai?.pos || local?.pos || dict?.meanings[0]?.pos;
  const isInflected = ai ? ai.isInflected : !!local?.isInflected;

  async function add(term: string, frText: string) {
    setAdding(term);
    try {
      const r = await quickAdd(term, { context: sentence, source: "reader", fr: frText || undefined, example: sentence });
      setAdded((a) => [...a, term]);
      toast(r.merged ? t("Déjà dans vos flashcards — mis à jour", "Already in your flashcards — updated") : t("Ajouté aux flashcards ✓", "Added to flashcards ✓"));
    } catch (e) {
      toast(errorMessage(e), "err");
    } finally {
      setAdding(null);
    }
  }

  async function illustrate() {
    setImgLoading(true);
    try {
      const key = imageKeyFor({ lemma, fr: fr || lemma });
      const cached = await getDb().images.get(key);
      if (cached) return setImg(cached.data);
      const r = await postApi<{ data: string; mime: string; provider: "openai" | "claude-svg" }>("/api/image", { key, term: lemma, meaning: fr, kind: pos?.includes("verb") ? "verb" : "word", prompt: ai?.definition ?? "" });
      await getDb().images.put({ key, data: r.data, mime: r.mime, provider: r.provider, createdAt: Date.now(), updatedAt: Date.now() });
      setImg(r.data);
    } catch (e) {
      toast(errorMessage(e), "err");
    } finally {
      setImgLoading(false);
    }
  }

  const picture = existingImg || img;
  const canIllustrate = !picture && status?.images && (ai?.imageWorthy ?? (pos === "noun" || pos === "verb"));

  return (
    <Sheet open onClose={onClose} title={<span className="flex items-baseline gap-2"><span className="text-2xl">{word}</span>{ipa && <span className="text-base font-normal text-muted">{ipa}</span>}</span>}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SpeakButton text={word} label={t("Écouter", "Listen")} />
          {dict?.audioUK && <button className="rounded-full bg-surface-2 px-3 py-1.5 text-sm" onClick={() => new Audio(dict.audioUK!).play().catch(() => speak(word, { accent: "en-GB" }))}>🇬🇧 UK</button>}
          {dict?.audioUS && <button className="rounded-full bg-surface-2 px-3 py-1.5 text-sm" onClick={() => new Audio(dict.audioUS!).play().catch(() => speak(word, { accent: "en-US" }))}>🇺🇸 US</button>}
          {pos && <Badge tone="gray">{t(POS_FR[pos] ?? pos, pos)}</Badge>}
          {local?.rank && <Badge tone="mint">{t(`Top ${local.rank <= 100 ? 100 : local.rank <= 500 ? 500 : local.rank <= 1000 ? "1 000" : local.rank <= 2000 ? "2 000" : "3 000"}`, `Top ${local.rank <= 100 ? 100 : local.rank <= 500 ? 500 : local.rank <= 1000 ? "1,000" : local.rank <= 2000 ? "2,000" : "3,000"}`)}</Badge>}
        </div>

        {isInflected && (
          <p className="rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-800 dark:bg-ink-900/50 dark:text-ink-100">
            {ai?.inflectionNote || t(`Forme de « ${baseLemma} »`, `Form of “${baseLemma}”`)} — {t("forme de base", "base form")} : <strong>{lemma}</strong>
          </p>
        )}

        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{ai ? t("Traduction dans ce contexte", "Translation in context") : t("Traduction", "Translation")}</p>
            <p className="mt-0.5 text-xl font-semibold">{fr || (aiLoading ? "…" : t("Pas dans le dictionnaire hors ligne", "Not in the offline dictionary"))}</p>
            {ai?.definition && <p className="mt-1 text-sm text-muted">{ai.definition}</p>}
            {!ai?.definition && dict?.meanings[0]?.definitions[0] && <p className="mt-1 text-sm text-muted">{dict.meanings[0].definitions[0].definition}</p>}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
          {picture && <img src={picture} alt="" className="h-24 w-24 shrink-0 rounded-xl border border-line object-cover" />}
        </div>

        {aiLoading && <p className="flex items-center gap-2 text-sm text-muted"><Spinner className="h-4 w-4" /> {t("Analyse du contexte…", "Analysing context…")}</p>}
        {status && !status.ai && <ServiceNotice service={t("La traduction contextuelle", "Contextual translation")} envVar="ANTHROPIC_API_KEY">{t("La traduction ci-dessus vient du dictionnaire intégré.", "The translation above comes from the built-in dictionary.")}</ServiceNotice>}
        {aiError && !(aiError instanceof ApiError && aiError.notConfigured) && <ErrorNote>{errorMessage(aiError)}</ErrorNote>}
        {aiError instanceof ApiError && aiError.notConfigured && <ServiceNotice service={t("La traduction contextuelle", "Contextual translation")} envVar="ANTHROPIC_API_KEY" />}

        {ai?.isPartOfExpression && (
          <div className="rounded-xl border border-coral-400/40 bg-coral-100/40 p-3 dark:bg-coral-600/10">
            <p className="text-xs font-medium uppercase tracking-wide text-coral-600 dark:text-coral-400">{t("Fait partie de l'expression", "Part of the expression")}</p>
            <p className="mt-0.5 font-semibold">{ai.isPartOfExpression} <span className="font-normal text-muted">— {ai.expressionFr}</span></p>
            <Button size="sm" variant="outline" className="mt-2" loading={adding === ai.isPartOfExpression} disabled={added.includes(ai.isPartOfExpression)} onClick={() => add(ai.isPartOfExpression, ai.expressionFr)}>
              {added.includes(ai.isPartOfExpression) ? t("Ajoutée ✓", "Added ✓") : t("Ajouter l'expression", "Add the expression")}
            </Button>
          </div>
        )}

        {(ai?.example || local?.example) && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("Exemple", "Example")}</p>
            <p className="mt-0.5 flex items-start gap-1 italic">
              <span className="flex-1">{ai?.example || local?.example}</span>
              <SpeakButton text={(ai?.example || local?.example)!} size={16} className="-mt-1" />
            </p>
            {(ai?.exampleFr || local?.exampleFr) && <p className="text-sm text-muted">{ai?.exampleFr || local?.exampleFr}</p>}
          </div>
        )}

        {local?.forms && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("Formes", "Forms")}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {Object.entries(local.forms).map(([k, v]) => <span key={k} className="rounded-lg bg-surface-2 px-2 py-1 text-sm"><span className="text-muted">{k} :</span> {v}</span>)}
            </div>
          </div>
        )}

        {(ai?.otherSenses?.length || local?.meanings?.length || (dict && dict.meanings.length > 1)) ? (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-ink-600 dark:text-ink-300">{t("Autres sens possibles", "Other meanings")}</summary>
            <ul className="mt-2 space-y-1.5 text-sm">
              {ai?.otherSenses.map((s, i) => <li key={`a${i}`}><strong>{s.fr}</strong> — <span className="text-muted">{s.definition}</span></li>)}
              {!ai && local?.meanings?.map((m, i) => <li key={`l${i}`}><strong>{m.fr}</strong> — <span className="text-muted">{m.en}</span></li>)}
              {dict?.meanings.slice(0, 4).map((m, i) => (
                <li key={`d${i}`}><Badge tone="gray">{m.pos}</Badge> <span className="text-muted">{m.definitions[0]?.definition}</span></li>
              ))}
            </ul>
          </details>
        ) : null}

        {dict && dict.meanings.some((m) => m.synonyms.length || m.antonyms.length) && (
          <div className="text-sm">
            {dict.meanings.flatMap((m) => m.synonyms).length > 0 && <p><span className="text-muted">{t("Synonymes", "Synonyms")} :</span> {[...new Set(dict.meanings.flatMap((m) => m.synonyms))].slice(0, 6).join(", ")}</p>}
            {dict.meanings.flatMap((m) => m.antonyms).length > 0 && <p><span className="text-muted">{t("Contraires", "Antonyms")} :</span> {[...new Set(dict.meanings.flatMap((m) => m.antonyms))].slice(0, 4).join(", ")}</p>}
          </div>
        )}
        {dictState === "none" && !local && !ai && <p className="text-xs text-muted">{t("Dictionnaire libre indisponible pour ce mot.", "Free dictionary unavailable for this word.")}</p>}

        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          {existing ? (
            <Badge tone="mint" className="py-1.5 px-3 text-sm">✓ {t("Dans vos flashcards", "In your flashcards")} : {existing.term}</Badge>
          ) : (
            <Button loading={adding === lemma} disabled={added.includes(lemma)} onClick={() => add(lemma, fr)} className="flex-1">
              {added.includes(lemma) ? t("Ajouté ✓", "Added ✓") : `＋ ${t("Ajouter", "Add")} « ${lemma} »`}
            </Button>
          )}
          {canIllustrate && <Button variant="secondary" loading={imgLoading} onClick={illustrate}>🖼️ {t("Illustration", "Picture")}</Button>}
        </div>
        {dict && <p className="text-[10px] text-muted">{t("Dictionnaire libre : Wiktionary (CC BY-SA)", "Free dictionary: Wiktionary (CC BY-SA)")}</p>}
      </div>
    </Sheet>
  );
}
