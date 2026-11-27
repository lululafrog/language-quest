"use client";
import { grammarLessonForTopic } from "@/lib/data/grammar";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getDb, uid } from "@/lib/db";
import { postApi, ApiError, errorMessage } from "@/lib/api";
import { speak, stopSpeaking } from "@/lib/speech";
import { trackActivity, recordMistake } from "@/lib/track";
import { normalize } from "@/lib/text";
import { SCENARIOS, LEVELS, REGISTERS, type Level } from "@/lib/data/scenarios";
import type { ChatMessage, Conversation, ConversationReport, CorrectionMode } from "@/lib/types";
import { Button, PageHeader, Panel, Segmented, ServiceNotice, ErrorNote, SpeakButton, Badge, Toggle, Spinner, cx } from "@/components/ui";
import { MicButton } from "@/components/chat/MicButton";
import { ReportView } from "@/components/chat/ReportView";
import { useSettings } from "@/hooks/useSettings";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";

const LEVEL_KEY = "fluent30.chatLevel";
const SPEAK_KEY = "fluent30.chatAutoSpeak";
const now = () => Date.now();

async function defaultLevel(): Promise<Level> {
  const saved = typeof localStorage !== "undefined" ? (localStorage.getItem(LEVEL_KEY) as Level | null) : null;
  if (saved && LEVELS.includes(saved)) return saved;
  const tests = await getDb().tests.orderBy("at").reverse().toArray();
  const v = tests.find((x) => x.vocabEstimate)?.vocabEstimate;
  if (v) return v < 500 ? "A1" : v < 1200 ? "A2" : v < 2500 ? "B1" : v < 4500 ? "B2" : "C1";
  return "A2";
}

export default function ChatScenarioPage() {
  const t = useT();
  const params = useParams<{ scenario: string }>();
  const scenario = SCENARIOS.find((s) => s.id === params.scenario);
  const settings = useSettings();
  const status = useStatus();

  const [phase, setPhase] = useState<"setup" | "chat" | "report">("setup");
  const [level, setLevel] = useState<Level>("A2");
  const [modeOverride, setModeOverride] = useState<CorrectionMode | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [interim, setInterim] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const endRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  const mode: CorrectionMode = modeOverride ?? settings.correctionMode;

  useEffect(() => {
    void defaultLevel().then((l) => {
      setLevel(l);
      setAutoSpeak(localStorage.getItem(SPEAK_KEY) === "1");
    });
  }, []);

  // Reopen a saved conversation (?c=id)
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const id = new URLSearchParams(window.location.search).get("c");
    if (!id) return;
    void getDb().conversations.get(id).then((c) => {
      if (!c) return;
      setConv(c);
      setModeOverride(c.mode);
      setPhase(c.report ? "report" : "chat");
    });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conv?.messages.length, loading]);

  useEffect(() => () => stopSpeaking(), []);

  if (!scenario) {
    return (
      <div>
        <PageHeader title={t("Scénario introuvable", "Scenario not found")} back="/chat" />
      </div>
    );
  }
  const sc = scenario;

  function handleError(e: unknown) {
    if (e instanceof ApiError && e.notConfigured) setNotConfigured(true);
    setError(errorMessage(e));
  }

  async function save(c: Conversation) {
    setConv(c);
    await getDb().conversations.put(c);
  }

  async function askPartner(messages: ChatMessage[], base: Conversation) {
    setLoading(true);
    setError(null);
    try {
      const r = await postApi<{ reply: string; correction: string | null }>("/api/ai/chat", {
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        level,
        mode: base.mode,
        scenario: { title: sc.titleEn, role: sc.role, setting: sc.setting, goal: sc.goal },
        register: sc.register,
      });
      const next = [...messages];
      if (r.correction && next.length && next[next.length - 1].role === "user") next[next.length - 1] = { ...next[next.length - 1], correction: r.correction };
      next.push({ role: "assistant", content: r.reply });
      await save({ ...base, messages: next, updatedAt: now() });
      if (autoSpeak) speak(r.reply);
    } catch (e) {
      handleError(e);
      await save({ ...base, messages, updatedAt: now() });
    } finally {
      setLoading(false);
    }
  }

  async function start() {
    localStorage.setItem(LEVEL_KEY, level);
    const c: Conversation = { id: uid("conv"), scenarioId: sc.id, mode, messages: [], createdAt: now(), updatedAt: now() };
    setConv(c);
    setPhase("chat");
    await askPartner([], c);
  }

  async function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if (!text || !conv || loading) return;
    setInput("");
    setInterim("");
    stopSpeaking();
    const messages: ChatMessage[] = [...conv.messages, { role: "user", content: text }];
    await trackActivity({ chatMessages: 1, xp: 2 });
    await askPartner(messages, conv);
  }

  async function finish() {
    if (!conv) return;
    if (!conv.messages.some((m) => m.role === "user")) {
      setError(t("Écrivez au moins un message avant de demander le bilan.", "Write at least one message first."));
      return;
    }
    stopSpeaking();
    setReportLoading(true);
    setError(null);
    try {
      const report = await postApi<ConversationReport>("/api/ai/report", {
        messages: conv.messages.map((m) => ({ role: m.role, content: m.content })),
        level,
        scenario: `${sc.titleEn} — ${sc.setting}`,
      });
      await save({ ...conv, report, updatedAt: now() });
      for (const g of report.grammarPoints) {
        await recordMistake({ id: grammarLessonForTopic(g) ? `grammar:${grammarLessonForTopic(g)!.id}` : `grammar:chat:${normalize(g).slice(0, 48)}`, type: "grammar", label: grammarLessonForTopic(g)?.title ?? g, detail: t("Relevé pendant une conversation", "Spotted in a conversation") });
      }
      for (const e of report.errors.slice(0, 10)) {
        await recordMistake({ id: `grammar:err:${normalize(e.corrected).slice(0, 48)}`, type: "grammar", label: e.explanation.slice(0, 80), example: `${e.original} → ${e.corrected}` });
      }
      await trackActivity({ xp: 10 });
      setPhase("report");
    } catch (e) {
      handleError(e);
    } finally {
      setReportLoading(false);
    }
  }

  async function translate(i: number, text: string) {
    if (translations[i]) {
      setTranslations((s) => {
        const n = { ...s };
        delete n[i];
        return n;
      });
      return;
    }
    try {
      const r = await postApi<{ translationFr: string }>("/api/ai/phrase", { text }, { cacheKey: `phrase:${normalize(text).slice(0, 200)}` });
      setTranslations((s) => ({ ...s, [i]: r.translationFr }));
    } catch (e) {
      handleError(e);
    }
  }

  const aiOff = (status && !status.ai) || notConfigured;
  const registerLabel = REGISTERS.find((r) => r.id === sc.register);

  // ---------- Setup ----------
  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader back="/chat" title={<span>{sc.emoji} {t(sc.titleFr, sc.titleEn)}</span>} subtitle={t(sc.goalFr, sc.goal)} />
        {aiOff && <div className="mb-4"><ServiceNotice service={t("La conversation IA", "AI conversation")} envVar="ANTHROPIC_API_KEY" /></div>}
        <Panel className="space-y-4">
          <div>
            <p className="text-sm text-muted">{t("Situation", "Setting")}</p>
            <p className="font-medium">{sc.setting}</p>
            <p className="mt-2 text-sm text-muted">{t("Votre interlocuteur", "Your partner")}</p>
            <p>{sc.role}</p>
            {registerLabel && <p className="mt-2 text-sm"><Badge tone="sun">{t("Registre", "Register")} : {t(registerLabel.fr, registerLabel.en)}</Badge> <span className="text-muted">{registerLabel.desc}</span></p>}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("Votre niveau", "Your level")}</p>
            <Segmented value={level} onChange={setLevel} options={LEVELS.map((l) => ({ value: l, label: l }))} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("Correction", "Corrections")}</p>
            <Segmented
              value={mode}
              onChange={(m) => setModeOverride(m)}
              options={[
                { value: "immediate", label: t("Immédiate", "Immediate") },
                { value: "end", label: t("À la fin", "At the end") },
                { value: "free", label: t("Libre", "Free") },
              ]}
            />
            <p className="mt-1.5 text-xs text-muted">
              {mode === "immediate" ? t("Chaque message est vérifié et corrigé tout de suite.", "Each message is checked right away.") : mode === "end" ? t("Vous parlez sans interruption ; le bilan détaillé arrive à la fin.", "Talk freely; detailed report at the end.") : t("Conversation sans aucune correction (vous pouvez quand même demander un bilan).", "No corrections at all (you can still ask for a report).")}
            </p>
          </div>
          <Toggle checked={autoSpeak} onChange={(v) => { setAutoSpeak(v); localStorage.setItem(SPEAK_KEY, v ? "1" : "0"); }} label={t("Lire les réponses à voix haute", "Read replies aloud")} hint={t("Idéal pour une conversation orale avec le micro.", "Great for spoken practice with the mic.")} />
          <div>
            <p className="mb-2 text-sm font-medium">{t("Phrases utiles", "Useful phrases")}</p>
            <ul className="space-y-1.5">
              {sc.phrases.map((p) => (
                <li key={p.en} className="flex items-center gap-2 text-[15px]"><SpeakButton text={p.en} size={16} className="-my-1" /><span className="font-medium">{p.en}</span><span className="text-sm text-muted">— {p.fr}</span></li>
              ))}
            </ul>
          </div>
          <Button size="lg" className="w-full" onClick={start} disabled={!!aiOff}>{t("Commencer la conversation", "Start the conversation")}</Button>
        </Panel>
      </div>
    );
  }

  // ---------- Report ----------
  if (phase === "report" && conv?.report) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader back="/chat" title={<span>{sc.emoji} {t(sc.titleFr, sc.titleEn)}</span>} subtitle={new Date(conv.createdAt).toLocaleString(t("fr-FR", "en-GB"))} />
        <ReportView report={conv.report} />
        <details className="mt-4 rounded-2xl border border-line bg-surface p-4">
          <summary className="cursor-pointer font-medium">{t("Revoir la conversation", "See the conversation")}</summary>
          <div className="mt-3 space-y-2">
            {conv.messages.map((m, i) => (
              <div key={i} className={cx("rounded-xl px-3 py-2 text-[15px]", m.role === "user" ? "ml-8 bg-ink-50 dark:bg-ink-900/40" : "mr-8 bg-surface-2")}>{m.content}</div>
            ))}
          </div>
        </details>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => { setConv(null); setPhase("setup"); window.history.replaceState(null, "", `/chat/${sc.id}`); }}>{t("Nouvelle conversation", "New conversation")}</Button>
          <Link href="/chat" className="inline-flex h-11 items-center rounded-xl px-4 font-medium hover:bg-surface-2">{t("Autres scénarios", "Other scenarios")}</Link>
        </div>
      </div>
    );
  }

  // ---------- Chat ----------
  const messages = conv?.messages ?? [];
  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <div className="mb-3 flex items-center gap-3">
        <Link href="/chat" className="-ml-1 rounded-lg p-1.5 text-muted hover:bg-surface-2" aria-label={t("Retour", "Back")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <span className="text-2xl">{sc.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{t(sc.titleFr, sc.titleEn)}</p>
          <p className="text-xs text-muted">{level} · {conv?.mode === "immediate" ? t("correction immédiate", "immediate correction") : conv?.mode === "end" ? t("correction à la fin", "correction at the end") : t("libre", "free")}</p>
        </div>
        <button onClick={() => setShowHelp((v) => !v)} className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-surface-2">💡 {t("Aide", "Help")}</button>
        <Button size="sm" variant="secondary" onClick={finish} loading={reportLoading}>{t("Terminer", "Finish")}</Button>
      </div>

      {showHelp && (
        <Panel className="mb-3 animate-fade">
          <p className="mb-2 text-sm font-medium">{t("Touchez une phrase pour l'insérer", "Tap a phrase to insert it")}</p>
          <div className="flex flex-wrap gap-2">
            {sc.phrases.map((p) => (
              <button key={p.en} onClick={() => setInput((v) => (v ? `${v} ${p.en}` : p.en))} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm hover:bg-ink-100 dark:hover:bg-ink-900/60" title={p.fr}>{p.en}</button>
            ))}
          </div>
        </Panel>
      )}

      <div className="min-h-[50vh] space-y-3 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={cx("flex animate-slide-up flex-col", m.role === "user" ? "items-end" : "items-start")}>
            <div className={cx("max-w-[85%] rounded-2xl px-4 py-2.5 text-[15.5px] leading-relaxed", m.role === "user" ? "rounded-br-md bg-ink-600 text-white" : "rounded-bl-md border border-line bg-surface")}>
              {m.content}
              {translations[i] && <p className="mt-1.5 border-t border-line pt-1.5 text-sm text-muted">{translations[i]}</p>}
            </div>
            {m.role === "assistant" && (
              <div className="mt-0.5 flex items-center gap-1">
                <SpeakButton text={m.content} size={16} />
                <button onClick={() => translate(i, m.content)} className="rounded-full px-2 py-1 text-xs text-muted hover:bg-surface-2">{translations[i] ? t("Masquer", "Hide") : t("Traduire", "Translate")}</button>
              </div>
            )}
            {m.role === "user" && m.correction && (
              <div className="mt-1 max-w-[85%] rounded-xl border border-sun-400/60 bg-sun-100/70 px-3 py-2 text-sm dark:bg-sun-500/10">
                <span className="font-medium">✏️ </span>{m.correction}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted"><Spinner className="h-4 w-4" /> {t("Votre interlocuteur écrit…", "Typing…")}</div>
        )}
        {reportLoading && <div className="flex items-center gap-2 text-sm text-muted"><Spinner className="h-4 w-4" /> {t("Préparation du bilan…", "Preparing your report…")}</div>}
        {aiOff && <ServiceNotice service={t("La conversation IA", "AI conversation")} envVar="ANTHROPIC_API_KEY" />}
        {error && !aiOff && (
          <ErrorNote>
            {error}{" "}
            {conv && <button className="ml-1 underline" onClick={() => askPartner(conv.messages, conv)}>{t("Réessayer", "Retry")}</button>}
          </ErrorNote>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-20 z-10 md:bottom-4">
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 shadow-lg">
          <MicButton
            disabled={loading || !!aiOff}
            onInterim={setInterim}
            onResult={(text) => { setInterim(""); void send(text); }}
            onError={(m) => setError(m)}
            lang={settings.accent}
          />
          <textarea
            value={interim || input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder={t("Écrivez en anglais… (ou utilisez le micro)", "Type in English… (or use the mic)")}
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15.5px] outline-none placeholder:text-muted"
            disabled={!!aiOff}
            aria-label={t("Votre message", "Your message")}
          />
          <Button onClick={() => send()} disabled={!input.trim() || loading || !!aiOff} aria-label={t("Envoyer", "Send")} className="w-11 px-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
