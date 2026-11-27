"use client";
// Owner dashboard: external services, costs, quotas and recent technical errors.
// Not linked from the learner navigation. Access needs the server admin token (FLUENT30_ADMIN_TOKEN),
// kept only for this browser tab (sessionStorage). Keys are never displayed — only a short hint.
import { useCallback, useEffect, useState } from "react";
import { accessToken } from "@/lib/supabase";
import { BarChart } from "@/components/BarChart";
import { Badge, Button, Panel, ProgressBar, cx } from "@/components/ui";
import { CostSimulation } from "./CostSimulation";

interface ProviderInfo {
  id: string;
  label: string;
  configured: boolean;
  keyHint?: string | null;
  required?: boolean;
  free?: boolean;
  features: string[];
  docsUrl?: string;
  envVars?: string[];
}
interface Overview {
  providers: ProviderInfo[];
  usage: {
    today: { calls: number; costUsd: number };
    month: { calls: number; costUsd: number };
    byFeature: { feature: string; calls: number; costUsd: number; errors: number; quotaHits: number; avgCostPerCall?: number }[];
    byDay: { day: string; calls: number; costUsd: number }[];
    byUser?: { user: string; email?: string; calls: number; costUsd: number; monthCostUsd?: number }[];
    activeUsers: number;
    avgMonthlyCostPerUser: number;
  };
  budget: { dailyCapUsd?: number | null; monthlyCapUsd?: number | null; spentTodayUsd: number; spentMonthUsd: number };
  cacheSavingsUsd?: number;
  alerts?: { threshold: number; at: number | string; spentUsd: number }[];
  errors: { at: number | string; feature: string; code: string; message: string }[];
  storage: string;
  models?: { main?: string; fast?: string };
}
type Health = { ok: boolean; latencyMs?: number; error?: string };

const TOKEN_KEY = "fluent30.adminToken";
const usd = (n?: number | null) => (n == null ? "—" : n < 0.01 && n > 0 ? `< 0,01 $` : `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`);
const when = (t: number | string) => new Date(t).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

async function adminHeaders(token: string): Promise<HeadersInit> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["x-admin-token"] = token;
  const bearer = await accessToken().catch(() => null);
  if (bearer) h.Authorization = `Bearer ${bearer}`;
  return h;
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [input, setInput] = useState("");
  const [data, setData] = useState<Overview | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "unauthorised" | "missing" | "error" | "ok">("idle");
  const [health, setHealth] = useState<Record<string, Health | "pending">>({});

  const load = useCallback(async (tk: string) => {
    setState("loading");
    try {
      const res = await fetch("/api/admin/overview", { headers: await adminHeaders(tk), cache: "no-store" });
      if (res.status === 401 || res.status === 403) return setState("unauthorised");
      if (res.status === 404) return setState("missing");
      if (!res.ok) return setState("error");
      setData((await res.json()) as Overview);
      setState("ok");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY) ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the tab-scoped token once
    setToken(saved);
    void load(saved);
  }, [load]);

  const test = async (id: string) => {
    setHealth((h) => ({ ...h, [id]: "pending" }));
    try {
      const res = await fetch("/api/admin/health", { method: "POST", headers: await adminHeaders(token), body: JSON.stringify({ provider: id }) });
      const j = (await res.json().catch(() => null)) as Health | null;
      setHealth((h) => ({ ...h, [id]: j ?? { ok: false, error: `Erreur ${res.status}` } }));
    } catch {
      setHealth((h) => ({ ...h, [id]: { ok: false, error: "Serveur injoignable" } }));
    }
  };

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem(TOKEN_KEY, input.trim());
    setToken(input.trim());
    void load(input.trim());
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-10">
      <meta name="robots" content="noindex, nofollow" />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="t-display">Administration</h1>
          <p className="text-sm text-muted">Services externes, coûts, quotas et erreurs. Les clés ne sont jamais affichées.</p>
        </div>
        {state === "ok" && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => load(token)}>Actualiser</Button>
            <Button size="sm" variant="ghost" onClick={() => { sessionStorage.removeItem(TOKEN_KEY); setToken(""); setData(null); setState("unauthorised"); }}>Se déconnecter</Button>
          </div>
        )}
      </header>

      {(state === "unauthorised" || (state === "idle" && !data)) && (
        <Panel className="max-w-md space-y-3">
          <p className="font-semibold">Accès réservé</p>
          <p className="text-sm text-muted">Saisis le jeton administrateur défini sur le serveur (variable FLUENT30_ADMIN_TOKEN). Il reste uniquement dans cet onglet.</p>
          <form onSubmit={signIn} className="flex gap-2">
            <input type="password" autoComplete="off" value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2 outline-none focus:border-ink-400" aria-label="Jeton administrateur" />
            <Button type="submit" disabled={!input.trim()}>Entrer</Button>
          </form>
          {state === "unauthorised" && token && <p className="text-sm text-coral-600">Jeton refusé.</p>}
        </Panel>
      )}
      {state === "loading" && <div className="h-40 animate-pulse rounded-3xl bg-surface-2" />}
      {state === "missing" && <Panel><p className="text-sm">L&apos;API d&apos;administration n&apos;est pas disponible sur ce déploiement (route /api/admin/overview absente).</p></Panel>}
      {state === "error" && <Panel><p className="text-sm text-coral-600">Impossible de charger le tableau de bord. Vérifie que le serveur répond, puis actualise.</p></Panel>}

      {state === "ok" && data && <Dashboard data={data} health={health} onTest={test} />}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <Panel className="space-y-0.5">
      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </Panel>
  );
}

function Gauge({ label, spent, cap, alerts }: { label: string; spent: number; cap?: number | null; alerts?: number[] }) {
  if (!cap) return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm"><span>{label}</span><span className="tabular-nums">{usd(spent)} · sans plafond</span></div>
      <p className="text-xs text-muted">Aucun plafond défini : configure-le pour éviter les mauvaises surprises.</p>
    </div>
  );
  const pct = Math.min(1, spent / cap);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm"><span>{label}</span><span className="tabular-nums">{usd(spent)} / {usd(cap)} ({Math.round(pct * 100)} %)</span></div>
      <div className="relative">
        <ProgressBar value={spent} max={cap} tone={pct >= 1 ? "coral" : pct >= 0.8 ? "sun" : "mint"} />
        {[50, 80, 100].map((m) => (
          <span key={m} className={cx("absolute -top-1 h-4 w-0.5", alerts?.includes(m) ? "bg-coral-600" : "bg-fg/25")} style={{ left: `calc(${m}% - 1px)` }} title={`Alerte ${m} %`} />
        ))}
      </div>
      <div className="relative h-3 text-[10px] text-muted">
        {[50, 80, 100].map((m) => <span key={m} className="absolute -translate-x-1/2" style={{ left: `${m}%` }}>{m} %</span>)}
      </div>
    </div>
  );
}

function Dashboard({ data, health, onTest }: { data: Overview; health: Record<string, Health | "pending">; onTest: (id: string) => void }) {
  const u = data.usage;
  const monthAlerts = (data.alerts ?? []).map((a) => a.threshold);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Aujourd'hui" value={usd(u.today.costUsd)} sub={`${u.today.calls} appels`} />
        <Stat label="Ce mois" value={usd(u.month.costUsd)} sub={`${u.month.calls} appels`} />
        <Stat label="Par utilisateur" value={usd(u.avgMonthlyCostPerUser)} sub={`moyenne mensuelle · ${u.activeUsers} actifs`} />
        <Stat label="Économies du cache" value={usd(data.cacheSavingsUsd ?? 0)} sub="réponses réutilisées" />
      </div>

      <Panel className="space-y-4">
        <h2 className="font-semibold">Budget</h2>
        <Gauge label="Aujourd'hui" spent={data.budget.spentTodayUsd} cap={data.budget.dailyCapUsd} />
        <Gauge label="Ce mois" spent={data.budget.spentMonthUsd} cap={data.budget.monthlyCapUsd} alerts={monthAlerts} />
        {data.alerts && data.alerts.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-medium">Alertes déclenchées</p>
            <ul className="space-y-1 text-sm">
              {data.alerts.map((a, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <Badge tone={a.threshold >= 100 ? "coral" : a.threshold >= 80 ? "sun" : "gray"}>{a.threshold} %</Badge>
                  <span className="flex-1 text-muted">{when(a.at)}</span>
                  <span className="tabular-nums">{usd(a.spentUsd)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs text-muted">Stockage des statistiques : {data.storage}{data.models?.main ? ` · modèle principal ${data.models.main}` : ""}{data.models?.fast ? ` · modèle rapide ${data.models.fast}` : ""}</p>
      </Panel>

      <Panel className="space-y-3">
        <h2 className="font-semibold">Services</h2>
        <div className="divide-y divide-line">
          {data.providers.map((p) => {
            const h = health[p.id];
            return (
              <div key={p.id} className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {p.label}
                    <Badge tone={p.configured ? "mint" : p.required ? "coral" : "gray"}>{p.configured ? "configuré" : p.free ? "gratuit, sans clé" : "non configuré"}</Badge>
                    {p.keyHint && <code className="rounded bg-surface-2 px-1.5 text-xs">••••{p.keyHint}</code>}
                    {h && h !== "pending" && <Badge tone={h.ok ? "mint" : "coral"}>{h.ok ? `opérationnel${h.latencyMs ? ` · ${h.latencyMs} ms` : ""}` : "indisponible"}</Badge>}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{p.features.join(" · ")}</p>
                  {p.envVars && p.envVars.length > 0 && <p className="mt-0.5 text-xs text-muted">Variables : {p.envVars.join(", ")}</p>}
                  {h && h !== "pending" && !h.ok && h.error && <p className="mt-1 text-xs text-coral-600">{h.error}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {p.docsUrl && <a href={p.docsUrl} target="_blank" rel="noreferrer noopener" className="rounded-xl border border-line px-3 py-1.5 text-sm hover:border-ink-300">Obtenir une clé</a>}
                  <Button size="sm" variant="outline" onClick={() => onTest(p.id)} disabled={h === "pending"}>{h === "pending" ? "Test…" : "Tester"}</Button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {u.byDay.length > 0 && (
        <Panel className="space-y-2">
          <h2 className="font-semibold">Coût par jour</h2>
          <BarChart data={u.byDay.map((d) => ({ label: d.day.slice(5), value: Math.round(d.costUsd * 100) / 100, title: `${d.day} · ${d.calls} appels` }))} unit=" $" />
        </Panel>
      )}

      <Panel className="space-y-2">
        <h2 className="font-semibold">Par fonctionnalité</h2>
        {u.byFeature.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted"><tr><th className="py-1 pr-3 font-medium">Fonction</th><th className="pr-3 font-medium">Appels</th><th className="pr-3 font-medium">Coût</th><th className="pr-3 font-medium">Moy./appel</th><th className="pr-3 font-medium">Erreurs</th><th className="font-medium">Quotas atteints</th></tr></thead>
              <tbody>
                {u.byFeature.map((f) => (
                  <tr key={f.feature} className="border-t border-line">
                    <td className="py-1.5 pr-3 font-medium">{f.feature}</td>
                    <td className="pr-3 tabular-nums">{f.calls}</td>
                    <td className="pr-3 tabular-nums">{usd(f.costUsd)}</td>
                    <td className="pr-3 tabular-nums">{usd(f.avgCostPerCall ?? (f.calls ? f.costUsd / f.calls : 0))}</td>
                    <td className={cx("pr-3 tabular-nums", f.errors > 0 && "text-coral-600")}>{f.errors}</td>
                    <td className="tabular-nums">{f.quotaHits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted">Aucun appel enregistré pour l&apos;instant.</p>}
      </Panel>

      {u.byUser && (
        <Panel className="space-y-2">
          <h2 className="font-semibold">Par utilisateur <span className="text-sm font-normal text-muted">(50 plus gros consommateurs)</span></h2>
          {u.byUser.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted"><tr><th className="py-1 pr-3 font-medium">Utilisateur</th><th className="pr-3 font-medium">Appels</th><th className="pr-3 font-medium">Coût total</th><th className="font-medium">Ce mois</th></tr></thead>
                <tbody>
                  {u.byUser.map((x) => (
                    <tr key={x.user} className="border-t border-line">
                      <td className="py-1.5 pr-3"><code className="text-xs">{x.user.slice(0, 12)}</code>{x.email && <span className="ml-2 text-muted">{x.email}</span>}</td>
                      <td className="pr-3 tabular-nums">{x.calls}</td>
                      <td className="pr-3 tabular-nums">{usd(x.costUsd)}</td>
                      <td className="tabular-nums">{usd(x.monthCostUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-muted">Aucune consommation par utilisateur pour l&apos;instant.</p>}
        </Panel>
      )}

      <CostSimulation />

      <Panel className="space-y-2">
        <h2 className="font-semibold">Erreurs récentes</h2>
        {data.errors.length ? (
          <ul className="divide-y divide-line text-sm">
            {data.errors.map((e, i) => (
              <li key={i} className="py-1.5">
                <span className="text-muted">{when(e.at)}</span> · <span className="font-medium">{e.feature}</span> · <code className="text-xs">{e.code}</code>
                <span className="block text-xs text-muted">{e.message}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">Aucune erreur récente.</p>}
      </Panel>
    </>
  );
}
