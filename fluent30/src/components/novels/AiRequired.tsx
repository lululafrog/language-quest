"use client";
import { useT } from "@/hooks/useT";
import { ServiceNotice } from "@/components/ui";

/** Honest notice: personal novels are written by the AI and need a server key. */
export function AiRequired() {
  const t = useT();
  return (
    <div className="space-y-3">
      <ServiceNotice service={t("L'écriture de romans personnalisés", "Personal novel writing")}>
        {t("Chaque chapitre est écrit sur mesure par l'IA Claude : rien n'est simulé ici.", "Each chapter is written by Claude: nothing is simulated.")}
      </ServiceNotice>
      <div className="rounded-2xl border border-line bg-surface-2 p-3 text-sm text-muted">
        <p className="font-medium text-fg">{t("Coût indicatif", "Indicative cost")}</p>
        <p className="mt-1">
          {t(
            "Avec le modèle par défaut (Claude Opus 5.5 : 4 $ / million de jetons en entrée, 20 $ en sortie), un chapitre d'environ 800 mots consomme quelques milliers de jetons : compter environ 0,05 à 0,15 $ par chapitre, et environ 0,05 $ pour imaginer l'histoire. Un roman de 8 chapitres revient donc à environ 0,50 à 1,20 $. Les chapitres sont écrits un par un, uniquement quand vous le demandez.",
            "With the default model, expect about $0.05–0.15 per chapter. Chapters are only written when you ask.",
          )}
        </p>
      </div>
    </div>
  );
}
