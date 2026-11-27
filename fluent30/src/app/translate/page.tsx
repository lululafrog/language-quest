"use client";
import { grammarLessonForTopic } from "@/lib/data/grammar";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { postApi, ApiError, errorMessage } from "@/lib/api";
import { trackActivity, recordMistake } from "@/lib/track";
import { normalize } from "@/lib/text";
import { lookupLocal, type LocalEntry } from "@/lib/lexicon";
import { quickAdd } from "@/lib/cards";
import { REGISTERS } from "@/lib/data/scenarios";
import { Button, PageHeader, Panel, Segmented, ServiceNotice, ErrorNote, SpeakButton, Badge, toast, cx } from "@/components/ui";
import { AddToCards } from "@/components/chat/AddToCards";
import { imageToBase64 } from "@/components/chat/image";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import type { Register } from "@/lib/types";

interface TranslateResult {
  sourceText: string;
  translationFr: string;
  register: Register;
  registerExplanation: string;
  difficultExpressions: { en: string; fr: string; explanation: string }[];
  unknownWords: { en: string; fr: string; pos: string }[];
  suggestedReplies: { en: string; fr: string; tone: string; why: string }[];
  engine?: "ai" | "mymemory";
  note?: string;
}

interface CorrectResult {
  corrected: string;
  moreNatural: string;
  isAlreadyCorrect: boolean;
  changes: { original: string; corrected: string; explanationFr: string; category: string }[];
  grammarPoints: string[];
  register: Register;
  engine?: "ai" | "languagetool";
  note?: string;
}

function RegisterBadge({ r }: { r: Register }) {
  const t = useT();
  const reg = REGISTERS.find((x) => x.id === r);
  return <Badge tone="sun">{t("Registre", "Register")} : {reg ? t(reg.fr, reg.en) : r}</Badge>;
}

function CopyButton({ text }: { text: string }) {
  const t = useT();
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast(t("Copié", "Copied"));
        } catch {
          toast(t("Copie impossible", "Copy failed"), "err");
        }
      }}
      className="rounded-full px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-900/60"
    >
      {t("Copier", "Copy")}
    </button>
  );
}

export default function TranslatePage() {
  const t = useT();
  const status = useStatus();
  const [tab, setTab] = useState<"received" | "correct">("received");
  const aiOff = status && !status.ai;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("Assistant de traduction", "Translation assistant")} subtitle={t("Comprenez un message reçu, répondez naturellement, faites corriger votre anglais.", "Understand a message, reply naturally, get your English corrected.")} />
      {aiOff && <div className="mb-4"><ServiceNotice service={t("L'assistant de traduction", "The translation assistant")} alternative={"Pour un mot ou une phrase courte, la traduction rapide reste disponible dans la liseuse et dans Mes cartes."} /></div>}
      <Segmented
        className="mb-4"
        value={tab}
        onChange={setTab}
        options={[
          { value: "received", label: t("📩 Message reçu", "📩 Received message") },
          { value: "correct", label: t("✍️ Corriger mon anglais", "✍️ Correct my English") },
        ]}
      />
      {tab === "received" ? <Received /> : <Correct />}
    </div>
  );
}

function Received() {
  const t = useT();
  const [text, setText] = useState("");
  const [image, setImage] = useState<{ data: string; mediaType: string; preview: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<TranslateResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(f: Blob | null | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError(t("Choisissez une image (capture d'écran).", "Choose an image."));
    try {
      setImage(await imageToBase64(f));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  // Paste a screenshot directly (Ctrl/Cmd+V)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      if (item) {
        e.preventDefault();
        void onFile(item.getAsFile());
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [localHit, setLocalHit] = useState<LocalEntry | null>(null);

  async function analyse(force = false) {
    setError(null);
    setRes(null);
    setLocalHit(null);
    // Local-first: a single word or a known expression is answered by the built-in dictionary, instantly and offline.
    const q = text.trim().replace(/[.!?]+$/, "");
    if (!force && !image && q && q.split(/\s+/).length <= 4) {
      const hit = lookupLocal(q);
      if (hit?.fr) {
        setLocalHit(hit);
        return;
      }
    }
    setLoading(true);
    try {
      const r = await postApi<TranslateResult>(
        "/api/ai/translate",
        { text, image: image ? { data: image.data, mediaType: image.mediaType } : undefined },
        image ? {} : { cacheKey: `translate:${normalize(text).slice(0, 300)}` },
      );
      setRes(r);
      await trackActivity({ xp: 3 });
    } catch (e) {
      // image analysis unavailable → read the text on the device (free, private), then translate the text
      if (e instanceof ApiError && e.code === "image_unavailable" && image) {
        try {
          const { readTextOnDevice } = await import("@/lib/ocr");
          const bytes = Uint8Array.from(atob(image.data), (c) => c.charCodeAt(0));
          const ocr = await readTextOnDevice(new Blob([bytes], { type: image.mediaType }));
          const r = await postApi<TranslateResult>("/api/ai/translate", { text: [ocr.text, text].filter(Boolean).join("\n\n") });
          setRes({ ...r, sourceText: ocr.text });
          return;
        } catch (e2) {
          setError(errorMessage(e2));
          return;
        }
      }
      setError(e instanceof ApiError ? e.message : errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel>
        <label className="mb-2 block text-sm font-medium" htmlFor="received">{t("Collez le message reçu en anglais", "Paste the English message you received")}</label>
        <textarea
          id="received"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={t("ex. « Hey! Wanna grab a bite after work? No worries if you're swamped 😊 »", "e.g. “Hey! Wanna grab a bite after work?”")}
          className="w-full resize-y rounded-xl border border-line bg-surface-2 p-3 text-[15.5px] outline-none focus:border-ink-400"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>🖼️ {t("Importer une capture", "Import a screenshot")}</Button>
          <span className="text-xs text-muted">{t("ou collez-la (Ctrl/⌘+V)", "or paste it (Ctrl/⌘+V)")}</span>
          <Button className="ml-auto" onClick={() => analyse()} loading={loading} disabled={!text.trim() && !image}>{t("Traduire et expliquer", "Translate & explain")}</Button>
        </div>
        {image && (
          <div className="mt-3 flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.preview} alt={t("Capture importée", "Imported screenshot")} className="max-h-48 rounded-lg border border-line" />
            <button onClick={() => setImage(null)} className="text-sm text-coral-600 hover:underline">{t("Retirer", "Remove")}</button>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">🔒 {t("Les captures sont analysées puis oubliées : rien n'est enregistré, sauf les mots que vous ajoutez à vos flashcards.", "Screenshots are analysed then discarded: nothing is stored except words you add to your flashcards.")}</p>
      </Panel>

      <ErrorNote>{error}</ErrorNote>

      {localHit && <LocalAnswer entry={localHit} onFull={() => analyse(true)} />}

      {res && (
        <div className="space-y-4 animate-fade">
          <Panel>
            {image && res.sourceText && <p className="mb-2 whitespace-pre-line rounded-lg bg-surface-2 p-2 text-sm text-muted">{res.sourceText}</p>}
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="font-semibold">🇫🇷 {t("Traduction", "Translation")}</h3>
              <SpeakButton text={res.sourceText || text} size={16} label={t("Écouter l'original", "Listen")} />
            </div>
            <p className="whitespace-pre-line text-[16px] leading-relaxed">{res.translationFr}</p>
            {res.engine === "mymemory" ? (
              <p className="mt-3 text-sm text-muted">{res.note}</p>
            ) : (
              <>
                <div className="mt-3"><RegisterBadge r={res.register} /></div>
                <p className="mt-1.5 text-sm text-muted">{res.registerExplanation}</p>
              </>
            )}
          </Panel>

          {res.difficultExpressions.length > 0 && (
            <Panel>
              <h3 className="mb-3 font-semibold">🔎 {t("Expressions expliquées", "Expressions explained")}</h3>
              <ul className="space-y-3">
                {res.difficultExpressions.map((d, i) => (
                  <li key={i} className="rounded-xl bg-surface-2 p-3">
                    <p><span className="font-medium">{d.en}</span> <span className="text-muted">— {d.fr}</span></p>
                    <p className="mt-1 text-sm text-muted">{d.explanation}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {(res.unknownWords.length > 0 || res.difficultExpressions.length > 0) && (
            <Panel>
              <h3 className="mb-3 font-semibold">✨ {t("Ajouter à mes flashcards", "Add to my flashcards")}</h3>
              <AddToCards
                defaultChecked={false}
                source="translator"
                context={res.sourceText || text}
                items={[
                  ...res.difficultExpressions.map((d) => ({ term: d.en, fr: d.fr })),
                  ...res.unknownWords.map((w) => ({ term: w.en, fr: w.fr, note: w.pos })),
                ]}
              />
            </Panel>
          )}

          {res.suggestedReplies.length > 0 && (
            <Panel>
              <h3 className="mb-3 font-semibold">💬 {t("Réponses suggérées", "Suggested replies")}</h3>
              <ul className="space-y-3">
                {res.suggestedReplies.map((r, i) => (
                  <li key={i} className="rounded-xl border border-line p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[16px] font-medium">{r.en}</p>
                      <div className="flex shrink-0 items-center"><SpeakButton text={r.en} size={16} /><CopyButton text={r.en} /></div>
                    </div>
                    <p className="text-sm text-muted">{r.fr}</p>
                    <p className="mt-1.5 text-sm"><Badge tone="ink">{r.tone}</Badge> <span className="text-muted">{r.why}</span></p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

function Correct() {
  const t = useT();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<CorrectResult | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setRes(null);
    try {
      const r = await postApi<CorrectResult>("/api/ai/correct", { text }, { cacheKey: `correct:${normalize(text).slice(0, 300)}:${text.length}` });
      setRes(r);
      for (const c of r.changes.filter((c) => c.category === "grammar").slice(0, 5)) {
        await recordMistake({ id: `grammar:err:${normalize(c.corrected).slice(0, 48)}`, type: "grammar", label: c.explanationFr.slice(0, 80), example: `${c.original} → ${c.corrected}` });
      }
      for (const c of r.changes.filter((c) => c.category === "spelling").slice(0, 5)) {
        await recordMistake({ id: `spelling:${normalize(c.corrected).slice(0, 40)}`, type: "spelling", label: c.corrected, example: `${c.original} → ${c.corrected}` });
      }
      await trackActivity({ xp: 3 });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  const catLabel: Record<string, string> = { grammar: t("grammaire", "grammar"), vocabulary: t("vocabulaire", "vocabulary"), spelling: t("orthographe", "spelling"), "word order": t("ordre des mots", "word order"), style: "style", punctuation: t("ponctuation", "punctuation") };

  return (
    <div className="space-y-4">
      <Panel>
        <label className="mb-2 block text-sm font-medium" htmlFor="mytext">{t("Écrivez votre message en anglais", "Write your message in English")}</label>
        <textarea
          id="mytext"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={t("ex. « Hi Sarah, I am agree with you, we can meet us tomorrow at 6pm if you want »", "e.g. “I am agree with you…”")}
          className="w-full resize-y rounded-xl border border-line bg-surface-2 p-3 text-[15.5px] outline-none focus:border-ink-400"
        />
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-muted">{t("La correction garde votre style et vos idées.", "Your style and ideas are kept.")}</p>
          <Button onClick={run} loading={loading} disabled={!text.trim()}>{t("Corriger", "Correct")}</Button>
        </div>
      </Panel>
      <ErrorNote>{error}</ErrorNote>
      {res && (
        <div className="space-y-4 animate-fade">
          <Panel>
            {res.engine === "languagetool" && <p className="mb-2 text-sm text-muted">{res.note}</p>}
            {res.isAlreadyCorrect && <p className="mb-2 font-medium text-mint-600">{res.engine === "languagetool" ? t("Aucune faute détectée par le correcteur automatique.", "No error detected by the automatic checker.") : t("Votre texte est déjà correct !", "Your text is already correct!")}</p>}
            <div className="mb-1 flex items-center justify-between"><h3 className="font-semibold">{t("Version corrigée", "Corrected version")}</h3><CopyButton text={res.corrected} /></div>
            <p className="whitespace-pre-line text-[16px] leading-relaxed">{res.corrected}</p>
            {res.moreNatural && normalize(res.moreNatural) !== normalize(res.corrected) && (
              <div className="mt-4 rounded-xl bg-ink-50 p-3 dark:bg-ink-900/40">
                <div className="mb-1 flex items-center justify-between"><p className="text-sm font-medium">🗣️ {t("Comme le dirait un anglophone", "How a native would say it")}</p><CopyButton text={res.moreNatural} /></div>
                <p className="whitespace-pre-line">{res.moreNatural}</p>
              </div>
            )}
            <div className="mt-3"><RegisterBadge r={res.register} /></div>
          </Panel>
          {res.changes.length > 0 && (
            <Panel>
              <h3 className="mb-3 font-semibold">{t("Corrections expliquées", "Changes explained")}</h3>
              <ul className="space-y-3">
                {res.changes.map((c, i) => (
                  <li key={i} className="rounded-xl bg-surface-2 p-3">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-coral-600 line-through decoration-coral-400/70 dark:text-coral-400">{c.original}</span>
                      <span className="text-muted">→</span>
                      <span className="font-medium text-mint-600 dark:text-mint-400">{c.corrected}</span>
                      <Badge tone="gray">{catLabel[c.category] ?? c.category}</Badge>
                    </p>
                    <p className="mt-1 text-sm text-muted">{c.explanationFr}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {res.grammarPoints.length > 0 && (
            <Panel>
              <h3 className="mb-2 font-semibold">📚 {t("À réviser", "To review")}</h3>
              <div className="flex flex-wrap gap-2">{res.grammarPoints.map((g, i) => <Link key={i} href={grammarHref(g)} className={cx("rounded-full bg-surface-2 px-3 py-1 text-sm hover:bg-ink-100 dark:hover:bg-ink-900/60")}>{g}</Link>)}</div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

function grammarHref(topic: string) {
  const l = grammarLessonForTopic(topic);
  return l ? `/grammar/${l.id}` : "/grammar";
}

function LocalAnswer({ entry, onFull }: { entry: LocalEntry; onFull: () => void }) {
  const t = useT();
  const [added, setAdded] = useState(false);
  return (
    <Panel className="space-y-2 animate-fade">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold">
            {entry.lemma} {entry.ipa && <span className="text-sm font-normal text-muted">{entry.ipa}</span>}
          </p>
          <p className="text-[16px]">{entry.fr}</p>
          {entry.def && <p className="text-sm text-muted">{entry.def}</p>}
        </div>
        <SpeakButton text={entry.lemma} size={18} />
      </div>
      {entry.example && (
        <p className="text-sm">
          <span className="italic">{entry.example}</span>
          {entry.exampleFr && <span className="block text-muted">{entry.exampleFr}</span>}
        </p>
      )}
      <p className="text-xs text-muted">{t("Réponse du dictionnaire intégré (hors ligne, instantanée).", "Answer from the built-in dictionary (offline, instant).")}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={added} onClick={async () => { await quickAdd(entry.lemma, { source: "translator" }); setAdded(true); toast(t("Ajouté à tes cartes", "Added to your cards")); }}>
          {added ? t("Ajouté", "Added") : t("Ajouter à mes cartes", "Add to my cards")}
        </Button>
        <Button size="sm" variant="outline" onClick={onFull}>{t("Analyse complète du message", "Full analysis of the message")}</Button>
      </div>
    </Panel>
  );
}
