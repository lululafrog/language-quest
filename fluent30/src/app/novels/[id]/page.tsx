"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { deleteNovel, novelPitch, wovenWords, writeNextChapter } from "@/lib/novels";
import { errorMessage } from "@/lib/api";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { Badge, Button, EmptyState, ErrorNote, LinkButton, PageHeader, Panel, ProgressBar, Spinner, cx, toast } from "@/components/ui";
import { NovelCover } from "@/components/novels/NovelCover";
import { AiRequired } from "@/components/novels/AiRequired";

export default function NovelPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const router = useRouter();
  const status = useStatus();
  const data = useLiveQuery(async () => {
    const db = getDb();
    const novel = await db.novels.get(id);
    if (!novel) return null;
    return { novel, book: await db.books.get(novel.bookId) };
  }, [id]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [custom, setCustom] = useState("");
  const [woven, setWoven] = useState<Record<number, string[]>>({});
  const [pitch, setPitch] = useState("");

  useEffect(() => {
    // localStorage-only data (not synced): words woven into each chapter and the French pitch.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once per novel / chapter count
    setWoven(wovenWords(id));
    setPitch(novelPitch(id));
  }, [id, data?.novel.chapters.length]);

  if (data === undefined) return <div className="h-96 animate-pulse rounded-3xl bg-surface-2" />;
  if (data === null) return <EmptyState icon="🔍" title={t("Roman introuvable", "Novel not found")}><LinkButton href="/novels" size="sm" className="mt-3">{t("Mes romans", "My novels")}</LinkButton></EmptyState>;

  const { novel, book } = data;
  const done = novel.chapters.length >= novel.prefs.chapters;
  const last = novel.chapters[novel.chapters.length - 1];
  const needsChoice = novel.prefs.interactive && !done && !!last?.choices?.length && !last.chosen;

  const next = async (chosen?: string) => {
    setBusy(true);
    setError("");
    try {
      await writeNextChapter(novel.id, chosen);
      setCustom("");
      toast(t("Nouveau chapitre écrit ✨", "New chapter written ✨"));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const readHref = `/library/read/${encodeURIComponent(novel.bookId)}`;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={novel.title} subtitle={novel.cover.subtitle} back="/novels" />
      <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
        <div>
          <div className="card-shadow mx-auto w-44 overflow-hidden rounded-2xl sm:w-full"><NovelCover novel={novel} className="block w-full" /></div>
          {book && (
            <div className="mt-3">
              <ProgressBar value={book.progress} tone="mint" />
              <p className="mt-1 text-center text-xs text-muted">{Math.round(book.progress * 100)} % {t("lu", "read")}</p>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {pitch && <p className="text-[15px] leading-relaxed">{pitch}</p>}
          <div className="flex flex-wrap gap-1.5">
            <Badge>{novel.prefs.level}</Badge>
            <Badge tone="gray">{novel.prefs.genre}</Badge>
            <Badge tone="gray">{novel.prefs.setting}</Badge>
            <Badge tone="gray">{novel.prefs.era}</Badge>
            {novel.prefs.interactive && <Badge tone="coral">🔀 {t("interactif", "interactive")}</Badge>}
          </div>
          <p className="text-sm text-muted">{t(`${novel.chapters.length} chapitre(s) écrit(s) sur ${novel.prefs.chapters}`, `${novel.chapters.length} of ${novel.prefs.chapters} chapters written`)}</p>
          <div className="flex flex-wrap gap-2">
            {novel.chapters.length > 0 && <LinkButton href={readHref}>📖 {t("Lire", "Read")}</LinkButton>}
            {!done && !needsChoice && status?.ai && <Button variant="outline" onClick={() => next()} loading={busy}>✍️ {t("Écrire le chapitre suivant", "Write next chapter")}</Button>}
          </div>
          {done && <p className="rounded-xl bg-mint-100 px-3 py-2 text-sm text-mint-600 dark:bg-mint-600/15">🏁 {t("Ton roman est terminé ! Bonne lecture.", "Your novel is complete! Enjoy.")}</p>}
          {busy && <p className="flex items-center gap-2 text-sm text-muted"><Spinner className="h-4 w-4" /> {t("L'IA écrit la suite de ton histoire… (jusqu'à une minute)", "Writing the next chapter…")}</p>}
          <ErrorNote>{error}</ErrorNote>
        </div>
      </div>

      {status && !status.ai && !done && <div className="mt-5"><AiRequired /></div>}

      {needsChoice && status?.ai && (
        <Panel className="mt-5 border-coral-300 bg-gradient-to-br from-coral-100/60 to-transparent dark:from-coral-600/10">
          <p className="font-bold" style={{ fontFamily: "var(--font-display)" }}>🔀 {t("À toi de décider : que fait ton héros ?", "Your call: what does your hero do?")}</p>
          <p className="mb-3 text-sm text-muted">{t("Lis d'abord le dernier chapitre, puis choisis. La suite sera écrite selon ta décision.", "Read the last chapter, then choose.")}</p>
          <div className="grid gap-2">
            {last!.choices!.map((c) => (
              <button key={c} disabled={busy} onClick={() => next(c)} className="rounded-2xl border-2 border-line bg-surface px-4 py-3 text-left font-medium transition hover:border-coral-400 active:scale-[0.99] disabled:opacity-50">{c}</button>
            ))}
          </div>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) void next(custom.trim()); }}>
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={t("…ou écris ton propre choix (en anglais)", "…or write your own choice")} className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-ink-400" />
            <Button type="submit" size="sm" disabled={busy || !custom.trim()}>OK</Button>
          </form>
        </Panel>
      )}

      <h2 className="mb-3 mt-7 text-lg font-bold">{t("Chapitres", "Chapters")}</h2>
      <ol className="space-y-2">
        {novel.chapters.map((c, i) => (
          <li key={i}>
            <Panel className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{i + 1}. {c.title}</p>
                  <p className="mt-1 text-sm text-muted">{c.summary}</p>
                  {c.chosen && <p className="mt-1.5 text-xs text-coral-600">🔀 {t("Ton choix :", "Your choice:")} « {c.chosen} »</p>}
                  {woven[i]?.length ? (
                    <p className="mt-1.5 text-xs text-ink-700 dark:text-ink-200">🧠 {t("Mots à retenir glissés dans ce chapitre :", "Practice words woven in:")} {woven[i].join(", ")}</p>
                  ) : null}
                </div>
                <span className={cx("shrink-0 text-xs text-muted")}>{c.text.split(/\s+/).length} {t("mots", "words")}</span>
              </div>
            </Panel>
          </li>
        ))}
      </ol>
      {!novel.chapters.length && <p className="text-sm text-muted">{t("Aucun chapitre écrit pour l'instant.", "No chapter yet.")}</p>}

      <div className="mt-8 flex justify-end">
        <Button variant="danger" size="sm" onClick={async () => { if (confirm(t("Supprimer ce roman et sa progression ?", "Delete this novel?"))) { await deleteNovel(novel.id); router.push("/novels"); } }}>{t("Supprimer", "Delete")}</Button>
      </div>
      <p className="mt-4 text-center text-xs text-muted">{t("Roman écrit par l'IA pour toi seul·e : il reste sur ton appareil et n'est partagé avec personne.", "Written for you only; stays on your device.")} <Link href="/library" className="underline">{t("Bibliothèque", "Library")}</Link></p>
    </div>
  );
}
