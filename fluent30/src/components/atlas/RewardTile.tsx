// A destination reward (clothing, decor, souvenir, stamp, postcard, trophy), locked or unlocked.
import type { AtlasReward, RewardKind } from "@/lib/atlas/types";
import { Icon, type IconName } from "@/components/icons";
import { cx } from "@/components/ui";
import { RewardArt } from "./RewardArt";

const KIND: Record<RewardKind, { label: string; icon: IconName }> = {
  clothing: { label: "Vêtement", icon: "shirt" },
  accessory: { label: "Accessoire", icon: "star" },
  decor: { label: "Décoration", icon: "home" },
  "souvenir-culture": { label: "Souvenir culturel", icon: "heart" },
  "souvenir-activity": { label: "Souvenir d'activité", icon: "camera" },
  stamp: { label: "Tampon", icon: "passport" },
  postcard: { label: "Carte postale", icon: "postcard" },
  trophy: { label: "Trophée", icon: "trophy" },
};

export function rewardKindLabel(k: RewardKind) {
  return KIND[k].label;
}

export function RewardTile({ reward, owned, accent }: { reward: AtlasReward; owned: boolean; accent: string }) {
  const k = KIND[reward.kind];
  return (
    <div className={cx("rounded-2xl border border-line bg-surface p-3 text-center", !owned && "opacity-70")} title={reward.desc}>
      <span className="relative mx-auto block h-14 w-14">
        <RewardArt reward={reward} accent={accent} locked={!owned} size={56} />
        {!owned && (
          <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-line bg-surface text-muted">
            <Icon name="lock" size={11} />
          </span>
        )}
      </span>
      <p className="mt-1.5 text-[13px] font-semibold leading-tight">{reward.fr}</p>
      <p className="text-[11px] text-muted">{k.label}</p>
    </div>
  );
}
