"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { EmptyState, LinkButton, PageHeader, ProgressBar } from "@/components/ui";
import { NovelCover } from "@/components/novels/NovelCover";
import { AiRequired } from "@/components/novels/AiRequired";

export default function NovelsPage() {
  const t = useT();
  const status = useStatus();
  const data = useLiveQuery(async () => {
    const db = getDb();
    const novels = await db.novels.orderBy("updatedAt").reverse().toArray();
    const books = await db.books.bulkGet(novels.map((n) => n.bookId));
    return novels.map((n, i) => ({ novel: n, book: books[i] }));
  }, []);

  return (
    <div>
      <PageHeader
        title={t("Mes romans sur mesure", "My personal novels")}
        subtitle={t("Une histoire écrite pour toi, à ton niveau, qui réutilise les mots que tu as du mal à retenir.", "A story written for you, at your level, using the words you struggle with.")}
        back="/library"
        action={status?.ai ? <LinkButton href="/novels/new" size="sm">✨ {t("Créer", "Create")}</LinkButton> : undefined}
      />
      {status && !status.ai && <div className="mb-5"><AiRequired /></div>}

      {data && !data.length && (
        <EmptyState icon="📖" title={t("Aucun roman pour l'instant", "No novel yet")}>
          {t("Choisis un genre, un lieu, une époque et ton héros : l'IA écrit ton roman chapitre par chapitre, à ton niveau d'anglais.", "Pick a genre, a place, an era and your hero.")}
          {status?.ai && <div className="mt-4"><LinkButton href="/novels/new">✨ {t("Créer mon premier roman", "Create my first novel")}</LinkButton></div>}
        </EmptyState>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data?.map(({ novel, book }) => (
          <Link key={novel.id} href={`/novels/${novel.id}`} className="group block">
            <div className="card-shadow overflow-hidden rounded-2xl transition group-hover:-translate-y-1">
              <NovelCover novel={novel} className="block w-full" />
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{novel.title}</p>
            <p className="text-xs text-muted">
              {novel.prefs.level} · {t(`${novel.chapters.length}/${novel.prefs.chapters} chapitres`, `${novel.chapters.length}/${novel.prefs.chapters} chapters`)}
              {novel.prefs.interactive ? " · 🔀" : ""}
            </p>
            <ProgressBar value={book?.progress ?? 0} tone="mint" className="mt-1.5 h-1.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
