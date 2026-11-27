import { BookCover } from "@/components/library/BookCover";
import type { Novel } from "@/lib/types";

export function NovelCover({ novel, className }: { novel: Pick<Novel, "title" | "cover" | "prefs">; className?: string }) {
  const p = novel.cover.palette;
  return (
    <BookCover
      className={className}
      book={{ title: novel.title, author: novel.cover.subtitle ?? "Mon roman", level: novel.prefs.level, cover: { palette: [p[0] ?? "#4a32bb", p[1] ?? "#ff7a6b", p[2] ?? "#ffd166"], motif: novel.cover.motif } }}
    />
  );
}
