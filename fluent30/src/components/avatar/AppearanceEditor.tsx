"use client";
import { EYE_COLORS, EYES, HAIR_COLORS, HAIR_STYLES, SKIN_TONES } from "@/lib/data/shop";
import { useT } from "@/hooks/useT";
import { Toggle, cx } from "@/components/ui";
import type { Appearance } from "@/lib/types";

/** Free character customisation (skin, hair, eyes, beard). */
export function AppearanceEditor({ value, onChange }: { value: Appearance; onChange: (a: Appearance) => void }) {
  const t = useT();
  const set = (p: Partial<Appearance>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">{t("Couleur de peau", "Skin tone")}</p>
        <div className="flex flex-wrap gap-2">
          {SKIN_TONES.map((c) => (
            <button key={c} onClick={() => set({ skin: c })} aria-label={c} className={cx("h-10 w-10 rounded-full border-2 transition", value.skin === c ? "scale-110 border-ink-600 ring-2 ring-ink-300" : "border-white shadow")} style={{ background: c }} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">{t("Coiffure", "Hairstyle")}</p>
        <div className="flex flex-wrap gap-1.5">
          {HAIR_STYLES.map((h) => (
            <button key={h.id} onClick={() => set({ hair: h.id })} className={cx("rounded-full border px-3 py-1.5 text-sm", value.hair === h.id ? "border-ink-500 bg-ink-600 text-white" : "border-line bg-surface")}>{t(h.fr, h.en)}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">{t("Couleur des cheveux", "Hair colour")}</p>
        <div className="flex flex-wrap gap-2">
          {HAIR_COLORS.map((c) => (
            <button key={c} onClick={() => set({ hairColor: c })} aria-label={c} className={cx("h-9 w-9 rounded-full border-2 transition", value.hairColor === c ? "scale-110 border-ink-600 ring-2 ring-ink-300" : "border-white shadow")} style={{ background: c }} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">{t("Yeux", "Eyes")}</p>
        <div className="flex flex-wrap gap-1.5">
          {EYES.map((e) => (
            <button key={e.id} onClick={() => set({ eyes: e.id })} className={cx("rounded-full border px-3 py-1.5 text-sm", value.eyes === e.id ? "border-ink-500 bg-ink-600 text-white" : "border-line bg-surface")}>{t(e.fr, e.en)}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">{t("Couleur des yeux", "Eye colour")}</p>
        <div className="flex flex-wrap gap-2">
          {EYE_COLORS.map((c) => (
            <button key={c} onClick={() => set({ eyeColor: c })} aria-label={c} className={cx("h-8 w-8 rounded-full border-2 transition", (value.eyeColor ?? EYE_COLORS[0]) === c ? "scale-110 border-ink-600 ring-2 ring-ink-300" : "border-white shadow")} style={{ background: c }} />
          ))}
        </div>
      </div>
      <Toggle checked={value.beard} onChange={(v) => set({ beard: v })} label={t("Barbe", "Beard")} />
    </div>
  );
}
