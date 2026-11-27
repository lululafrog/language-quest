"use client";
// "My English Journey" — private journal with AI rewrites, monthly oral check and a gentle timeline.
import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, todayKey } from "@/lib/db";
import { MONTHLY_TOPIC, monthKey, recurringIssues } from "@/lib/journal";
import { courseForTag } from "@/lib/connect";
import { Button, PageHeader, Panel, SectionHeader, cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { AudioPlayer } from "@/components/journal/Audio";
import { TAG_FR } from "@/components/journal/EntryAnalysis";

function monthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  const s = new Date(y, mo - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function JournalPage() {
  const entries = useLiveQuery(() => getDb().journal.orderBy("date").reverse().toArray(), []);
  const [mode, setMode] = useState<"none" | "daily" | "monthly">("none");
  const today = todayKey();

  if (!entries) return <div className="mx-auto h-80 max-w-2xl animate-pulse rounded-3xl bg-surface-2" />;
  const groups = new Map<string, typeof entries>();
  for (const e of entries) {
    const k = monthKey(e.date);
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }
  const byMonth = [...groups.entries()];
  const wroteToday = entries.some((e) => e.date === today && !e.monthly);
  const monthlyDone = entries.some((e) => e.monthly && monthKey(e.date) === monthKey(today));
  const monthlies = entries.filter((e) => e.monthly && e.audioKey);
  const issues = recurringIssues(entries).filter((x) => x.count >= 2).slice(0, 4);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="My English Journey" subtitle="Ton journal privé : raconte ta journée, découvre comment le dire naturellement." back="/practice" />

      {mode !== "none" ? (
        <JournalEditor key={mode} monthly={mode === "monthly"} onCancel={() => setMode("none")} />
      ) : (
        <Panel tone="highlight" className="space-y-3">
          <p className="text-[17px] font-semibold">{wroteToday ? "Tu as déjà écrit aujourd'hui." : "Qu'as-tu vécu aujourd'hui ?"}</p>
          <p className="text-sm text-muted">Quelques phrases suffisent. Pas de note, pas de série à tenir : écris quand tu en as envie.</p>
          <Button className="w-full" onClick={() => setMode("daily")}>
            <Icon name="pen" size={18} /> {wroteToday ? "Écrire une autre entrée" : "Écrire mon journal"}
          </Button>
        </Panel>
      )}

      {mode === "none" && !monthlyDone && (
        <Panel className="flex items-start gap-3">
          <Icon name="mic" size={22} className="mt-0.5 shrink-0 text-ink-600" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-semibold">Bilan oral du mois</p>
            <p className="text-sm text-muted">
              Même sujet chaque mois — « {MONTHLY_TOPIC.en} » — pour entendre ta progression. {monthlies.length > 0 && `Tu as déjà ${monthlies.length} enregistrement${monthlies.length > 1 ? "s" : ""}.`}
            </p>
            <Button size="sm" variant="outline" onClick={() => setMode("monthly")}>Enregistrer celui de ce mois</Button>
          </div>
        </Panel>
      )}

      {issues.length > 0 && (
        <section>
          <SectionHeader title="Ce qui revient souvent" subtitle="Repéré dans tes corrections" />
          <div className="grid gap-2">
            {issues.map((x) => {
              const c = courseForTag(x.tag);
              return (
                <Panel key={x.tag} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{TAG_FR[x.tag] ?? x.tag} <span className="text-sm text-muted">· {x.count} fois</span></p>
                    {x.example && <p className="truncate text-[13px] text-muted">{x.example}</p>}
                  </div>
                  {c && (
                    <Link href={c.href} className="shrink-0 text-sm font-semibold text-ink-600 hover:underline dark:text-ink-300">
                      Revoir
                    </Link>
                  )}
                </Panel>
              );
            })}
          </div>
        </section>
      )}

      {monthlies.length > 1 && (
        <section>
          <SectionHeader title="Mes bilans oraux" subtitle="Écoute ta progression d'un mois à l'autre" />
          <div className="space-y-2">
            {monthlies.slice(0, 6).map((e) => (
              <Panel key={e.id} className="space-y-1.5 py-3">
                <p className="text-sm font-medium">{monthLabel(monthKey(e.date))}</p>
                <AudioPlayer mediaKey={e.audioKey!} />
              </Panel>
            ))}
          </div>
        </section>
      )}

      {byMonth.length > 0 && (
        <section>
          <SectionHeader title="Mon parcours" subtitle={`${entries.length} entrée${entries.length > 1 ? "s" : ""}`} />
          <div className="space-y-5">
            {byMonth.map(([m, list]) => (
              <div key={m}>
                <p className="mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-muted">{monthLabel(m)}</p>
                <ol className="relative space-y-2 border-l border-line pl-4">
                  {list.map((e) => (
                    <li key={e.id} className="relative">
                      <span className={cx("absolute -left-[21px] top-4 h-2.5 w-2.5 rounded-full", e.versions ? "bg-mint-500" : "bg-ink-300")} />
                      <Link href={`/practice/journal/${e.id}`} className="block rounded-2xl border border-line/70 bg-surface px-4 py-3 transition hover:border-ink-300">
                        <p className="flex items-center gap-2 text-[13px] text-muted">
                          {new Date(e.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                          {e.monthly && <span className="rounded-full bg-ink-50 px-2 text-[11px] font-semibold text-ink-600 dark:bg-ink-900">bilan oral</span>}
                          {e.mood && <span>· {e.mood}</span>}
                          {e.audioKey && <Icon name="mic" size={13} />}
                        </p>
                        <p className="line-clamp-2 text-[15px]">{e.text || e.prompt || "Enregistrement audio"}</p>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
