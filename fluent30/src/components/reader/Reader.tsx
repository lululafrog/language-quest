"use client";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, saveSettings } from "@/lib/db";
import { tokenize, lemmaCandidates, type Token } from "@/lib/text";
import { speak, stopSpeaking, ttsSupported } from "@/lib/speech";
import { addLookup, addReadingTime, addWordsRead, canAdapt, finishBook, finishChapter, markStarted } from "@/lib/reading";
import { PRIORITY_INFO, wordInfo } from "@/lib/priority";
import { errorMessage } from "@/lib/api";
import { useSettings } from "@/hooks/useSettings";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { Sheet, Spinner, cx, toast } from "@/components/ui";
import { WordPopup } from "./WordPopup";
import { PhrasePopup } from "./PhrasePopup";
import { ReaderSettings, READER_FONTS, READER_THEMES } from "./ReaderSettings";
import { ChapterSession } from "./ChapterSession";
import { CharacterChat } from "./CharacterChat";
import { ShadowingSheet } from "./ShadowingSheet";
import { LevelSheet } from "./LevelSheet";
import { aiAdaptParagraphs, aiTranslateParagraphs, freeTranslate, sentencesOf } from "./translate";
import { getAdaptLevel, setAdaptLevel, useReaderPrefs } from "./prefs";

type Mode = "word" | "phrase" | "sentence" | "paragraph";
type Popup = { type: "word"; word: string; sentence: string; proper: boolean } | { type: "phrase" | "sentence" | "paragraph"; text: string; context: string } | null;

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

/** Capitalised word that does not start a sentence → probably a proper noun. */
function isProperNoun(p: ParaData, t: number): boolean {
  const w = p.tokens[t]?.text ?? "";
  if (!/^[A-Z]/.test(w) || w === "I" || w.startsWith("I'")) return false;
  const before = p.text.slice(0, p.offsets[t]);
  return !/(^|[.!?…:"“‘]\s*)$/.test(before.trimEnd() === before ? before : before.trimEnd() + " ");
}

const Paragraph = memo(function Paragraph({ data, pIndex, isSaved, active, sel, savedVersion, colorize, fr, frState, onTranslate, frStyle }: {
  data: ParaData;
  pIndex: number;
  isSaved: (w: string) => boolean;
  active: number;
  sel: [number, number] | null;
  savedVersion: number;
  colorize: boolean;
  fr?: string;
  frState?: "loading" | "button" | null;
  onTranslate?: (p: number) => void;
  frStyle?: React.CSSProperties;
}) {
  void savedVersion;
  return (
    <div className="mb-[1em]">
      <p data-pidx={pIndex} id={`para-${pIndex}`}>
        {data.tokens.map((tk, i) => {
          if (!tk.word) return <span key={i}>{tk.text}</span>;
          let style: React.CSSProperties | undefined;
          if (colorize) {
            const info = wordInfo(tk.text, { properNoun: isProperNoun(data, i) });
            if (!(info.rank && info.rank <= 150)) style = { boxShadow: `inset 0 -2px 0 ${PRIORITY_INFO[info.priority].color}` };
          }
          return (
            <span key={i} data-p={pIndex} data-t={i} style={style} className={cx("reader-word", isSaved(tk.text) && "saved", active === i && "active", sel && i >= sel[0] && i <= sel[1] && "selected")}>
              {tk.text}
            </span>
          );
        })}
      </p>
      {fr ? (
        <p className="mt-1 font-sans text-[0.82em] leading-relaxed opacity-70" style={frStyle}>{fr}</p>
      ) : frState === "loading" ? (
        <p className="mt-1 font-sans text-[0.75em] opacity-50">…</p>
      ) : frState === "button" ? (
        <button onClick={(e) => { e.stopPropagation(); onTranslate?.(pIndex); }} className="mt-1 font-sans text-[0.72em] underline opacity-60">FR ↓</button>
      ) : null}
    </div>
  );
});

export function Reader({ bookId }: { bookId: string }) {
  const t = useT();
  const settings = useSettings();
  const status = useStatus();
  const prefs = useReaderPrefs();
  const db = getDb();
  const book = useLiveQuery(async () => (await db.books.get(bookId)) ?? null, [bookId]);
  const content = useLiveQuery(async () => (await db.bookContent.get(bookId)) ?? null, [bookId]);
  const cards = useLiveQuery(() => db.cards.toArray(), []);
  const readingMode = settings.readingMode ?? "assisted";
  const accent = settings.reader.voice ?? settings.accent;

  const [chapter, setChapter] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("word");
  const [anchor, setAnchor] = useState<{ p: number; t: number } | null>(null);
  const [popup, setPopup] = useState<Popup>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showLevel, setShowLevel] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [shadowing, setShadowing] = useState<string[] | null>(null);
  const [listenOnly, setListenOnly] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState<{ p: number; t: number } | null>(null);
  const [session, setSession] = useState<{ chapter: number; last: boolean; lookedUp: string[]; words: number } | null>(null);
  const [level, setLevel] = useState<string | null>(() => getAdaptLevel(bookId));
  const [adapted, setAdapted] = useState<{ key: string; paras: string[] } | null>(null);
  const [adapting, setAdapting] = useState<string | null>(null);
  const [frMap, setFrMap] = useState<{ key: string; fr: string[] } | null>(null);
  const [frFree, setFrFree] = useState<Record<string, string>>({});
  const [frLoading, setFrLoading] = useState<Record<string, boolean>>({});
  const [bilProgress, setBilProgress] = useState<string | null>(null);

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
    [saved],
  );

  // ---- Open: last opened + start date
  const opened = useRef(false);
  useEffect(() => {
    if (book && !opened.current) {
      opened.current = true;
      void db.books.update(book.id, { lastOpenedAt: Date.now() });
      void markStarted(book.id);
    }
  }, [book, db]);

  const ch = chapter ?? (book ? Math.min(book.position.chapter, Math.max(0, book.chapterCount - 1)) : 0);
  const chap = content?.chapters[ch];
  const adaptAllowed = !!book && canAdapt(book.source);
  const adaptKey = `adapt:${bookId}:${ch}:${level}`;
  const shownParagraphs = useMemo(() => (level && adapted?.key === adaptKey ? adapted.paras : chap?.paragraphs ?? []), [level, adapted, adaptKey, chap]);
  const paras = useMemo(() => shownParagraphs.map(prepare), [shownParagraphs]);

  // ---- Level adaptation (AI, public-domain texts only)
  useEffect(() => {
    if (!level || !chap || !book || !adaptAllowed || !status) return;
    if (adapted?.key === adaptKey) return;
    if (!status.ai) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading indicator for async work
    setAdapting(t("Adaptation du chapitre…", "Adapting the chapter…"));
    aiAdaptParagraphs(chap.paragraphs, level, book.title, book.source, adaptKey, (d, n) => alive && setAdapting(t(`Adaptation du chapitre… ${d}/${n}`, `Adapting… ${d}/${n}`)))
      .then((p) => {
        if (!alive) return;
        // Keep the reading position: map the visible paragraph proportionally.
        const ratio = chap.paragraphs.length ? topPara.current / chap.paragraphs.length : 0;
        setAdapted({ key: adaptKey, paras: p });
        requestAnimationFrame(() => document.getElementById(`para-${Math.round(ratio * p.length)}`)?.scrollIntoView({ block: "start" }));
      })
      .catch((e) => alive && toast(errorMessage(e), "err"))
      .finally(() => alive && setAdapting(null));
    return () => {
      alive = false;
    };
  }, [level, chap, book, adaptAllowed, status, adapted, adaptKey, t]);

  const pickLevel = (l: string | null) => {
    setShowLevel(false);
    if (l && !status?.ai) return;
    setAdaptLevel(bookId, l);
    setLevel(l);
    if (!l) {
      const ratio = paras.length ? topPara.current / paras.length : 0;
      requestAnimationFrame(() => document.getElementById(`para-${Math.round(ratio * (chap?.paragraphs.length ?? 0))}`)?.scrollIntoView({ block: "start" }));
    }
  };

  // ---- Bilingual mode
  const bilKey = `bil:${bookId}:${ch}:${level && adapted?.key === adaptKey ? level : "orig"}`;
  useEffect(() => {
    if (readingMode !== "bilingual" || !status?.ai || !shownParagraphs.length || frMap?.key === bilKey) return;
    if (level && adapted?.key !== adaptKey) return; // wait for the adapted text
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading indicator for async work
    setBilProgress(t("Traduction du chapitre…", "Translating the chapter…"));
    aiTranslateParagraphs(shownParagraphs, bilKey, (d, n) => alive && setBilProgress(t(`Traduction du chapitre… ${d}/${n}`, `Translating… ${d}/${n}`)))
      .then((fr) => alive && setFrMap({ key: bilKey, fr }))
      .catch((e) => alive && toast(errorMessage(e), "err"))
      .finally(() => alive && setBilProgress(null));
    return () => {
      alive = false;
    };
  }, [readingMode, status, shownParagraphs, frMap, bilKey, level, adapted, adaptKey, t]);

  const translateFree = useCallback(
    async (p: number) => {
      const k = `${bilKey}:${p}`;
      setFrLoading((m) => ({ ...m, [k]: true }));
      try {
        const fr = await freeTranslate(shownParagraphs[p]);
        setFrFree((m) => ({ ...m, [k]: fr }));
      } catch (e) {
        toast(errorMessage(e), "err");
      } finally {
        setFrLoading((m) => ({ ...m, [k]: false }));
      }
    },
    [bilKey, shownParagraphs],
  );

  // ---- Restore scroll position once
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || !book || !paras.length) return;
    restored.current = true;
    if (book.position.chapter === ch && book.position.paragraph > 0) {
      requestAnimationFrame(() => document.getElementById(`para-${book.position.paragraph}`)?.scrollIntoView({ block: "start" }));
    }
  }, [book, paras, ch]);

  // ---- Track position, words read, reading time, lookups
  const topPara = useRef(0);
  const pendingWords = useRef(0);
  const chapterWords = useRef(0);
  const chapterLookups = useRef<string[]>([]);
  const seen = useRef(new Set<string>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savePosition = useCallback(
    (c: number, p: number) => {
      if (!book || !content) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const len = content.chapters[c]?.paragraphs.length || 1;
        const progress = Math.min(1, (c + Math.min(1, (p + 1) / len)) / content.chapters.length);
        void db.books.update(book.id, { position: { chapter: c, paragraph: p }, progress: Math.max(progress, book.finishedAt ? book.progress : 0), lastOpenedAt: Date.now() });
      }, 800);
    },
    [book, content, db],
  );

  const flushWords = useCallback(() => {
    const n = pendingWords.current;
    if (n > 0 && book) {
      pendingWords.current = 0;
      void addWordsRead(book.id, n);
    }
  }, [book]);

  const countRead = useCallback((key: string, n: number) => {
    if (seen.current.has(key)) return;
    seen.current.add(key);
    pendingWords.current += n;
    chapterWords.current += n;
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
            if (e.boundingClientRect.top < 0) countRead(`${ch}:${idx}`, paras[idx]?.tokens.filter((x) => x.word).length ?? 0);
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
      { threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    const iv = setInterval(flushWords, 15000);
    return () => {
      io.disconnect();
      clearInterval(iv);
      flushWords();
    };
  }, [paras, ch, savePosition, flushWords, countRead]);

  // Reading time: counted while the reader is visible.
  useEffect(() => {
    if (!book) return;
    let secs = 0;
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") secs += 5;
      if (secs >= 30) {
        void addReadingTime(book.id, secs);
        secs = 0;
      }
    }, 5000);
    return () => {
      clearInterval(tick);
      if (secs) void addReadingTime(book.id, secs);
    };
  }, [book?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Chapter navigation
  const goChapter = useCallback(
    (c: number) => {
      if (!content) return;
      const next = Math.max(0, Math.min(content.chapters.length - 1, c));
      stopAudio();
      setChapter(next);
      setAnchor(null);
      topPara.current = 0;
      chapterWords.current = 0;
      chapterLookups.current = [];
      window.scrollTo({ top: 0 });
      if (book) {
        const progress = Math.min(1, next / content.chapters.length);
        void db.books.update(book.id, { position: { chapter: next, paragraph: 0 }, progress: Math.max(book.progress, progress), lastOpenedAt: Date.now() });
      }
    },
    [content, book, db],
  );

  /** End of a chapter: count it as read, notify, then offer the optional session. */
  const endChapter = (last: boolean) => {
    if (!book) return;
    paras.forEach((p, i) => countRead(`${ch}:${i}`, p.tokens.filter((x) => x.word).length));
    flushWords();
    stopAudio();
    finishChapter(book.id, ch);
    setSession({ chapter: ch, last, lookedUp: [...chapterLookups.current], words: chapterWords.current });
  };
  const finishedOnce = useRef(false);
  const afterSession = () => {
    if (!session || !book) return;
    const s = session;
    setSession(null);
    if (s.last) {
      if (!finishedOnce.current) {
        finishedOnce.current = true;
        void finishBook(book.id);
      }
      toast(t("Livre terminé, bravo ! 🎉", "Book finished — well done! 🎉"));
    } else goChapter(s.chapter + 1);
  };

  // ---- Audio follow mode
  const audioSession = useRef(0);
  const playingRef = useRef(false);
  const lastChar = useRef<{ p: number; c: number }>({ p: 0, c: 0 });
  const playFrom = useCallback(
    (p: number) => {
      if (!paras[p]) {
        playingRef.current = false;
        setPlaying(false);
        setActive(null);
        return;
      }
      const id = ++audioSession.current;
      playingRef.current = true;
      setPlaying(true);
      setActive({ p, t: -1 });
      lastChar.current = { p, c: 0 };
      document.getElementById(`para-${p}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      const u = speak(paras[p].text, {
        accent,
        rate: settings.speechRate,
        onBoundary: (ci) => {
          if (audioSession.current !== id) return;
          lastChar.current = { p, c: ci };
          setActive({ p, t: tokenAtChar(paras[p], ci) });
        },
        onEnd: () => {
          if (audioSession.current !== id || !playingRef.current) return;
          countRead(`${ch}:${p}`, paras[p].tokens.filter((x) => x.word).length);
          playFrom(p + 1);
        },
      });
      if (!u) {
        playingRef.current = false;
        setPlaying(false);
        toast(t("La synthèse vocale n'est pas disponible sur ce navigateur.", "Speech synthesis is not available in this browser."), "err");
      }
    },
    [paras, settings.speechRate, accent, t, countRead, ch],
  );

  function stopAudio() {
    audioSession.current++;
    playingRef.current = false;
    stopSpeaking();
    setPlaying(false);
    setActive(null);
  }
  useEffect(() => () => stopSpeaking(), []);

  /** Repeat the sentence being read (or the first sentence of the visible paragraph). */
  const repeatSentence = () => {
    const { p, c } = playing || active ? lastChar.current : { p: topPara.current, c: 0 };
    const para = paras[p];
    if (!para) return;
    stopAudio();
    const s = sentenceAt(para.text, c);
    const start = para.text.indexOf(s);
    const id = ++audioSession.current;
    speak(s, {
      accent,
      rate: settings.speechRate,
      onBoundary: (ci) => audioSession.current === id && setActive({ p, t: tokenAtChar(para, start + ci) }),
      onEnd: () => audioSession.current === id && setActive(null),
    });
  };

  // ---- Interaction (event delegation)
  const longPress = useRef<{ timer: ReturnType<typeof setTimeout> | null; fired: boolean }>({ timer: null, fired: false });

  function targetOf(e: { target: EventTarget | null }) {
    const el = (e.target as HTMLElement | null)?.closest?.("[data-t]") as HTMLElement | null;
    if (!el) return null;
    return { p: Number(el.dataset.p), t: Number(el.dataset.t) };
  }

  const openWord = (tg: { p: number; t: number }) => {
    const p = paras[tg.p];
    if (!p || !book) return;
    const word = p.tokens[tg.t].text;
    chapterLookups.current.push(word);
    void addLookup(book.id);
    setPopup({ type: "word", word, sentence: sentenceAt(p.text, p.offsets[tg.t]), proper: isProperNoun(p, tg.t) });
  };

  function onPointerDown(e: React.PointerEvent) {
    const tg = targetOf(e);
    longPress.current.fired = false;
    if (!tg) return;
    longPress.current.timer = setTimeout(() => {
      longPress.current.fired = true;
      if (navigator.vibrate) navigator.vibrate(15);
      if (readingMode === "immersive") {
        openWord(tg);
        return;
      }
      setMode("phrase");
      setAnchor(tg);
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
    const offset = p.offsets[tg.t];
    if (playing) {
      playFrom(tg.p);
      return;
    }
    if (readingMode === "immersive") return;
    if (mode === "word") openWord(tg);
    else if (mode === "sentence") setPopup({ type: "sentence", text: sentenceAt(p.text, offset), context: p.text });
    else if (mode === "paragraph") setPopup({ type: "paragraph", text: p.text, context: p.text });
    else {
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

  const theme = prefs.night ? READER_THEMES.night : READER_THEMES[settings.reader.theme];
  const font = READER_FONTS[settings.reader.font];
  const chapterCount = content.chapters.length;
  const dark = prefs.night || settings.reader.theme === "dark";
  const barStyle = { background: theme.background, color: theme.color, borderColor: dark ? "#2a2a35" : "rgba(0,0,0,0.08)" };
  const brightness = settings.reader.brightness ?? 100;
  const margin = settings.reader.margin ?? 20;
  const colorize = prefs.colorize && readingMode !== "immersive";
  const textSoFar = () =>
    content.chapters
      .slice(0, ch + 1)
      .map((c, i) => (i === ch ? c.paragraphs.slice(0, Math.max(1, topPara.current + 1)) : c.paragraphs).join("\n\n"))
      .join("\n\n")
      .slice(-50000);
  const quizLevel = level ?? book.level ?? "B1";

  return (
    <div className="min-h-dvh" style={theme}>
      {brightness < 100 && <div className="pointer-events-none fixed inset-0 z-[45] bg-black" style={{ opacity: ((100 - brightness) / 100) * 0.75 }} aria-hidden />}
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
          {adaptAllowed && (
            <button onClick={() => setShowLevel(true)} className="rounded-lg px-2 py-1 text-xs font-bold opacity-80 ring-1 ring-current/30 hover:opacity-100" aria-label={t("Niveau du texte", "Text level")}>
              {level ?? t("VO", "Orig.")}
            </button>
          )}
          {adaptAllowed && (
            <button onClick={() => setShowChat(true)} className="rounded-lg p-2 opacity-70 hover:opacity-100" aria-label={t("Parler avec un personnage", "Talk to a character")}>💬</button>
          )}
          <button onClick={() => setShowToc(true)} className="rounded-lg p-2 opacity-70 hover:opacity-100" aria-label={t("Chapitres", "Chapters")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
          </button>
          <button onClick={() => setShowSettings(true)} className="rounded-lg px-2 py-1.5 text-base font-semibold opacity-70 hover:opacity-100" aria-label={t("Affichage", "Display")}>Aa</button>
        </div>
        <div className="h-0.5 w-full" style={{ background: "rgba(127,127,127,0.15)" }}>
          <div className="h-full bg-ink-500 transition-all" style={{ width: `${Math.round(book.progress * 100)}%` }} />
        </div>
        {(adapting || bilProgress) && (
          <div className="flex items-center justify-center gap-2 py-1 font-sans text-xs opacity-80"><Spinner className="h-3 w-3" /> {adapting ?? bilProgress}</div>
        )}
      </header>

      {/* Text */}
      <main
        className={cx("mx-auto max-w-2xl pb-40 pt-8 select-none", readingMode === "immersive" && "[&_.reader-word:hover]:bg-transparent")}
        style={{ ...font, fontSize: settings.reader.size, lineHeight: settings.reader.lineHeight, paddingLeft: margin, paddingRight: margin }}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerMove={(e) => {
          if (Math.abs(e.movementX) + Math.abs(e.movementY) > 6) cancelLongPress();
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <p className="mb-1 font-sans text-xs uppercase tracking-widest opacity-50">
          {t("Chapitre", "Chapter")} {ch + 1} / {chapterCount}
          {level && adapted?.key === adaptKey ? ` · ${t("version", "version")} ${level}` : ""}
        </p>
        <h1 className="mb-8 font-semibold leading-tight" style={{ fontSize: "1.35em" }}>{chap?.title}</h1>
        {readingMode === "bilingual" && status && !status.ai && (
          <p className="mb-6 rounded-xl border border-dashed p-3 font-sans text-xs opacity-80">
            {t("Touche « FR ↓ » sous un paragraphe pour une traduction automatique simple (nombre limité par jour). La traduction complète et fidèle du chapitre est momentanément indisponible.", "Tap “FR ↓” under a paragraph for a simple machine translation.")}
          </p>
        )}
        {paras.map((p, i) => {
          const freeKey = `${bilKey}:${i}`;
          const fr = readingMode === "bilingual" ? (frMap?.key === bilKey ? frMap.fr[i] : frFree[freeKey]) : undefined;
          const frState = readingMode !== "bilingual" || fr ? null : status?.ai ? "loading" : frLoading[freeKey] ? "loading" : "button";
          return (
            <Paragraph
              key={`${ch}-${level}-${i}`}
              data={p}
              pIndex={i}
              isSaved={isSaved}
              savedVersion={savedVersion}
              active={active?.p === i ? active.t : -1}
              sel={mode === "phrase" && anchor?.p === i ? [anchor.t, selEnd !== null && popup ? selEnd : anchor.t] : null}
              colorize={colorize}
              fr={fr}
              frState={frState}
              onTranslate={translateFree}
            />
          );
        })}
        <div className="mt-12 flex items-center justify-between gap-3 font-sans text-sm">
          <button disabled={ch === 0} onClick={() => goChapter(ch - 1)} className="rounded-xl border px-4 py-2.5 disabled:opacity-30" style={barStyle}>← {t("Précédent", "Previous")}</button>
          {ch < chapterCount - 1 ? (
            <button onClick={() => endChapter(false)} className="rounded-xl bg-ink-600 px-4 py-2.5 font-medium text-white">{t("Chapitre suivant", "Next chapter")} →</button>
          ) : (
            <button onClick={() => endChapter(true)} className="rounded-xl bg-mint-600 px-4 py-2.5 font-medium text-white">{t("Terminer le livre", "Finish the book")} ✓</button>
          )}
        </div>
      </main>

      {/* Bottom toolbar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur safe-bottom" style={{ ...barStyle, background: `${theme.background}f2` }}>
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2 font-sans">
          {readingMode === "immersive" ? (
            <p className="flex-1 text-xs opacity-70">{t("Lecture immersive · appui long sur un mot pour le traduire", "Immersive · long-press a word")}</p>
          ) : (
            <div className="flex min-w-0 flex-1 rounded-xl p-1" style={{ background: "rgba(127,127,127,0.12)" }} role="radiogroup" aria-label={t("Mode de sélection", "Selection mode")}>
              {([
                ["word", t("Mot", "Word")],
                ["phrase", t("Expr.", "Phrase")],
                ["sentence", t("Phrase", "Sentence")],
                ["paragraph", "§"],
              ] as [Mode, string][]).map(([m, label]) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={mode === m}
                  aria-label={m === "paragraph" ? t("Paragraphe", "Paragraph") : label}
                  onClick={() => {
                    setMode(m);
                    setAnchor(null);
                    setSelEnd(null);
                    if (m === "phrase") toast(t("Touchez le premier puis le dernier mot", "Tap the first then the last word"), "info");
                    if (m === "paragraph") toast(t("Touchez un paragraphe pour le traduire", "Tap a paragraph to translate it"), "info");
                  }}
                  className={cx("min-w-0 flex-1 truncate rounded-lg px-1 py-1.5 text-[13px] font-medium transition", mode === m ? "bg-ink-600 text-white shadow" : "opacity-70")}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {ttsSupported() && (
            <>
              <button onClick={() => setShowAudio(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg" style={{ background: "rgba(127,127,127,0.15)" }} aria-label={t("Options audio", "Audio options")}>🎧</button>
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
            </>
          )}
        </div>
        {playing && (
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pb-2 font-sans text-xs opacity-80">
            <span className="flex-1">{t("Lecture audio — touchez un paragraphe pour y aller", "Audio — tap a paragraph to jump")}</span>
            <button onClick={repeatSentence} className="underline">↺ {t("Répéter la phrase", "Repeat sentence")}</button>
          </div>
        )}
      </div>

      {/* Listen-only mode */}
      {listenOnly && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 p-8 text-center font-sans" style={theme}>
          <p className="text-xs uppercase tracking-widest opacity-60">{t("Écoute seule", "Listen only")}</p>
          <div>
            <p className="text-2xl font-semibold" style={font}>{book.title}</p>
            <p className="mt-1 opacity-70">{chap?.title}</p>
          </div>
          <div className="w-full max-w-sm">
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(127,127,127,0.25)" }}>
              <div className="h-full bg-ink-500 transition-all" style={{ width: `${paras.length ? Math.round((((active?.p ?? topPara.current) + 1) / paras.length) * 100) : 0}%` }} />
            </div>
            <p className="mt-1 text-xs opacity-60">{t("Paragraphe", "Paragraph")} {(active?.p ?? topPara.current) + 1} / {paras.length}</p>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => playFrom(Math.max(0, (active?.p ?? topPara.current) - 1))} className="rounded-full p-3 text-2xl opacity-80" aria-label={t("Paragraphe précédent", "Previous paragraph")}>⏮</button>
            <button onClick={() => (playing ? stopAudio() : playFrom(active?.p ?? topPara.current))} className={cx("flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl", playing ? "bg-coral-500" : "bg-ink-600")} aria-label={playing ? t("Pause", "Pause") : t("Lecture", "Play")}>
              {playing ? <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg> : <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
            </button>
            <button onClick={() => playFrom(Math.min(paras.length - 1, (active?.p ?? topPara.current) + 1))} className="rounded-full p-3 text-2xl opacity-80" aria-label={t("Paragraphe suivant", "Next paragraph")}>⏭</button>
          </div>
          <button onClick={repeatSentence} className="text-sm underline opacity-80">↺ {t("Répéter la phrase", "Repeat sentence")}</button>
          <div className="w-full max-w-xs">
            <p className="mb-1 text-xs opacity-70">{t("Vitesse", "Speed")} ×{settings.speechRate.toFixed(2)}</p>
            <input type="range" min={0.5} max={1.5} step={0.05} value={settings.speechRate} onChange={(e) => saveSettings({ speechRate: Number(e.target.value) })} className="w-full accent-ink-600" aria-label={t("Vitesse", "Speed")} />
          </div>
          <button onClick={() => setListenOnly(false)} className="rounded-xl border px-4 py-2 text-sm" style={barStyle}>{t("Afficher le texte", "Show the text")}</button>
        </div>
      )}

      {/* Sheets */}
      {popup?.type === "word" && <WordPopup key={`${popup.word}|${popup.sentence}`} word={popup.word} sentence={popup.sentence} properNoun={popup.proper} bookTitle={book.title} onClose={() => setPopup(null)} />}
      {(popup?.type === "phrase" || popup?.type === "sentence" || popup?.type === "paragraph") && (
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
      <Sheet open={showAudio} onClose={() => setShowAudio(false)} title={t("Livre audio", "Audiobook")}>
        <div className="space-y-3">
          <p className="text-xs text-muted">{t("Lecture par les voix de synthèse de votre appareil, synchronisée avec le texte (aucun enregistrement protégé).", "Uses your device's speech voices, synced with the text.")}</p>
          <button onClick={() => { setShowAudio(false); setListenOnly(true); playFrom(topPara.current); }} className="w-full rounded-xl border border-line px-4 py-3 text-left hover:border-ink-300">
            <span className="block font-semibold">🎧 {t("Écoute seule", "Listen only")}</span>
            <span className="text-xs text-muted">{t("Texte masqué : entraîne ta compréhension orale.", "Text hidden: train your listening.")}</span>
          </button>
          <button onClick={() => { setShowAudio(false); stopAudio(); setShadowing(paras.slice(topPara.current).flatMap((p) => sentencesOf(p.text)).filter((s) => s.split(/\s+/).length >= 3).slice(0, 40)); }} className="w-full rounded-xl border border-line px-4 py-3 text-left hover:border-ink-300">
            <span className="block font-semibold">🗣️ {t("Shadowing", "Shadowing")}</span>
            <span className="text-xs text-muted">{t("Écoute une phrase, répète-la, vois ce qui a été compris.", "Listen, repeat, get feedback.")}</span>
          </button>
          <button onClick={() => { setShowAudio(false); repeatSentence(); }} className="w-full rounded-xl border border-line px-4 py-3 text-left hover:border-ink-300">
            <span className="block font-semibold">↺ {t("Répéter la phrase en cours", "Repeat the current sentence")}</span>
          </button>
          <div>
            <p className="mb-1 text-sm font-medium">{t("Vitesse", "Speed")} ×{settings.speechRate.toFixed(2)}</p>
            <input type="range" min={0.5} max={1.5} step={0.05} value={settings.speechRate} onChange={(e) => saveSettings({ speechRate: Number(e.target.value) })} className="w-full accent-ink-600" aria-label={t("Vitesse", "Speed")} />
          </div>
          <div className="flex gap-2">
            {(["en-GB", "en-US"] as const).map((v) => (
              <button key={v} onClick={() => saveSettings({ reader: { ...settings.reader, voice: v } })} className={cx("flex-1 rounded-xl border-2 py-2 text-sm font-medium", accent === v ? "border-ink-500" : "border-line")}>
                {v === "en-GB" ? "🇬🇧 British" : "🇺🇸 American"}
              </button>
            ))}
          </div>
        </div>
      </Sheet>
      {shadowing && <ShadowingSheet sentences={shadowing} accent={accent} rate={settings.speechRate} onClose={() => setShadowing(null)} />}
      {showLevel && <LevelSheet book={book} current={level} onPick={pickLevel} onClose={() => setShowLevel(false)} />}
      {showChat && <CharacterChat book={book} chapter={ch} textSoFar={textSoFar()} level={quizLevel} onClose={() => setShowChat(false)} />}
      {session && (
        <ChapterSession
          book={book}
          chapter={session.chapter}
          chapterTitle={chap?.title ?? ""}
          paragraphs={shownParagraphs}
          lookedUp={session.lookedUp}
          wordsRead={session.words}
          level={quizLevel}
          onClose={afterSession}
        />
      )}
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
                {book.chaptersDone?.includes(i) && <span className="ml-1 text-mint-600">✓</span>}
              </button>
            </li>
          ))}
        </ol>
      </Sheet>
    </div>
  );
}
