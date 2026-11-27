"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { errorMessage } from "@/lib/api";
import { bookLengthLabel, deleteBook, downloadGutenberg, ensureGradedBook, importFile, searchGutenberg, ImportError, type GutenbergHit } from "@/lib/books";
import { GRADED_STORIES } from "@/lib/data/stories";
import { useT } from "@/hooks/useT";
import { useOnline } from "@/hooks/useOnline";
import { Badge, Button, EmptyState, ErrorNote, PageHeader, Panel, ProgressBar, Segmented, Spinner, cx, toast } from "@/components/ui";
import type { Book } from "@/lib/types";
import { CLASSICS, GUTENBERG_TOPICS } from "./classics";
import { Bookshop } from "@/components/library/Bookshop";

type Tab = "shop" | "mine" | "graded" | "gutenberg" | "import";
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export default function LibraryPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("shop");
  const books = useLiveQuery(() => getDb().books.toArray(), []);
  const recent = useMemo(() => (books ?? []).filter((b) => b.lastOpenedAt).sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0))[0], [books]);

  return (
    <div>
      <PageHeader title={t("Bibliothèque", "Library")} subtitle={t("Lisez en anglais : chaque mot est cliquable et peut rejoindre vos flashcards.", "Read in English: tap any word to translate it and save it.")} />

      {recent && tab !== "shop" && (
        <Link href={`/library/read/${encodeURIComponent(recent.id)}`} className="mb-5 block">
          <Panel className="flex items-center gap-4 bg-gradient-to-br from-ink-600 to-ink-800 text-white border-transparent">
            <BookCover book={recent} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-200">{t("Continuer la lecture", "Continue reading")}</p>
              <p className="mt-0.5 truncate text-lg font-semibold">{recent.title}</p>
              {recent.author && <p className="truncate text-sm text-ink-200">{recent.author}</p>}
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-sun-400" style={{ width: `${Math.round(recent.progress * 100)}%` }} /></div>
                <span className="text-xs tabular-nums text-ink-100">{Math.round(recent.progress * 100)} %</span>
              </div>
            </div>
          </Panel>
        </Link>
      )}

      <div className="mb-5 overflow-x-auto no-scrollbar">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "shop", label: t("📚 Librairie", "📚 Bookshop") },
            { value: "mine", label: t("Mes livres", "My books") },
            { value: "graded", label: t("Histoires graduées", "Graded stories") },
            { value: "gutenberg", label: t("Catalogue Gutenberg", "Gutenberg") },
            { value: "import", label: t("Importer", "Import") },
          ]}
        />
      </div>

      {tab === "shop" && <Bookshop books={books ?? []} />}
      {tab === "mine" && <MyBooks books={books} onGo={setTab} />}
      {tab === "graded" && <Graded books={books ?? []} />}
      {tab === "gutenberg" && <Gutenberg books={books ?? []} />}
      {tab === "import" && <Importer />}
    </div>
  );
}

function BookCover({ book, small }: { book: Pick<Book, "title" | "level" | "source">; small?: boolean }) {
  const hue = [...book.title].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className={cx("flex shrink-0 flex-col justify-between rounded-lg p-2 text-white shadow-md", small ? "h-20 w-14" : "h-24 w-[68px]")}
      style={{ background: `linear-gradient(160deg, hsl(${hue} 55% 50%), hsl(${(hue + 40) % 360} 55% 32%))` }}
      aria-hidden
    >
      <span className="line-clamp-3 text-[9px] font-semibold leading-tight">{book.title}</span>
      {book.level && <span className="self-end rounded bg-white/25 px-1 text-[9px] font-bold">{book.level}</span>}
    </div>
  );
}

function Filters({ level, setLevel, genre, setGenre, genres, length, setLength }: { level: string; setLevel: (v: string) => void; genre: string; setGenre: (v: string) => void; genres: string[]; length?: string; setLength?: (v: string) => void }) {
  const t = useT();
  const sel = "h-9 rounded-xl border border-line bg-surface px-3 text-sm";
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <select className={sel} value={level} onChange={(e) => setLevel(e.target.value)} aria-label={t("Niveau", "Level")}>
        <option value="">{t("Tous niveaux", "All levels")}</option>
        {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      <select className={sel} value={genre} onChange={(e) => setGenre(e.target.value)} aria-label={t("Genre", "Genre")}>
        <option value="">{t("Tous genres", "All genres")}</option>
        {genres.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
      {setLength && (
        <select className={sel} value={length} onChange={(e) => setLength(e.target.value)} aria-label={t("Longueur", "Length")}>
          <option value="">{t("Toutes longueurs", "Any length")}</option>
          <option value="court">{t("Court (< 5 000 mots)", "Short (< 5,000 words)")}</option>
          <option value="moyen">{t("Moyen (5 000 – 30 000)", "Medium (5,000–30,000)")}</option>
          <option value="long">{t("Long (> 30 000)", "Long (> 30,000)")}</option>
        </select>
      )}
    </div>
  );
}

function MyBooks({ books, onGo }: { books: Book[] | undefined; onGo: (t: Tab) => void }) {
  const t = useT();
  const [level, setLevel] = useState("");
  const [genre, setGenre] = useState("");
  const [length, setLength] = useState("");
  if (!books) return <div className="flex justify-center py-10"><Spinner /></div>;
  if (!books.length)
    return (
      <EmptyState icon="📚" title={t("Votre bibliothèque est vide", "Your library is empty")}>
        <p>{t("Commencez par une histoire adaptée à votre niveau, un classique gratuit ou importez vos fichiers.", "Start with a graded story, a free classic, or import your own files.")}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button size="sm" onClick={() => onGo("graded")}>{t("Histoires graduées", "Graded stories")}</Button>
          <Button size="sm" variant="secondary" onClick={() => onGo("shop")}>{t("Classiques gratuits", "Free classics")}</Button>
          <Button size="sm" variant="secondary" onClick={() => onGo("import")}>{t("Importer", "Import")}</Button>
        </div>
      </EmptyState>
    );
  const genres = [...new Set(books.map((b) => b.genre).filter(Boolean) as string[])];
  const list = books
    .filter((b) => (!level || b.level === level) && (!genre || b.genre === genre) && (!length || bookLengthLabel(b.words) === length))
    .sort((a, b) => (b.lastOpenedAt ?? b.createdAt) - (a.lastOpenedAt ?? a.createdAt));
  return (
    <>
      <Filters level={level} setLevel={setLevel} genre={genre} setGenre={setGenre} genres={genres} length={length} setLength={setLength} />
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((b) => (
          <Panel key={b.id} className="flex gap-3 p-3 sm:p-3">
            <Link href={`/library/read/${encodeURIComponent(b.id)}`}><BookCover book={b} small /></Link>
            <div className="min-w-0 flex-1">
              <Link href={`/library/read/${encodeURIComponent(b.id)}`} className="block">
                <p className="truncate font-medium">{b.title}</p>
                {b.author && <p className="truncate text-sm text-muted">{b.author}</p>}
              </Link>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {b.level && <Badge>{b.level}</Badge>}
                <Badge tone="gray">{b.source === "graded" ? t("Graduée", "Graded") : b.source === "gutenberg" ? "Gutenberg" : b.format.toUpperCase()}</Badge>
                {b.words ? <Badge tone="gray">{Math.round(b.words / 100) / 10}k {t("mots", "words")}</Badge> : null}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar value={b.progress} className="h-1.5" />
                <span className="text-xs tabular-nums text-muted">{Math.round(b.progress * 100)} %</span>
                <button
                  className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-coral-600"
                  aria-label={t("Supprimer", "Delete")}
                  onClick={async () => {
                    if (!confirm(t(`Supprimer « ${b.title} » de l'appareil ?`, `Delete “${b.title}” from this device?`))) return;
                    await deleteBook(b.id);
                    toast(t("Livre supprimé", "Book deleted"));
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                </button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
      {!list.length && <p className="py-6 text-center text-sm text-muted">{t("Aucun livre ne correspond à ces filtres.", "No books match these filters.")}</p>}
    </>
  );
}

function Graded({ books }: { books: Book[] }) {
  const t = useT();
  const router = useRouter();
  const [level, setLevel] = useState("");
  const [genre, setGenre] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const genres = [...new Set(GRADED_STORIES.map((s) => s.genre))];
  const list = GRADED_STORIES.filter((s) => (!level || s.level === level) && (!genre || s.genre === genre));
  return (
    <>
      <p className="mb-3 text-sm text-muted">{t("Des histoires originales écrites pour Fluent30, du niveau A1 au niveau C2.", "Original stories written for Fluent30, from A1 to C2.")}</p>
      <Filters level={level} setLevel={setLevel} genre={genre} setGenre={setGenre} genres={genres} />
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((s) => {
          const existing = books.find((b) => b.id === `graded:${s.id}`);
          const words = s.chapters.reduce((a, c) => a + c.paragraphs.join(" ").split(/\s+/).length, 0);
          return (
            <button
              key={s.id}
              disabled={busy === s.id}
              onClick={async () => {
                setBusy(s.id);
                try {
                  const b = await ensureGradedBook(s);
                  router.push(`/library/read/${encodeURIComponent(b.id)}`);
                } catch (e) {
                  toast(errorMessage(e), "err");
                  setBusy(null);
                }
              }}
              className="text-left"
            >
              <Panel className="flex h-full gap-3 p-3 transition hover:border-ink-300 sm:p-3">
                <BookCover book={{ title: s.title, level: s.level, source: "graded" }} small />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">{s.summaryFr}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge>{s.level}</Badge>
                    <Badge tone="gray">{s.genre}</Badge>
                    <Badge tone="gray">{s.chapters.length} {t("chap.", "ch.")} · {words} {t("mots", "words")}</Badge>
                    {existing && existing.progress > 0 && <Badge tone="mint">{Math.round(existing.progress * 100)} %</Badge>}
                  </div>
                </div>
                {busy === s.id && <Spinner className="h-4 w-4 self-center" />}
              </Panel>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Gutenberg({ books }: { books: Book[] }) {
  const t = useT();
  const online = useOnline();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<GutenbergHit[] | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);
  const [level, setLevel] = useState("");
  const [genre, setGenre] = useState("");

  const downloaded = new Set(books.filter((b) => b.gutenbergId).map((b) => b.gutenbergId));

  async function run(p = 1, tp = topic, query = q) {
    setLoading(true);
    setError("");
    try {
      const r = await searchGutenberg({ q: query.trim() || undefined, topic: tp || undefined, page: p });
      setResults(r.results);
      setHasNext(r.hasNext);
      setPage(p);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function download(id: number, hint?: { title?: string; author?: string; genre?: string }) {
    const existing = books.find((b) => b.gutenbergId === id);
    if (existing) return router.push(`/library/read/${encodeURIComponent(existing.id)}`);
    setDownloading(id);
    try {
      const b = await downloadGutenberg(id, hint);
      toast(t("Livre téléchargé : disponible hors ligne", "Downloaded — available offline"));
      router.push(`/library/read/${encodeURIComponent(b.id)}`);
    } catch (e) {
      toast(errorMessage(e), "err");
    } finally {
      setDownloading(null);
    }
  }

  const classics = CLASSICS.filter((c) => (!level || c.level === level) && (!genre || c.genre === genre));

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-surface-2 p-3 text-xs text-muted">
        📜 {t(
          "Project Gutenberg propose plus de 70 000 livres du domaine public. Fluent30 ne distribue que des œuvres libres de droits ; les livres protégés par le droit d'auteur ne sont pas proposés.",
          "Project Gutenberg offers 70,000+ public-domain books. Fluent30 only distributes copyright-free works."
        )}
      </div>

      <section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(1);
          }}
          className="flex gap-2"
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Titre ou auteur (ex. Sherlock, Austen…)", "Title or author (e.g. Sherlock, Austen…)")} className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3" />
          <Button type="submit" loading={loading} disabled={!online}>{t("Chercher", "Search")}</Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {GUTENBERG_TOPICS.map((g) => (
            <button
              key={g.topic}
              onClick={() => {
                const next = topic === g.topic ? "" : g.topic;
                setTopic(next);
                void run(1, next);
              }}
              disabled={!online}
              className={cx("rounded-full border px-3 py-1 text-sm transition", topic === g.topic ? "border-ink-600 bg-ink-600 text-white" : "border-line hover:bg-surface-2")}
            >
              {t(g.fr, g.en)}
            </button>
          ))}
        </div>
        {!online && <p className="mt-3 text-sm text-muted">{t("Hors ligne : la recherche est indisponible. Vos livres téléchargés restent lisibles.", "Offline: search unavailable. Downloaded books remain readable.")}</p>}
        <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>
        {results && (
          <div className="mt-4 space-y-2">
            {!results.length && <p className="text-sm text-muted">{t("Aucun résultat.", "No results.")}</p>}
            {results.map((r) => (
              <Panel key={r.id} className="flex items-center gap-3 p-3 sm:p-3">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-medium">{r.title}</p>
                  <p className="truncate text-sm text-muted">{r.authors.join(", ") || t("Auteur inconnu", "Unknown author")} · {r.downloads.toLocaleString()} {t("téléchargements", "downloads")}</p>
                </div>
                <Button size="sm" variant={downloaded.has(r.id) ? "secondary" : "primary"} loading={downloading === r.id} onClick={() => download(r.id, { title: r.title, author: r.authors[0], genre: GUTENBERG_TOPICS.find((g) => g.topic === topic)?.fr })}>
                  {downloaded.has(r.id) ? t("Lire", "Read") : t("Télécharger", "Download")}
                </Button>
              </Panel>
            ))}
            {(page > 1 || hasNext) && (
              <div className="flex justify-between pt-2">
                <Button size="sm" variant="ghost" disabled={page <= 1 || loading} onClick={() => run(page - 1)}>← {t("Précédent", "Previous")}</Button>
                <span className="self-center text-sm text-muted">{t("Page", "Page")} {page}</span>
                <Button size="sm" variant="ghost" disabled={!hasNext || loading} onClick={() => run(page + 1)}>{t("Suivant", "Next")} →</Button>
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">{t("Classiques recommandés", "Recommended classics")}</h2>
        <p className="mb-3 text-sm text-muted">{t("Niveau indicatif : les classiques emploient souvent un anglais plus ancien que l'anglais parlé actuel.", "Indicative level: classics often use older English than today's spoken English.")}</p>
        <Filters level={level} setLevel={setLevel} genre={genre} setGenre={setGenre} genres={[...new Set(CLASSICS.map((c) => c.genre))]} />
        <div className="grid gap-2 sm:grid-cols-2">
          {classics.map((c) => (
            <Panel key={c.id} className="flex items-center gap-3 p-3 sm:p-3">
              <BookCover book={{ title: c.title, level: c.level, source: "gutenberg" }} small />
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{c.title}</p>
                <p className="truncate text-sm text-muted">{c.author}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted">{c.noteFr}</p>
                <div className="mt-1 flex gap-1.5"><Badge>{c.level}</Badge><Badge tone="gray">{c.genre}</Badge></div>
              </div>
              <Button size="sm" variant={downloaded.has(c.id) ? "secondary" : "primary"} loading={downloading === c.id} disabled={!online && !downloaded.has(c.id)} onClick={() => download(c.id, { title: c.title, author: c.author, genre: c.genre })}>
                {downloaded.has(c.id) ? t("Lire", "Read") : t("Télécharger", "Get")}
              </Button>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  );
}

function Importer() {
  const t = useT();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  async function handle(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    setProgress(0);
    try {
      const b = await importFile(file, setProgress);
      toast(t(`« ${b.title} » importé`, `“${b.title}” imported`));
      router.push(`/library/read/${encodeURIComponent(b.id)}`);
    } catch (e) {
      setError(e instanceof ImportError ? e.message : `${t("Import impossible", "Import failed")} : ${errorMessage(e)}`);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handle(e.dataTransfer.files[0]);
        }}
        className={cx("flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition", drag ? "border-ink-500 bg-ink-50 dark:bg-ink-900/40" : "border-line")}
      >
        <div className="mb-3 text-4xl">📥</div>
        <p className="font-medium">{t("Glissez un fichier ici", "Drop a file here")}</p>
        <p className="mt-1 text-sm text-muted">EPUB · PDF · TXT — {t("60 Mo max.", "60 MB max.")}</p>
        <input ref={input} type="file" accept=".epub,.pdf,.txt,application/epub+zip,application/pdf,text/plain" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
        <Button className="mt-4" loading={busy} onClick={() => input.current?.click()}>{t("Choisir un fichier", "Choose a file")}</Button>
        {busy && progress > 0 && progress < 1 && <ProgressBar value={progress} className="mt-4 max-w-xs" />}
      </div>
      <ErrorNote>{error}</ErrorNote>
      <div className="rounded-xl bg-surface-2 p-3 text-xs text-muted space-y-1">
        <p>🔒 {t("Les fichiers restent sur votre appareil (et dans votre sauvegarde personnelle si la synchronisation est activée). Ils ne sont jamais partagés.", "Files stay on your device (and your personal backup if sync is on). They are never shared.")}</p>
        <p>⚖️ {t("N'importez que des livres que vous possédez légalement. Les livres protégés par DRM (Kindle, Adobe…) ne peuvent pas être lus.", "Only import books you legally own. DRM-protected books (Kindle, Adobe…) cannot be read.")}</p>
        <p>📄 {t("Les PDF scannés (images sans texte) ne sont pas pris en charge.", "Scanned PDFs (images without text) are not supported.")}</p>
      </div>
    </div>
  );
}
