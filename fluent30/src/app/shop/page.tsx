"use client";
// Travel wardrobe ("dressing"): live preview, try-on before buying, categories & collections,
// items earned by real progress, and up to 5 saved favourite outfits.
import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  buyItem, checkEarnedItems, deleteOutfit, earnValue, getGame, MAX_OUTFITS, progressStats, saveAppearance, saveOutfit, toggleEquip, undressAll, wearOutfit,
} from "@/lib/game";
import { CATEGORIES, COLLECTIONS, SHOP_ITEMS, type Collection, type ShopCategory, type ShopItem } from "@/lib/data/shop";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { Badge, Button, FilterChips, PageHeader, Panel, ProgressBar, Segmented, cx, toast } from "@/components/ui";
import { DEFAULT_APPEARANCE, Tourist } from "@/components/avatar/Tourist";
import { AppearanceEditor } from "@/components/avatar/AppearanceEditor";
import { Coins, CoinIcon } from "@/components/game/Coin";
import type { AvatarSlot } from "@/lib/types";

type Mode = "garde-robe" | "tenues" | "perso";
type CatFilter = ShopCategory | "tout" | "possedes";

const RARITY_TONE = { commun: "gray", rare: "ink", "épique": "coral", "légendaire": "sun" } as const;

/** Equipped set with one item tried on (dress replaces top & bottom and vice versa). */
function withTry(eq: Partial<Record<AvatarSlot, string>>, it: ShopItem | null) {
  if (!it) return eq;
  const next = { ...eq, [it.slot]: it.id };
  if (it.slot === "dress") {
    delete next.top;
    delete next.bottom;
  }
  if (it.slot === "top" || it.slot === "bottom") delete next.dress;
  return next;
}

export default function ShopPage() {
  const t = useT();
  const s = useSettings();
  const game = useLiveQuery(() => getGame(), []);
  const stats = useLiveQuery(() => progressStats(), []);
  const [mode, setMode] = useState<Mode>("garde-robe");
  const [cat, setCat] = useState<CatFilter>("tout");
  const [col, setCol] = useState<Collection | "">("");
  const [trying, setTrying] = useState<string | null>(null);
  const [outfitName, setOutfitName] = useState("");
  const name = (it: { fr: string; en: string }) => (s.immersion ? it.en : it.fr);

  // Grant items earned by real progress (missions, lessons, words, books, regularity).
  useEffect(() => {
    void checkEarnedItems().then((fresh) => {
      for (const it of fresh) toast(t(`Nouvel objet gagné : ${it.fr}`, `New item earned: ${it.en}`));
    });
  }, [t]);

  const items = useMemo(() => {
    if (!game) return [];
    let list = SHOP_ITEMS;
    if (cat === "possedes") list = list.filter((i) => game.owned.includes(i.id));
    else if (cat !== "tout") list = list.filter((i) => i.cat === cat);
    if (col) list = list.filter((i) => i.col === col);
    const order = (i: ShopItem) => (game.owned.includes(i.id) ? 0 : i.earn || i.unlock ? 2 : 1);
    return [...list].sort((a, b) => order(a) - order(b) || a.price - b.price);
  }, [game, cat, col]);

  if (!game) return <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-3xl bg-surface-2" />;
  const appearance = game.appearance ?? DEFAULT_APPEARANCE;
  const tryItem = trying ? SHOP_ITEMS.find((i) => i.id === trying) ?? null : null;
  const shown = withTry(game.equipped, tryItem);
  const owned = (id: string) => game.owned.includes(id);

  const lockText = (it: ShopItem) => {
    if (it.unlock) return t(`En terminant ${it.unlock.fr}`, `Finish ${it.unlock.en}`);
    if (it.earn) return name(it.earn);
    return "";
  };
  const earnProgress = (it: ShopItem) => (it.earn && stats ? { value: Math.min(it.earn.n, earnValue(it.earn, stats)), max: it.earn.n } : null);

  const act = async (it: ShopItem) => {
    if (owned(it.id)) {
      await toggleEquip(it.id);
      setTrying(null);
      return;
    }
    if (it.unlock || it.earn) return;
    const r = await buyItem(it.id);
    if (r.ok) {
      toast(t(`${it.fr} rejoint ta garde-robe`, `${it.en} added to your wardrobe`));
      setTrying(null);
    } else toast(t(`Il te manque ${it.price - game.coins} pièces`, `You need ${it.price - game.coins} more coins`), "err");
  };

  const catOptions: { value: CatFilter; label: string }[] = [
    { value: "tout", label: t("Tout", "All") },
    { value: "possedes", label: t(`Possédés (${game.owned.length})`, `Owned (${game.owned.length})`) },
    ...CATEGORIES.map((c) => ({ value: c.id as CatFilter, label: name(c) })),
  ];
  const colOptions: { value: Collection | ""; label: string }[] = [{ value: "", label: t("Toutes les collections", "All collections") }, ...COLLECTIONS.map((c) => ({ value: c.id as Collection | "", label: name(c) }))];

  const tryPanel = tryItem && (
    <div className="min-w-0 flex-1 animate-fade space-y-2">
      <p className="text-[15px] font-semibold leading-snug">{name(tryItem)}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={RARITY_TONE[tryItem.rarity]} className="text-[10px]">{tryItem.rarity}</Badge>
        {tryItem.col && <Badge tone="gray" className="text-[10px]">{name(COLLECTIONS.find((c) => c.id === tryItem.col)!)}</Badge>}
      </div>
      {owned(tryItem.id) ? (
        <Button size="sm" className="w-full" onClick={() => act(tryItem)}>{game.equipped[tryItem.slot] === tryItem.id ? t("Enlever", "Take off") : t("Mettre", "Wear")}</Button>
      ) : tryItem.unlock || tryItem.earn ? (
        <div className="rounded-xl bg-surface-2 p-2.5 text-[13px]">
          <p className="font-medium">{t("À gagner :", "To earn:")} {lockText(tryItem)}</p>
          {earnProgress(tryItem) && <ProgressBar value={earnProgress(tryItem)!.value} max={earnProgress(tryItem)!.max} tone="mint" className="mt-1.5" />}
          {earnProgress(tryItem) && <p className="mt-1 text-xs text-muted tabular-nums">{earnProgress(tryItem)!.value} / {earnProgress(tryItem)!.max}</p>}
        </div>
      ) : (
        <Button size="sm" className="w-full" disabled={game.coins < tryItem.price} onClick={() => act(tryItem)}>
          {t("Acheter", "Buy")} · {tryItem.price} <CoinIcon size={14} />
        </Button>
      )}
      {!owned(tryItem.id) && !tryItem.unlock && !tryItem.earn && game.coins < tryItem.price && <p className="text-xs text-muted">{t(`Encore ${tryItem.price - game.coins} pièces à gagner en pratiquant`, `${tryItem.price - game.coins} more coins to earn`)}</p>}
      <button type="button" onClick={() => setTrying(null)} className="text-xs font-medium text-muted underline">{t("Arrêter l'essayage", "Stop trying on")}</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t("Dressing de voyage", "Travel wardrobe")} subtitle={t("Essaie, achète ou gagne des tenues en progressant", "Try on, buy or earn outfits as you progress")} back="/profile" action={<Coins amount={game.coins} className="text-base" />} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
        {/* live preview */}
        <div className="sticky top-2 z-10 md:top-6 md:self-start">
          <Panel className="flex items-start gap-3 p-3 md:flex-col md:items-stretch">
            <div className="w-28 shrink-0 overflow-hidden rounded-2xl sm:w-36 md:w-full">
              <Tourist equipped={shown} appearance={appearance} animate={!s.reduceMotion} className="w-full" />
            </div>
            {tryPanel ?? (
              <div className="min-w-0 flex-1 space-y-2 text-[13px] text-muted md:text-center">
                <p>{t("Touche un objet pour l'essayer sur ton personnage.", "Tap an item to try it on.")}</p>
                <button type="button" onClick={() => void undressAll()} className="font-medium underline">{t("Tout enlever", "Take everything off")}</button>
              </div>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-3">
          <Segmented<Mode>
            value={mode}
            onChange={(m) => { setMode(m); setTrying(null); }}
            options={[
              { value: "garde-robe", label: t("Garde-robe", "Wardrobe") },
              { value: "tenues", label: t(`Mes tenues (${game.outfits?.length ?? 0})`, `My outfits (${game.outfits?.length ?? 0})`) },
              { value: "perso", label: t("Mon perso", "My character") },
            ]}
            className="w-full"
          />

          {mode === "perso" && (
            <Panel>
              <p className="mb-3 text-sm text-muted">{t("Personnalise ton personnage gratuitement, autant de fois que tu veux.", "Customise your character for free, as often as you like.")}</p>
              <AppearanceEditor value={appearance} onChange={(a) => void saveAppearance(a)} />
            </Panel>
          )}

          {mode === "tenues" && (
            <div className="space-y-3">
              <Panel className="space-y-2">
                <p className="text-sm font-semibold">{t("Enregistrer la tenue actuelle", "Save the current outfit")}</p>
                <form
                  className="flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const r = await saveOutfit(outfitName);
                    if (r.ok) {
                      setOutfitName("");
                      toast(t("Tenue enregistrée", "Outfit saved"));
                    } else toast(r.reason ?? "", "err");
                  }}
                >
                  <input value={outfitName} onChange={(e) => setOutfitName(e.target.value)} maxLength={30} placeholder={t("Nom (ex. Plage à Bali)", "Name (e.g. Bali beach)")} className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-[15px] outline-none focus:border-ink-400" />
                  <Button type="submit" size="sm" disabled={(game.outfits?.length ?? 0) >= MAX_OUTFITS}>{t("Enregistrer", "Save")}</Button>
                </form>
                <p className="text-xs text-muted">{t(`Jusqu'à ${MAX_OUTFITS} tenues favorites.`, `Up to ${MAX_OUTFITS} favourite outfits.`)}</p>
              </Panel>
              {!game.outfits?.length ? (
                <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">{t("Aucune tenue enregistrée pour l'instant.", "No saved outfit yet.")}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {game.outfits.map((o) => {
                    const worn = JSON.stringify(o.equipped) === JSON.stringify(game.equipped);
                    return (
                      <div key={o.id} className={cx("overflow-hidden rounded-2xl border bg-surface", worn ? "border-mint-500" : "border-line")}>
                        <Tourist equipped={o.equipped} appearance={appearance} animate={false} className="w-full" title={o.name} />
                        <div className="space-y-2 p-2.5">
                          <p className="truncate text-[14px] font-semibold">{o.name}</p>
                          <div className="flex gap-1.5">
                            <Button size="sm" className="flex-1" variant={worn ? "secondary" : "primary"} onClick={() => void wearOutfit(o.id)}>{worn ? t("Portée", "Worn") : t("Porter", "Wear")}</Button>
                            <Button size="sm" variant="ghost" aria-label={t(`Supprimer ${o.name}`, `Delete ${o.name}`)} onClick={() => void deleteOutfit(o.id)}>✕</Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {mode === "garde-robe" && (
            <>
              <FilterChips<CatFilter> value={cat} onChange={(c) => setCat(c)} options={catOptions} />
              <FilterChips<Collection | ""> value={col} onChange={(c) => setCol(c)} options={colOptions} className="[&>button]:py-1 [&>button]:text-[13px]" />
              {!items.length && <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">{t("Rien ici pour l'instant.", "Nothing here yet.")}</p>}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((it) => {
                  const own = owned(it.id);
                  const worn = game.equipped[it.slot] === it.id;
                  const locked = !own && (it.unlock || it.earn);
                  const pr = earnProgress(it);
                  return (
                    <button
                      type="button"
                      key={it.id}
                      onClick={() => (trying === it.id && own ? act(it) : setTrying(it.id))}
                      className={cx(
                        "relative min-w-0 overflow-hidden rounded-2xl border bg-surface text-left transition active:scale-[0.98]",
                        worn ? "border-mint-500 ring-2 ring-mint-400/40" : trying === it.id ? "border-ink-500 ring-2 ring-ink-400/40" : "border-line hover:border-ink-300",
                      )}
                    >
                      <div className={cx("grid h-28 place-items-center bg-surface-2/60 p-1.5", locked && "opacity-60 grayscale-[35%]")}>
                        <Tourist mannequin={it.slot} equipped={{ [it.slot]: it.id }} animate={false} className="h-full w-full" title={name(it)} />
                      </div>
                      <div className="p-2.5">
                        <p className="line-clamp-2 min-h-[2.5em] text-[13px] font-medium leading-snug">{name(it)}</p>
                        <div className="mt-1.5 flex min-h-5 items-center justify-between gap-1">
                          {own ? (
                            <span className="text-xs font-semibold text-mint-600">{worn ? t("Porté", "Worn") : t("Possédé", "Owned")}</span>
                          ) : locked ? (
                            <span className="line-clamp-2 text-[11px] font-medium leading-tight text-muted">{lockText(it)}</span>
                          ) : it.price === 0 ? (
                            <span className="text-xs font-semibold text-mint-600">{t("Gratuit", "Free")}</span>
                          ) : (
                            <span className={cx("flex items-center gap-1 text-sm font-semibold tabular-nums", game.coins < it.price && "text-muted")}>{it.price}<CoinIcon size={14} /></span>
                          )}
                          {!locked && <Badge tone={RARITY_TONE[it.rarity]} className="shrink-0 text-[10px]">{it.rarity}</Badge>}
                        </div>
                        {locked && pr && <ProgressBar value={pr.value} max={pr.max} tone="mint" className="mt-1.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="pt-1 text-center text-xs text-muted">{t("Les objets exclusifs se gagnent en réussissant des missions, des cours, des livres ou en mémorisant des mots — jamais en payant.", "Exclusive items are earned through missions, lessons, books and memorised words — never paid for.")}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
