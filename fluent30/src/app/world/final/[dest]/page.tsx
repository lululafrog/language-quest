"use client";
// Final mission of a destination: an interactive story that combines every skill of the country.
// Opens once the regular missions are done; validates the destination (stamp, trophy, postcard).
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { getPrefs, setSpeechPrefs, stopSpeaking } from "@/lib/speech";
import { useSettings } from "@/hooks/useSettings";
import { accentFor, atlasDestination, destName, learnerBand } from "@/lib/atlas/engine";
import { recordAtlasFinal, type AtlasMissionResult } from "@/lib/atlas/progress";
import { BAND_ORDER, type Band } from "@/lib/atlas/types";
import { StoryPlayer, type StoryResult } from "@/components/atlas/StoryPlayer";
import { Badge, Button, EmptyState, LinkButton, Panel, Segmented, cx } from "@/components/ui";
import { Icon } from "@/components/icons";

export default function FinalPage() {
  const { dest: destId } = useParams<{ dest: string }>();
  const dest = atlasDestination(destId);
  const s = useSettings();
  const [band, setBand] = useState<Band | null>(null);
  const [phase, setPhase] = useState<"intro" | "play" | "result">("intro");
  const [result, setResult] = useState<StoryResult | null>(null);
  const [res, setRes] = useState<AtlasMissionResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const rows = useLiveQuery(() => getDb().missions.toArray(), []) ?? null;
  const accent = dest ? accentFor(dest.id, dest.characters[0]?.accent) : "en-GB";

  useEffect(() => {
    void learnerBand().then((b) => setBand((c) => c ?? b));
  }, []);
  useEffect(() => {
    if (!dest) return;
    const before = getPrefs();
    setSpeechPrefs({ accent, voiceURI: undefined });
    return () => {
      stopSpeaking();
      setSpeechPrefs({ accent: before.accent, voiceURI: before.voiceURI });
    };
  }, [dest, accent]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase]);

  if (!dest || dest.preview || !dest.final.nodes.length) {
    return (
      <EmptyState title="Mission finale à venir">
        <p className="mb-2 text-sm text-muted">Cette destination n&apos;a pas encore sa mission finale.</p>
        <Link href={dest ? `/world/${dest.id}` : "/world"} className="font-semibold text-ink-600 underline">Retour</Link>
      </EmptyState>
    );
  }
  if (!rows) return <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-3xl bg-surface-2" />;

  const done = new Set(rows.filter((r) => r.status === "done").map((r) => r.id));
  const missing = dest.missions.filter((m) => !done.has(m.id) && !(m.legacyId && done.has(m.legacyId)));
  const name = destName(dest.id);
  const b = band ?? "A1";

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-2">
        <Link href={`/world/${dest.id}`} className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-muted hover:bg-surface-2">
          <Icon name="arrow" size={16} className="rotate-180" /> {name}
        </Link>
        <div className="flex items-center gap-2">
          <Badge tone="sun">Mission finale</Badge>
          <Badge tone="ink">{b}</Badge>
        </div>
        <h1 className="font-display text-[26px] font-bold leading-tight">{dest.final.title}</h1>
        <p className="text-[15px] text-muted">{dest.final.titleEn}</p>
      </header>

      {phase === "intro" && (
        <div className="space-y-4">
          <Panel tone="highlight" className="space-y-2">
            <p className="text-[16px] leading-relaxed">{dest.final.intro}</p>
            {dest.final.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">{dest.final.skills.map((k) => <Badge key={k} tone="gray">{k}</Badge>)}</div>
            )}
          </Panel>
          <p className="text-[13.5px] text-muted">
            Tes choix changent la suite de l&apos;histoire. On évalue ta capacité à communiquer : plusieurs formulations naturelles sont acceptées.
          </p>
          {missing.length > 0 ? (
            <Panel className="space-y-2">
              <p className="font-semibold">Encore {missing.length} mission{missing.length > 1 ? "s" : ""} avant la finale</p>
              <ul className="space-y-1 text-[14.5px]">
                {missing.slice(0, 5).map((m) => (
                  <li key={m.id}>
                    <Link href={`/world/mission/${m.id}`} className="text-ink-600 hover:underline dark:text-ink-300">{m.title}</Link>
                  </li>
                ))}
              </ul>
              <p className="text-[13px] text-muted">Tu peux quand même t&apos;entraîner sur la finale ; elle ne validera la destination qu&apos;une fois toutes les missions réussies.</p>
            </Panel>
          ) : null}
          <Panel className="space-y-2">
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Niveau</p>
            <Segmented value={b} onChange={(v) => setBand(v)} options={BAND_ORDER.map((x) => ({ value: x, label: x }))} />
          </Panel>
          <Button size="lg" className="w-full" onClick={() => setPhase("play")}>Commencer l&apos;aventure</Button>
        </div>
      )}

      {phase === "play" && (
        <StoryPlayer
          key={attempt}
          final={dest.final}
          accent={accent}
          onFinish={(r) => {
            setResult(r);
            setPhase("result");
            recordAtlasFinal(dest.id, r.score, b).then(setRes).catch(() => setRes(null));
          }}
        />
      )}

      {phase === "result" && result && (
        <div className="space-y-4 pb-8">
          <Panel tone="highlight" className="space-y-2 text-center">
            <p className="font-display text-5xl font-bold tabular-nums">{Math.round(result.score * 100)}%</p>
            <p className="text-[17px] font-semibold">
              {result.score >= 0.7 ? "Aventure réussie : tu as communiqué clairement." : "L'aventure continue : rejoue pour améliorer tes réponses."}
            </p>
            <p className="text-sm text-muted">{result.good} bonne{result.good > 1 ? "s" : ""} décision{result.good > 1 ? "s" : ""} ou message{result.good > 1 ? "s" : ""} clair{result.good > 1 ? "s" : ""} sur {result.total}.</p>
            {res?.firstCompletion && <p className="text-sm font-semibold text-sun-600 dark:text-sun-400">+{res.coins} pièces</p>}
          </Panel>
          {res?.validation?.validated && (
            <Panel className={cx("space-y-2 text-center", !s.reduceMotion && "animate-pop")}>
              <Icon name="passport" size={32} className="mx-auto text-ink-600" />
              <p className="font-display text-lg font-semibold">{name} validée !</p>
              <p className="text-sm text-muted">
                Tampon, trophée et carte postale ajoutés.
                {res.validation.rewards.length > 0 && ` Récompenses : ${res.validation.rewards.map((r) => r.fr).join(", ")}.`}
              </p>
              <p className="text-[12.5px] text-muted">Cette validation reconnaît les situations réussies dans la destination ; ce n&apos;est pas une certification officielle de niveau.</p>
              <LinkButton href={`/world/postcards/${dest.id}`} className="w-full">Écrire ma carte postale</LinkButton>
            </Panel>
          )}
          {result.score >= 0.7 && missing.length > 0 && (
            <p className="text-sm text-muted">Termine les missions restantes pour valider {name}.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAttempt((a) => a + 1);
                setResult(null);
                setRes(null);
                setPhase("intro");
              }}
            >
              Rejouer
            </Button>
            <LinkButton href={`/world/${dest.id}`} variant="secondary">{name}</LinkButton>
          </div>
        </div>
      )}
    </article>
  );
}
