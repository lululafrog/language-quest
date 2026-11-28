"use client";
// Immersive flashcard session (no navigation bar): flip with a tap, answer with the 4 buttons or by swiping
// (→ Bien mémorisé · ← À revoir · ↑ Facile · ↓ Difficile). Missed words come back later in the session; words found
// at once are not asked again (their long-term review is scheduled by FSRS).
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, SpeakButton, Spinner, cx, toast } from "@/components/ui";
import { UniverseArt } from "@/components/vocab/UniverseArt";
import { getDb, getSettings } from "@/lib/db";
import { ensureImage } from "@/lib/cards";
import { checkEarnedItems } from "@/lib/game";
import { listenOnce, recognitionSupported, speak } from "@/lib/speech";
import { normalize, splitAlternatives } from "@/lib/text";
import { CATEGORIES, universesOf } from "@/lib/vocab/universes";
import { buildSession, recordFlashcard, isConsolidated, type CardFormat, type SessionCard, type SessionMode, type SessionOpts } from "@/lib/vocab/space";
import type { Cefr, Grade } from "@/lib/types";
import type { WordStatus } from "@/lib/vocab/core";

const GRADES: { g: Grade; label: string; hint: string; cls: string }[] = [
  { g: 1, label: "À revoir", hint: "←", cls: "border-coral-300 text-coral-700 dark:text-coral-300" },
  { g: 2, label: "Difficile", hint: "↓", cls: "border-sun-300 text-sun-700 dark:text-sun-300" },
  { g: 3, label: "Bien mémorisé", hint: "→", cls: "border-mint-300 text-mint-700 dark:text-mint-300" },
  { g: 4, label: "Facile", hint: "↑", cls: "border-ink-300 text-ink-700 dark:text-ink-300" },
];
const PROMPT: Record<CardFormat, string> = {
  discover: "Nouveau mot",
  "en-fr": "Que veut dire ce mot ?",
  "fr-en": "Comment dit-on en anglais ?",
  image: "Quel est ce mot ?",
  audio: "Écoute : quel mot entends-tu ?",
  cloze: "Complète la phrase",
  speak: "Dis-le en anglais",
  expression: "Retrouve l'expression",
};

function blank(sentence: string, word: string) {
  const first = word.split(" ")[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${word.length > 3 && !word.includes(" ") ? first.slice(0, Math.max(3, first.length - 2)) : first}\\w*(\\s+\\w+){0,${Math.max(0, word.split(" ").length - 1)}}`, "i");
  return re.test(sentence) ? sentence.replace(re, "_____") : sentence;
}

interface Done {
  sc: SessionCard;
  grade: Grade;
  status: WordStatus;
  created: boolean;
}

export default function Play() {
  const router = useRouter();
  const params = useSearchParams();
  const opts = useMemo<SessionOpts>(
    () => ({
      mode: (params.get("mode") as SessionMode) || "auto",
      size: Math.min(50, Math.max(3, Number(params.get("size")) || 10)),
      universe: params.get("universe") || undefined,
      sub: params.get("sub") || undefined,
      collection: params.get("collection") || undefined,
      level: (params.get("level") as Cefr) || undefined,
      own: params.get("own") === "1",
      formats: (params.get("formats")?.split(",").filter(Boolean) as CardFormat[]) || undefined,
      speechAvailable: typeof window !== "undefined" && recognitionSupported(),
    }),
    [params],
  );
  const [queue, setQueue] = useState<SessionCard[] | null>(null);
  const [empty, setEmpty] = useState(false);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [hint, setHint] = useState(0);
  const [heard, setHeard] = useState<{ text: string; ok: boolean } | null>(null);
  const [listening, setListening] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [results, setResults] = useState<Done[]>([]);
  const [finished, setFinished] = useState(false);
  const [rewards, setRewards] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const shownAt = useRef(0);
  const seen = useRef(new Set<string>());
  const requeued = useRef(new Map<string, number>());
  const start = useRef<{ x: number; y: number } | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    let alive = true;
    buildSession(opts).then((s) => {
      if (!alive) return;
      setQueue(s.cards);
      setEmpty(s.cards.length === 0);
    });
    return () => {
      alive = false;
    };
  }, [opts, round]);

  const sc = queue?.[i];
  useEffect(() => {
    shownAt.current = Date.now();
    if (sc?.format === "audio") setTimeout(() => speak(sc.item.en), 250);
  }, [sc]);

  const doFlip = useCallback(() => {
    if (!sc || flipped) return;
    setFlipped(true);
    if (sc.format !== "audio") speak(sc.item.en);
  }, [sc, flipped]);

  const answer = useCallback(
    async (g: Grade) => {
      if (!sc || !queue || busy.current) return;
      busy.current = true;
      const first = !seen.current.has(sc.key);
      seen.current.add(sc.key);
      const ms = Date.now() - shownAt.current;
      try {
        const r = await recordFlashcard(sc, g, { ms, hint: hint > 0, firstInSession: first });
        if (first) setResults((x) => [...x, { sc, grade: g, status: r.status, created: r.created }]);
        else setResults((x) => x.map((d) => (d.sc.key === sc.key ? { ...d, status: r.status } : d)));
        if (r.created && (await getSettings()).autoImages) {
          const card = await getDb().cards.get(r.cardId);
          if (card && !card.imageKey) void ensureImage(card).catch(() => null);
        }
      } catch {
        toast("Réponse non enregistrée, réessaie.", "err");
        busy.current = false;
        return;
      }
      // in-session spacing: a miss comes back a few cards later (twice at most), a hard word once at the end
      let next = queue;
      const n = requeued.current.get(sc.key) ?? 0;
      if (g === 1 && n < 2) {
        requeued.current.set(sc.key, n + 1);
        const at = Math.min(queue.length, i + 4);
        next = [...queue.slice(0, at), { ...sc, format: sc.format === "discover" ? "en-fr" : sc.format }, ...queue.slice(at)];
      } else if (g === 2 && n < 1) {
        requeued.current.set(sc.key, n + 1);
        next = [...queue, { ...sc, format: sc.format === "discover" ? "en-fr" : sc.format }];
      }
      setQueue(next);
      setFlipped(false);
      setHint(0);
      setHeard(null);
      setDrag({ x: 0, y: 0, active: false });
      if (i + 1 >= next.length) {
        setFinished(true);
        const fresh = await checkEarnedItems().catch(() => []);
        setRewards(fresh.map((f) => f.fr));
      } else setI(i + 1);
      busy.current = false;
    },
    [sc, queue, i, hint],
  );

  // keyboard: space / enter flips, 1–4 answer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        doFlip();
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) void answer(Number(e.key) as Grade);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doFlip, answer, flipped]);

  async function speakTest() {
    if (!sc) return;
    setListening(true);
    try {
      const r = await listenOnce("en-GB").promise;
      const said = normalize(r.transcript);
      const ok = said.includes(normalize(sc.item.en)) || normalize(sc.item.en).includes(said) && said.length > 2;
      setHeard({ text: r.transcript, ok });
    } catch {
      setHeard({ text: "", ok: false });
    } finally {
      setListening(false);
      doFlip();
    }
  }

  // swipe on the revealed card
  function pDown(e: React.PointerEvent) {
    if (!flipped) return;
    start.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ x: 0, y: 0, active: true });
  }
  function pMove(e: React.PointerEvent) {
    if (!start.current) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true });
  }
  function pUp() {
    if (!start.current) return;
    start.current = null;
    const { x, y } = drag;
    const T = 90;
    if (Math.abs(x) > Math.abs(y) && Math.abs(x) > T) void answer(x > 0 ? 3 : 1);
    else if (Math.abs(y) > T) void answer(y < 0 ? 4 : 2);
    else setDrag({ x: 0, y: 0, active: false });
  }
  const swipeGrade: Grade | null = !drag.active ? null : Math.abs(drag.x) > Math.abs(drag.y) ? (Math.abs(drag.x) > 50 ? (drag.x > 0 ? 3 : 1) : null) : Math.abs(drag.y) > 50 ? (drag.y < 0 ? 4 : 2) : null;

  // ---------- screens
  if (!queue)
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-ink-500">
        <Spinner className="h-8 w-8" />
      </div>
    );

  if (empty)
    return (
      <Shell onClose={() => router.push("/vocab")}>
        <div className="mx-auto mt-16 max-w-sm text-center">
          <p className="font-display text-2xl font-semibold">{opts.mode === "review" || opts.mode === "difficult" ? "Rien à réviser ici" : "Pas de mot à proposer"}</p>
          <p className="mt-2 text-muted">{opts.mode === "review" || opts.mode === "difficult" ? "Ta mémoire est à jour pour cette sélection. Découvre plutôt de nouveaux mots." : opts.own ? "Tu n'as pas encore de mots à toi dans cette sélection." : "Tous les mots de cette sélection sont déjà dans ton vocabulaire."}</p>
          <div className="mt-6 space-y-2">
            {opts.mode !== "new" && !opts.own && (
              <Button className="w-full" onClick={() => router.replace(`/vocab/play?${new URLSearchParams({ ...Object.fromEntries(params.entries()), mode: "new" }).toString()}`)}>Découvrir de nouveaux mots</Button>
            )}
            <Link href="/vocab" className="block"><Button variant="secondary" className="w-full">Retour au vocabulaire</Button></Link>
          </div>
        </div>
      </Shell>
    );

  if (finished) {
    const learned = results.filter((r) => r.created || r.sc.isNew).length;
    const reviewed = results.length - learned;
    const again = results.filter((r) => r.status === "review").map((r) => r.sc.item.en);
    const solid = results.filter((r) => isConsolidated(r.status)).length;
    const good = results.filter((r) => r.grade >= 3).length;
    const msg = good === results.length ? "Sans faute : ta mémoire répond présent." : good / Math.max(1, results.length) >= 0.7 ? "Belle session : la plupart des mots sont bien ancrés." : "Chaque mot raté reviendra au bon moment : c'est comme ça qu'on retient.";
    return (
      <Shell onClose={() => router.push("/vocab")}>
        <div className="mx-auto mt-6 max-w-md animate-pop">
          <p className="text-center font-display text-2xl font-semibold">Session terminée</p>
          <p className="mt-1 text-center text-muted">{msg}</p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Stat n={learned} label="nouveaux mots" tone="bg-sun-100/70 dark:bg-sun-500/15" />
            <Stat n={reviewed} label="révisés" tone="bg-mint-100/70 dark:bg-mint-600/15" />
            <Stat n={again.length} label="à revoir" tone="bg-coral-100/70 dark:bg-coral-600/15" />
          </div>
          {solid > 0 && <p className="mt-3 text-center text-sm">{solid} mot{solid > 1 ? "s" : ""} de cette session {solid > 1 ? "sont" : "est"} déjà bien mémorisé{solid > 1 ? "s" : ""} : on les vérifiera dans quelques jours.</p>}
          {rewards.length > 0 && <p className="mt-3 rounded-2xl bg-mint-100/80 p-3 text-center text-sm font-medium text-mint-700 dark:bg-mint-600/20 dark:text-mint-300">Nouvelle récompense pour ton avatar : {rewards.join(", ")} !</p>}
          {again.length > 0 && (
            <div className="mt-4 rounded-2xl border border-line bg-surface p-3">
              <p className="text-sm font-semibold">À revoir bientôt</p>
              <p className="mt-1 text-sm text-muted">{again.join(" · ")}</p>
            </div>
          )}
          <div className="mt-6 space-y-2">
            <Button
              className="w-full"
              onClick={() => {
                setFinished(false);
                setResults([]);
                setI(0);
                setQueue(null);
                seen.current.clear();
                requeued.current.clear();
                setRound((r) => r + 1);
              }}
            >
              Continuer ({opts.size} de plus)
            </Button>
            <Link href="/vocab" className="block"><Button variant="secondary" className="w-full">Terminer</Button></Link>
          </div>
        </div>
      </Shell>
    );
  }

  if (!sc) return null;
  const it = sc.item;
  const frFirst = splitAlternatives(it.fr)[0] ?? it.fr;
  const uni = universesOf(it.themes, sc.entry?.subs)[0];
  const showImageFront = sc.format === "image" && sc.image;
  const hintText = sc.format === "fr-en" || sc.format === "cloze" || sc.format === "expression" || sc.format === "speak" ? it.en.split(" ").map((w) => w.slice(0, hint + 1) + "·".repeat(Math.max(0, w.length - hint - 1))).join(" ") : null;
  const rot = drag.active ? drag.x / 18 : 0;

  return (
    <Shell onClose={() => router.push("/vocab")} progress={(i + (flipped ? 0.5 : 0)) / queue.length} count={`${Math.min(i + 1, queue.length)} / ${queue.length}`}>
      <div className="mx-auto flex max-w-md flex-col">
        <div className="flip-scene mt-2" onPointerDown={pDown} onPointerMove={pMove} onPointerUp={pUp} onPointerCancel={pUp} style={{ touchAction: flipped ? "none" : "auto" }}>
          <div
            className={cx("flip-card h-[min(62dvh,520px)]", flipped && "is-flipped")}
            style={drag.active ? { transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rot}deg) rotateY(180deg)`, transition: "none" } : undefined}
          >
            {/* front */}
            <button type="button" onClick={doFlip} className="flip-face flex flex-col overflow-hidden rounded-[28px] border border-line bg-surface text-left shadow-lg" aria-label="Retourner la carte">
              {showImageFront ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sc.image} alt="Illustration à identifier" className="h-1/2 w-full object-cover" />
              ) : (
                <UniverseArt id={uni ?? "daily"} className="h-24 w-full shrink-0 opacity-80" />
              )}
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{PROMPT[sc.format]}</p>
                {(sc.format === "discover" || sc.format === "en-fr") && (
                  <>
                    <p className="mt-3 font-display text-4xl font-semibold leading-tight">{it.en}</p>
                    {it.ipa && <p className="mt-1 text-muted">/{it.ipa.replace(/^\/|\/$/g, "")}/</p>}
                  </>
                )}
                {(sc.format === "fr-en" || sc.format === "speak") && <p className="mt-3 font-display text-3xl font-semibold leading-tight">{frFirst}</p>}
                {sc.format === "expression" && (
                  <>
                    <p className="mt-3 font-display text-2xl font-semibold leading-snug">{frFirst}</p>
                    {it.def && <p className="mt-2 text-sm text-muted">{it.def}</p>}
                  </>
                )}
                {sc.format === "cloze" && it.example && (
                  <>
                    <p className="mt-3 text-xl font-medium leading-relaxed">{blank(it.example, it.en)}</p>
                    {it.exampleFr && <p className="mt-2 text-sm text-muted">{it.exampleFr}</p>}
                  </>
                )}
                {sc.format === "audio" && (
                  <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); speak(it.en); }} className="mt-4 flex h-20 w-20 items-center justify-center rounded-full bg-ink-600 text-3xl text-white shadow-md">▶</span>
                )}
                {hintText && hint > 0 && <p className="mt-3 font-mono text-lg tracking-widest text-ink-600 dark:text-ink-300">{hintText}</p>}
                {heard && <p className={cx("mt-3 text-sm", heard.ok ? "text-mint-700" : "text-coral-700")}>{heard.text ? `J'ai entendu : « ${heard.text} »` : "Je n'ai rien entendu."}</p>}
                <p className="mt-6 text-xs text-muted">Touche la carte pour la retourner</p>
              </div>
            </button>

            {/* back */}
            <div className="flip-face flip-back flex flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-lg">
              {sc.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sc.image} alt="" className="h-28 w-full shrink-0 object-cover" />
              ) : (
                <UniverseArt id={uni ?? "daily"} className="h-16 w-full shrink-0 opacity-70" />
              )}
              <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3">
                <div className="flex items-center gap-1.5">
                  <p className="font-display text-3xl font-semibold leading-tight">{it.en}</p>
                  <SpeakButton text={it.en} />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                  {it.ipa && <span>/{it.ipa.replace(/^\/|\/$/g, "")}/</span>}
                  {it.cefr && <span className="rounded-full bg-surface-2 px-1.5 text-[11px] font-semibold">{it.cefr}</span>}
                  <span className="text-[11px]">{CATEGORIES[sc.cat as keyof typeof CATEGORIES] ?? ""}</span>
                </div>
                <p className="mt-2 text-xl font-medium">{it.fr}</p>
                {it.example && (
                  <div className="mt-3 rounded-2xl bg-surface-2 p-3 text-[15px]">
                    <p className="flex items-start gap-1 italic"><span className="flex-1">{it.example}</span><SpeakButton text={it.example} size={16} /></p>
                    {it.exampleFr && <p className="mt-1 text-sm text-muted">{it.exampleFr}</p>}
                  </div>
                )}
                {it.synonyms?.[0] && normalize(it.synonyms[0]) !== normalize(it.en) && <p className="mt-2 text-sm">≈ <b>{it.synonyms[0]}</b>{sc.entry?.ant ? <> · ≠ <b>{sc.entry.ant}</b></> : null}</p>}
                {sc.entry?.note && <p className="mt-2 rounded-xl bg-sun-100/70 p-2 text-sm dark:bg-sun-500/15">{sc.entry.note}</p>}
                {sc.entry?.tip && <p className="mt-2 text-sm"><span className="font-semibold">Astuce : </span>{sc.entry.tip}</p>}
              </div>
            </div>
          </div>
          {swipeGrade && <p className="pointer-events-none mt-2 text-center text-sm font-semibold text-muted">{GRADES.find((g) => g.g === swipeGrade)!.label}</p>}
        </div>

        {/* actions */}
        <div className="safe-bottom mt-4 pb-4">
          {!flipped ? (
            <div className="flex gap-2">
              {hintText && hint < 3 && (
                <Button variant="secondary" className="flex-1" onClick={() => setHint((h) => h + 1)}>Indice</Button>
              )}
              {sc.format === "speak" && recognitionSupported() ? (
                <Button className="flex-[2]" onClick={speakTest} loading={listening}>{listening ? "J'écoute…" : "Parler"}</Button>
              ) : null}
              <Button className="flex-[2]" variant={sc.format === "speak" ? "outline" : "primary"} onClick={doFlip}>Voir la réponse</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                {GRADES.map((g) => (
                  <button key={g.g} onClick={() => answer(g.g)} className={cx("flex h-16 flex-col items-center justify-center rounded-2xl border-2 bg-surface text-[13px] font-semibold leading-tight transition active:scale-95", g.cls)}>
                    {g.label}
                    <span className="text-[10px] font-normal opacity-60">{g.hint}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-muted">{hint > 0 ? "Indice utilisé : la carte reviendra plus tôt." : "Tu peux aussi glisser la carte."}</p>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Stat({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className={cx("rounded-2xl p-3", tone)}>
      <p className="text-2xl font-semibold tabular-nums">{n}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function Shell({ children, onClose, progress, count }: { children: React.ReactNode; onClose: () => void; progress?: number; count?: string }) {
  return (
    <div className="min-h-dvh bg-bg px-4 pt-[max(env(safe-area-inset-top),12px)]">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface-2" aria-label="Quitter la session">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
        {progress !== undefined && (
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-ink-500 transition-all duration-500" style={{ width: `${Math.min(1, progress) * 100}%` }} />
          </div>
        )}
        {count && <span className="text-xs tabular-nums text-muted">{count}</span>}
      </div>
      {children}
    </div>
  );
}
