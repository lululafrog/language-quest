"use client";
// Result of a real-life analysis: translation, expressions to keep, replies, mini-lesson, similar situation.
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { keepExpressions, lessonExercises, type RealLifeAnalysis, type RLExpression } from "@/lib/reallife";
import { speak } from "@/lib/speech";
import { Badge, Button, Panel, ProgressBar, SectionHeader, SpeakButton, toast, cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ExerciseView, exerciseLabel } from "@/components/lesson/Exercises";
import type { Capture } from "@/lib/types";

const REG_LABEL: Record<string, string> = { formel: "Formel", courant: "Courant", familier: "Familier", argot: "Argot" };

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-fg/50">{children}</p>;
}

function ExpressionRow({ x, checked, onToggle, kept }: { x: RLExpression; checked: boolean; onToggle: () => void; kept: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={checked || kept} disabled={kept} onChange={onToggle} className="mt-1.5 h-5 w-5 shrink-0 accent-[var(--color-ink-600)]" aria-label={`Garder « ${x.en} »`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <p className="text-[16px] font-semibold">{x.en}</p>
            <SpeakButton text={x.en.replace(/^to /, "")} size={15} className="-my-1 p-1" />
            {x.register !== "courant" && <Badge tone={x.register === "argot" ? "coral" : "gray"}>{REG_LABEL[x.register]}</Badge>}
            {kept && <Badge tone="mint">Gardé</Badge>}
          </div>
          <p className="text-[14.5px] text-fg/75">{x.fr}</p>
          <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1 text-[13px] font-semibold text-ink-600 hover:underline dark:text-ink-300">
            {open ? "Moins de détails" : "Explication, exemples, prononciation"}
          </button>
          {open && (
            <div className="mt-2 space-y-2 text-[14px]">
              <p className="text-fg/85">{x.meaning}</p>
              <ul className="space-y-1.5">
                {x.examples.map((e, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <SpeakButton text={e.en} size={14} className="-my-1 shrink-0 p-1" />
                    <span>
                      <span className="font-medium">{e.en}</span>
                      <span className="block text-fg/60">{e.fr}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {x.pronunciation && (
                <p className="rounded-xl bg-surface-2 px-3 py-2 text-fg/80">
                  <span className="font-semibold">Prononciation : </span>
                  {x.pronunciation}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniLesson({ a }: { a: RealLifeAnalysis }) {
  const exercises = useMemo(() => lessonExercises(a), [a]);
  const [started, setStarted] = useState(false);
  const [pos, setPos] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ ok: 0, graded: 0 });
  const done = pos >= exercises.length;
  return (
    <Panel className="space-y-3">
      <Label>Mini-leçon</Label>
      <p className="text-[17px] font-semibold">{a.miniLesson.title}</p>
      <ul className="space-y-1.5 text-[15px] leading-relaxed">
        {a.miniLesson.explanation.map((e, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-400" />
            <span>{e}</span>
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border-l-4 border-ink-500 bg-ink-50 px-4 py-3 text-[15px] font-semibold dark:bg-ink-900/50">{a.miniLesson.rule}</div>
      {!exercises.length ? null : !started ? (
        <Button className="w-full" onClick={() => setStarted(true)}>
          S&apos;entraîner · {exercises.length} exercices
        </Button>
      ) : done ? (
        <div className="rounded-2xl bg-mint-500/10 p-4 text-center">
          <p className="text-2xl font-bold tabular-nums">{score.graded ? Math.round((score.ok / score.graded) * 100) : 100}%</p>
          <p className="text-sm text-fg/70">Les expressions que tu as gardées reviendront dans tes révisions et tes jeux.</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => { setPos(0); setScore({ ok: 0, graded: 0 }); setAnswered(false); }}>
            Recommencer
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-fg/60">
            <span>{exerciseLabel(exercises[pos])}</span>
            <span className="tabular-nums">{pos + 1} / {exercises.length}</span>
          </div>
          <ProgressBar value={pos + (answered ? 1 : 0)} max={exercises.length} />
          <div className="rounded-2xl border border-line p-4">
            <ExerciseView
              key={pos}
              ex={exercises[pos]}
              onDone={(o) => {
                setAnswered(true);
                if (o.override) setScore((s) => ({ ...s, ok: s.ok + 1 }));
                else if (!o.ungraded) setScore((s) => ({ ok: s.ok + (o.correct ? 1 : 0), graded: s.graded + 1 }));
              }}
            />
          </div>
          {answered && (
            <Button className="w-full" onClick={() => { setPos(pos + 1); setAnswered(false); }}>
              Continuer
            </Button>
          )}
        </div>
      )}
    </Panel>
  );
}

export function AnalysisView({ cap, a }: { cap: Capture; a: RealLifeAnalysis }) {
  const [picked, setPicked] = useState<Set<number>>(() => new Set(a.expressions.map((_, i) => i).slice(0, 3)));
  const [saving, setSaving] = useState(false);
  const [showFr, setShowFr] = useState(false);
  const keptTerms = useKeptTerms(cap);
  const toKeep = a.expressions.filter((x, i) => picked.has(i) && !keptTerms.has(x.en.toLowerCase()));

  const keep = async () => {
    setSaving(true);
    try {
      const r = await keepExpressions(cap.id, toKeep, a.sourceText || cap.input);
      toast(`${r.added} carte${r.added > 1 ? "s" : ""} ajoutée${r.added > 1 ? "s" : ""}${r.merged ? `, ${r.merged} déjà connue${r.merged > 1 ? "s" : ""}` : ""}`);
      setPicked(new Set());
    } catch {
      toast("Impossible d'enregistrer les cartes", "err");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel tone="highlight" className="space-y-2">
        <Label>{a.context}</Label>
        {a.sourceText && (
          <p className="flex items-start gap-1 text-[16px] font-medium">
            <span className="whitespace-pre-line">{a.sourceText}</span>
            {a.language !== "fr" && <SpeakButton text={a.sourceText} size={16} className="-my-1 shrink-0" />}
          </p>
        )}
        <div className="border-t border-line pt-2">
          <p className="text-[12px] font-semibold text-fg/50">{a.language === "fr" ? "En anglais naturel" : "Traduction naturelle"}</p>
          <p className="text-[15.5px]">{a.naturalTranslation}</p>
        </div>
      </Panel>

      {a.englishVersions.length > 0 && (
        <Panel className="space-y-2">
          <Label>Comment le dire</Label>
          {a.englishVersions.map((v, i) => (
            <div key={i} className="flex items-start gap-1">
              <SpeakButton text={v.en} size={16} className="-my-1 shrink-0" />
              <div>
                <p className="font-semibold">
                  {v.en} <span className="ml-1 text-[12px] font-medium text-fg/50">{REG_LABEL[v.register]}</span>
                </p>
                <p className="text-sm text-fg/65">{v.note}</p>
              </div>
            </div>
          ))}
        </Panel>
      )}

      <Panel className="space-y-1">
        <Label>Ton et registre · {REG_LABEL[a.register]}</Label>
        <p className="text-[15px] text-fg/85">{a.nuance}</p>
      </Panel>

      <section>
        <SectionHeader title="Expressions à garder" subtitle="Coche celles que tu veux revoir : elles reviendront dans tes révisions, tes jeux et tes conversations." />
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {a.expressions.map((x, i) => (
            <ExpressionRow
              key={i}
              x={x}
              kept={keptTerms.has(x.en.toLowerCase())}
              checked={picked.has(i)}
              onToggle={() => setPicked((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
            />
          ))}
        </div>
        <Button className="mt-3 w-full" onClick={keep} disabled={!toKeep.length} loading={saving}>
          <Icon name="flashcards" size={18} /> Ajouter {toKeep.length || ""} à mes flashcards
        </Button>
      </section>

      {a.grammar.length > 0 && (
        <Panel className="space-y-2">
          <Label>Grammaire</Label>
          {a.grammar.map((g, i) => (
            <div key={i}>
              <p className="font-semibold">{g.point}</p>
              <p className="text-[14.5px] text-fg/80">{g.explanation}</p>
            </div>
          ))}
        </Panel>
      )}

      {a.replySuggestions.length > 0 && (
        <Panel className="space-y-2">
          <Label>Pour répondre</Label>
          {a.replySuggestions.map((r, i) => (
            <div key={i} className="flex items-start gap-1 rounded-2xl bg-surface-2 px-3 py-2">
              <SpeakButton text={r.en} size={16} className="-my-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.en}</p>
                <p className="text-sm text-fg/60">{r.fr} · <span className="italic">{r.tone}</span></p>
              </div>
              <button type="button" className="shrink-0 rounded-full p-2 text-fg/45 hover:bg-surface hover:text-ink-600" aria-label="Copier" onClick={() => void navigator.clipboard?.writeText(r.en).then(() => toast("Copié"))}>
                <Icon name="layers" size={16} />
              </button>
            </div>
          ))}
        </Panel>
      )}

      <MiniLesson a={a} />

      <Panel className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Situation similaire</Label>
          <div className="flex gap-3 text-sm">
            <button type="button" onClick={() => speak(a.similarSituation.dialogue.map((d) => d.en).join(" … "))} className="inline-flex items-center gap-1 font-semibold text-ink-600 dark:text-ink-300">
              <Icon name="headphones" size={16} /> Écouter
            </button>
            <button type="button" onClick={() => setShowFr((v) => !v)} className="text-fg/55 hover:underline">{showFr ? "Masquer FR" : "Voir FR"}</button>
          </div>
        </div>
        <p className="text-[15px] text-fg/80">{a.similarSituation.context}</p>
        <div className="space-y-2">
          {a.similarSituation.dialogue.map((d, i) => {
            const side = i % 2 === 1;
            return (
              <div key={i} className={cx("flex", side ? "justify-end" : "justify-start")}>
                <div className={cx("max-w-[85%] rounded-2xl px-3.5 py-2.5", side ? "rounded-br-md bg-ink-600 text-white dark:bg-ink-500" : "rounded-bl-md bg-surface-2")}>
                  <p className={cx("text-[11px] font-semibold uppercase tracking-wide", side ? "text-white/70" : "text-fg/50")}>{d.speaker}</p>
                  <p className="text-[15px]">{d.en}</p>
                  {showFr && <p className={cx("text-[13px]", side ? "text-white/70" : "text-fg/55")}>{d.fr}</p>}
                </div>
              </div>
            );
          })}
        </div>
        <p className="rounded-2xl bg-surface-2 px-3 py-2 text-[15px]"><span className="font-semibold">À toi : </span>{a.similarSituation.task}</p>
        <Link href="/chat/free" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:underline dark:text-ink-300">
          <Icon name="chat" size={16} /> S&apos;entraîner en conversation avec l&apos;IA
        </Link>
      </Panel>
    </div>
  );
}

/** Expressions already turned into cards from this capture. */
function useKeptTerms(cap: Capture): Set<string> {
  const n = cap.keptCardIds.length;
  const terms = useLiveQuery(
    async () => (n ? (await getDb().cards.bulkGet(cap.keptCardIds)).flatMap((c) => (c ? [c.term.toLowerCase()] : [])) : []),
    [cap.id, n],
  );
  return useMemo(() => new Set(terms ?? []), [terms]);
}
