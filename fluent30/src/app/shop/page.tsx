"use client";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { buyItem, getGame, saveAppearance, toggleEquip } from "@/lib/game";
import { CATEGORIES, SHOP_ITEMS, type ShopCategory } from "@/lib/data/shop";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { Badge, PageHeader, Panel, cx, toast } from "@/components/ui";
import { DEFAULT_APPEARANCE, Tourist } from "@/components/avatar/Tourist";
import { AppearanceEditor } from "@/components/avatar/AppearanceEditor";
import { Coins, CoinIcon } from "@/components/game/Coin";

const RARITY_TONE = { commun: "gray", rare: "ink", "épique": "coral", "légendaire": "sun" } as const;
type Tab = ShopCategory | "apparence" | "garde-robe";

export default function ShopPage() {
  const t = useT();
  const s = useSettings();
  const game = useLiveQuery(() => getGame(), []);
  const [tab, setTab] = useState<Tab>("casquettes");
  const [preview, setPreview] = useState<string | null>(null);
  const items = useMemo(() => {
    if (!game) return [];
    if (tab === "garde-robe") return SHOP_ITEMS.filter((i) => game.owned.includes(i.id));
    return SHOP_ITEMS.filter((i) => i.cat === tab).sort((a, b) => a.price - b.price);
  }, [tab, game]);
  if (!game) return null;
  const appearance = game.appearance ?? DEFAULT_APPEARANCE;

  const previewItem = preview ? SHOP_ITEMS.find((i) => i.id === preview) : null;
  const shown = previewItem
    ? { ...game.equipped, [previewItem.slot]: previewItem.id, ...(previewItem.slot === "dress" ? { top: undefined, bottom: undefined } : {}), ...(previewItem.slot === "top" || previewItem.slot === "bottom" ? { dress: undefined } : {}) }
    : game.equipped;

  const onItem = async (id: string) => {
    const it = SHOP_ITEMS.find((i) => i.id === id)!;
    if (it.unlock && !game.owned.includes(id)) {
      toast(t(`Débloqué en terminant ${it.unlock.fr} 📖`, `Unlocked by finishing ${it.unlock.en} 📖`), "info");
      setPreview(id);
      return;
    }
    if (game.owned.includes(id) || it.price === 0) {
      if (!game.owned.includes(id)) await buyItem(id);
      else await toggleEquip(id);
      setPreview(null);
      return;
    }
    if (preview !== id) return setPreview(id);
    const r = await buyItem(id);
    if (r.ok) {
      toast(t(`${it.fr} acheté ! 🎉`, `${it.en} bought! 🎉`));
      setPreview(null);
    } else toast(t(`Il te manque ${it.price - game.coins} pièces — fais tes quêtes du jour !`, `You need ${it.price - game.coins} more coins`), "err");
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "apparence", label: `🙂 ${t("Mon perso", "My character")}` },
    { id: "garde-robe", label: `🧳 ${t("Ma garde-robe", "My wardrobe")} (${game.owned.length})` },
    ...CATEGORIES.map((c) => ({ id: c.id as Tab, label: `${c.emoji} ${s.immersion ? c.en : c.fr}` })),
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("Boutique du touriste", "Tourist shop")} subtitle={t(`${SHOP_ITEMS.length} objets à gagner en pratiquant`, `${SHOP_ITEMS.length} items to earn by practising`)} back="/" action={<Coins amount={game.coins} className="text-base" />} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
        <div className="sticky top-2 z-10 md:top-6 md:self-start">
          <div className="mx-auto w-40 overflow-hidden rounded-3xl border border-line bg-surface shadow-lg sm:w-52 md:w-full">
            <Tourist equipped={shown} appearance={appearance} className="w-full" />
          </div>
          {previewItem && !game.owned.includes(previewItem.id) && (
            <Panel className="mx-auto mt-3 max-w-xs animate-pop text-center">
              <p className="font-semibold">{s.immersion ? previewItem.en : previewItem.fr}</p>
              {previewItem.unlock ? (
                <p className="mt-2 rounded-xl bg-coral-100 px-3 py-2 text-sm font-medium text-coral-600 dark:bg-coral-600/20">🔒 {t(`Débloqué en terminant ${previewItem.unlock.fr}`, `Unlocked by finishing ${previewItem.unlock.en}`)}</p>
              ) : (
                <button onClick={() => onItem(previewItem.id)} disabled={game.coins < previewItem.price} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-ink-500 to-ink-700 px-4 py-2.5 font-semibold text-white shadow-md disabled:opacity-50">
                  {t("Acheter", "Buy")} · {previewItem.price} <CoinIcon size={16} />
                </button>
              )}
              <button onClick={() => setPreview(null)} className="ml-2 text-sm text-muted underline">{t("Annuler", "Cancel")}</button>
              {!previewItem.unlock && game.coins < previewItem.price && <p className="mt-2 text-xs text-muted">{t(`Encore ${previewItem.price - game.coins} pièces à gagner`, `${previewItem.price - game.coins} more coins needed`)}</p>}
            </Panel>
          )}
        </div>
        <div className="min-w-0">
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {tabs.map((x) => (
              <button key={x.id} onClick={() => { setTab(x.id); setPreview(null); }} className={cx("shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium", tab === x.id ? "border-ink-500 bg-ink-600 text-white shadow-md shadow-ink-600/25" : "border-line bg-surface")}>
                {x.label}
              </button>
            ))}
          </div>
          {tab === "apparence" ? (
            <Panel>
              <p className="mb-3 text-sm text-muted">{t("Personnalise ton perso gratuitement, autant de fois que tu veux.", "Customise your character for free.")}</p>
              <AppearanceEditor value={appearance} onChange={(a) => void saveAppearance(a)} />
            </Panel>
          ) : (
            <>
              {tab === "garde-robe" && !items.length && <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">{t("Ta garde-robe est vide. Fais tes quêtes du jour pour gagner des pièces !", "Your wardrobe is empty.")}</p>}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {items.map((it) => {
                  const owned = game.owned.includes(it.id);
                  const worn = game.equipped[it.slot] === it.id;
                  const eq = { background: it.slot === "background" ? it.id : "bg-home", [it.slot]: it.id };
                  return (
                    <button key={it.id} onClick={() => onItem(it.id)} className={cx("card-shadow relative overflow-hidden rounded-2xl border bg-surface text-left transition active:scale-[0.98]", worn ? "border-mint-500 ring-2 ring-mint-400/40" : preview === it.id ? "border-ink-500 ring-2 ring-ink-400/40" : "border-line/70 hover:border-ink-300")}>
                      <Tourist equipped={eq} appearance={appearance} animate={false} className="w-full" title={it.fr} />
                      <div className="p-2.5">
                        <p className="line-clamp-2 min-h-[2.4em] text-[13px] font-medium leading-snug">{s.immersion ? it.en : it.fr}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          {owned ? <span className="text-xs font-semibold text-mint-600">{worn ? t("Porté ✓", "Worn ✓") : t("Possédé", "Owned")}</span> : it.unlock ? <span className="text-[11px] font-semibold leading-tight text-coral-600">🔒 {t(`En terminant ${it.unlock.fr}`, `Finish ${it.unlock.en}`)}</span> : it.price === 0 ? <span className="text-xs font-semibold text-mint-600">{t("Gratuit", "Free")}</span> : <span className="flex items-center gap-1 text-sm font-bold">{it.price}<CoinIcon size={14} /></span>}
                          <Badge tone={RARITY_TONE[it.rarity]} className="text-[10px]">{it.rarity}</Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-center text-xs text-muted">{t("Touche un objet pour l'essayer, puis encore une fois pour l'acheter. Touche un objet possédé pour le mettre ou l'enlever.", "Tap to try on, tap again to buy.")}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
