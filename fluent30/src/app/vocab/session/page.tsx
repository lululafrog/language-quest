"use client";
// Flashcard session setup: one choice is enough (or "Choisis pour moi"); the rest is optional.
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, PageHeader, Spinner, Toggle, cx } from "@/components/ui";
import { useSpace } from "@/components/vocab/common";
import { CEFR_LEVELS } from "@/lib/vocab/core";
import { UNIVERSES } from "@/lib/vocab/universes";
import { reviewPriority } from "@/lib/vocab/engine";
import { suggestSession, type CardFormat, type SessionMode } from "@/lib/vocab/space";
import { recognitionSupported } from "@/lib/speech";

const MODES: { id: SessionMode; title: string; desc: string }[] = [
  { id: "auto", title: "Choisis pour moi", desc: "Les mots les plus utiles maintenant" },
  { id: "new", title: "Découvrir de nouveaux mots", desc: "Adaptés à ton niveau" },
  { id: "review", title: "Réviser mes mots", desc: "Ceux qui en ont vraiment besoin" },
  { id: "mix", title: "Mélanger découverte et révision", desc: "Un peu des deux" },
  { id: "difficult", title: "Travailler mes mots difficiles", desc: "Ceux que tu rates souvent" },
];
const SIZES = [5, 10, 20, 30];
const TIMES = [
  { min: 5, size: 10 },
  { min: 10, size: 20 },
  { min: 15, size: 30 },
];
const FORMATS: { id: CardFormat; label: string }[] = [
  { id: "en-fr", label: "Anglais → français" },
  { id: "fr-en", label: "Français → anglais" },
  { id: "image", label: "Image → mot" },
  { id: "audio", label: "Audio → mot" },
  { id: "cloze", label: "Phrase à compléter" },
  { id: "speak", label: "Mot à prononcer" },
  { id: "expression", label: "Expression à retrouver" },
];

export default function SessionSetup() {
  const router = useRouter();
  const params = useSearchParams();
  const data = useSpace();
  const [mode, setMode] = useState<SessionMode>((params.get("mode") as SessionMode) || "auto");
  const [universe, setUniverse] = useState<string>(params.get("universe") ?? "");
  const [level, setLevel] = useState<string>("");
  const [own, setOwn] = useState(false);
  const [size, setSize] = useState(10);
  const [formats, setFormats] = useState<CardFormat[]>([]);
  const [more, setMore] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "auto") suggestSession(size).then((s) => setReason(s.reason));
  }, [mode, size]);

  if (!data)
    return (
      <div className="flex justify-center py-20 text-ink-500">
        <Spinner className="h-8 w-8" />
      </div>
    );

  const { sp } = data;
  const inUni = (w: (typeof sp.words)[number]) => !universe || (w.card.subs ?? []).some((s) => s.startsWith(universe + "."));
  const due = sp.words.filter((w) => inUni(w) && w.status !== "new" && reviewPriority(w, sp.now) >= 2).length;
  const hard = sp.words.filter((w) => inUni(w) && (w.states.some((s) => s.lapses > 0) || (w.card.gameStats?.wrong ?? 0) >= 2)).length;
  const empty = (mode === "review" && due === 0) || (mode === "difficult" && hard === 0);
  const speech = recognitionSupported();

  function start(m = mode) {
    const q = new URLSearchParams({ mode: m, size: String(size) });
    if (universe) q.set("universe", universe);
    if (level) q.set("level", level);
    if (own) q.set("own", "1");
    if (formats.length) q.set("formats", formats.join(","));
    router.push(`/vocab/play?${q.toString()}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Session de flashcards" back="/vocab" />
      <div className="space-y-2">
        {MODES.map((m) => {
          const count = m.id === "review" ? due : m.id === "difficult" ? hard : null;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={cx("flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.99]", mode === m.id ? "border-ink-500 bg-ink-50 ring-1 ring-ink-300 dark:bg-ink-900/40" : "border-line bg-surface hover:border-ink-300")}
            >
              <span className={cx("h-4 w-4 shrink-0 rounded-full border-2", mode === m.id ? "border-ink-600 bg-ink-600" : "border-line")} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{m.title}</span>
                <span className="block text-xs text-muted">{m.id === "auto" && mode === "auto" && reason ? reason : m.desc}</span>
              </span>
              {count !== null && <span className="text-sm font-semibold tabular-nums text-muted">{count}</span>}
            </button>
          );
        })}
      </div>

      {empty ? (
        <div className="mt-5 rounded-2xl bg-mint-100/70 p-4 dark:bg-mint-600/15">
          <p className="font-medium">{mode === "review" ? "Rien à réviser pour l'instant : ta mémoire est à jour." : "Aucun mot difficile pour l'instant."}</p>
          <p className="mt-1 text-sm text-muted">Inutile d&apos;inventer des révisions : profites-en pour découvrir de nouveaux mots.</p>
          <Button className="mt-3 w-full" onClick={() => start("new")}>Découvrir de nouveaux mots</Button>
        </div>
      ) : (
        <Button size="lg" className="mt-5 w-full" onClick={() => start()}>Commencer</Button>
      )}

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Nombre de mots</p>
        <div className="flex gap-2">
          {SIZES.map((n) => (
            <button key={n} onClick={() => setSize(n)} className={cx("h-11 flex-1 rounded-xl border text-sm font-semibold", size === n ? "border-ink-600 bg-ink-600 text-white" : "border-line bg-surface")}>{n}</button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {TIMES.map((x) => (
            <button key={x.min} onClick={() => setSize(x.size)} className="h-9 flex-1 rounded-xl border border-line bg-surface text-xs text-muted hover:text-fg">J&apos;ai {x.min} min</button>
          ))}
        </div>
      </div>

      <button onClick={() => setMore(!more)} className="mt-6 flex w-full items-center justify-between rounded-xl py-2 text-sm font-semibold" aria-expanded={more}>
        Plus d&apos;options {universe || level || own || formats.length ? "(personnalisée)" : ""}
        <span className={cx("text-muted transition", more && "rotate-90")}>›</span>
      </button>
      {more && (
        <div className="animate-fade space-y-5 pb-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Univers</p>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {[{ id: "", fr: "Tous" }, ...UNIVERSES].map((u) => (
                <button key={u.id} onClick={() => setUniverse(u.id)} className={cx("shrink-0 rounded-full border px-3 py-1.5 text-sm", universe === u.id ? "border-ink-600 bg-ink-600 text-white" : "border-line bg-surface text-muted")}>{u.fr}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Niveau</p>
            <div className="flex flex-wrap gap-2">
              {["", ...CEFR_LEVELS].map((l) => (
                <button key={l} onClick={() => setLevel(l)} className={cx("h-9 rounded-full border px-3 text-sm", level === l ? "border-ink-600 bg-ink-600 text-white" : "border-line bg-surface text-muted")}>{l || "Mon niveau"}</button>
              ))}
            </div>
          </div>
          <Toggle checked={own} onChange={setOwn} label="Seulement mes propres mots" hint="Ceux que tu as ajoutés (livres, photos, cours, conversations, listes)." />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Formats de cartes</p>
            <div className="flex flex-wrap gap-2">
              {FORMATS.filter((f) => f.id !== "speak" || speech).map((f) => {
                const on = formats.includes(f.id);
                return (
                  <button key={f.id} onClick={() => setFormats(on ? formats.filter((x) => x !== f.id) : [...formats, f.id])} aria-pressed={on} className={cx("h-9 rounded-full border px-3 text-sm", on ? "border-ink-600 bg-ink-600 text-white" : "border-line bg-surface text-muted")}>{f.label}</button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-muted">Sans choix, l&apos;appli alterne : comprendre le mot, puis le retrouver toi-même.</p>
          </div>
        </div>
      )}
    </div>
  );
}
