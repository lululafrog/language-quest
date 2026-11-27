"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, todayKey } from "@/lib/db";
import { computeOverview, computeSkillScores, formatDuration, srsSummary } from "@/lib/progress";
import { DURABLE_DAYS, State } from "@/lib/srs";
import { themeEmoji, themeLabel } from "@/lib/data/types";
import { GRAMMAR_TITLES } from "@/lib/catalog";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { Badge, LinkButton, PageHeader, Panel, ProgressBar, StatTile } from "@/components/ui";
import { BarChart } from "@/components/BarChart";
import type { SkillArea } from "@/lib/types";

export default function StatsPage() {
  const t = useT();
  const s = useSettings();
  const o = useLiveQuery(() => computeOverview(), []);
  const skills = useLiveQuery(() => computeSkillScores(), []);
  const extra = useLiveQuery(async () => {
    const db = getDb();
    const [cards, srs, logs, grammar, mistakes] = await Promise.all([db.cards.toArray(), db.srs.toArray(), db.reviewLogs.orderBy("at").reverse().limit(2000).toArray(), db.grammar.toArray(), db.mistakes.orderBy("count").reverse().toArray()]);
    const byCard = new Map(cards.map((c) => [c.id, c]));
    const rec = srs.filter((x) => x.skill === "recognition");
    const hardest = [...rec].filter((x) => x.lapses > 0).sort((a, b) => b.lapses - a.lapses || a.stability - b.stability).slice(0, 10).map((x) => ({ card: byCard.get(x.cardId), lapses: x.lapses })).filter((x) => x.card);
    const themeStats = new Map<string, { total: number; durable: number }>();
    const recBy = new Map(rec.map((x) => [x.cardId, x]));
    for (const c of cards) for (const th of c.themes) {
      const v = themeStats.get(th) ?? { total: 0, durable: 0 };
      v.total++;
      const st = recBy.get(c.id);
      if (st && st.state === State.Review && st.stability >= DURABLE_DAYS) v.durable++;
      themeStats.set(th, v);
    }
    const forecast = Array.from({ length: 14 }, (_, i) => {
      const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() + i);
      const end = start.getTime() + 86400000;
      return { label: i === 0 ? t("auj.", "today") : start.toLocaleDateString(undefined, { day: "numeric", month: "short" }), value: srs.filter((x) => (i === 0 ? x.due < end : x.due >= start.getTime() && x.due < end)).length };
    });
    const perSkill = (["recognition", "production", "listening"] as const).map((sk) => ({ sk, ...srsSummary(srs.filter((x) => x.skill === sk)) }));
    return { hardest, themes: [...themeStats.entries()].sort((a, b) => b[1].total - a[1].total), forecast, perSkill, logs, grammar, mistakes };
  }, []);

  if (!o || !skills || !extra) return <div className="h-96 animate-pulse rounded-2xl bg-surface-2" />;

  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const k = todayKey(d);
    const a = o.days.find((x) => x.date === k);
    return { key: k, label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }), reviews: a?.reviews ?? 0, minutes: Math.round((a?.seconds ?? 0) / 60) };
  });
  const areaLabel: Record<SkillArea, string> = { vocabulary: t("Vocabulaire", "Vocabulary"), grammar: t("Grammaire", "Grammar"), reading: t("Compréhension écrite", "Reading"), listening: t("Compréhension orale", "Listening"), writing: t("Expression écrite", "Writing"), speaking: t("Expression orale", "Speaking") };
  const skillName = { recognition: t("Reconnaissance", "Recognition"), production: t("Production", "Production"), listening: t("Écoute", "Listening") };

  return (
    <div className="space-y-4">
      <PageHeader title={t("Statistiques", "Statistics")} back="/more" action={<LinkButton href="/tests" size="sm" variant="outline">{t("Tests", "Tests")}</LinkButton>} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon="🔎" label={t("Découverts", "Discovered")} value={o.discovered} />
        <StatTile icon="🌱" label={t("En cours", "Learning")} value={o.learning} />
        <StatTile icon="🧠" label={t("Mémorisés", "Memorised")} value={o.memorized} sub={t(`stabilité ≥ ${DURABLE_DAYS} j`, `stability ≥ ${DURABLE_DAYS} d`)} />
        <StatTile icon="🎯" label={t("Réussite (30 j)", "Success (30 d)")} value={`${Math.round(o.successRate * 100)} %`} />
        <StatTile icon="🔥" label={t("Série", "Streak")} value={`${o.streak} ${t("j", "d")}`} />
        <StatTile icon="⏱️" label={t("Temps total", "Total time")} value={formatDuration(o.totalSeconds, s.immersion)} />
        <StatTile icon="⚡" label={t("Verbes maîtrisés", "Verbs mastered")} value={o.verbsMastered} />
        <StatTile icon="✍️" label={t("Leçons de grammaire", "Grammar lessons")} value={o.grammarDone} />
      </div>

      <Panel>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-semibold">{t("Niveau estimé (prudent)", "Estimated level (conservative)")}</h2>
          {skills.cefr ? <Badge tone="ink" className="text-sm">{skills.cefr}</Badge> : <Badge tone="gray">{t("pas assez de données", "not enough data")}</Badge>}
        </div>
        <ul className="space-y-3">
          {(Object.keys(areaLabel) as SkillArea[]).map((a) => (
            <li key={a}>
              <div className="flex justify-between text-sm"><span>{areaLabel[a]}</span><span className="tabular-nums text-muted">{skills.scores[a] !== undefined ? `${Math.round(skills.scores[a]! * 100)} %` : t("à évaluer", "not assessed")}</span></div>
              <ProgressBar value={skills.scores[a] ?? 0} className="mt-1" />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{t(`Estimation fondée sur plusieurs compétences et tirée par les plus faibles (confiance : ${skills.confidence}). ~${skills.vocabSize} mots durablement connus. Ce n'est pas une certification : passez les tests hebdomadaires et mensuels pour l'affiner.`, `Based on several skills, driven by the weakest (confidence: ${skills.confidence}). Not a certification.`)}</p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <h2 className="mb-3 font-semibold">{t("Révisions par jour (30 j)", "Reviews per day (30 d)")}</h2>
          <BarChart data={days30.map((d) => ({ label: d.label, value: d.reviews }))} />
        </Panel>
        <Panel>
          <h2 className="mb-3 font-semibold">{t("Minutes par jour (30 j)", "Minutes per day (30 d)")}</h2>
          <BarChart data={days30.map((d) => ({ label: d.label, value: d.minutes }))} unit=" min" goal={s.sessionMinutes} />
        </Panel>
        <Panel>
          <h2 className="mb-3 font-semibold">{t("Révisions à venir (14 j)", "Upcoming reviews (14 d)")}</h2>
          <BarChart data={extra.forecast} />
        </Panel>
        <Panel>
          <h2 className="mb-3 font-semibold">{t("Par compétence", "By skill")}</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted"><tr><th className="text-left font-normal" /><th className="font-normal">{t("Nouv.", "New")}</th><th className="font-normal">{t("En cours", "Learning")}</th><th className="font-normal">{t("Acquis", "Known")}</th><th className="font-normal">{t("Durables", "Durable")}</th></tr></thead>
            <tbody>{extra.perSkill.map((p) => <tr key={p.sk} className="border-t border-line"><td className="py-2">{skillName[p.sk]}</td><td className="text-center tabular-nums">{p.new}</td><td className="text-center tabular-nums">{p.learning}</td><td className="text-center tabular-nums">{p.review}</td><td className="text-center font-semibold tabular-nums">{p.durable}</td></tr>)}</tbody>
          </table>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <h2 className="mb-3 font-semibold">{t("Mots les plus difficiles", "Hardest words")}</h2>
          {extra.hardest.length ? (
            <ul className="space-y-1.5 text-sm">{extra.hardest.map((h) => <li key={h.card!.id} className="flex justify-between"><Link href={`/cards/${h.card!.id}`} className="hover:underline">{h.card!.term} <span className="text-muted">— {h.card!.fr}</span></Link><span className="tabular-nums text-coral-600">{h.lapses}×</span></li>)}</ul>
          ) : <p className="text-sm text-muted">{t("Aucun mot oublié pour l'instant.", "No forgotten words yet.")}</p>}
        </Panel>
        <Panel>
          <h2 className="mb-3 font-semibold">{t("Thèmes", "Themes")}</h2>
          {extra.themes.length ? (
            <ul className="space-y-2.5">{extra.themes.slice(0, 10).map(([th, v]) => <li key={th}><div className="flex justify-between text-sm"><span>{themeEmoji(th)} {themeLabel(th, s.immersion)}</span><span className="tabular-nums text-muted">{v.durable}/{v.total}</span></div><ProgressBar value={v.durable} max={v.total} tone="mint" className="mt-1" /></li>)}</ul>
          ) : <p className="text-sm text-muted">{t("Ajoute des mots pour voir tes thèmes.", "Add words to see themes.")}</p>}
        </Panel>
      </div>

      <Panel>
        <h2 className="mb-3 font-semibold">{t("Grammaire et temps", "Grammar & tenses")}</h2>
        {extra.grammar.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">{extra.grammar.sort((a, b) => b.bestScore - a.bestScore).map((g) => <li key={g.lessonId} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm"><Link href={`/grammar/${g.lessonId}`} className="hover:underline">{GRAMMAR_TITLES[g.lessonId] ?? g.lessonId}</Link><Badge tone={g.status === "done" ? "mint" : "sun"}>{Math.round(g.bestScore * 100)} %</Badge></li>)}</ul>
        ) : <p className="text-sm text-muted">{t("Aucune leçon commencée.", "No lessons started.")} <Link href="/grammar" className="text-ink-600 underline">{t("Commencer", "Start")}</Link></p>}
      </Panel>

      <Panel id="mistakes">
        <h2 className="mb-3 font-semibold">{t("Erreurs récurrentes", "Recurring mistakes")}</h2>
        {extra.mistakes.length ? (
          <ul className="divide-y divide-line text-sm">{extra.mistakes.slice(0, 30).map((m) => <li key={m.id} className="flex items-center justify-between gap-3 py-2"><span className="min-w-0"><Badge tone="gray" className="mr-2">{m.type}</Badge>{m.label}{m.detail && <span className="text-muted"> — {m.detail}</span>}</span><span className="shrink-0 tabular-nums text-muted">×{m.count}</span></li>)}</ul>
        ) : <p className="text-sm text-muted">{t("Rien à signaler.", "Nothing yet.")}</p>}
      </Panel>

      <Panel>
        <h2 className="mb-3 font-semibold">{t("Historique des révisions", "Review history")}</h2>
        {extra.logs.length ? (
          <ul className="max-h-72 divide-y divide-line overflow-y-auto text-sm">{extra.logs.slice(0, 100).map((l) => <li key={l.id} className="flex justify-between py-1.5"><span className="text-muted">{new Date(l.at).toLocaleString()}</span><span>{skillName[l.skill]} · {["", t("Oublié", "Again"), t("Difficile", "Hard"), t("Bien", "Good"), t("Facile", "Easy")][l.rating]}</span></li>)}</ul>
        ) : <p className="text-sm text-muted">{t("Aucune révision pour l'instant.", "No reviews yet.")}</p>}
      </Panel>
    </div>
  );
}
