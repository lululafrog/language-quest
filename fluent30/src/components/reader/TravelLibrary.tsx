"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LIBRARY, LIBRARY_CATEGORIES, readingTime, type LibraryCategory } from "@/lib/data/library";
import { downloadGutenberg } from "@/lib/books";
import { errorMessage } from "@/lib/api";
import { normalize } from "@/lib/text";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { Badge, Spinner, cx, toast } from "@/components/ui";
import type { Book } from "@/lib/types";

const COVER: Record<LibraryCategory, string> = {
  thriller: "from-[#1f2937] to-[#4b5563]", devperso: "from-[#15803d] to-[#86efac]", horreur: "from-[#450a0a] to-[#991b1b]", courtes: "from-[#0369a1] to-[#38bdf8]",
  aventure: "from-[#0e7490] to-[#14b8a6]",
  romance: "from-[#be185d] to-[#f472b6]",
  fantastique: "from-[#4c1d95] to-[#7c3aed]",
  classiques: "from-[#ea580c] to-[#fbbf24]",
};

/** 100 classics shipped with the app: no download service needed, readable offline. */
export function TravelLibrary({ books }: { books: Book[] }) {
  const t = useT();
  const s = useSettings();
  const router = useRouter();
  const [cat, setCat] = useState<LibraryCategory | "all">("all");
  const [level, setLevel] = useState("");
  const [q, setQ] = useState("");
  const [opening, setOpening] = useState<number | null>(null);

  const list = useMemo(() => {
    const nq = normalize(q);
    return LIBRARY.filter((b) => (cat === "all" || b.cat === cat) && (!level || b.level === level) && (!nq || normalize(`${b.title} ${b.titleFr} ${b.author}`).includes(nq)));
  }, [cat, level, q]);

  const open = async (id: number) => {
    const existing = books.find((b) => b.gutenbergId === id);
    if (existing) return router.push(`/library/read/${encodeURIComponent(existing.id)}`);
    setOpening(id);
    try {
      const b = await downloadGutenberg(id);
      router.push(`/library/read/${encodeURIComponent(b.id)}`);
    } catch (e) {
      toast(errorMessage(e), "err");
    } finally {
      setOpening(null);
    }
  };

  return (
    <div>
      <div className="mb-4 rounded-3xl bg-gradient-to-br from-ink-600 to-coral-500 p-4 text-white shadow-lg">
        <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>🎒 {t("La bibliothèque du voyageur", "The traveller's library")}</p>
        <p className="mt-1 text-sm text-white/85">{t("100 grands classiques en anglais, intégrés à l'appli : aucun livre à porter, lisibles même hors connexion. Touchez n'importe quel mot pour le traduire.", "100 classics built into the app, readable offline.")}</p>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Titre ou auteur (Sherlock, Austen, Verne…)", "Title or author")} className="mb-3 w-full rounded-xl border border-line bg-surface px-4 py-2.5 outline-none focus:border-ink-400" />
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        <button onClick={() => setCat("all")} className={cx("shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium", cat === "all" ? "border-ink-500 bg-ink-600 text-white" : "border-line bg-surface")}>{t("Tous", "All")} · {LIBRARY.length}</button>
        {LIBRARY_CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={cx("shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium", cat === c.id ? "border-ink-500 bg-ink-600 text-white" : "border-line bg-surface")}>{c.emoji} {s.immersion ? c.en : c.fr}</button>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4">
        {["", "A2", "B1", "B2", "C1", "C2"].map((l) => (
          <button key={l || "all"} onClick={() => setLevel(l)} className={cx("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", level === l ? "bg-ink-100 text-ink-700 dark:bg-ink-900/60 dark:text-ink-200" : "bg-surface-2 text-muted")}>{l || t("Tous niveaux", "All levels")}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((b) => {
          const mine = books.find((x) => x.gutenbergId === b.id);
          return (
            <button key={b.id} onClick={() => open(b.id)} className="card-shadow group flex flex-col overflow-hidden rounded-3xl border border-line/70 bg-surface text-left transition active:scale-[0.98]">
              <div className={cx("relative flex aspect-[3/4] flex-col justify-between bg-gradient-to-br p-3 text-white", COVER[b.cat])}>
                <span className="absolute right-2 top-2 rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-bold backdrop-blur">{b.level}</span>
                <span className="text-2xl">{LIBRARY_CATEGORIES.find((c) => c.id === b.cat)?.emoji}</span>
                <span>
                  <span className="line-clamp-4 block text-[15px] font-bold leading-snug drop-shadow" style={{ fontFamily: "var(--font-display)" }}>{b.title}</span>
                  <span className="mt-1 block truncate text-[11px] text-white/80">{b.author}</span>
                </span>
                {opening === b.id && <span className="absolute inset-0 flex items-center justify-center bg-black/30"><Spinner /></span>}
                {mine && <span className="absolute bottom-0 left-0 h-1.5 bg-sun-400" style={{ width: `${Math.max(4, Math.round(mine.progress * 100))}%` }} />}
              </div>
              <div className="flex flex-1 flex-col p-2.5">
                <span className="line-clamp-1 text-xs font-semibold text-ink-700 dark:text-ink-200">{b.titleFr}</span>
                {b.noteFr && <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{b.noteFr}</span>}
                <span className="mt-auto flex items-center justify-between pt-1.5 text-[11px] text-muted">
                  <span>⏱ {readingTime(b.words)}</span>
                  {mine ? <Badge tone="mint" className="text-[10px]">{t("Dans mes livres", "In my books")}</Badge> : null}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {!list.length && <p className="py-8 text-center text-sm text-muted">{t("Aucun livre ne correspond.", "No match.")}</p>}
      <p className="mt-5 text-center text-xs text-muted">{t("Œuvres du domaine public (Project Gutenberg), libres de droits en France et aux États-Unis. Les best-sellers récents sont protégés par le droit d'auteur : achetez-les en numérique et importez-les s'ils sont sans DRM.", "Public-domain works.")}</p>
    </div>
  );
}
