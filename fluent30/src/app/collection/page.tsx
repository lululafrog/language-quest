"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { buyShelfThing, getShelf, placeDecor } from "@/lib/game";
import { DECORS, SHELF_STYLES, unlockedShelves, BOOKS_PER_SHELF } from "@/lib/collection";
import { Bookshelf, shelfToPng } from "@/components/collection/Bookshelf";
import { DecorIcon } from "@/components/collection/Decor";
import { ReadingCard } from "@/components/collection/ReadingCard";
import { Coins, CoinIcon } from "@/components/game/Coin";
import { Button, EmptyState, LinkButton, PageHeader, Panel, Sheet, cx, toast } from "@/components/ui";

export default function CollectionPage() {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [tab, setTab] = useState<"shelf" | "cards">("shelf");
  const [sharing, setSharing] = useState(false);
  const data = useLiveQuery(async () => {
    const [entries, shelf] = await Promise.all([getDb().collection.toArray(), getShelf()]);
    return { entries, shelf };
  }, []);
  if (!data) return <div className="h-96 animate-pulse rounded-3xl bg-surface-2" />;
  const { entries, shelf } = data;
  const unlocked = unlockedShelves(entries.length);
  const shelves = Math.max(unlocked, Math.ceil(entries.length / BOOKS_PER_SHELF));
  const nextUnlock = unlocked < 8 ? 4 - (entries.length % 4) : 0;
  const ownedDecor = DECORS.filter((d) => shelf.decor.includes(d.id));

  const share = async () => {
    if (!svgRef.current) return;
    setSharing(true);
    try {
      const blob = await shelfToPng(svgRef.current);
      const file = new File([blob], "ma-bibliotheque-fluent30.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: "Ma bibliothèque en anglais", text: `${entries.length} livres lus en anglais avec Fluent30 📚` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        toast("Image de ta bibliothèque téléchargée");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast("Partage impossible sur cet appareil", "err");
    } finally {
      setSharing(false);
    }
  };

  const buy = async (kind: "decor" | "style", id: string, price: number) => {
    const r = await buyShelfThing(kind, id, price);
    if (!r.ok) toast(r.reason ?? "Achat impossible", "err");
    else toast(kind === "style" ? "Style appliqué ✨" : "Décoration achetée ! Touche un emplacement pour la poser.");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Ma collection" subtitle="Chaque livre terminé rejoint tes étagères." back="/library" action={<Coins amount={shelf.coins} className="text-base" />} />

      <div className="flex gap-2">
        {(["shelf", "cards"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cx("rounded-full px-4 py-2 text-sm font-semibold", tab === t ? "bg-ink-600 text-white shadow-md" : "bg-surface-2 text-muted")}>{t === "shelf" ? "📚 Étagères" : "🃏 Cartes de lecture"}</button>
        ))}
      </div>

      {tab === "shelf" && (
        <>
          <div className="overflow-hidden rounded-3xl shadow-xl">
            <Bookshelf ref={svgRef} entries={entries} style={shelf.style} placed={shelf.placed} shelves={shelves} editable onBook={(e) => router.push(`/collection/${encodeURIComponent(e.bookId)}`)} onSlot={setSlot} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
            <span>{entries.length} livre{entries.length > 1 ? "s" : ""} terminé{entries.length > 1 ? "s" : ""} · {unlocked} étagère{unlocked > 1 ? "s" : ""}{nextUnlock ? ` · encore ${nextUnlock} livre${nextUnlock > 1 ? "s" : ""} pour une nouvelle étagère` : ""}</span>
            <Button size="sm" variant="outline" onClick={share} loading={sharing}>Partager ma bibliothèque</Button>
          </div>
          {!entries.length && (
            <EmptyState icon="📖" title="Tes étagères attendent leur premier livre">
              Termine un livre pour le voir apparaître ici, avec sa carte de lecture.
              <div className="mt-3"><LinkButton href="/library" size="sm">Choisir un livre</LinkButton></div>
            </EmptyState>
          )}

          <Panel>
            <h2 className="mb-3 font-semibold">Style des étagères</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {SHELF_STYLES.map((st) => {
                const owned = st.price === 0 || shelf.decor.includes(`style:${st.id}`);
                const active = shelf.style === st.id;
                return (
                  <button key={st.id} onClick={() => buy("style", st.id, owned ? 0 : st.price)} className={cx("rounded-2xl border-2 p-2 text-left transition active:scale-95", active ? "border-ink-500" : "border-line")}>
                    <div className="h-12 rounded-lg" style={{ background: `linear-gradient(${st.back}, ${st.back}) top/100% 70% no-repeat, linear-gradient(${st.board}, ${st.edge})`, boxShadow: st.glow ? `0 0 12px ${st.glow}` : undefined }} />
                    <p className="mt-1.5 text-xs font-semibold">{st.fr}</p>
                    <p className="flex items-center gap-1 text-[11px] text-muted">{active ? "Actif" : owned ? "Possédé" : <>{st.price}<CoinIcon size={12} /></>}</p>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <h2 className="mb-1 font-semibold">Décorations</h2>
            <p className="mb-3 text-sm text-muted">Achète un objet, puis touche un emplacement en pointillés sur une étagère pour le poser.</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {DECORS.map((d) => {
                const owned = shelf.decor.includes(d.id);
                return (
                  <button key={d.id} onClick={() => (owned ? toast("Touche un emplacement libre pour la poser", "info") : buy("decor", d.id, d.price))} className="rounded-2xl border border-line bg-surface p-2 text-center transition active:scale-95">
                    <DecorIcon id={d.id} className="mx-auto h-12 w-12" />
                    <p className="mt-1 text-[11px] font-medium leading-tight">{d.fr}</p>
                    <p className="flex items-center justify-center gap-1 text-[11px] text-muted">{owned ? "Possédé" : <>{d.price}<CoinIcon size={12} /></>}</p>
                  </button>
                );
              })}
            </div>
          </Panel>
        </>
      )}

      {tab === "cards" && (
        entries.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[...entries].sort((a, b) => b.finishedAt - a.finishedAt).map((e) => (
              <Link key={e.bookId} href={`/collection/${encodeURIComponent(e.bookId)}`}><ReadingCard entry={e} /></Link>
            ))}
          </div>
        ) : (
          <EmptyState icon="🃏" title="Aucune carte pour l'instant">Chaque livre terminé te donne une carte : bronze, argent, or ou holo selon sa longueur et son niveau.</EmptyState>
        )
      )}

      <Sheet open={!!slot} onClose={() => setSlot(null)} title="Poser une décoration">
        {ownedDecor.length ? (
          <div className="grid grid-cols-3 gap-2">
            {ownedDecor.map((d) => (
              <button key={d.id} onClick={async () => { await placeDecor(slot!, d.id); setSlot(null); }} className="rounded-2xl border border-line p-2 text-center hover:border-ink-300">
                <DecorIcon id={d.id} className="mx-auto h-14 w-14" />
                <p className="mt-1 text-xs">{d.fr}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Tu n&apos;as pas encore de décoration. Achètes-en une juste en dessous des étagères.</p>
        )}
        {slot && shelf.placed[slot] && <Button variant="ghost" className="mt-3 w-full" onClick={async () => { await placeDecor(slot, null); setSlot(null); }}>Retirer l&apos;objet</Button>}
      </Sheet>
    </div>
  );
}
