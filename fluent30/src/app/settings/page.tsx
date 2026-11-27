"use client";
import { useEffect, useRef, useState } from "react";
import { saveSettings } from "@/lib/db";
import { useSettings } from "@/hooks/useSettings";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { THEMES } from "@/lib/data/types";
import { ACCENT_LABELS, availableAccents, englishVoices, loadVoices, speak, type Accent } from "@/lib/speech";
import { download, exportAll, importAll, wipeLocal } from "@/lib/backup";
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
        <Toggle checked={s.autoImages} onChange={(v) => set({ autoImages: v })} label={t("Illustrations automatiques", "Automatic illustrations")} hint={status?.images ? t(`Fournisseur : ${status.imageProvider === "openai" ? "OpenAI Images" : "pictogrammes SVG dessinés par Claude"} · mises en cache`, "Cached") : t("Nécessite OPENAI_API_KEY ou ANTHROPIC_API_KEY", "Requires an API key")} />
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
        <h2 className="mb-3 font-semibold">{t("Services externes", "External services")}</h2>
        <ul className="space-y-2 text-sm">
          {[
            { ok: status?.ai, name: t("IA (traductions, enrichissement, conversation, correction)", "AI"), env: "ANTHROPIC_API_KEY" },
            { ok: status?.images, name: t("Illustrations", "Illustrations"), env: "OPENAI_API_KEY ou ANTHROPIC_API_KEY" },
            { ok: status?.transcription, name: t("Transcription audio serveur (si le navigateur n'a pas de reconnaissance vocale)", "Server transcription"), env: "OPENAI_API_KEY" },
            { ok: status?.supabase, name: t("Compte, sauvegarde et synchronisation", "Account & sync"), env: "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY" },
            { ok: true, name: t("Synthèse vocale et reconnaissance vocale du navigateur", "Browser speech"), env: t("gratuit, selon navigateur", "free, browser-dependent") },
            { ok: true, name: t("Dictionnaire libre (phonétique, définitions)", "Free dictionary"), env: "dictionaryapi.dev" },
          ].map((x) => (
            <li key={x.name} className="flex items-start justify-between gap-3">
              <span>{x.name}<span className="block text-xs text-muted">{x.env}</span></span>
              <Badge tone={x.ok ? "mint" : "sun"}>{x.ok ? t("actif", "active") : t("non configuré", "not configured")}</Badge>
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

      <Panel>
        <h2 className="mb-1 font-semibold">{t("Mes données", "My data")}</h2>
        <p className="mb-3 text-sm text-muted">{t("Tes données sont stockées sur cet appareil (et dans ton compte si la synchronisation est active). Les captures d'écran et enregistrements vocaux ne sont jamais conservés : ils sont seulement transmis le temps du traitement.", "Your data is stored on this device (and your account if sync is on). Screenshots and voice recordings are never kept.")}</p>
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
