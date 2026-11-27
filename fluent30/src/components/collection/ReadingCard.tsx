// Collectible reading card (bronze / silver / gold / holo).
import { BookCover } from "@/components/library/BookCover";
import { LIBRARY } from "@/lib/data/library";
import type { CollectionEntry } from "@/lib/types";
import { cx } from "@/components/ui";

const FRAME: Record<CollectionEntry["card"], { label: string; ring: string; bg: string }> = {
  bronze: { label: "Bronze", ring: "from-[#B87333] via-[#E8A86A] to-[#8C5523]", bg: "from-[#3B2618] to-[#5A3A22]" },
  silver: { label: "Argent", ring: "from-[#9EA7B3] via-[#F1F4F8] to-[#7D8794]", bg: "from-[#28303B] to-[#3E4957]" },
  gold: { label: "Or", ring: "from-[#B8860B] via-[#FFE38A] to-[#A87400]", bg: "from-[#3A2A06] to-[#5C430E]" },
  holo: { label: "Holo", ring: "from-[#FF4FD8] via-[#5FD3B5] to-[#6A55F2]", bg: "from-[#1A1740] to-[#2E2A6B]" },
};

export function ReadingCard({ entry, className }: { entry: CollectionEntry; className?: string }) {
  const lib = entry.libraryId ? LIBRARY.find((b) => b.id === entry.libraryId) : undefined;
  const f = FRAME[entry.card];
  const date = new Date(entry.finishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  return (
    <div className={cx("relative rounded-[22px] bg-gradient-to-br p-[3px] shadow-xl", f.ring, className)}>
      <style>{`@keyframes holo-shift{0%{background-position:0% 50%}100%{background-position:200% 50%}}`}</style>
      <div className={cx("relative overflow-hidden rounded-[19px] bg-gradient-to-br p-3 text-white", f.bg)}>
        {entry.card === "holo" && (
          <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-screen" style={{ background: "linear-gradient(115deg,#ff4fd8,#5fd3b5,#ffd166,#6a55f2,#ff4fd8)", backgroundSize: "200% 100%", animation: "holo-shift 4s linear infinite" }} />
        )}
        <div className="relative flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] opacity-90">
          <span>Fluent30 · {f.label}</span>
          <span>{entry.level ?? lib?.level ?? ""}</span>
        </div>
        <div className="relative mx-auto mt-2 w-[62%] overflow-hidden rounded-lg shadow-lg">
          <BookCover book={{ title: entry.title, author: entry.author, cat: entry.cat, level: entry.level, cover: lib?.cover }} className="w-full" />
        </div>
        <p className="relative mt-2 line-clamp-2 text-center text-sm font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{entry.title}</p>
        {lib?.titleFr && <p className="relative line-clamp-1 text-center text-[11px] opacity-75">{lib.titleFr}</p>}
        <div className="relative mt-2 grid grid-cols-3 gap-1 text-center text-[10px]">
          <div className="rounded-lg bg-white/10 py-1"><b className="block text-xs">{Math.round(entry.stats.wordsRead / 1000)}k</b>mots lus</div>
          <div className="rounded-lg bg-white/10 py-1"><b className="block text-xs">{entry.stats.newWords}</b>mots notés</div>
          <div className="rounded-lg bg-white/10 py-1"><b className="block text-xs">{entry.times}×</b>lu</div>
        </div>
        <p className="relative mt-1.5 text-center text-[10px] opacity-70">Terminé le {date}</p>
      </div>
    </div>
  );
}
