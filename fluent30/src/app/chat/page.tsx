"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { SCENARIOS, REGISTERS } from "@/lib/data/scenarios";
import { PageHeader, Panel, Badge, ServiceNotice, EmptyState } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { useStatus } from "@/hooks/useStatus";

export default function ChatHome() {
  const t = useT();
  const status = useStatus();
  const history = useLiveQuery(() => getDb().conversations.orderBy("createdAt").reverse().limit(20).toArray(), []);

  return (
    <div>
      <PageHeader title={t("Conversation avec l'IA", "AI conversation")} subtitle={t("Un partenaire anglophone disponible à tout moment, à l'écrit comme à l'oral.", "A native-speaking partner available anytime, written or spoken.")} />
      {status && !status.ai && <div className="mb-4"><ServiceNotice service={t("La conversation IA", "AI conversation")} alternative={"En attendant, entraîne-toi avec les dialogues interactifs des cours (Cours → Vie réelle) et des missions de la carte du monde."} /></div>}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{t("Choisissez un scénario", "Choose a scenario")}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SCENARIOS.map((s) => (
          <Link key={s.id} href={`/chat/${s.id}`} className="group rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{s.emoji}</span>
              <div className="min-w-0">
                <p className="font-semibold group-hover:text-ink-700 dark:group-hover:text-ink-200">{t(s.titleFr, s.titleEn)}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">{t(s.goalFr, s.goal)}</p>
                <Badge tone="gray" className="mt-2">{REGISTERS.find((r) => r.id === s.register)?.[t("fr", "en") as "fr" | "en"]}</Badge>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Panel className="mt-6">
        <h2 className="mb-1 font-semibold">🎚️ {t("Les registres de langue", "Language registers")}</h2>
        <p className="mb-3 text-sm text-muted">{t("En anglais comme en français, on ne parle pas de la même façon à un ami et à un recruteur. L'IA adapte son registre au scénario et le bilan vous l'indique.", "Like in French, you don't talk to a friend the way you talk to a recruiter. The AI adapts its register to the scenario.")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {REGISTERS.map((r) => (
            <div key={r.id} className="rounded-xl bg-surface-2 p-3">
              <p className="font-medium">{t(r.fr, r.en)}</p>
              <p className="text-sm text-muted">{r.desc}</p>
              <p className="mt-1 text-sm italic">“{r.example}”</p>
            </div>
          ))}
        </div>
      </Panel>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted">{t("Historique", "History")}</h2>
      {history && history.length === 0 && <EmptyState icon="💬" title={t("Aucune conversation pour l'instant", "No conversations yet")}>{t("Vos conversations et leurs bilans seront enregistrés ici, sur cet appareil.", "Your conversations and reports will be saved here, on this device.")}</EmptyState>}
      <div className="space-y-2">
        {history?.map((c) => {
          const s = SCENARIOS.find((x) => x.id === c.scenarioId);
          const turns = c.messages.filter((m) => m.role === "user").length;
          return (
            <Link key={c.id} href={`/chat/${c.scenarioId}?c=${c.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-ink-300">
              <span className="text-2xl">{s?.emoji ?? "💬"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{s ? t(s.titleFr, s.titleEn) : c.scenarioId}</p>
                <p className="text-xs text-muted">{new Date(c.createdAt).toLocaleString(t("fr-FR", "en-GB"), { dateStyle: "medium", timeStyle: "short" })} · {turns} {t("message(s)", "message(s)")}</p>
              </div>
              {c.report ? <Badge tone="mint">{t("Bilan", "Report")}</Badge> : <Badge tone="gray">{t("En cours", "Open")}</Badge>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
