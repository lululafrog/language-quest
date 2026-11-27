"use client";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { tokenize, lemmaCandidates, type Token } from "@/lib/text";
import { speak, stopSpeaking, ttsSupported } from "@/lib/speech";
import { trackActivity } from "@/lib/track";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { Sheet, Spinner, cx, toast } from "@/components/ui";
import { WordPopup } from "./WordPopup";
import { PhrasePopup } from "./PhrasePopup";
import { ReaderSettings, READER_FONTS, READER_THEMES } from "./ReaderSettings";

type Mode = "word" | "phrase" | "sentence";
type Popup = { type: "word"; word: string; sentence: string } | { type: "phrase" | "sentence"; text: string; context: string } | null;

interface ParaData {
  text: string;
  tokens: Token[];
  offsets: number[];
}

function prepare(text: string): ParaData {
  const tokens = tokenize(text);
  const offsets: number[] = [];
  let o = 0;
  for (const tk of tokens) {
    offsets.push(o);
    o += tk.text.length;
  }
  return { text, tokens, offsets };
}

/** The sentence of `text` containing character offset `at`. */
function sentenceAt(text: string, at: number): string {
  const re = /[^.!?…]+(?:[.!?…]+["”’)\]]*|$)\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (at >= m.index && at < m.index + m[0].length) return m[0].trim();
    if (m[0].length === 0) re.lastIndex++;
  }
  return text;
}

function tokenAtChar(p: ParaData, ci: number): number {
  let idx = -1;
  for (let i = 0; i < p.tokens.length; i++) {
    if (p.offsets[i] > ci) break;
    if (p.tokens[i].word) idx = i;
  }
  return idx;
}

const Paragraph = memo(function Paragraph({ data, pIndex, isSaved, active, sel, savedVersion }: { data: ParaData; pIndex: number; isSaved: (w: string) => boolean; active: number; sel: [number, number] | null; savedVersion: number }) {
  void savedVersion;
  return (
    <p data-pidx={pIndex} id={`para-${pIndex}`} className="mb-[1em]">
      {data.tokens.map((tk, i) =>
        tk.word ? (
          <span
            key={i}
            data-p={pIndex}
            data-t={i}
            className={cx("reader-word", isSaved(tk.text) && "saved", active === i && "active", sel && i >= sel[0] && i <= sel[1] && "selected")}
          >
            {tk.text}
          </span>
        ) : (
          <span key={i}>{tk.text}</span>
        )
      )}
    </p>
  );
});

export function Reader({ bookId }: { bookId: string }) {
  const t = useT();
  const settings = useSettings();
  const db = getDb();
  const book = useLiveQuery(() => db.books.get(bookId), [bookId]);
  const content = useLiveQuery(() => db.bookContent.get(bookId), [bookId]);
  const cards = useLiveQuery(() => db.cards.toArray(), []);

  const [chapter, setChapter] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("word");
  const [anchor, setAnchor] = useState<{ p: number; t: number } | null>(null);
  const [popup, setPopup] = useState<Popup>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState<{ p: number; t: number } | null>(null);

  // ---- Saved words (underlined)
  const saved = useMemo(() => {
    const s = new Set<string>();
    for (const c of cards ?? []) {
      s.add(c.lemma.toLowerCase());
      s.add(c.term.toLowerCase());
      for (const v of c.variants ?? []) s.add(v.toLowerCase());
    }
    return s;
  }, [cards]);
  const savedVersion = saved.size;
  const isSaved = useCallback(
    (w: string) => {
      if (!saved.size) return false;
      const lw = w.toLowerCase();
      if (saved.has(lw)) return true;
      return lemmaCandidates(lw).some((c) => saved.has(c));
    },
    [saved]
  );

  // ---- Initial chapter from saved position
  const opened = useRef(false);
  useEffect(() => {
    if (book && !opened.current) {
      opened.current = true;
      void db.books.update(book.id, { lastOpenedAt: Date.now() });
    }
  }, [book, db]);

  const ch = chapter ?? (book ? Math.min(book.position.chapter, Math.max(0, book.chapterCount - 1)) : 0);
  const chap = content?.chapters[ch];
  const paras = useMemo(() => (chap ? chap.paragraphs.map(prepare) : []), [chap]);

  // ---- Restore scroll position once
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || !book || !paras.length) return;
    restored.current = true;
    if (book.position.chapter === ch && book.position.paragraph > 0) {
      requestAnimationFrame(() => document.getElementById(`para-${book.position.paragraph}`)?.scrollIntoView({ block: "start" }));
    }
  }, [book, paras, ch]);

  // ---- Track position & reading words
  const topPara = useRef(0);
  const pendingWords = useRef(0);
  const seen = useRef(new Set<string>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savePosition = useCallback(
    (c: number, p: number) => {
      if (!book || !content) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const len = content.chapters[c]?.paragraphs.length || 1;
        const progress = Math.min(1, (c + Math.min(1, (p + 1) / len)) / content.chapters.length);
        void db.books.update(book.id, { position: { chapter: c, paragraph: p }, progress: Math.max(progress, 0), lastOpenedAt: Date.now() });
      }, 800);
    },
    [book, content, db]
  );

  const flushWords = useCallback(() => {
    const n = pendingWords.current;
    if (n > 0) {
      pendingWords.current = 0;
      void trackActivity({ readingWords: n, xp: Math.floor(n / 50) });
    }
  }, []);

  useEffect(() => {
    if (!paras.length) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-pidx]"));
    const visible = new Set<number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const idx = Number((e.target as HTMLElement).dataset.pidx);
          if (e.isIntersecting) visible.add(idx);
          else {
            visible.delete(idx);
            // Scrolled past (upwards) → counted as read
            if (e.boundingClientRect.top < 0) {
              const key = `${ch}:${idx}`;
              if (!seen.current.has(key)) {
                seen.current.add(key);
                pendingWords.current += paras[idx]?.tokens.filter((x) => x.word).length ?? 0;
              }
            }
          }
        }
        if (visible.size) {
          const top = Math.min(...visible);
          if (top !== topPara.current) {
            topPara.current = top;
            savePosition(ch, top);
          }
        }
      },
      { threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    const iv = setInterval(flushWords, 15000);
    return () => {
      io.disconnect();
      clearInterval(iv);
      flushWords();
    };
  }, [paras, ch, savePosition, flushWords]);

  // ---- Chapter navigation
  const goChapter = useCallback(
    (c: number) => {
      if (!content) return;
      const next = Math.max(0, Math.min(content.chapters.length - 1, c));
      if (next > ch) {
        // Finishing a chapter counts the remaining paragraphs as read.
        paras.forEach((p, i) => {
          const key = `${ch}:${i}`;
          if (!seen.current.has(key)) {
            seen.current.add(key);
            pendingWords.current += p.tokens.filter((x) => x.word).length;
          }
        });
        flushWords();
      }
      stopAudio();
      setChapter(next);
      setAnchor(null);
      topPara.current = 0;
      window.scrollTo({ top: 0 });
      if (book) {
        const progress = Math.min(1, next / content.chapters.length);
        void db.books.update(book.id, { position: { chapter: next, paragraph: 0 }, progress: Math.max(book.progress, progress), lastOpenedAt: Date.now() });
      }
    },
    [content, ch, paras, book, db, flushWords]
  );

  // ---- Audio follow mode
  const session = useRef(0);
  const playingRef = useRef(false);
  const playFrom = useCallback(
    (p: number) => {
      if (!paras[p]) {
        playingRef.current = false;
        setPlaying(false);
        setActive(null);
        return;
      }
      const id = ++session.current;
      playingRef.current = true;
      setPlaying(true);
      setActive({ p, t: -1 });
      document.getElementById(`para-${p}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      const u = speak(paras[p].text, {
        rate: settings.speechRate,
        onBoundary: (ci) => {
          if (session.current !== id) return;
          setActive({ p, t: tokenAtChar(paras[p], ci) });
        },
        onEnd: () => {
          if (session.current !== id || !playingRef.current) return;
          playFrom(p + 1);
        },
      });
      if (!u) {
        playingRef.current = false;
        setPlaying(false);
        toast(t("La synthèse vocale n'est pas disponible sur ce navigateur.", "Speech synthesis is not available in this browser."), "err");
      }
    },
    [paras, settings.speechRate, t]
  );

  function stopAudio() {
    session.current++;
    playingRef.current = false;
    stopSpeaking();
    setPlaying(false);
    setActive(null);
  }
  useEffect(() => () => stopSpeaking(), []);

  // ---- Interaction (event delegation)
  const longPress = useRef<{ timer: ReturnType<typeof setTimeout> | null; fired: boolean }>({ timer: null, fired: false });

  function targetOf(e: { target: EventTarget | null }) {
    const el = (e.target as HTMLElement | null)?.closest?.("[data-t]") as HTMLElement | null;
    if (!el) return null;
    return { p: Number(el.dataset.p), t: Number(el.dataset.t) };
  }

  function onPointerDown(e: React.PointerEvent) {
    const tg = targetOf(e);
    longPress.current.fired = false;
    if (!tg) return;
    longPress.current.timer = setTimeout(() => {
      longPress.current.fired = true;
      setMode("phrase");
      setAnchor(tg);
      if (navigator.vibrate) navigator.vibrate(15);
      toast(t("Touchez le dernier mot de l'expression", "Tap the last word of the expression"), "info");
    }, 500);
  }
  function cancelLongPress() {
    if (longPress.current.timer) clearTimeout(longPress.current.timer);
    longPress.current.timer = null;
  }

  function onClick(e: React.MouseEvent) {
    if (longPress.current.fired) {
      longPress.current.fired = false;
      return;
    }
    const tg = targetOf(e);
    if (!tg) return;
    const p = paras[tg.p];
    if (!p) return;
    const word = p.tokens[tg.t].text;
    const offset = p.offsets[tg.t];
    if (playing) {
      // Tapping while listening restarts audio from that paragraph.
      playFrom(tg.p);
      return;
    }
    if (mode === "word") {
      setPopup({ type: "word", word, sentence: sentenceAt(p.text, offset) });
    } else if (mode === "sentence") {
      setPopup({ type: "sentence", text: sentenceAt(p.text, offset), context: p.text });
    } else {
      if (!anchor || anchor.p !== tg.p) {
        setAnchor(tg);
        return;
      }
      const a = Math.min(anchor.t, tg.t);
      const b = Math.max(anchor.t, tg.t);
      const text = p.text.slice(p.offsets[a], p.offsets[b] + p.tokens[b].text.length).trim();
      setAnchor({ p: tg.p, t: a });
      setSelEnd(b);
      setPopup({ type: "phrase", text, context: sentenceAt(p.text, p.offsets[a]) });
    }
  }
  const [selEnd, setSelEnd] = useState<number | null>(null);

  // ---------------- Render
  if (book === undefined || content === undefined) {
    return <div className="flex min-h-dvh items-center justify-center"><Spinner /></div>;
  }
  if (!book || !content) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">{t("Livre introuvable sur cet appareil.", "Book not found on this device.")}</p>
        <Link href="/library" className="text-ink-600 underline">{t("Retour à la bibliothèque", "Back to the library")}</Link>
      </div>
    );
  }

  const theme = READER_THEMES[settings.reader.theme];
  const font = READER_FONTS[settings.reader.font];
  const chapterCount = content.chapters.length;
  const barStyle = { background: theme.background, color: theme.color, borderColor: settings.reader.theme === "dark" ? "#2a2a35" : "rgba(0,0,0,0.08)" };

  return (
    <div className="min-h-dvh" style={theme}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b backdrop-blur" style={{ ...barStyle, background: `${theme.background}ee` }}>
        <div className="mx-auto flex max-w-3xl items-center gap-1 px-2 py-2">
          <Link href="/library" className="rounded-lg p-2 opacity-70 hover:opacity-100" aria-label={t("Retour", "Back")}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
          <button onClick={() => setShowToc(true)} className="min-w-0 flex-1 truncate px-1 text-left text-sm">
            <span className="font-medium">{book.title}</span>
            <span className="opacity-60"> · {chap?.title}</span>
          </button>
          <button onClick={() => setShowToc(true)} className="rounded-lg p-2 opacity-70 hover:opacity-100" aria-label={t("Chapitres", "Chapters")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
          </button>
          <button onClick={() => setShowSettings(true)} className="rounded-lg px-2 py-1.5 text-base font-semibold opacity-70 hover:opacity-100" aria-label={t("Affichage", "Display")}>Aa</button>
        </div>
        <div className="h-0.5 w-full" style={{ background: "rgba(127,127,127,0.15)" }}>
          <div className="h-full bg-ink-500 transition-all" style={{ width: `${Math.round(book.progress * 100)}%` }} />
        </div>
      </header>

      {/* Text */}
      <main
        className="mx-auto max-w-2xl px-5 pb-40 pt-8 select-none sm:px-8"
        style={{ ...font, fontSize: settings.reader.size, lineHeight: settings.reader.lineHeight }}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerMove={(e) => {
          if (Math.abs(e.movementX) + Math.abs(e.movementY) > 6) cancelLongPress();
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <p className="mb-1 text-xs font-sans uppercase tracking-widest opacity-50">
          {t("Chapitre", "Chapter")} {ch + 1} / {chapterCount}
        </p>
        <h1 className="mb-8 font-semibold leading-tight" style={{ fontSize: "1.35em" }}>{chap?.title}</h1>
        {paras.map((p, i) => (
          <Paragraph
            key={`${ch}-${i}`}
            data={p}
            pIndex={i}
            isSaved={isSaved}
            savedVersion={savedVersion}
            active={active?.p === i ? active.t : -1}
            sel={mode === "phrase" && anchor?.p === i ? [anchor.t, selEnd !== null && popup ? selEnd : anchor.t] : null}
          />
        ))}
        <div className="mt-12 flex items-center justify-between gap-3 font-sans text-sm">
          <button disabled={ch === 0} onClick={() => goChapter(ch - 1)} className="rounded-xl border px-4 py-2.5 disabled:opacity-30" style={barStyle}>← {t("Précédent", "Previous")}</button>
          {ch < chapterCount - 1 ? (
            <button onClick={() => goChapter(ch + 1)} className="rounded-xl bg-ink-600 px-4 py-2.5 font-medium text-white">{t("Chapitre suivant", "Next chapter")} →</button>
          ) : (
            <button
              onClick={() => {
                paras.forEach((p, i) => {
                  const key = `${ch}:${i}`;
                  if (!seen.current.has(key)) {
                    seen.current.add(key);
                    pendingWords.current += p.tokens.filter((x) => x.word).length;
                  }
                });
                void db.books.update(book.id, { progress: 1 });
                flushWords();
                toast(t("Livre terminé, bravo ! 🎉", "Book finished — well done! 🎉"));
              }}
              className="rounded-xl bg-mint-600 px-4 py-2.5 font-medium text-white"
            >
              {t("Terminer le livre", "Finish the book")} ✓
            </button>
          )}
        </div>
      </main>

      {/* Bottom toolbar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur safe-bottom" style={{ ...barStyle, background: `${theme.background}f2` }}>
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2 font-sans">
          <div className="flex flex-1 rounded-xl p-1" style={{ background: "rgba(127,127,127,0.12)" }} role="radiogroup" aria-label={t("Mode de sélection", "Selection mode")}>
            {([
              ["word", t("Mot", "Word")],
              ["phrase", t("Expression", "Phrase")],
              ["sentence", t("Phrase", "Sentence")],
            ] as [Mode, string][]).map(([m, label]) => (
              <button
                key={m}
                role="radio"
                aria-checked={mode === m}
                onClick={() => {
                  setMode(m);
                  setAnchor(null);
                  setSelEnd(null);
                  if (m === "phrase") toast(t("Touchez le premier puis le dernier mot", "Tap the first then the last word"), "info");
                }}
                className={cx("flex-1 rounded-lg px-2 py-1.5 text-[13px] font-medium transition", mode === m ? "bg-ink-600 text-white shadow" : "opacity-70")}
              >
                {label}
              </button>
            ))}
          </div>
          {ttsSupported() && (
            <button
              onClick={() => (playing ? stopAudio() : playFrom(topPara.current))}
              className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow", playing ? "bg-coral-500" : "bg-ink-600")}
              aria-label={playing ? t("Arrêter la lecture audio", "Stop audio") : t("Écouter le texte", "Listen to the text")}
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
          )}
        </div>
        {playing && (
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 pb-2 font-sans text-xs opacity-80">
            <span>{t("Lecture audio — touchez un paragraphe pour y aller", "Audio — tap a paragraph to jump")}</span>
          </div>
        )}
      </div>

      {/* Sheets */}
      {popup?.type === "word" && <WordPopup key={`${popup.word}|${popup.sentence}`} word={popup.word} sentence={popup.sentence} onClose={() => setPopup(null)} />}
      {(popup?.type === "phrase" || popup?.type === "sentence") && (
        <PhrasePopup
          key={popup.text}
          text={popup.text}
          context={popup.context}
          kind={popup.type}
          onClose={() => {
            setPopup(null);
            setAnchor(null);
            setSelEnd(null);
          }}
        />
      )}
      <ReaderSettings open={showSettings} onClose={() => setShowSettings(false)} />
      <Sheet open={showToc} onClose={() => setShowToc(false)} title={t("Chapitres", "Chapters")}>
        <ol className="space-y-1">
          {content.chapters.map((c, i) => (
            <li key={i}>
              <button
                onClick={() => {
                  setShowToc(false);
                  goChapter(i);
                }}
                className={cx("w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-surface-2", i === ch && "bg-ink-50 font-medium text-ink-700 dark:bg-ink-900/60 dark:text-ink-200")}
              >
                <span className="mr-2 tabular-nums text-muted">{i + 1}.</span>
                {c.title}
              </button>
            </li>
          ))}
        </ol>
      </Sheet>
    </div>
  );
}
