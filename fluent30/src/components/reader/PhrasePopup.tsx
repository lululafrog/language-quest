"use client";
import { useEffect, useState } from "react";
import { ApiError, errorMessage, postApi } from "@/lib/api";
import { quickAdd } from "@/lib/cards";
import { normalize } from "@/lib/text";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { Button, ErrorNote, Sheet, SpeakButton, Spinner, toast } from "@/components/ui";
import { freeTranslate } from "./translate";

interface PhraseResult {
  translationFr: string;
  literal: string;
  explanation: string;
  keyItems: { en: string; fr: string }[];
}

export function PhrasePopup({ text, context, kind, onClose }: { text: string; context: string; kind: "phrase" | "sentence" | "paragraph"; onClose: () => void }) {
  const t = useT();
  const status = useStatus();
  const [res, setRes] = useState<PhraseResult | null>(null);
  const [err, setErr] = useState<unknown>(null);
  const [added, setAdded] = useState<string[]>([]);
  const [adding, setAdding] = useState<string | null>(null);

  const [free, setFree] = useState<string | null>(null);
  const [freeErr, setFreeErr] = useState<string | null>(null);

  useEffect(() => {
    if (!status || !status.ai) return;
    let alive = true;
    const req =
      kind === "paragraph"
        ? postApi<{ paragraphs: string[] }>("/api/ai/reader/translate", { paragraphs: [text] }, { cacheKey: `para:${normalize(text).slice(0, 300)}` }).then((r) => ({ translationFr: r.paragraphs[0] ?? "", literal: "", explanation: "", keyItems: [] }))
        : postApi<PhraseResult>("/api/ai/phrase", { text, context }, { cacheKey: `phrase:${normalize(text)}` });
    req.then((r) => alive && setRes(r)).catch((e) => alive && setErr(e));
    return () => {
      alive = false;
    };
  }, [text, context, status, kind]);

  // Without AI (or if it isn't configured): free machine translation.
  const useFree = (status && !status.ai) || (err instanceof ApiError && err.notConfigured);
  useEffect(() => {
    if (!useFree) return;
    let alive = true;
    freeTranslate(text)
      .then((r) => alive && setFree(r))
      .catch((e) => alive && setFreeErr(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, [useFree, text]);

  async function add(term: string, fr?: string) {
    setAdding(term);
    try {
      await quickAdd(term, { fr, context, source: "reader", example: context });
      setAdded((a) => [...a, term]);
      toast(t("Ajouté aux flashcards ✓", "Added to flashcards ✓"));
    } catch (e) {
      toast(errorMessage(e), "err");
    } finally {
      setAdding(null);
    }
  }

  const loading = !!status?.ai && !res && !err;
  const wordCount = text.split(/\s+/).length;
  const notConfigured = useFree;

  return (
    <Sheet open onClose={onClose} title={kind === "paragraph" ? t("Traduction du paragraphe", "Paragraph translation") : kind === "sentence" ? t("Traduction de la phrase", "Sentence translation") : t("Expression sélectionnée", "Selected expression")}>
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl bg-surface-2 p-3">
          <p className={kind === "paragraph" ? "flex-1 font-serif text-[15px] leading-relaxed" : "flex-1 font-serif text-lg leading-relaxed"}>{text}</p>
          <SpeakButton text={text} />
        </div>
        {loading && <p className="flex items-center gap-2 text-sm text-muted"><Spinner className="h-4 w-4" /> {t("Traduction en cours…", "Translating…")}</p>}
        {notConfigured && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("Traduction automatique", "Machine translation")}</p>
            {free ? <p className="mt-0.5 text-lg font-semibold">{free}</p> : freeErr ? <ErrorNote>{freeErr}</ErrorNote> : <p className="flex items-center gap-2 text-sm text-muted"><Spinner className="h-4 w-4" /> {t("Traduction…", "Translating…")}</p>}
            <p className="mt-1 text-xs text-muted">{t("Traduction gratuite (MyMemory), hors contexte et limitée par jour. Avec une clé IA (ANTHROPIC_API_KEY), la traduction est fidèle au contexte et expliquée.", "Free machine translation, limited per day. Add an AI key for contextual translations.")}</p>
          </div>
        )}
        {!!err && !notConfigured && <ErrorNote>{errorMessage(err)}</ErrorNote>}
        {res && (
          <>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("Traduction", "Translation")}</p>
              <p className={kind === "paragraph" ? "mt-0.5 text-[15px] leading-relaxed" : "mt-0.5 text-lg font-semibold"}>{res.translationFr}</p>
              {res.literal && <p className="mt-1 text-sm text-muted">{t("Mot à mot", "Literally")} : {res.literal}</p>}
            </div>
            {res.explanation && <p className="text-sm leading-relaxed">{res.explanation}</p>}
            {res.keyItems.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">{t("À retenir", "Worth learning")}</p>
                <ul className="space-y-1.5">
                  {res.keyItems.map((k) => (
                    <li key={k.en} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                      <span className="min-w-0 flex-1"><strong>{k.en}</strong> <span className="text-muted">— {k.fr}</span></span>
                      <Button size="sm" variant="secondary" loading={adding === k.en} disabled={added.includes(k.en)} onClick={() => add(k.en, k.fr)}>{added.includes(k.en) ? "✓" : "＋"}</Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        {kind === "phrase" && wordCount <= 10 && (
          <Button className="w-full" loading={adding === text} disabled={added.includes(text)} onClick={() => add(text, res?.translationFr)}>
            {added.includes(text) ? t("Ajoutée ✓", "Added ✓") : t("＋ Ajouter cette expression aux flashcards", "＋ Add this expression to flashcards")}
          </Button>
        )}
      </div>
    </Sheet>
  );
}
