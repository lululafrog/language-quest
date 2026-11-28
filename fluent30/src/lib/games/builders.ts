"use client";
// Question builders for the quiz-style games.
import { getPracticePool, distractors, type PoolItem } from "../pool";

/** Word provider: the central vocabulary engine (mode new/review) or, by default, the practice pool. */
export type Pick = (n: number, filter?: (p: PoolItem) => boolean) => Promise<PoolItem[]>;
import { IRREGULAR_VERBS } from "../data/irregular";
import { CORE_VERBS } from "../data/verbs";
import {
  CONJ_TEMPLATES, CONJ_VERBS, COMMON_IRREGULAR, EMOJI_NOUNS, ERROR_BANK, GAPFILL_BANK, PARTICLES, PHRASAL_BANK,
  SENTENCE_BANK, SYNONYM_BANK, TENSE_BANK, TENSE_LABELS, type TenseId,
} from "../data/game-content";
import { normalize, sample, shuffle, splitAlternatives } from "../text";
import type { Skill } from "../types";
import { loadImages, type Level, type MissedItem, type MistakeInfo } from "./engine";
import { lexicon, lexWord } from "../vocab/words";

export interface Question {
  id: string;
  kind: "choice" | "type";
  prompt: { label?: string; text?: string; sub?: string; speak?: string; autoSpeak?: boolean; image?: string; emoji?: string; hideText?: boolean };
  choices?: string[];
  accepted: string[];
  display: string;
  explanation?: string;
  cardId?: string;
  skill?: Skill;
  missed: MissedItem;
  mistake?: MistakeInfo;
  sentence?: boolean; // lenient full-sentence comparison
  answerLang?: "en" | "fr";
  /** vocabulary item behind the question: the answer goes through the vocabulary engine and gets full feedback */
  word?: PoolItem;
  /** optional clues (using one counts as "with help": the word goes to review) */
  hints?: string[];
  /** meaning of each wrong choice, to explain a mistake ("« borrow » veut dire « emprunter »") */
  meanings?: Record<string, string>;
  /** second chance in the same game after a miss (not counted in the score) */
  retry?: boolean;
}

export interface Built {
  questions: Question[];
  notice?: string;
  empty?: string;
}

const first = (fr: string) => splitAlternatives(fr)[0] ?? fr;
const vocabMistake = (p: PoolItem): MistakeInfo => ({ id: `vocab:${normalize(p.en)}`, type: "vocab", label: p.en, detail: p.fr });

function count(level: Level, base = 8) {
  return level === 1 ? base : level === 2 ? base + 2 : base + 4;
}

function mcqFromPool(pool: PoolItem[], dir: "en-fr" | "fr-en", nChoices: number): Question[] {
  return pool.map((p) => {
    const field = dir === "en-fr" ? "fr" : "en";
    const correct = dir === "en-fr" ? first(p.fr) : p.en;
    const others = distractors(p, pool, nChoices - 1, field).map((x) => (dir === "en-fr" ? first(x) : x));
    return {
      id: p.key, kind: "choice",
      prompt: dir === "en-fr" ? { label: "Traduction de", text: p.en, speak: p.en, sub: p.example } : { label: "Comment dit-on", text: first(p.fr) },
      choices: shuffle([...new Set([correct, ...others])]), accepted: [correct], display: dir === "en-fr" ? p.fr : p.en, word: p,
      meanings: meaningsOf(others, dir === "en-fr" ? "fr" : "en", pool),
      explanation: p.example ? `${p.example}${p.exampleFr ? ` — ${p.exampleFr}` : ""}` : undefined,
      cardId: p.cardId, skill: dir === "en-fr" ? "recognition" : "production", missed: { en: p.en, fr: p.fr, cardId: p.cardId }, mistake: vocabMistake(p),
      answerLang: dir === "en-fr" ? "fr" : "en",
    } satisfies Question;
  });
}

export async function imageItems(n: number, pick: Pick = getPracticePool): Promise<{ items: (PoolItem & { image?: string; emoji?: string })[]; fallback: boolean }> {
  const pool = await pick(60, (p) => !!p.imageKey);
  const imgs = await loadImages(pool.map((p) => p.imageKey!));
  const withImg = pool.filter((p) => imgs.has(p.imageKey!)).map((p) => ({ ...p, image: imgs.get(p.imageKey!) }));
  if (withImg.length >= 4) return { items: withImg.slice(0, n), fallback: false };
  const emoji = sample(EMOJI_NOUNS, n).map((e) => ({ key: `emoji:${e.en}`, en: e.en, fr: e.fr, pos: "noun", weakness: 0.4, emoji: e.emoji }));
  return { items: emoji, fallback: true };
}

export const IMAGE_FALLBACK_NOTICE =
  "Tu as moins de 4 flashcards illustrées : ce jeu utilise pour l'instant des emojis pour des noms concrets. Les illustrations de tes propres mots apparaissent ici automatiquement dès qu'elles sont générées (réglage « Illustrations automatiques » + clé API d'images sur le serveur), ou si tu ajoutes une image à une carte.";

export async function buildQuestions(gameId: string, level: Level, pick: Pick = getPracticePool): Promise<Built> {
  switch (gameId) {
    case "mcq": {
      const pool = await pick(count(level));
      const qs = mcqFromPool(pool, "en-fr", level === 3 ? 5 : 4);
      if (level >= 2) mcqFromPool(pool.slice(0, Math.floor(pool.length / 3)), "fr-en", 4).forEach((q, i) => (qs[i * 3] = { ...q, id: `${q.id}:r` }));
      return { questions: qs };
    }
    case "timed": {
      const pool = await pick(40);
      return { questions: mcqFromPool(pool, "en-fr", 4) };
    }
    case "picture": {
      const { items, fallback } = await imageItems(count(level));
      const qs: Question[] = items.map((p) => {
        const others = distractors(p, items, 3, "en");
        return {
          id: p.key, kind: level === 3 && !fallback ? "type" : "choice",
          prompt: { label: "Quel mot correspond à l'image ?", image: p.image, emoji: p.emoji },
          choices: shuffle([p.en, ...others]), accepted: [p.en], display: `${p.en} — ${p.fr}`,
          cardId: p.cardId, skill: "production", missed: { en: p.en, fr: p.fr, cardId: p.cardId }, mistake: vocabMistake(p), answerLang: "en",
          word: fallback ? undefined : p, meanings: meaningsOf(others, "en", items),
        };
      });
      return { questions: qs, notice: fallback ? IMAGE_FALLBACK_NOTICE : undefined };
    }
    case "fr-en":
    case "en-fr": {
      const pool = await pick(count(level));
      return {
        questions: pool.map((p) => {
          const toEn = gameId === "fr-en";
          return {
            id: p.key, kind: "type",
            prompt: toEn ? { label: "Écris en anglais", text: p.fr } : { label: "Écris en français", text: p.en, speak: p.en, sub: p.example },
            hints: toEn ? [`Commence par « ${p.en[0]} » · ${p.en.length} lettres`, ...(p.example ? [blankOut(p.example, p.en)] : [])] : p.def ? [`Définition : ${p.def}`] : undefined,
            word: p,
            accepted: toEn ? [p.en, ...(p.synonyms ?? []).slice(0, 2)] : splitAlternatives(p.fr),
            display: toEn ? p.en : p.fr,
            explanation: p.example ? `${p.example}${p.exampleFr ? ` — ${p.exampleFr}` : ""}` : undefined,
            cardId: p.cardId, skill: toEn ? "production" : "recognition", missed: { en: p.en, fr: p.fr, cardId: p.cardId }, mistake: vocabMistake(p),
            answerLang: toEn ? "en" : "fr",
          } satisfies Question;
        }),
      };
    }
    case "synonyms": {
      const mine = await pick(30, (p) => !!p.synonyms?.length);
      const bank = SYNONYM_BANK.filter((s) => s.level <= level);
      const items = [
        ...mine.slice(0, 6).map((p) => ({ w: p.en, syn: p.synonyms![0], fr: p.fr, cardId: p.cardId, word: p as PoolItem | undefined })),
        ...sample(bank, count(level)).map((s) => ({ ...s, cardId: undefined as string | undefined, word: undefined as PoolItem | undefined })),
      ].slice(0, count(level));
      const allSyn = [...SYNONYM_BANK.map((s) => s.syn), ...SYNONYM_BANK.map((s) => s.w)];
      return {
        questions: items.map((s, i) => {
          const others = sample(allSyn.filter((x) => x !== s.syn && x !== s.w), 3);
          return {
            id: `syn${i}`, kind: "choice", prompt: { label: "Synonyme de", text: s.w, speak: s.w, sub: `(${first(s.fr)})` },
            choices: shuffle([s.syn, ...others]), accepted: [s.syn], display: s.syn, explanation: `${s.w} ≈ ${s.syn} (${s.fr})`,
            cardId: s.cardId, word: s.word, missed: { en: `${s.w} ≈ ${s.syn}`, fr: s.fr, cardId: s.cardId },
            mistake: { id: `syn:${s.w}`, type: "vocab", label: `${s.w} ≈ ${s.syn}`, detail: s.fr },
          } satisfies Question;
        }),
      };
    }
    case "irregular": {
      const common = IRREGULAR_VERBS.filter((v) => COMMON_IRREGULAR.includes(v[0]));
      const rest = IRREGULAR_VERBS.filter((v) => !COMMON_IRREGULAR.includes(v[0]));
      const verbs = level === 1 ? sample(common.slice(0, 25), 6) : level === 2 ? sample(common, 7) : [...sample(common, 4), ...sample(rest, 4)];
      const allPast = IRREGULAR_VERBS.map((v) => v[1].split("/")[0]);
      const qs: Question[] = [];
      for (const [base, past, pp, fr] of verbs) {
        for (const [form, value, label] of [["past", past, "Prétérit"], ["pp", pp, "Participe passé"]] as const) {
          const correct = value.split("/")[0];
          const regular = base.endsWith("e") ? `${base}d` : `${base}ed`;
          const wrongs = [regular, form === "past" ? pp.split("/")[0] : past.split("/")[0], ...sample(allPast, 4)].filter((x) => !value.split("/").includes(x));
          qs.push({
            id: `${base}:${form}`, kind: level === 1 ? "choice" : "type",
            prompt: { label: `${label} de`, text: base, sub: `(${fr})`, speak: base },
            choices: shuffle([correct, ...[...new Set(wrongs)].slice(0, 3)]), accepted: value.split("/"), display: `${base} – ${past} – ${pp}`,
            explanation: `${base} → ${past} → ${pp}`, missed: { en: `${base} – ${past} – ${pp}`, fr },
            mistake: { id: `irregular:${base}`, type: "conjugation", label: `${base} – ${past} – ${pp}`, detail: fr }, answerLang: "en",
          });
        }
      }
      return { questions: qs };
    }
    case "conjugation": {
      const verbs: { base: string; third: string; past: string; pp: string; ing: string; fr: string; c: string }[] = [...CONJ_VERBS];
      const templates = CONJ_TEMPLATES.filter((t) => t.level <= level);
      const qs: Question[] = sample(verbs, count(level)).map((v, i) => {
        const t = templates[i % templates.length];
        const ans = v[t.form];
        return {
          id: `${v.base}:${t.id}`, kind: "type", prompt: { label: t.label, text: t.s(v.c, v.base), sub: level === 1 ? t.hint : `(${v.fr})` },
          accepted: [ans], display: ans, explanation: `${t.s(v.c, v.base).replace("___", ans).replace(/ \([^)]+\)/, "")} — ${t.hint}`,
          missed: { en: `${v.base} → ${ans} (${t.label})`, fr: v.fr }, mistake: { id: `conj:${t.id}`, type: "conjugation", label: t.label, detail: t.hint, example: t.s(v.c, v.base).replace("___", ans) },
          answerLang: "en",
        };
      });
      return { questions: shuffle(qs) };
    }
    case "phrasal": {
      const bank = [...PHRASAL_BANK.filter((p) => p.level <= level)];
      // Add phrasal verbs from the core verbs track when available.
      for (const v of CORE_VERBS) for (const p of v.phrasal.slice(0, 2)) if (!bank.some((b) => b.pv === p.en)) {
        const particle = p.en.split(" ").slice(1).join(" ");
        if (particle && p.example.toLowerCase().includes(p.en.split(" ")[0])) bank.push({ pv: p.en, fr: p.fr, sentence: p.example, sentenceFr: p.exampleFr ?? "", particle, level: 2 });
      }
      const items = sample(bank, count(level));
      return {
        questions: items.map((p, i) => {
          const asMeaning = i % 2 === 0;
          const blanked = p.sentence.replace(new RegExp(`\\s${escapeRe(p.particle).replace(" ", "\\s+")}\\b`, "i"), " ___");
          const canBlank = blanked !== p.sentence;
          if (asMeaning || !canBlank) {
            const others = sample(bank.filter((b) => b.pv !== p.pv), 3).map((b) => b.fr);
            return {
              id: `pv${i}`, kind: "choice", prompt: { label: "Que signifie", text: p.pv, sub: p.sentence, speak: p.sentence },
              choices: shuffle([p.fr, ...others]), accepted: [p.fr], display: p.fr, explanation: `${p.sentence} — ${p.sentenceFr}`,
              missed: { en: p.pv, fr: p.fr, note: p.sentence }, mistake: { id: `phrasal:${p.pv}`, type: "vocab", label: p.pv, detail: p.fr, example: p.sentence },
            } satisfies Question;
          }
          const others = sample(PARTICLES.filter((x) => x !== p.particle), 3);
          return {
            id: `pv${i}`, kind: level === 3 ? "type" : "choice", prompt: { label: `Complète (${p.fr})`, text: blanked, sub: p.sentenceFr },
            choices: shuffle([p.particle, ...others]), accepted: [p.particle], display: p.particle, explanation: `${p.sentence} — ${p.pv} = ${p.fr}`,
            missed: { en: p.pv, fr: p.fr, note: p.sentence }, mistake: { id: `phrasal:${p.pv}`, type: "vocab", label: p.pv, detail: p.fr, example: p.sentence }, answerLang: "en",
          } satisfies Question;
        }),
      };
    }
    case "tenses": {
      const items = sample(TENSE_BANK.filter((t) => t.level <= level), count(level));
      const allTenses = [...new Set(TENSE_BANK.filter((t) => t.level <= Math.max(2, level)).map((t) => t.tense))];
      return {
        questions: items.map((t, i) => ({
          id: `t${i}`, kind: "choice", prompt: { label: "Quel temps ?", text: t.s, sub: t.fr, speak: t.s },
          choices: shuffle([t.tense, ...sample(allTenses.filter((x) => x !== t.tense), 3)]).map((x) => TENSE_LABELS[x as TenseId]),
          accepted: [TENSE_LABELS[t.tense]], display: TENSE_LABELS[t.tense], explanation: t.why,
          missed: { en: t.s, fr: TENSE_LABELS[t.tense], note: t.why },
          mistake: { id: `grammar:${t.tense}`, type: "grammar", label: TENSE_LABELS[t.tense], detail: t.why, example: t.s },
        })),
      };
    }
    case "errors": {
      const items = sample(ERROR_BANK.filter((e) => e.level <= level), count(level, 6));
      return {
        questions: items.map((e, i) =>
          level === 1 || i % 2 === 0
            ? {
                id: `e${i}`, kind: "choice", prompt: { label: "Quelle phrase est correcte ?", text: `❌ ${e.wrong}` },
                choices: shuffle([e.right, e.alt, e.wrong]), accepted: [e.right], display: e.right, explanation: e.why,
                missed: { en: e.right, fr: e.label, note: e.why }, mistake: { id: `grammar:err:${e.label}`, type: "grammar", label: e.label, detail: e.why, example: e.right },
              }
            : {
                id: `e${i}`, kind: "type", sentence: true, prompt: { label: "Corrige la phrase", text: e.wrong },
                accepted: [e.right], display: e.right, explanation: e.why,
                missed: { en: e.right, fr: e.label, note: e.why }, mistake: { id: `grammar:err:${e.label}`, type: "grammar", label: e.label, detail: e.why, example: e.right }, answerLang: "en",
              },
        ) as Question[],
      };
    }
    case "gapfill": {
      const bank = sample(GAPFILL_BANK.filter((g) => g.level <= level), Math.ceil(count(level) * 0.6));
      const pool = await pick(30, (p) => !!p.example && new RegExp(`\\b${escapeRe(p.en)}\\b`, "i").test(p.example));
      const fromPool: Question[] = pool.slice(0, count(level) - bank.length).map((p) => {
        const s = p.example!.replace(new RegExp(`\\b${escapeRe(p.en)}\\b`, "i"), "___");
        return {
          id: p.key, kind: level === 3 ? "type" : "choice", prompt: { label: "Complète la phrase", text: s, sub: p.exampleFr },
          choices: shuffle([p.en, ...distractors(p, pool, 3, "en")]), accepted: [p.en], display: p.en, explanation: `${p.en} = ${p.fr}`,
          cardId: p.cardId, skill: "production", missed: { en: p.en, fr: p.fr, cardId: p.cardId }, mistake: vocabMistake(p), answerLang: "en", word: p,
        };
      });
      const fromBank: Question[] = bank.map((g, i) => ({
        id: `gf${i}`, kind: "choice", prompt: { label: "Complète la phrase", text: g.s, sub: g.fr },
        choices: shuffle(g.choices), accepted: [g.answer], display: g.answer, explanation: g.why,
        missed: { en: g.s.replace("___", g.answer), fr: g.fr, note: g.why }, mistake: { id: `grammar:gap:${g.why.slice(0, 40)}`, type: "grammar", label: g.why, example: g.s.replace("___", g.answer) },
      }));
      return { questions: shuffle([...fromBank, ...fromPool]) };
    }
    case "definition": {
      const pool = await pick(count(level), (p) => !!p.def);
      const defs = pool.map((p) => p.def!);
      return {
        questions: pool.map((p) => {
          let others = shuffle(defs.filter((d) => d !== p.def)).slice(0, 3);
          if (others.length < 3) others = [...others, ...sample(lexicon().filter((w) => w.def && w.def !== p.def && w.pos === p.pos), 3 - others.length).map((w) => w.def!)];
          return {
            id: p.key, kind: "choice", prompt: { label: "Quelle est la bonne définition ?", text: p.en, speak: p.en, sub: level === 1 ? `(${first(p.fr)})` : undefined },
            choices: shuffle([p.def!, ...others]), accepted: [p.def!], display: p.def!, word: p, cardId: p.cardId, skill: "recognition",
            meanings: Object.fromEntries(others.map((d) => [d, [...pool, ...lexicon().map((w) => ({ en: w.en, def: w.def }))].find((x) => x.def === d)?.en ?? ""]).filter(([, v]) => v).map(([d, en]) => [d, `la définition de « ${en} »`])),
            missed: { en: p.en, fr: p.fr, cardId: p.cardId, note: p.def }, mistake: vocabMistake(p),
          } satisfies Question;
        }),
      };
    }
    case "truefalse": {
      const pool = await pick(count(level, 10));
      return {
        questions: pool.map((p, i) => {
          const truth = i % 2 === 0 ? Math.random() < 0.6 : Math.random() < 0.4;
          const wrong = distractors(p, pool, 1, "fr")[0];
          const shown = truth || !wrong ? first(p.fr) : first(wrong);
          const isTrue = truth || !wrong;
          return {
            id: p.key, kind: "choice", prompt: { label: "Vrai ou faux ?", text: `${p.en} = ${shown}`, speak: p.en },
            choices: ["Vrai", "Faux"], accepted: [isTrue ? "Vrai" : "Faux"], display: `${p.en} = ${first(p.fr)}`, word: p, cardId: p.cardId, skill: "recognition",
            meanings: (isTrue ? { Faux: `« ${p.en} » veut bien dire « ${first(p.fr)} »` } : { Vrai: `« ${shown} » se dit autrement : « ${p.en} » veut dire « ${first(p.fr)} »` }) as Record<string, string>,
            missed: { en: p.en, fr: p.fr, cardId: p.cardId }, mistake: vocabMistake(p),
          } satisfies Question;
        }),
      };
    }
    case "mystery": {
      const pool = await pick(count(level, 6), (p) => /^[a-zA-Z' -]{3,20}$/.test(p.en) && (!!p.def || !!p.example));
      return {
        questions: pool.map((p) => {
          const clue1 = p.def ? `🔎 ${p.def}` : `🔎 ${blankOut(p.example!, p.en)}`;
          const hints = [
            `🇫🇷 ${first(p.fr)}`,
            ...(p.def && p.example ? [`💬 ${blankOut(p.example, p.en)}`] : []),
            `🔤 ${p.en.length} lettres, commence par « ${p.en[0]} »`,
          ];
          return {
            id: p.key, kind: "type", prompt: { label: "Mot mystère : quel est ce mot ?", text: clue1 },
            accepted: [p.en], display: p.en, hints, word: p, cardId: p.cardId, skill: "production", answerLang: "en",
            missed: { en: p.en, fr: p.fr, cardId: p.cardId }, mistake: vocabMistake(p),
          } satisfies Question;
        }),
      };
    }
    case "context": {
      const has = (p: PoolItem) => !!p.example && new RegExp(`\\b${escapeRe(p.en)}\\b`, "i").test(p.example);
      const pool = await pick(count(level), has);
      return {
        questions: pool.map((p) => {
          const others = distractors(p, pool, 3, "en");
          return {
            id: p.key, kind: level === 3 ? "type" : "choice", prompt: { label: "Complète la phrase", text: blankOut(p.example!, p.en), sub: p.exampleFr },
            choices: shuffle([p.en, ...others]), accepted: [p.en], display: p.en, word: p, cardId: p.cardId, skill: "production", answerLang: "en",
            meanings: meaningsOf(others, "en", pool), hints: level === 3 ? [`Commence par « ${p.en[0]} »`] : undefined,
            missed: { en: p.en, fr: p.fr, cardId: p.cardId }, mistake: vocabMistake(p),
          } satisfies Question;
        }),
      };
    }
    case "dictation": {
      const qs: Question[] = [];
      if (level === 1) {
        const pool = await pick(8, (p) => /^[a-zA-Z' -]+$/.test(p.en));
        for (const p of pool)
          qs.push({
            id: p.key, kind: "type", prompt: { label: "Écris ce que tu entends", speak: p.en, autoSpeak: true, hideText: true },
            accepted: [p.en], display: `${p.en} — ${p.fr}`, cardId: p.cardId, skill: "listening",
            missed: { en: p.en, fr: p.fr, cardId: p.cardId }, mistake: vocabMistake(p), answerLang: "en", word: p,
          });
      } else {
        const pool = await pick(4, (p) => !!p.example && p.example.length < 90);
        for (const p of pool)
          qs.push({
            id: p.key, kind: "type", sentence: true, prompt: { label: "Écris la phrase entendue", speak: p.example, autoSpeak: true, hideText: true },
            accepted: [p.example!], display: p.example!, explanation: p.exampleFr, cardId: p.cardId, skill: "listening",
            missed: { en: p.example!, fr: p.exampleFr ?? p.fr, cardId: p.cardId }, answerLang: "en",
          });
        for (const s of sample(SENTENCE_BANK.filter((x) => x.level <= level), 8 - qs.length))
          qs.push({
            id: `d:${s.en}`, kind: "type", sentence: true, prompt: { label: "Écris la phrase entendue", speak: s.en, autoSpeak: true, hideText: true },
            accepted: [s.en], display: s.en, explanation: s.fr, missed: { en: s.en, fr: s.fr },
            mistake: { id: `listening:${normalize(s.en).slice(0, 40)}`, type: "spelling", label: s.en, detail: s.fr }, answerLang: "en",
          });
      }
      return { questions: shuffle(qs) };
    }
  }
  return { questions: [], empty: "Jeu inconnu." };
}

/** "I'm overwhelmed with work" → "I'm ___ with work" */
export function blankOut(sentence: string, word: string): string {
  const re = new RegExp(`\\b${escapeRe(word)}\\w*`, "i");
  return re.test(sentence) ? sentence.replace(re, "___") : sentence;
}

/** Meaning of each wrong choice (looked up in the game's words, then in the shared lexicon). */
function meaningsOf(choices: string[], field: "en" | "fr", pool: PoolItem[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of choices) {
    if (field === "fr") {
      const it = pool.find((p) => first(p.fr) === c || p.fr === c) ?? lexicon().find((w) => first(w.fr) === c);
      if (it) out[c] = `la traduction de « ${it.en} »`;
    } else {
      const it = pool.find((p) => p.en === c) ?? lexWord(c);
      if (it) out[c] = first(it.fr);
    }
  }
  return out;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
