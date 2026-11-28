"use client";
// Library view: compact, searchable list of the whole lexicon and the learner's own words, with filters and sorting.
import { useMemo, useState } from "react";
import { cx } from "@/components/ui";
import { CEFR_LEVELS, STATUS_INFO, STATUS_ORDER, type WordStatus } from "@/lib/vocab/core";
import { CATEGORIES, UNIVERSES } from "@/lib/vocab/universes";
import { libraryRows, searchRows, type LibraryRow, type Space } from "@/lib/vocab/space";
import { StatusPill } from "./common";

type Sort = "relevance" | "az" | "level" | "recent" | "review";
const PAGE = 60;

function Select<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="h-10 w-full appearance-none rounded-xl border border-line bg-surface pl-3 pr-7 text-sm">
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">▾</span>
    </label>
  );
}

export function VocabLibrary({ sp, onOpen }: { sp: Space; onOpen: (r: LibraryRow) => void }) {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"all" | "mine">("mine");
  const [status, setStatus] = useState<WordStatus | "unknown" | "any">("any");
  const [level, setLevel] = useState<string>("any");
  const [cat, setCat] = useState<string>("any");
  const [uni, setUni] = useState<string>("any");
  const [sort, setSort] = useState<Sort>("relevance");
  const [limit, setLimit] = useState(PAGE);

  const base = useMemo(() => libraryRows(sp, { mine: scope === "mine" }), [sp, scope]);
  const rows = useMemo(() => {
    let r = q.trim() ? searchRows(base, q) : base;
    if (status !== "any") r = r.filter((x) => x.status === status);
    if (level !== "any") r = r.filter((x) => x.level === level);
    if (cat !== "any") r = r.filter((x) => x.cat === cat);
    if (uni !== "any") r = r.filter((x) => x.unis.includes(uni));
    const lv = (x: LibraryRow) => CEFR_LEVELS.indexOf(x.level);
    if (sort === "az") r = [...r].sort((a, b) => a.en.localeCompare(b.en));
    else if (sort === "level") r = [...r].sort((a, b) => lv(a) - lv(b) || a.en.localeCompare(b.en));
    else if (sort === "recent") r = [...r].sort((a, b) => (b.word?.card.createdAt ?? 0) - (a.word?.card.createdAt ?? 0));
    else if (sort === "review") r = [...r].sort((a, b) => (a.status === "review" ? 0 : 1) - (b.status === "review" ? 0 : 1) || STATUS_ORDER.indexOf(a.status as WordStatus) - STATUS_ORDER.indexOf(b.status as WordStatus));
    return r;
  }, [base, q, status, level, cat, uni, sort]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Chercher un mot, en anglais ou en français…"
          className="h-11 flex-1 rounded-xl border border-line bg-surface px-3.5 text-[15px] outline-none focus:border-ink-400"
          aria-label="Rechercher"
        />
      </div>
      <div className="flex gap-2">
        {(["mine", "all"] as const).map((s) => (
          <button key={s} onClick={() => setScope(s)} className={cx("h-9 flex-1 rounded-full border text-sm font-medium", scope === s ? "border-ink-600 bg-ink-600 text-white" : "border-line bg-surface text-muted")}>
            {s === "mine" ? `Mes mots (${sp.words.length})` : `Toute la base (${(sp.words.length + sp.lex.length - sp.byLemma.size).toLocaleString("fr-FR")})`}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Select label="Univers" value={uni} onChange={setUni} options={[{ value: "any", label: "Tous les univers" }, ...UNIVERSES.map((u) => ({ value: u.id, label: u.fr }))]} />
        <Select label="Niveau" value={level} onChange={setLevel} options={[{ value: "any", label: "Tous niveaux" }, ...CEFR_LEVELS.map((l) => ({ value: l, label: l }))]} />
        <Select label="Catégorie" value={cat} onChange={setCat} options={[{ value: "any", label: "Toutes catégories" }, ...Object.entries(CATEGORIES).map(([v, l]) => ({ value: v, label: l }))]} />
        <Select
          label="Statut"
          value={status}
          onChange={setStatus}
          options={[{ value: "any", label: "Tous statuts" }, ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_INFO[s].label })), ...(scope === "all" ? [{ value: "unknown" as const, label: "À découvrir" }] : [])]}
        />
        <Select label="Tri" value={sort} onChange={setSort} options={[{ value: "relevance", label: "Pertinence" }, { value: "review", label: "À réviser d'abord" }, { value: "az", label: "A → Z" }, { value: "level", label: "Par niveau" }, { value: "recent", label: "Récents" }]} />
      </div>
      <p className="text-xs text-muted">{rows.length.toLocaleString("fr-FR")} résultat{rows.length > 1 ? "s" : ""}</p>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          {scope === "mine" && !sp.words.length ? "Tu n'as pas encore de mots : passe à « Toute la base » ou lance « Apprendre de nouveaux mots »." : "Aucun mot ne correspond."}
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {rows.slice(0, limit).map((r) => (
            <li key={r.key}>
              <button onClick={() => onOpen(r)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-surface-2 active:bg-surface-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.en}</p>
                  <p className="truncate text-sm text-muted">{r.fr}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">{r.level}</span>
                <span className="shrink-0"><StatusPill status={r.status} /></span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {rows.length > limit && (
        <button onClick={() => setLimit((l) => l + PAGE * 2)} className="h-11 w-full rounded-xl border border-line bg-surface text-sm font-medium">
          Afficher plus ({(rows.length - limit).toLocaleString("fr-FR")} restants)
        </button>
      )}
    </div>
  );
}
