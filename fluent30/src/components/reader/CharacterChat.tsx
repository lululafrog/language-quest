"use client";
import { useEffect, useRef, useState } from "react";
import { ApiError, errorMessage, postApi } from "@/lib/api";
import { speak } from "@/lib/speech";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { Button, ErrorNote, ServiceNotice, Sheet, Spinner, cx } from "@/components/ui";
import type { Book } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string };

/** Chat in English with a character of a public-domain book — never beyond the learner's current chapter. */
export function CharacterChat({ book, chapter, textSoFar, level, onClose }: { book: Book; chapter: number; textSoFar: string; level: string; onClose: () => void }) {
  const t = useT();
  const status = useStatus();
  const [chars, setChars] = useState<{ name: string; descriptionFr: string }[] | null>(null);
  const [err, setErr] = useState<unknown>(null);
  const [who, setWho] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!status?.ai) return;
    let alive = true;
    postApi<{ characters: { name: string; descriptionFr: string }[] }>("/api/ai/reader/characters", { text: textSoFar, title: book.title, source: book.source }, { cacheKey: `chars:${book.id}:${chapter}` })
      .then((r) => alive && setChars(r.characters))
      .catch((e) => alive && setErr(e));
    return () => {
      alive = false;
    };
  }, [status, book, chapter, textSoFar]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const send = async (history: Msg[], character: string) => {
    setBusy(true);
    try {
      const r = await postApi<{ reply: string }>("/api/ai/reader/chat", { title: book.title, character, text: textSoFar, chapter, level, source: book.source, messages: history });
      setMsgs([...history, { role: "assistant", content: r.reply }]);
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  const pick = (name: string) => {
    setWho(name);
    setMsgs([]);
    void send([], name);
  };

  return (
    <Sheet open onClose={onClose} title={who ? `💬 ${who}` : t("Parler avec un personnage", "Talk to a character")} wide>
      {status && !status.ai ? (
        <ServiceNotice service={t("La discussion avec les personnages", "Character chat")} alternative={"La lecture, l'audio et la traduction des mots restent disponibles."} />
      ) : !who ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">{t(`Les personnages ne connaissent que l'histoire jusqu'au chapitre ${chapter + 1} : aucun spoiler.`, `Characters only know the story up to chapter ${chapter + 1}: no spoilers.`)}</p>
          {!chars && !err && <p className="flex items-center gap-2 text-sm text-muted"><Spinner className="h-4 w-4" /> {t("Recherche des personnages…", "Finding characters…")}</p>}
          {err instanceof ApiError && err.notConfigured ? <ServiceNotice service={t("La discussion avec les personnages", "Character chat")} alternative={"La lecture, l'audio et la traduction des mots restent disponibles."} /> : err ? <ErrorNote>{errorMessage(err)}</ErrorNote> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {chars?.map((c) => (
              <button key={c.name} onClick={() => pick(c.name)} className="rounded-xl border border-line p-3 text-left transition hover:border-ink-300">
                <span className="block font-semibold">{c.name}</span>
                <span className="block text-xs text-muted">{c.descriptionFr}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-[60vh] flex-col">
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {msgs.map((m, i) => (
              <div key={i} className={cx("max-w-[85%] rounded-2xl px-3 py-2 text-[15px]", m.role === "user" ? "ml-auto bg-ink-600 text-white" : "bg-surface-2")}>
                {m.content}
                {m.role === "assistant" && <button onClick={() => speak(m.content)} className="ml-1 text-xs opacity-60" aria-label={t("Écouter", "Listen")}>🔊</button>}
              </div>
            ))}
            {busy && <p className="flex items-center gap-2 text-sm text-muted"><Spinner className="h-4 w-4" /> {who}…</p>}
            {!!err && <ErrorNote>{errorMessage(err)}</ErrorNote>}
            <div ref={endRef} />
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim() || busy) return;
              const h: Msg[] = [...msgs, { role: "user", content: input.trim() }];
              setMsgs(h);
              setInput("");
              void send(h, who);
            }}
          >
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Écris en anglais…", "Write in English…")} className="h-11 flex-1 rounded-xl border border-line bg-surface-2 px-3 outline-none focus:border-ink-400" />
            <Button type="submit" disabled={!input.trim() || busy}>{t("Envoyer", "Send")}</Button>
          </form>
          <button onClick={() => setWho(null)} className="mt-2 text-xs text-muted underline">{t("Changer de personnage", "Change character")}</button>
        </div>
      )}
    </Sheet>
  );
}
