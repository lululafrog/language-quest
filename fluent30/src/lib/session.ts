"use client";
// Smart daily session: a plan adapted to what the learner needs today.
import { getDb, todayKey } from "./db";
import { computeOverview } from "./progress";
import type { DailySession, SessionPlanStep } from "./types";
import { getGrammarLesson } from "./data/grammar";

type Kind = SessionPlanStep["kind"];

const TEMPLATES: Record<number, [Kind, number][]> = {
  5: [["review", 3], ["new", 2]],
  10: [["review", 4], ["new", 3], ["game", 3]],
  15: [["review", 4], ["new", 3], ["grammar", 3], ["game", 2], ["reading", 3]],
  30: [["review", 5], ["new", 5], ["grammar", 5], ["game", 5], ["reading", 5], ["conversation", 5]],
  60: [["review", 10], ["new", 8], ["grammar", 8], ["verbs", 5], ["game", 7], ["reading", 10], ["listening", 6], ["conversation", 6]],
};

const META: Record<Kind, { title: string; titleEn: string; href: string }> = {
  review: { title: "Révision des mots", titleEn: "Review words", href: "/review" },
  new: { title: "Nouveaux mots", titleEn: "New words", href: "/learn" },
  grammar: { title: "Grammaire", titleEn: "Grammar", href: "/grammar" },
  game: { title: "Mini-jeux", titleEn: "Mini-games", href: "/games" },
  reading: { title: "Lecture", titleEn: "Reading", href: "/library" },
  conversation: { title: "Conversation", titleEn: "Conversation", href: "/chat" },
  listening: { title: "Écoute & prononciation", titleEn: "Listening & speaking", href: "/listen" },
  verbs: { title: "Verbes essentiels", titleEn: "Core verbs", href: "/verbs" },
};

export async function buildSession(minutes: number, opts: { aiAvailable: boolean; dailyNewWords: number; immersion: boolean }): Promise<DailySession> {
  const o = await computeOverview();
  const tpl = (TEMPLATES[minutes] ?? TEMPLATES[15]).map(([k, m]) => [k, m] as [Kind, number]);
  const steps: [Kind, number][] = [];
  let spare = 0;
  for (const [kind, m] of tpl) {
    // Adapt to today's situation.
    if (kind === "review" && o.dueNow === 0) { spare += m; continue; }
    if (kind === "new" && o.newToday >= opts.dailyNewWords && o.dueNow > 30) { spare += m; continue; }
    if (kind === "conversation" && !opts.aiAvailable) { steps.push(["listening", m]); continue; }
    steps.push([kind, m]);
  }
  if (spare) {
    // Lots of reviews pending → reviews first; otherwise practise with games.
    const target: Kind = o.dueNow > 40 ? "review" : steps.some(([k]) => k === "game") ? "game" : "new";
    const ex = steps.find(([k]) => k === target);
    if (ex) ex[1] += spare;
    else steps.unshift([target, spare]);
  }
  // Recurring grammar mistakes → point the grammar step to them.
  const grammarMistake = o.topMistakes.find((m) => m.type === "grammar" && getGrammarLesson(m.id.replace(/^grammar:/, "")));
  const out: SessionPlanStep[] = steps.map(([kind, m], i) => {
    const meta = META[kind];
    let href = meta.href;
    let title = opts.immersion ? meta.titleEn : meta.title;
    if (kind === "grammar" && grammarMistake) {
      href = `/grammar/${grammarMistake.id.replace(/^grammar:/, "")}`;
      title += ` · ${grammarMistake.label}`;
    }
    if (kind === "reading" && o.currentBook) {
      href = `/library/read/${o.currentBook.id}`;
      title += ` · ${o.currentBook.title}`;
    }
    return { id: `${kind}-${i}`, kind, minutes: m, title, href, done: false };
  });
  const session: DailySession = { date: todayKey(), minutes, steps: out, updatedAt: Date.now() };
  await getDb().sessions.put(session);
  return session;
}

export async function markStep(stepId: string, done: boolean) {
  const db = getDb();
  const s = await db.sessions.get(todayKey());
  if (!s) return;
  s.steps = s.steps.map((x) => (x.id === stepId ? { ...x, done } : x));
  await db.sessions.put(s);
}
