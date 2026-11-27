"use client";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { IRREGULAR_RANKED, IRREGULAR_TIERS } from "@/lib/data/irregular-rank";
import { FAMILIES, familyOf, learnIrregular, nextIrregulars, type IrregularPick } from "@/lib/irregular";
import { isDurable } from "@/lib/srs";
import { themeLabel } from "@/lib/data/types";
import { normalize } from "@/lib/text";
import { speak } from "@/lib/speech";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { Badge, Button, PageHeader, Panel, ProgressBar, Segmented, cx, toast } from "@/components/ui";
import { IrregularQuiz } from "@/components/verbs/IrregularQuiz";

type Status = "new" | "learning" | "mastered";

export default function IrregularVerbsPage() {
  const t = useT();
  const s = useSettings();
  const [tier, setTier] = useState<string>("all");
  const [family, setFamily] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [picks, setPicks] = useState<IrregularPick[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [quiz, setQuiz] = useState<null | "mine" | string>(null);

  const status = useLiveQuery(async () => {
    const db = getDb();
    const cards = (await db.cards.toArray()).filter((c) => c.themes.includes("irregular-verbs"));
    const srs = await db.srs.where("cardId").anyOf(cards.map((c) => c.id)).toArray();
    const map = new Map<string, Status>();
    for (const c of cards) {
      const rec = srs.find((x) => x.cardId === c.id && x.skill === "recognition");
      const prod = srs.find((x) => x.cardId === c.id && x.skill === "production");
      map.set(c.lemma, rec && prod && isDurable(rec) && isDurable(prod) ? "mastered" : "learning");
    }
    return map;
  }, []);

  const stat = (b: string): Status => status?.get(b) ?? "new";
  const tierInfo = IRREGULAR_TIERS.map((ti) => {
    const verbs = IRREGULAR_RANKED.slice(ti.from, ti.to === Infinity ? undefined : ti.to);
    return { ...ti, total: verbs.length, learned: verbs.filter((v) => stat(v.base) !== "new").length, mastered: verbs.filter((v) => stat(v.base) === "mastered").length };
  });

  const list = useMemo(() => {
    const nq = normalize(q);
    return IRREGULAR_RANKED.filter((v, i) => {
      const ti = IRREGULAR_TIERS.find((x) => x.id === tier);
      if (ti && (i < ti.from || i >= ti.to)) return false;
      if (family && familyOf(v) !== family) return false;
      return !nq || normalize(`${v.base} ${v.past} ${v.pp} ${v.fr}`).includes(nq);
    });
  }, [tier, family, q]);

  const propose = async () => {
    const p = await nextIrregulars(10, s.interests);
    setPicks(p);
    setSelected(new Set(p.map((x) => x.verb.base)));
  };

  const addSelected = async () => {
    if (!picks) return;
    setBusy(true);
    let n = 0;
    for (const p of picks) if (selected.has(p.verb.base)) { await learnIrregular(p.verb); n++; }
    setBusy(false);
    setPicks(null);
    toast(t(`${n} verbes ajoutés à tes révisions`, `${n} verbs added to your reviews`));
  };

  const learnedCount = status ? [...status.values()].length : 0;

  if (quiz) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title={t("Entraînement", "Practice")} subtitle={t("Tape le prétérit et le participe passé", "Type the past simple and past participle")} />
        <IrregularQuiz mode={quiz} onExit={() => setQuiz(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={t("Verbes irréguliers", "Irregular verbs")} subtitle={t("Classés par importance : d'abord ceux qu'on entend tous les jours.", "Ranked by importance: everyday verbs first.")} back="/verbs" />

      <Panel>
        <div className="grid gap-3 sm:grid-cols-3">
          {tierInfo.map((ti) => (
            <div key={ti.id}>
              <div className="flex justify-between text-sm"><span className="font-medium">{s.immersion ? ti.en : ti.fr}</span><span className="tabular-nums text-muted">{ti.learned}/{ti.total}</span></div>
              <ProgressBar value={ti.learned} max={ti.total} className="mt-1.5" tone={ti.mastered === ti.total ? "mint" : "ink"} />
              <p className="mt-1 text-xs text-muted">{t(`${ti.mastered} maîtrisés`, `${ti.mastered} mastered`)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={propose}>{t("Apprendre 10 verbes", "Learn 10 verbs")}</Button>
          <Button variant="outline" disabled={!learnedCount} onClick={() => setQuiz("mine")}>{t(`Réviser mes verbes (${learnedCount})`, `Practise my verbs (${learnedCount})`)}</Button>
          <Button variant="ghost" onClick={() => setQuiz("core")}>{t("Quiz des 25 indispensables", "Quiz: essential 25")}</Button>
        </div>
        <p className="mt-3 text-xs text-muted">{t("Règle 70/30 : 7 verbes parmi les plus fréquents + 3 verbes liés à tes centres d'intérêt ou rencontrés dans tes lectures.", "70/30 rule: 7 most frequent verbs + 3 linked to your interests or reading.")}</p>
      </Panel>

      {picks && (
        <Panel className="animate-pop">
          <h2 className="mb-3 font-semibold">{t("Ta sélection du jour", "Today's selection")}</h2>
          <ul className="space-y-2">
            {picks.map((p) => (
              <li key={p.verb.base}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
                  <input type="checkbox" className="h-5 w-5 accent-ink-600" checked={selected.has(p.verb.base)} onChange={() => setSelected((x) => { const n = new Set(x); if (n.has(p.verb.base)) n.delete(p.verb.base); else n.add(p.verb.base); return n; })} />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{p.verb.base} – {p.verb.past} – {p.verb.pp}</span>
                    <span className="block text-sm text-muted">{p.verb.fr}</span>
                  </span>
                  <Badge tone={p.reason === "frequent" ? "ink" : "coral"}>{p.reason === "frequent" ? t(`n°${p.verb.rank}`, `#${p.verb.rank}`) : p.reason === "reading" ? t("vu en lecture", "seen reading") : themeLabel(p.interest!, s.immersion)}</Badge>
                </label>
              </li>
            ))}
          </ul>
          {!picks.length && <p className="text-sm text-muted">{t("Bravo, tu as déjà ajouté tous les verbes irréguliers !", "You've added all irregular verbs!")}</p>}
          <div className="mt-3 flex gap-2">
            <Button onClick={addSelected} loading={busy} disabled={!selected.size}>{t(`Ajouter à mes révisions (${selected.size})`, `Add to my reviews (${selected.size})`)}</Button>
            <Button variant="ghost" onClick={() => setPicks(null)}>{t("Annuler", "Cancel")}</Button>
          </div>
        </Panel>
      )}

      <Panel>
        <h2 className="mb-2 font-semibold">{t("Familles pour mémoriser", "Families to memorise")}</h2>
        <p className="mb-3 text-sm text-muted">{t("Les verbes irréguliers suivent souvent des modèles : les apprendre par famille est bien plus efficace.", "Irregular verbs often follow patterns.")}</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(FAMILIES).map(([id, f]) => (
            <button key={id} onClick={() => setFamily(family === id ? null : id)} className={cx("rounded-full border px-3 py-1.5 text-sm", family === id ? "border-ink-500 bg-ink-600 text-white" : "border-line")}>
              {s.immersion ? f.en : f.fr} <span className="opacity-70">{IRREGULAR_RANKED.filter((v) => familyOf(v) === id).length}</span>
            </button>
          ))}
        </div>
        {family && <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-sm">💡 {FAMILIES[family].hint}</p>}
      </Panel>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Rechercher (go, went, aller…)", "Search")} className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 outline-none focus:border-ink-400" />
        <Segmented value={tier} onChange={setTier} options={[{ value: "all", label: t("Tous", "All") }, { value: "core", label: "25" }, { value: "essential", label: "26–60" }, { value: "more", label: "+" }]} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid grid-cols-[2.2rem_1fr_1fr_1fr_auto] gap-2 border-b border-line px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted">
          <span>#</span><span>{t("Base", "Base")}</span><span>{t("Prétérit", "Past")}</span><span>{t("Participe", "Participle")}</span><span />
        </div>
        <ul className="divide-y divide-line">
          {list.map((v) => {
            const st = stat(v.base);
            return (
              <li key={v.base}>
                <button onClick={() => speak(`${v.base}. ${v.past.replace("/", ", or ")}. ${v.pp.replace("/", ", or ")}.`, { rate: 0.85 })} className="grid w-full grid-cols-[2.2rem_1fr_1fr_1fr_auto] items-center gap-2 px-3 py-2.5 text-left hover:bg-surface-2" title={t("Écouter", "Listen")}>
                  <span className="text-xs tabular-nums text-muted">{v.rank}</span>
                  <span><span className="font-semibold">{v.base}</span><span className="block text-xs text-muted">{v.fr}</span></span>
                  <span>{v.past}</span>
                  <span>{v.pp}</span>
                  <span className="text-right">{st === "mastered" ? <Badge tone="mint">✓</Badge> : st === "learning" ? <Badge tone="ink">•</Badge> : <span className="text-muted">🔊</span>}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-center text-xs text-muted">{t("Touchez une ligne pour écouter les trois formes · ✓ maîtrisé · • en cours d'apprentissage", "Tap a row to hear the three forms")}</p>
    </div>
  );
}
