"use client";
import { useEffect, useState } from "react";
import { getDb, uid } from "@/lib/db";
import { IRREGULAR_RANKED, type RankedIrregular } from "@/lib/data/irregular-rank";
import { shuffle } from "@/lib/text";
import { gameSignal } from "@/lib/srs";
import { recordMistake, trackActivity } from "@/lib/track";
import { speak } from "@/lib/speech";
import { useT } from "@/hooks/useT";
import { Button, Panel, ProgressBar, cx } from "@/components/ui";

type Item = { verb: RankedIrregular; cardId?: string };

/** Production practice: type the past simple and past participle. Feeds the SRS for the learner's verbs. */
export function IrregularQuiz({ mode, onExit }: { mode: string; onExit: () => void }) {
  const t = useT();
  const [items, setItems] = useState<Item[] | null>(null);
  const [i, setI] = useState(0);
  const [past, setPast] = useState("");
  const [pp, setPp] = useState("");
  const [checked, setChecked] = useState<null | { past: boolean; pp: boolean }>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<RankedIrregular[]>([]);

  useEffect(() => {
    void (async () => {
      if (mode === "mine") {
        const db = getDb();
        const cards = (await db.cards.toArray()).filter((c) => c.themes.includes("irregular-verbs"));
        const srs = await db.srs.where("cardId").anyOf(cards.map((c) => c.id)).toArray();
        // Weakest first (lowest production stability), then a little randomness.
        const scored = cards.map((c) => {
          const st = srs.find((x) => x.cardId === c.id && x.skill === "production");
          return { c, w: (st?.stability ?? 0) - (st?.lapses ?? 0) * 3 + Math.random() * 2 };
        }).sort((a, b) => a.w - b.w);
        setItems(scored.slice(0, 12).flatMap(({ c }) => {
          const v = IRREGULAR_RANKED.find((x) => x.base === c.lemma);
          return v ? [{ verb: v, cardId: c.id }] : [];
        }));
      } else {
        setItems(shuffle(IRREGULAR_RANKED.slice(0, 25)).slice(0, 12).map((verb) => ({ verb })));
      }
    })();
  }, [mode]);

  if (!items) return <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />;
  const item = items[i];

  if (!item) {
    return (
      <Panel className="text-center">
        <div className="text-4xl">{score >= items.length * 0.8 ? "🏆" : "💪"}</div>
        <p className="mt-2 text-lg font-semibold">{t(`${score}/${items.length} verbes parfaits`, `${score}/${items.length} perfect`)}</p>
        {missed.length > 0 && (
          <div className="mt-4 text-left">
            <p className="mb-2 text-sm font-medium">{t("À revoir :", "To review:")}</p>
            <ul className="space-y-1 text-sm">{missed.map((v) => <li key={v.base} className="rounded-lg bg-surface-2 px-3 py-1.5"><b>{v.base}</b> – {v.past} – {v.pp} <span className="text-muted">({v.fr})</span></li>)}</ul>
          </div>
        )}
        <div className="mt-4 flex justify-center gap-2"><Button onClick={onExit}>{t("Terminer", "Done")}</Button></div>
      </Panel>
    );
  }

  const check = async () => {
    const norm = (x: string) => x.trim().toLowerCase().replace(/[’]/g, "'");
    const res = { past: item.verb.past.split("/").includes(norm(past)), pp: item.verb.pp.split("/").includes(norm(pp)) };
    setChecked(res);
    speak(`${item.verb.base}, ${item.verb.past.split("/")[0]}, ${item.verb.pp.split("/")[0]}`, { rate: 0.85 });
    const ok = res.past && res.pp;
    if (ok) setScore((x) => x + 1);
    else {
      setMissed((m) => [...m, item.verb]);
      await recordMistake({ id: `irregular:${item.verb.base}`, type: "conjugation", label: `${item.verb.base} – ${item.verb.past} – ${item.verb.pp}`, detail: item.verb.fr });
    }
    if (item.cardId) await gameSignal(item.cardId, ok, "production", "verbs");
  };

  const next = async () => {
    setPast("");
    setPp("");
    setChecked(null);
    if (i + 1 >= items.length) {
      await getDb().games.put({ id: uid("g"), gameId: "irregular-verbs-quiz", score, total: items.length, durationSec: 0, at: Date.now(), updatedAt: Date.now() });
      await trackActivity({ games: 1, grammarExercises: items.length, xp: score * 2 });
    }
    setI(i + 1);
  };

  const field = (label: string, value: string, set: (v: string) => void, ok: boolean | undefined, answer: string) => (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      <input value={value} onChange={(e) => set(e.target.value)} disabled={!!checked} autoCapitalize="off" autoCorrect="off" spellCheck={false}
        className={cx("mt-1 h-12 w-full rounded-xl border bg-surface px-3 text-lg outline-none focus:border-ink-400", ok === undefined ? "border-line" : ok ? "border-mint-500 bg-mint-100/50 dark:bg-mint-600/10" : "animate-shake border-coral-500")} />
      {ok === false && <span className="mt-1 block text-sm text-coral-600">→ {answer}</span>}
    </label>
  );

  return (
    <div>
      <ProgressBar value={i} max={items.length} className="mb-4" />
      <Panel key={item.verb.base} className="animate-pop">
        <p className="text-center text-sm text-muted">{item.verb.fr}</p>
        <p className="mt-1 text-center text-3xl font-semibold">{item.verb.base}</p>
        <form className="mt-5 grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); if (checked) void next(); else void check(); }}>
          {field(t("Prétérit", "Past simple"), past, setPast, checked?.past, item.verb.past)}
          {field(t("Participe passé", "Past participle"), pp, setPp, checked?.pp, item.verb.pp)}
          <Button type="submit" className="col-span-2 mt-1" disabled={!checked && (!past.trim() || !pp.trim())}>{checked ? t("Suivant", "Next") : t("Vérifier", "Check")}</Button>
        </form>
      </Panel>
    </div>
  );
}
