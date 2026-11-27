"use client";
// Monthly AI cost per learner for typical usage profiles, computed by the pure simulator
// (src/lib/costs-sim.ts) from public prices and the default model routing — an estimate, not a bill.
import { useMemo, useState } from "react";
import { DEFAULT_PROFILES, simulateCosts, simulatePopulation } from "@/lib/costs-sim";
import { Panel, Segmented } from "@/components/ui";

const LABEL: Record<string, string> = { occasional: "Occasionnel", regular: "Régulier", intensive: "Intensif" };
const fmt = (n: number, cur: string) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 3 : 2 })} ${cur}`;

export function CostSimulation() {
  const [hit, setHit] = useState(0.5);
  const sim = useMemo(() => {
    try {
      return simulateCosts({ profiles: DEFAULT_PROFILES, cacheHitRate: hit });
    } catch {
      return null;
    }
  }, [hit]);
  const pops = useMemo(() => {
    try {
      return [100, 1000, 10000].map((u) => simulatePopulation(u, undefined, { profiles: DEFAULT_PROFILES, cacheHitRate: hit }));
    } catch {
      return null;
    }
  }, [hit]);

  return (
    <Panel className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Simulation des coûts</h2>
        <Segmented value={hit} onChange={setHit} options={[{ value: 0.3, label: "Cache 30 %" }, { value: 0.5, label: "50 %" }, { value: 0.7, label: "70 %" }]} />
      </div>
      {!sim ? (
        <p className="text-sm text-muted">Simulation indisponible.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted"><tr><th className="py-1 pr-3 font-medium">Profil</th><th className="pr-3 font-medium">Par utilisateur et par mois</th><th className="font-medium">Principaux postes</th></tr></thead>
              <tbody>
                {Object.entries(sim).map(([name, r]) => {
                  const top = Object.entries(r.byFeature).sort((a, b) => b[1] - a[1]).slice(0, 3);
                  return (
                    <tr key={name} className="border-t border-line">
                      <td className="py-1.5 pr-3 font-medium">{LABEL[name] ?? name}</td>
                      <td className="pr-3 tabular-nums">{fmt(r.usd, "$")} <span className="text-muted">(≈ {fmt(r.eur, "€")})</span></td>
                      <td className="text-xs text-muted">{top.map(([f, c]) => `${f} ${fmt(c, "$")}`).join(" · ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pops && (
            <p className="text-sm">
              {pops.map((p) => `${p.users.toLocaleString("fr-FR")} utilisateurs : ${fmt(p.usd, "$")} / mois`).join(" · ")}
              <span className="block text-xs text-muted">Mix : 60 % occasionnels, 30 % réguliers, 10 % intensifs. Estimation à partir des tarifs publics (à vérifier) ; les fonctions sans IA (cours, révisions, jeux, voix de l&apos;appareil) ne coûtent rien.</span>
            </p>
          )}
        </>
      )}
    </Panel>
  );
}
