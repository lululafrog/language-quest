"use client";
import { useT } from "@/hooks/useT";
import { useStatus } from "@/hooks/useStatus";
import { ServiceNotice, Sheet, cx } from "@/components/ui";
import { canAdapt } from "@/lib/reading";
import type { Book } from "@/lib/types";

const LEVELS = [
  { id: "A1", fr: "Débutant" },
  { id: "A2", fr: "Élémentaire" },
  { id: "B1", fr: "Intermédiaire" },
  { id: "B2", fr: "Intermédiaire avancé" },
  { id: "C1", fr: "Avancé" },
];

/** Choose an adapted version (AI rewrite) or the original text. */
export function LevelSheet({ book, current, onPick, onClose }: { book: Book; current: string | null; onPick: (level: string | null) => void; onClose: () => void }) {
  const t = useT();
  const status = useStatus();
  const allowed = canAdapt(book.source);
  return (
    <Sheet open onClose={onClose} title={t("Niveau du texte", "Text level")}>
      <div className="space-y-3">
        {!allowed ? (
          <p className="text-sm text-muted">{t("Les livres que vous importez restent la propriété de leurs auteurs : l'appli ne les réécrit pas. L'adaptation est proposée pour les œuvres du domaine public, les histoires graduées et vos romans personnalisés.", "Imported books are not rewritten (copyright).")}</p>
        ) : (
          <>
            <p className="text-sm text-muted">{t("Une version adaptée garde l'intrigue, les personnages et les dialogues, avec une langue plus simple. Vous pouvez changer de niveau à tout moment sans perdre votre progression.", "Adapted versions keep the plot; switch any time.")}</p>
            {status && !status.ai && <ServiceNotice service={t("L'adaptation de niveau", "Level adaptation")} alternative={"Tu peux lire la version originale avec l'aide à la traduction des mots."} />}
            <div className="grid gap-2">
              <button onClick={() => onPick(null)} className={cx("rounded-xl border-2 px-3 py-2.5 text-left", !current ? "border-ink-500 bg-ink-50 dark:bg-ink-900/50" : "border-line")}>
                <span className="font-semibold">{t("Version originale", "Original")}</span>
              </button>
              {LEVELS.map((l) => (
                <button key={l.id} disabled={!status?.ai} onClick={() => onPick(l.id)} className={cx("rounded-xl border-2 px-3 py-2.5 text-left disabled:opacity-40", current === l.id ? "border-ink-500 bg-ink-50 dark:bg-ink-900/50" : "border-line")}>
                  <span className="font-semibold">{l.id}</span> <span className="text-sm text-muted">— {l.fr}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">{t("Chaque chapitre est adapté au moment où vous l'ouvrez, puis gardé sur l'appareil.", "Each chapter is adapted when opened, then cached.")}</p>
          </>
        )}
      </div>
    </Sheet>
  );
}
