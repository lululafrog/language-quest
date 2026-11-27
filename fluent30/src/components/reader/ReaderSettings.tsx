"use client";
import { saveSettings } from "@/lib/db";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { Segmented, Sheet } from "@/components/ui";
import type { Settings } from "@/lib/types";

export function ReaderSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const s = useSettings();
  const r = s.reader;
  const set = (patch: Partial<Settings["reader"]>) => saveSettings({ reader: { ...r, ...patch } });
  return (
    <Sheet open={open} onClose={onClose} title={t("Affichage", "Display")}>
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium">{t("Police", "Font")}</p>
          <Segmented value={r.font} onChange={(font) => set({ font })} options={[
            { value: "serif", label: <span className="font-serif">Serif</span> },
            { value: "sans", label: <span className="font-sans">Sans</span> },
            { value: "dyslexic", label: <span style={{ fontFamily: "var(--font-dyslexic)" }}>{t("Lisible", "Legible")}</span> },
          ]} />
        </div>
        <div>
          <p className="mb-2 flex justify-between text-sm font-medium"><span>{t("Taille du texte", "Text size")}</span><span className="tabular-nums text-muted">{r.size}px</span></p>
          <div className="flex items-center gap-3">
            <span className="text-sm">A</span>
            <input type="range" min={14} max={30} value={r.size} onChange={(e) => set({ size: Number(e.target.value) })} className="flex-1 accent-ink-600" aria-label={t("Taille du texte", "Text size")} />
            <span className="text-xl">A</span>
          </div>
        </div>
        <div>
          <p className="mb-2 flex justify-between text-sm font-medium"><span>{t("Interligne", "Line spacing")}</span><span className="tabular-nums text-muted">{r.lineHeight.toFixed(1)}</span></p>
          <input type="range" min={1.3} max={2.2} step={0.1} value={r.lineHeight} onChange={(e) => set({ lineHeight: Number(e.target.value) })} className="w-full accent-ink-600" aria-label={t("Interligne", "Line spacing")} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">{t("Thème", "Theme")}</p>
          <div className="grid grid-cols-3 gap-2">
            {(["light", "sepia", "dark"] as const).map((th) => (
              <button key={th} onClick={() => set({ theme: th })} className={`rounded-xl border-2 py-3 text-sm font-medium ${r.theme === th ? "border-ink-500" : "border-line"}`} style={READER_THEMES[th]}>
                {th === "light" ? t("Clair", "Light") : th === "sepia" ? t("Sépia", "Sepia") : t("Sombre", "Dark")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 flex justify-between text-sm font-medium"><span>{t("Vitesse de lecture audio", "Audio speed")}</span><span className="tabular-nums text-muted">×{s.speechRate.toFixed(2)}</span></p>
          <input type="range" min={0.5} max={1.5} step={0.05} value={s.speechRate} onChange={(e) => saveSettings({ speechRate: Number(e.target.value) })} className="w-full accent-ink-600" aria-label={t("Vitesse audio", "Audio speed")} />
        </div>
      </div>
    </Sheet>
  );
}

export const READER_THEMES = {
  light: { background: "#ffffff", color: "#1d1b26" },
  sepia: { background: "#f6efe1", color: "#3b2f20" },
  dark: { background: "#121218", color: "#dcdbe6" },
} as const;

export const READER_FONTS = {
  serif: { fontFamily: "var(--font-serif)" },
  sans: { fontFamily: "var(--font-sans)" },
  dyslexic: { fontFamily: "var(--font-dyslexic)", letterSpacing: "0.02em", wordSpacing: "0.12em" },
} as const;
