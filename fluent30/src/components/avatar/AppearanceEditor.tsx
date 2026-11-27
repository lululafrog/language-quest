"use client";
import { useState } from "react";
import { EYE_COLORS, EYES, HAIR_COLORS, HAIR_STYLES, SKIN_TONES } from "@/lib/data/shop";
import { useT } from "@/hooks/useT";
import { cx } from "@/components/ui";
import { DEFAULT_APPEARANCE, Tourist } from "./Tourist";
import type { Appearance } from "@/lib/types";

type Tab = "corps" | "visage" | "cheveux" | "pilosite" | "maquillage";

const FEMALE_HAIR: Appearance["hair"][] = ["long", "wavy", "bob", "ponytail", "bun", "braids", "curly", "pixie", "afro"];
const MALE_HAIR: Appearance["hair"][] = ["short", "sidepart", "buzz", "spiky", "curly", "afro", "mohawk", "bald", "long"];
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function randomAppearance(gender?: Appearance["gender"]): Appearance {
  const g = gender ?? pick(["female", "male"] as const);
  const fem = g === "female";
  return {
    ...DEFAULT_APPEARANCE,
    gender: g,
    skin: pick(SKIN_TONES),
    hair: pick(fem ? FEMALE_HAIR : MALE_HAIR),
    hairColor: pick(HAIR_COLORS.slice(0, 7)),
    face: pick(["oval", "round", "square", "heart"] as const),
    eyes: fem ? pick(["lashes", "lashes", "happy", "round"] as const) : pick(["round", "round", "happy"] as const),
    eyeColor: pick(EYE_COLORS),
    brows: pick(["thin", "normal", "thick"] as const),
    nose: pick(["small", "round", "long"] as const),
    lips: pick(["thin", "normal", "full"] as const),
    facialHair: fem ? "none" : pick(["none", "none", "stubble", "moustache", "goatee", "short", "full"] as const),
    freckles: Math.random() < 0.25,
    makeup: fem ? pick(["none", "blush", "lipstick", "eyeliner"] as const) : "none",
    beard: false,
  };
}


function Thumb({ base, p, label, active, onClick }: { base: Appearance; p: Partial<Appearance>; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cx("overflow-hidden rounded-2xl border-2 bg-surface-2 text-center transition active:scale-95", active ? "border-ink-500 ring-2 ring-ink-300/60" : "border-transparent")}>
      <Tourist appearance={{ ...base, ...p }} portrait animate={false} className="w-full" />
      <span className="block px-1 pb-1.5 text-[11px] font-medium leading-tight">{label}</span>
    </button>
  );
}
function Swatches({ colors, current, onPick, size = "h-9 w-9" }: { colors: string[]; current?: string; onPick: (c: string) => void; size?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => <button key={c} onClick={() => onPick(c)} aria-label={c} className={cx(size, "rounded-full border-2 transition", current === c ? "scale-110 border-ink-600 ring-2 ring-ink-300" : "border-white shadow")} style={{ background: c }} />)}
    </div>
  );
}
function Chips<K extends string>({ options, current, onPick }: { options: { id: K; label: string }[]; current?: K; onPick: (k: K) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => <button key={o.id} onClick={() => onPick(o.id)} className={cx("rounded-full border px-3 py-1.5 text-sm", current === o.id ? "border-ink-500 bg-ink-600 text-white" : "border-line bg-surface")}>{o.label}</button>)}
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 mt-4 text-sm font-semibold first:mt-0">{children}</p>;
}

/** Sims-style character creator (free, editable at any time). */
export function AppearanceEditor({ value, onChange }: { value: Appearance; onChange: (a: Appearance) => void }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>("corps");
  const v = { ...DEFAULT_APPEARANCE, ...value };
  const set = (p: Partial<Appearance>) => onChange({ ...v, ...p, beard: false });

  const setGender = (g: NonNullable<Appearance["gender"]>) => {
    if (g === v.gender) return;
    // Sensible defaults when switching, everything stays editable.
    set(g === "female"
      ? { gender: g, facialHair: "none", eyes: "lashes", hair: MALE_HAIR.includes(v.hair) && !FEMALE_HAIR.includes(v.hair) ? "long" : v.hair }
      : { gender: g, eyes: "round", makeup: "none", hair: FEMALE_HAIR.includes(v.hair) && !MALE_HAIR.includes(v.hair) ? "short" : v.hair });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "corps", label: t("🧍 Corps", "🧍 Body") },
    { id: "visage", label: t("🙂 Visage", "🙂 Face") },
    { id: "cheveux", label: t("💇 Cheveux", "💇 Hair") },
    { id: "pilosite", label: t("🧔 Barbe", "🧔 Beard") },
    { id: "maquillage", label: t("💄 Maquillage", "💄 Make-up") },
  ];

  return (
    <div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <button onClick={() => setGender("female")} className={cx("rounded-2xl border-2 py-2.5 font-semibold transition", v.gender === "female" ? "border-coral-400 bg-coral-100 text-coral-600 dark:bg-coral-600/20" : "border-line bg-surface")}>👩 {t("Femme", "Woman")}</button>
        <button onClick={() => setGender("male")} className={cx("rounded-2xl border-2 py-2.5 font-semibold transition", v.gender !== "female" ? "border-ink-400 bg-ink-50 text-ink-700 dark:bg-ink-900/50 dark:text-ink-200" : "border-line bg-surface")}>👨 {t("Homme", "Man")}</button>
        <button onClick={() => onChange(randomAppearance())} className="rounded-2xl border-2 border-dashed border-sun-400 bg-sun-100/60 py-2.5 font-semibold text-amber-800 transition active:rotate-6 dark:bg-sun-500/10 dark:text-sun-100">🎲 {t("Aléatoire", "Random")}</button>
      </div>
      <div className="no-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1">
        {tabs.map((x) => <button key={x.id} onClick={() => setTab(x.id)} className={cx("shrink-0 rounded-full px-3 py-1.5 text-sm font-medium", tab === x.id ? "bg-ink-600 text-white shadow-md shadow-ink-600/25" : "bg-surface-2 text-muted")}>{x.label}</button>)}
      </div>

      {tab === "corps" && (
        <div>
          <Label>{t("Couleur de peau", "Skin tone")}</Label>
          <Swatches colors={SKIN_TONES} current={v.skin} onPick={(c) => set({ skin: c })} size="h-11 w-11" />
          <Label>{t("Forme du visage", "Face shape")}</Label>
          <div className="grid grid-cols-4 gap-2">
            {([["oval", t("Ovale", "Oval")], ["round", t("Rond", "Round")], ["square", t("Carré", "Square")], ["heart", t("Cœur", "Heart")]] as const).map(([id, label]) => <Thumb base={v} key={id} p={{ face: id }} label={label} active={v.face === id} onClick={() => set({ face: id })} />)}
          </div>
        </div>
      )}

      {tab === "visage" && (
        <div>
          <Label>{t("Yeux", "Eyes")}</Label>
          <div className="grid grid-cols-3 gap-2">{EYES.map((e) => <Thumb base={v} key={e.id} p={{ eyes: e.id }} label={t(e.fr, e.en)} active={v.eyes === e.id} onClick={() => set({ eyes: e.id })} />)}</div>
          <Label>{t("Couleur des yeux", "Eye colour")}</Label>
          <Swatches colors={EYE_COLORS} current={v.eyeColor} onPick={(c) => set({ eyeColor: c })} />
          <Label>{t("Sourcils", "Eyebrows")}</Label>
          <Chips options={[{ id: "thin", label: t("Fins", "Thin") }, { id: "normal", label: t("Normaux", "Normal") }, { id: "thick", label: t("Épais", "Thick") }]} current={v.brows} onPick={(b) => set({ brows: b })} />
          <Label>{t("Nez", "Nose")}</Label>
          <div className="grid grid-cols-3 gap-2">{([["small", t("Petit", "Small")], ["round", t("Rond", "Round")], ["long", t("Long", "Long")]] as const).map(([id, label]) => <Thumb base={v} key={id} p={{ nose: id }} label={label} active={v.nose === id} onClick={() => set({ nose: id })} />)}</div>
          <Label>{t("Bouche", "Mouth")}</Label>
          <Chips options={[{ id: "thin", label: t("Fine", "Thin") }, { id: "normal", label: t("Normale", "Normal") }, { id: "full", label: t("Pulpeuse", "Full") }]} current={v.lips} onPick={(l) => set({ lips: l })} />
          <Label>{t("Taches de rousseur", "Freckles")}</Label>
          <Chips options={[{ id: "no", label: t("Non", "No") }, { id: "yes", label: t("Oui", "Yes") }]} current={v.freckles ? "yes" : "no"} onPick={(x) => set({ freckles: x === "yes" })} />
        </div>
      )}

      {tab === "cheveux" && (
        <div>
          <Label>{t("Coiffure", "Hairstyle")}</Label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">{HAIR_STYLES.map((h) => <Thumb base={v} key={h.id} p={{ hair: h.id }} label={t(h.fr, h.en)} active={v.hair === h.id} onClick={() => set({ hair: h.id })} />)}</div>
          <Label>{t("Couleur des cheveux", "Hair colour")}</Label>
          <Swatches colors={HAIR_COLORS} current={v.hairColor} onPick={(c) => set({ hairColor: c })} />
        </div>
      )}

      {tab === "pilosite" && (
        <div>
          <Label>{t("Moustache & barbe", "Moustache & beard")}</Label>
          <div className="grid grid-cols-3 gap-2">
            {([["none", t("Rasé", "Clean-shaven")], ["stubble", t("Barbe de 3 jours", "Stubble")], ["moustache", t("Moustache", "Moustache")], ["goatee", t("Bouc", "Goatee")], ["short", t("Barbe courte", "Short beard")], ["full", t("Grande barbe", "Full beard")]] as const).map(([id, label]) => <Thumb base={v} key={id} p={{ facialHair: id }} label={label} active={(v.facialHair ?? "none") === id} onClick={() => set({ facialHair: id })} />)}
          </div>
          <p className="mt-2 text-xs text-muted">{t("La couleur suit celle des cheveux.", "Colour follows the hair colour.")}</p>
        </div>
      )}

      {tab === "maquillage" && (
        <div>
          <Label>{t("Maquillage", "Make-up")}</Label>
          <div className="grid grid-cols-4 gap-2">
            {([["none", t("Aucun", "None")], ["blush", t("Blush", "Blush")], ["lipstick", t("Rouge à lèvres", "Lipstick")], ["eyeliner", t("Eye-liner", "Eyeliner")]] as const).map(([id, label]) => <Thumb base={v} key={id} p={{ makeup: id }} label={label} active={(v.makeup ?? "none") === id} onClick={() => set({ makeup: id })} />)}
          </div>
        </div>
      )}
    </div>
  );
}
