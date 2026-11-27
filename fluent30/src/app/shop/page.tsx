"use client";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { DEFAULT_GAME, buyItem, toggleEquip } from "@/lib/game";
import { SHOP_ITEMS, SLOT_LABELS } from "@/lib/data/shop";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { Badge, PageHeader, Panel, cx, toast } from "@/components/ui";
import { Tourist } from "@/components/avatar/Tourist";
import { Coins, CoinIcon } from "@/components/game/Coin";
import type { AvatarSlot } from "@/lib/types";

const SLOTS = Object.keys(SLOT_LABELS) as AvatarSlot[];
const RARITY_TONE = { commun: "gray", rare: "ink", "épique": "coral", "légendaire": "sun" } as const;

export default function ShopPage() {
  const t = useT();
  const s = useSettings();
  const game = useLiveQuery(async () => (await getDb().game.get("me")) ?? DEFAULT_GAME, []);
  const [slot, setSlot] = useState<AvatarSlot>("top");
  const [preview, setPreview] = useState<string | null>(null);
  const items = useMemo(() => SHOP_ITEMS.filter((i) => i.slot === slot).sort((a, b) => a.price - b.price), [slot]);
  if (!game) return null;

  const previewItem = preview ? SHOP_ITEMS.find((i) => i.id === preview) : null;
  const shown = previewItem ? { ...game.equipped, [previewItem.slot]: previewItem.id } : game.equipped;

  const onItem = async (id: string) => {
    const it = SHOP_ITEMS.find((i) => i.id === id)!;
    if (game.owned.includes(id)) {
      await toggleEquip(id);
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

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("Boutique du touriste", "Tourist shop")} subtitle={t("Gagne des pièces en pratiquant, habille ton touriste n'importe comment.", "Earn coins by practising, dress your tourist up.")} back="/" action={<Coins amount={game.coins} className="text-base" />} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
        <div className="sticky top-2 z-10 md:top-6 md:self-start">
          <div className="mx-auto w-44 overflow-hidden rounded-3xl border border-line bg-surface shadow-lg sm:w-56 md:w-full">
            <Tourist equipped={shown} className="w-full" />
          </div>
          {previewItem && !game.owned.includes(previewItem.id) && (
            <Panel className="mt-3 animate-pop text-center">
              <p className="font-semibold">{s.immersion ? previewItem.en : previewItem.fr}</p>
              <p className="mt-1 text-sm text-muted">{t("Aperçu — touche encore pour acheter", "Preview — tap again to buy")}</p>
              <button onClick={() => onItem(previewItem.id)} disabled={game.coins < previewItem.price} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-ink-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50">
                {t("Acheter", "Buy")} · {previewItem.price} <CoinIcon size={16} />
              </button>
              <button onClick={() => setPreview(null)} className="ml-2 text-sm text-muted underline">{t("Annuler", "Cancel")}</button>
            </Panel>
          )}
          <p className="mt-3 text-center text-xs text-muted">{t(`${game.owned.length} objets possédés · ${game.totalEarned} pièces gagnées au total`, `${game.owned.length} items owned`)}</p>
        </div>
        <div className="min-w-0">
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
            {SLOTS.map((sl) => (
              <button key={sl} onClick={() => { setSlot(sl); setPreview(null); }} className={cx("shrink-0 rounded-full border px-3 py-1.5 text-sm", slot === sl ? "border-ink-500 bg-ink-600 text-white" : "border-line bg-surface")}>
                {SLOT_LABELS[sl].emoji} {s.immersion ? SLOT_LABELS[sl].en : SLOT_LABELS[sl].fr}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((it) => {
              const owned = game.owned.includes(it.id);
              const worn = game.equipped[it.slot] === it.id;
              const equippedPreview = { background: it.slot === "background" ? it.id : "bg-home", [it.slot]: it.id };
              return (
                <button key={it.id} onClick={() => onItem(it.id)} className={cx("relative overflow-hidden rounded-2xl border bg-surface text-left transition active:scale-[0.98]", worn ? "border-mint-500 ring-2 ring-mint-400/40" : preview === it.id ? "border-ink-500 ring-2 ring-ink-400/40" : "border-line hover:border-ink-300")}>
                  <Tourist equipped={equippedPreview} animate={false} className="w-full" title={it.fr} />
                  <div className="p-2.5">
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug">{s.immersion ? it.en : it.fr}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      {owned ? <span className="text-xs font-semibold text-mint-600">{worn ? t("Porté ✓", "Worn ✓") : t("Possédé", "Owned")}</span> : <span className="flex items-center gap-1 text-sm font-bold">{it.price}<CoinIcon size={14} /></span>}
                      <Badge tone={RARITY_TONE[it.rarity]} className="text-[10px]">{it.rarity}</Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-center text-xs text-muted">{t("Touche un objet pour l'essayer, puis encore une fois pour l'acheter. Touche un objet possédé pour le mettre ou l'enlever.", "Tap to try on, tap again to buy.")}</p>
        </div>
      </div>
    </div>
  );
}
