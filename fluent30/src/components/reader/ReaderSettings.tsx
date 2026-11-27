"use client";
import { saveSettings } from "@/lib/db";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { Segmented, Sheet, Toggle, cx } from "@/components/ui";
import { PRIORITY_INFO } from "@/lib/priority";
import { setReaderPrefs, useReaderPrefs } from "./prefs";
import type { Settings } from "@/lib/types";

type ReadingMode = NonNullable<Settings["readingMode"]>;

export function ReaderSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const s = useSettings();
  const prefs = useReaderPrefs();
  const r = s.reader;
  const set = (patch: Partial<Settings["reader"]>) => saveSettings({ reader: { ...r, ...patch } });
  const mode: ReadingMode = s.readingMode ?? "assisted";
  const modes: { id: ReadingMode; title: string; desc: string }[] = [
    { id: "immersive", title: t("Immersive", "Immersive"), desc: t("Texte uniquement en anglais. Appui long sur un mot pour le traduire.", "English only. Long-press a word to translate it.") },
    { id: "assisted", title: t("Assistée", "Assisted"), desc: t("Touchez un mot, une expression, une phrase ou un paragraphe pour le traduire.", "Tap to translate.") },
    { id: "bilingual", title: t("Bilingue", "Bilingual"), desc: t("La traduction française s'affiche sous chaque paragraphe.", "French under each paragraph.") },
  ];
  return (
    <Sheet open={open} onClose={onClose} title={t("Liseuse", "Reader")}>
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium">{t("Mode de lecture", "Reading mode")}</p>
          <div className="grid gap-2">
            {modes.map((m) => (
              <button key={m.id} onClick={() => saveSettings({ readingMode: m.id })} className={cx("rounded-xl border-2 px-3 py-2 text-left transition", mode === m.id ? "border-ink-500 bg-ink-50 dark:bg-ink-900/50" : "border-line")}>
                <span className="block text-sm font-semibold">{m.title}</span>
                <span className="block text-xs text-muted">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <Toggle checked={prefs.colorize} onChange={(v) => setReaderPrefs({ colorize: v })} label={t("Colorer les mots selon leur utilité", "Colour words by usefulness")} hint={t("Souligne les mots utiles à apprendre en priorité (méthode 70/30).", "Underlines words worth learning first.")} />
          {prefs.colorize && (
            <div className="mt-1 flex flex-wrap gap-2 text-xs">
              {(["green", "blue", "orange", "grey"] as const).map((p) => (
                <span key={p} className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded-full" style={{ background: PRIORITY_INFO[p].color }} />{t(PRIORITY_INFO[p].fr, PRIORITY_INFO[p].en)}</span>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">{t("Police", "Font")}</p>
          <Segmented value={r.font} onChange={(font) => set({ font })} options={[
            { value: "serif", label: <span className="font-serif">Serif</span> },
            { value: "sans", label: <span className="font-sans">Sans</span> },
            { value: "dyslexic", label: <span style={{ fontFamily: "var(--font-dyslexic)" }}>{t("Lisible", "Legible")}</span> },
          ]} />
        </div>
        <Slider label={t("Taille du texte", "Text size")} value={r.size} min={14} max={30} step={1} fmt={(v) => `${v}px`} onChange={(v) => set({ size: v })} />
        <Slider label={t("Interligne", "Line spacing")} value={r.lineHeight} min={1.3} max={2.2} step={0.1} fmt={(v) => v.toFixed(1)} onChange={(v) => set({ lineHeight: v })} />
        <Slider label={t("Marges", "Margins")} value={r.margin ?? 20} min={8} max={56} step={4} fmt={(v) => `${v}px`} onChange={(v) => set({ margin: v })} />
        <Slider label={t("Luminosité", "Brightness")} value={r.brightness ?? 100} min={40} max={100} step={5} fmt={(v) => `${v} %`} onChange={(v) => set({ brightness: v })} />
        <div>
          <p className="mb-2 text-sm font-medium">{t("Thème", "Theme")}</p>
          <div className="grid grid-cols-4 gap-2">
            {(["light", "sepia", "dark", "night"] as const).map((th) => {
              const active = th === "night" ? prefs.night : !prefs.night && r.theme === th;
              return (
                <button
                  key={th}
                  onClick={() => {
                    if (th === "night") {
                      setReaderPrefs({ night: true });
                      set({ theme: "dark" });
                    } else {
                      setReaderPrefs({ night: false });
                      set({ theme: th });
                    }
                  }}
                  className={`rounded-xl border-2 py-3 text-sm font-medium ${active ? "border-ink-500" : "border-line"}`}
                  style={READER_THEMES[th]}
                >
                  {th === "light" ? t("Clair", "Light") : th === "sepia" ? t("Sépia", "Sepia") : th === "dark" ? t("Sombre", "Dark") : t("Nuit", "Night")}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">{t("Voix de lecture", "Reading voice")}</p>
          <Segmented value={r.voice ?? (s.accent === "en-US" ? "en-US" : "en-GB")} onChange={(voice) => set({ voice })} options={[{ value: "en-GB", label: "🇬🇧 British" }, { value: "en-US", label: "🇺🇸 American" }]} />
          <p className="mt-1 text-xs text-muted">{t("Voix de synthèse de votre appareil (les plus naturelles sont choisies automatiquement).", "Your device's speech voices.")}</p>
        </div>
        <Slider label={t("Vitesse de lecture audio", "Audio speed")} value={s.speechRate} min={0.5} max={1.5} step={0.05} fmt={(v) => `×${v.toFixed(2)}`} onChange={(v) => saveSettings({ speechRate: v })} />
      </div>
    </Sheet>
  );
}

function Slider({ label, value, min, max, step, fmt, onChange }: { label: string; value: number; min: number; max: number; step: number; fmt: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="mb-2 flex justify-between text-sm font-medium"><span>{label}</span><span className="tabular-nums text-muted">{fmt(value)}</span></p>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-ink-600" aria-label={label} />
    </div>
  );
}

export const READER_THEMES = {
  light: { background: "#ffffff", color: "#1d1b26" },
  sepia: { background: "#f6efe1", color: "#3b2f20" },
  dark: { background: "#121218", color: "#dcdbe6" },
  night: { background: "#000000", color: "#d8b48a" },
} as const;

export const READER_FONTS = {
  serif: { fontFamily: "var(--font-serif)" },
  sans: { fontFamily: "var(--font-sans)" },
  dyslexic: { fontFamily: "var(--font-dyslexic)", letterSpacing: "0.02em", wordSpacing: "0.12em" },
} as const;
