"use client";
import { useEffect, useRef, useState } from "react";
import { saveSettings } from "@/lib/db";
import { useSettings } from "@/hooks/useSettings";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { THEMES } from "@/lib/data/types";
import { ACCENT_LABELS, availableAccents, englishVoices, loadVoices, speak, type Accent } from "@/lib/speech";
import { download, exportAll, importAll, personalContentStats, wipeLocal, wipePersonalContent } from "@/lib/backup";
import { useLiveQuery } from "dexie-react-hooks";
import { getAccessCode, setAccessCode } from "@/lib/api";
import { Badge, Button, PageHeader, Panel, Segmented, Toggle, cx, toast } from "@/components/ui";
import { AccountPanel } from "@/components/AccountPanel";
import type { CorrectionMode, Settings } from "@/lib/types";

const GOALS = [
  { id: "travel", fr: "Voyager", en: "Travel" },
  { id: "conversation", fr: "Converser librement", en: "Chat freely" },
  { id: "work", fr: "Travail", en: "Work" },
  { id: "dating", fr: "Rencontres", en: "Dating" },
  { id: "reading", fr: "Lire en VO", en: "Read in English" },
  { id: "series", fr: "Films et séries", en: "Films & series" },
  { id: "exam", fr: "Examen (TOEIC, IELTS…)", en: "Exam" },
];

export default function SettingsPage() {
  const s = useSettings();
  const t = useT();
  const status = useStatus();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [accents, setAccents] = useState<Accent[]>([]);
  const [code, setCode] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadVoices().then(() => {
      setVoices(englishVoices());
      setAccents(availableAccents());
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read from localStorage once
    setCode(getAccessCode());
  }, []);

  if (!s.loaded) return null;
  const set = (p: Partial<Settings>) => saveSettings(p);
  const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const accentVoices = voices.filter((v) => v.lang.replace("_", "-").toLowerCase() === s.accent.toLowerCase());

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={t("Réglages", "Settings")} back="/profile" />

      <AccountPanel />

      <Panel>
        <h2 className="mb-3 font-semibold">{t("Apprentissage", "Learning")}</h2>
        <label className="block text-sm">
          {t("Prénom (facultatif)", "First name (optional)")}
          <input defaultValue={s.displayName} onBlur={(e) => set({ displayName: e.target.value.trim() || undefined })} className="mt-1 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 outline-none focus:border-ink-400" />
        </label>
        <div className="mt-4">
          <div className="flex justify-between text-sm"><span>{t("Nouveaux mots par jour", "New words per day")}</span><span className="font-semibold tabular-nums">{s.dailyNewWords}</span></div>
          <input type="range" min={3} max={40} value={s.dailyNewWords} onChange={(e) => set({ dailyNewWords: Number(e.target.value) })} className="mt-2 w-full accent-ink-600" />
          <p className="text-xs text-muted">{t("10 par jour est un bon équilibre : chaque nouveau mot génère des révisions les jours suivants.", "10/day is a good balance.")}</p>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm">{t("Durée de la séance quotidienne", "Daily session length")}</p>
          <Segmented<Settings["sessionMinutes"]> value={s.sessionMinutes} onChange={(v) => set({ sessionMinutes: v })} options={[5, 10, 15, 30, 60].map((m) => ({ value: m as Settings["sessionMinutes"], label: `${m}′` }))} />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm">{t("Correction en conversation", "Conversation correction")}</p>
          <Segmented<CorrectionMode> value={s.correctionMode} onChange={(v) => set({ correctionMode: v })} options={[{ value: "immediate", label: t("Immédiate", "Immediate") }, { value: "end", label: t("À la fin", "At the end") }, { value: "free", label: t("Libre", "Free") }]} />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm">{t("Mes objectifs", "My goals")}</p>
          <div className="flex flex-wrap gap-1.5">
            {GOALS.map((g) => (
              <button key={g.id} onClick={() => set({ goals: toggleIn(s.goals, g.id) })} className={cx("rounded-full border px-3 py-1.5 text-sm", s.goals.includes(g.id) ? "border-ink-500 bg-ink-600 text-white" : "border-line")}>{s.immersion ? g.en : g.fr}</button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-1 text-sm">{t("Centres d'intérêt (30 % du vocabulaire personnalisé)", "Interests (30% personalised vocabulary)")}</p>
          <div className="flex flex-wrap gap-1.5">
            {THEMES.filter((th) => th.priority === 3 || th.priority === 2).map((th) => (
              <button key={th.id} onClick={() => set({ interests: toggleIn(s.interests, th.id) })} className={cx("rounded-full border px-3 py-1.5 text-sm", s.interests.includes(th.id) ? "border-ink-500 bg-ink-600 text-white" : "border-line")}>{th.emoji} {s.immersion ? th.en : th.fr}</button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-2 font-semibold">{t("Interface", "Interface")}</h2>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[15px]">{t("Thème", "Theme")}</span>
          <Segmented<Settings["theme"]> value={s.theme} onChange={(v) => set({ theme: v })} options={[{ value: "system", label: t("Auto", "Auto") }, { value: "light", label: t("Clair", "Light") }, { value: "dark", label: t("Sombre", "Dark") }]} />
        </div>
        <Toggle checked={s.immersion} onChange={(v) => set({ immersion: v })} label={t("Mode immersion (interface en anglais)", "Immersion mode (English interface)")} hint={t("Toute l'interface passe en anglais.", "The whole interface switches to English.")} />
        <Toggle checked={s.autoImages} onChange={(v) => set({ autoImages: v })} label={t("Illustrations automatiques", "Automatic illustrations")} hint={status?.images ? t(`Fournisseur : ${status.imageProvider === "openai" ? "OpenAI Images" : "pictogrammes SVG dessinés par Claude"} · mises en cache`, "Cached") : t("Indisponible pour le moment : les cartes restent utilisables, et tu peux ajouter ta propre photo.", "Unavailable for now")} />
        <Toggle checked={!!s.reduceMotion} onChange={(v) => set({ reduceMotion: v })} label={t("Réduire les animations", "Reduce motion")} hint={t("Célébrations et animations simplifiées (accessibilité).", "Simplified celebrations (accessibility).")} />
      </Panel>

      <Panel id="objectifs">
        <h2 className="mb-1 font-semibold">{t("Objectifs de lecture", "Reading goals")}</h2>
        <p className="mb-3 text-xs text-muted">{t("Sans culpabilité : un jour manqué par semaine est couvert automatiquement.", "No guilt: one missed day per week is covered.")}</p>
        {([
          ["minutesPerWeek", t("Minutes par semaine", "Minutes per week"), 15, 600, 15],
          ["wordsPerWeek", t("Mots lus par semaine", "Words read per week"), 500, 30000, 500],
          ["booksPerMonth", t("Livres par mois", "Books per month"), 1, 8, 1],
        ] as const).map(([key, label, min, max, step]) => {
          const g = s.readingGoals ?? { minutesPerWeek: 90, wordsPerWeek: 4000, booksPerMonth: 1 };
          return (
            <div key={key} className="mb-3">
              <div className="flex justify-between text-sm"><span>{label}</span><span className="font-semibold tabular-nums">{g[key]}</span></div>
              <input type="range" min={min} max={max} step={step} value={g[key]} onChange={(e) => set({ readingGoals: { ...g, [key]: Number(e.target.value) } })} className="mt-1 w-full accent-ink-600" />
            </div>
          );
        })}
      </Panel>

      <Panel>
        <h2 className="mb-3 font-semibold">{t("Voix et prononciation", "Voice & pronunciation")}</h2>
        <p className="mb-2 text-sm">{t("Accent", "Accent")}</p>
        <div className="flex flex-wrap gap-1.5">
          {(["en-GB", "en-US", ...accents.filter((a) => a !== "en-GB" && a !== "en-US")] as Accent[]).map((a) => (
            <button key={a} onClick={() => set({ accent: a === "en-US" ? "en-US" : a === "en-GB" ? "en-GB" : (a as Settings["accent"]), voiceURI: undefined })} className={cx("rounded-full border px-3 py-1.5 text-sm", s.accent === a ? "border-ink-500 bg-ink-600 text-white" : "border-line", !accents.includes(a) && "opacity-50")}>
              {ACCENT_LABELS[a]}
            </button>
          ))}
        </div>
        {accentVoices.length > 1 && (
          <select value={s.voiceURI ?? ""} onChange={(e) => set({ voiceURI: e.target.value || undefined })} className="mt-3 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm">
            <option value="">{t("Voix automatique (la plus naturelle)", "Automatic voice")}</option>
            {accentVoices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
          </select>
        )}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm">{t("Vitesse", "Speed")}</span>
          <input type="range" min={0.5} max={1.4} step={0.05} value={s.speechRate} onChange={(e) => set({ speechRate: Number(e.target.value) })} className="flex-1 accent-ink-600" />
          <span className="w-10 text-right text-sm tabular-nums">{s.speechRate.toFixed(2)}</span>
        </div>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => speak("Hi! I'm your English voice. How are you doing today?")}>{t("Tester la voix", "Test voice")}</Button>
        {!voices.length && <p className="mt-2 text-xs text-muted">{t("Aucune voix anglaise détectée sur cet appareil. Installez une voix anglaise dans les réglages du système.", "No English voice found on this device.")}</p>}
      </Panel>

      <Panel>
        <h2 className="mb-1 font-semibold">{t("Fonctions en ligne", "Online features")}</h2>
        <p className="mb-3 text-xs text-muted">{t("Ces fonctions ont besoin d'internet. Tout le reste fonctionne sur ton appareil, même hors connexion.", "These features need the internet. Everything else works on your device, even offline.")}</p>
        <ul className="space-y-2 text-sm">
          {[
            { ok: status?.ai, name: t("Analyse et correction intelligentes", "Smart analysis & correction"), desc: t("traduction en contexte, conversations, journal, photos, vraie vie", "contextual translation, chat, journal, photos") },
            { ok: status?.images, name: t("Illustrations des mots", "Word illustrations"), desc: t("tu peux aussi ajouter ta propre photo", "you can also add your own photo") },
            { ok: status?.transcription, name: t("Transcription des messages vocaux", "Voice message transcription"), desc: t("la dictée du navigateur reste disponible", "browser dictation still works") },
            { ok: status?.supabase, name: t("Compte et synchronisation", "Account & sync"), desc: t("sinon : sauvegarde par export", "otherwise: back up with the export") },
            { ok: true, name: t("Voix et reconnaissance vocale", "Voice & speech recognition"), desc: t("intégrées à ton navigateur", "built into your browser") },
            { ok: true, name: t("Dictionnaire libre", "Free dictionary"), desc: t("phonétique et définitions", "phonetics and definitions") },
          ].map((x) => (
            <li key={x.name} className="flex items-start justify-between gap-3">
              <span>{x.name}<span className="block text-xs text-muted">{x.desc}</span></span>
              <Badge tone={x.ok ? "mint" : "gray"}>{x.ok ? t("disponible", "available") : t("indisponible", "unavailable")}</Badge>
            </li>
          ))}
        </ul>
        {status?.accessCodeRequired && (
          <div className="mt-4">
            <label className="text-sm">{t("Code d'accès aux fonctions IA", "AI access code")}</label>
            <div className="mt-1 flex gap-2">
              <input type="password" value={code} onChange={(e) => setCode(e.target.value)} className="flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2 outline-none" />
              <Button onClick={() => { setAccessCode(code); toast(t("Code enregistré", "Code saved")); }}>OK</Button>
            </div>
          </div>
        )}
      </Panel>

      <OfflinePanel />

      <PersonalContentPanel />

      <Panel>
        <h2 className="mb-1 font-semibold">{t("Mes données", "My data")}</h2>
        <p className="mb-3 text-sm text-muted">{t("Tes données sont stockées sur cet appareil (et dans ton compte si la synchronisation est active). Tes photos et enregistrements restent sur l'appareil : ils ne sont jamais envoyés vers le cloud, seulement à l'IA le temps d'une analyse que tu demandes.", "Your data is stored on this device (and your account if sync is on). Photos and recordings stay on the device.")}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={async () => download(await exportAll(), `fluent30-${new Date().toISOString().slice(0, 10)}.json`)}>{t("Exporter (JSON)", "Export (JSON)")}</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>{t("Importer une sauvegarde", "Import a backup")}</Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const n = await importAll(f); toast(t(`${n} éléments importés`, `${n} items imported`)); } catch (err) { toast(String((err as Error).message), "err"); } }} />
          <Button variant="danger" onClick={async () => { if (confirm(t("Supprimer TOUTES les données de cet appareil ? Cette action est irréversible (exportez d'abord si besoin).", "Delete ALL data on this device? This cannot be undone."))) { await wipeLocal(); window.location.reload(); } }}>{t("Supprimer les données locales", "Delete local data")}</Button>
        </div>
      </Panel>
      <p className="pb-4 text-center text-xs text-muted">Fluent30 · {t("Listes de fréquence : NGSL / NGSL-Spoken (CC BY-SA 4.0) · Dictionnaire : Wiktionary via dictionaryapi.dev", "Frequency lists: NGSL (CC BY-SA 4.0)")}</p>
    </div>
  );
}

function PersonalContentPanel() {
  const s = useSettings();
  const stats = useLiveQuery(() => personalContentStats(), []);
  const mb = stats ? (stats.mediaBytes / 1_048_576).toFixed(1) : "0";
  return (
    <Panel>
      <h2 className="mb-1 font-semibold">Contenus personnels</h2>
      <p className="mb-3 text-sm text-muted">
        Captures, journal, photos souvenirs et enregistrements sont privés par défaut. Ils ne servent jamais à entraîner un modèle.
      </p>
      {stats && (
        <p className="mb-3 text-sm">
          {stats.captures} capture{stats.captures > 1 ? "s" : ""} · {stats.journal} page{stats.journal > 1 ? "s" : ""} de journal · {stats.memories} souvenir{stats.memories > 1 ? "s" : ""} · {stats.media} fichier{stats.media > 1 ? "s" : ""} ({mb} Mo sur l&apos;appareil)
        </p>
      )}
      <div className="space-y-3">
        <Toggle
          checked={!!s.personalAiConsent}
          onChange={(v) => void saveSettings({ personalAiConsent: v })}
          label="Autoriser l'analyse par l'IA"
          hint="Nécessaire pour analyser une capture, une photo ou une page de journal. Le contenu est transmis le temps du traitement, rien n'est conservé par le serveur."
        />
        <Toggle
          checked={!!s.syncPersonalContent}
          onChange={(v) => void saveSettings({ syncPersonalContent: v })}
          label="Sauvegarder les textes personnels dans mon compte"
          hint="Désactivé par défaut. Seuls les textes sont synchronisés (jamais les photos ni l'audio), uniquement si tu es connecté(e)."
        />
        <Button
          variant="danger"
          onClick={async () => {
            if (!confirm("Supprimer toutes tes captures, pages de journal, souvenirs, photos et enregistrements ? Tes flashcards sont conservées.")) return;
            const n = await wipePersonalContent();
            toast(`${n} élément${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""}`);
          }}
        >
          Supprimer mes contenus personnels
        </Button>
      </div>
    </Panel>
  );
}

// Pages warmed for offline use: loading each one once in a hidden frame lets the service worker store
// the page and the code it needs. User data (cards, reviews, progress, opened books) is already on the device.
const OFFLINE_ROUTES = ["/", "/cours", "/cours/fiches", "/review", "/learn", "/cards", "/games", "/verbs", "/verbs/irregular", "/grammar", "/basics", "/courses", "/library", "/practice", "/world", "/profile", "/stats", "/translate"];

function OfflinePanel() {
  const [state, setState] = useState<{ running: boolean; done: number; ok: number; total: number } | null>(null);
  const supported = typeof navigator !== "undefined" && "serviceWorker" in navigator;

  const prepare = async () => {
    const { ALL_LESSONS } = await import("@/lib/curriculum");
    const routes = [...OFFLINE_ROUTES, ...ALL_LESSONS.map((l) => `/cours/${l.id}`)];
    setState({ running: true, done: 0, ok: 0, total: routes.length });
    // Ask the service worker to store the HTML of every page (fast), then open the main pages in a hidden
    // frame so their scripts are cached too (lesson pages share the same code, so one is enough).
    navigator.serviceWorker?.controller?.postMessage({ type: "warm", urls: routes });
    const frameRoutes = [...OFFLINE_ROUTES, routes.find((r) => r.startsWith("/cours/a1")) ?? "/cours"];
    let ok = 0;
    for (let i = 0; i < frameRoutes.length; i++) {
      const loaded = await new Promise<boolean>((resolve) => {
        const f = document.createElement("iframe");
        f.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-10px;top:-10px";
        f.setAttribute("aria-hidden", "true");
        f.tabIndex = -1;
        const done = (v: boolean) => { setTimeout(() => { f.remove(); resolve(v); }, 1200); };
        const timer = setTimeout(() => done(false), 15000);
        f.onload = () => { clearTimeout(timer); done(true); };
        f.src = frameRoutes[i];
        document.body.appendChild(f);
      });
      if (loaded) ok++;
      setState({ running: true, done: Math.round(((i + 1) / frameRoutes.length) * routes.length), ok: Math.round((ok / frameRoutes.length) * routes.length), total: routes.length });
    }
    setState({ running: false, done: routes.length, ok: Math.round((ok / frameRoutes.length) * routes.length), total: routes.length });
    toast(ok === frameRoutes.length ? "Mode hors ligne prêt" : "Mode hors ligne préparé en partie : relance avec une bonne connexion");
  };

  return (
    <Panel>
      <h2 className="mb-1 font-semibold">Mode hors ligne</h2>
      <p className="mb-3 text-sm text-muted">
        Tes mots, tes révisions, ta progression et les livres déjà ouverts sont enregistrés sur ton appareil. Prépare le mode hors ligne avant un voyage pour garder aussi les cours, les fiches et les jeux sans connexion.
      </p>
      <div className="mb-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="mb-1 font-medium text-mint-600 dark:text-mint-400">Fonctionne sans internet</p>
          <ul className="space-y-0.5 text-muted">
            <li>Révisions et flashcards</li>
            <li>Cours, fiches et grammaire</li>
            <li>Mini-jeux et verbes</li>
            <li>Livres déjà ouverts</li>
            <li>Voix de l&apos;appareil (selon le téléphone)</li>
            <li>Ta progression (synchronisée au retour de la connexion)</li>
          </ul>
        </div>
        <div>
          <p className="mb-1 font-medium">A besoin d&apos;internet</p>
          <ul className="space-y-0.5 text-muted">
            <li>Analyses et corrections intelligentes</li>
            <li>Conversations avec l&apos;IA</li>
            <li>Traduction en ligne et dictionnaire</li>
            <li>Nouvelles illustrations</li>
            <li>Nouveaux livres du catalogue</li>
          </ul>
        </div>
      </div>
      {!supported ? (
        <p className="text-sm text-muted">Ton navigateur ne permet pas le mode hors ligne complet. Tes données restent tout de même sur l&apos;appareil.</p>
      ) : (
        <div className="space-y-2">
          <Button variant="outline" onClick={prepare} disabled={state?.running}>
            {state?.running ? `Préparation… ${state.done}/${state.total}` : "Préparer le mode hors ligne"}
          </Button>
          {state && !state.running && <p className="text-sm text-muted">{state.ok} pages sur {state.total} disponibles hors ligne.</p>}
        </div>
      )}
    </Panel>
  );
}
