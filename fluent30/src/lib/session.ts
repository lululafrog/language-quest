"use client";
// Central progression engine: today's plan, adapted to due reviews, the course path,
// weak concepts, goals and the time available. Steps are ticked automatically when
// their goal is objectively met (reviews done, lesson finished, game played…).
import { getDb, getSettings, todayKey } from "./db";
import { computeOverview } from "./progress";
import { weakConcepts, type WeakConcept } from "./connect";
import { THEME_MODULES, type Lesson } from "./curriculum";
import { dueLessonReviews, lastStartedLesson, lessonProgressMap, nextPathLesson } from "./curriculum/progress";
import type { DailySession, Settings } from "./types";

export type PlanMinutes = 5 | 10 | 15 | 20 | 30 | 60;
export type PlanStepKind = "review" | "lesson" | "lesson-review" | "practice" | "reading" | "listening" | "conversation" | "new-words";

export interface PlanStep {
  id: string;
  kind: PlanStepKind;
  minutes: number;
  title: string;
  subtitle?: string;
  href: string;
  done: boolean;
  /** lesson id for lesson / lesson-review / course-based practice steps */
  lessonId?: string;
}

/** Stored in db.sessions (same primary key and base fields as DailySession). */
export interface DailyPlan {
  date: string;
  minutes: PlanMinutes;
  steps: PlanStep[];
  createdAt: number;
  /** activity counters when the plan was built, used to tick steps objectively */
  base: { games: number; chatMessages: number; readingWords: number; reviews: number; newWords: number };
  version: 2;
  updatedAt: number;
}

export interface PlanOptions {
  aiAvailable?: boolean;
  immersion?: boolean;
  dailyNewWords?: number;
  /** rebuild even if a plan with the same length already exists today */
  force?: boolean;
}

type Slot = [PlanStepKind, number];

// Base templates (minutes per block). Adapted below to today's situation.
const TEMPLATES: Record<PlanMinutes, Slot[]> = {
  5: [["review", 2], ["lesson", 3]],
  10: [["review", 3], ["lesson", 5], ["practice", 2]],
  15: [["review", 3], ["lesson", 5], ["practice", 4], ["reading", 3]],
  20: [["review", 4], ["new-words", 3], ["lesson", 6], ["practice", 4], ["reading", 3]],
  30: [["review", 5], ["new-words", 4], ["lesson", 7], ["practice", 5], ["reading", 5], ["conversation", 4]],
  60: [["review", 8], ["new-words", 6], ["lesson", 10], ["lesson-review", 6], ["practice", 10], ["reading", 10], ["listening", 5], ["conversation", 5]],
};

// Settings goals → keywords to find a matching real-life module.
const GOAL_KEYWORDS: Record<string, string[]> = {
  travel: ["travel", "voyage", "airport", "hotel", "restaurant", "directions", "transport"],
  conversation: ["conversation", "small-talk", "opinion", "social"],
  work: ["work", "travail", "job", "meeting", "email", "interview", "phone"],
  dating: ["dating", "social", "feelings", "small-talk"],
  reading: ["reading", "lecture"],
  series: ["series", "films", "slang", "informal", "listening"],
  exam: ["exam", "formal", "writing", "toeic", "ielts"],
};

// Concept tag → mini-game that drills it.
const GAME_FOR_TAG: Record<string, string> = {
  "irregular-verbs": "irregular",
  "phrasal-verbs": "phrasal",
  "french-mistakes": "errors",
  conjugation: "conjugation",
  questions: "builder",
  negatives: "builder",
  "word-order": "builder",
};
const TENSE_TAGS = new Set(["present-simple", "present-continuous", "past-simple", "past-continuous", "present-perfect", "present-perfect-continuous", "past-perfect", "future-will", "going-to", "conditional"]);

const LABELS: Record<PlanStepKind, [string, string]> = {
  review: ["Révision des mots", "Word review"],
  "new-words": ["Nouveaux mots", "New words"],
  lesson: ["Nouveau cours", "New lesson"],
  "lesson-review": ["Révision d'un cours", "Lesson review"],
  practice: ["Pratique ciblée", "Targeted practice"],
  reading: ["Lecture", "Reading"],
  listening: ["Écoute", "Listening"],
  conversation: ["Conversation", "Conversation"],
};

function goalModule(goals: string[], done: Set<string>): Lesson | undefined {
  for (const g of goals) {
    const keys = GOAL_KEYWORDS[g] ?? [g];
    const m = THEME_MODULES.find((l) => !done.has(l.id) && keys.some((k) => l.id.includes(k) || l.tags.includes(k) || l.unit.toLowerCase().includes(k)));
    if (m) return m;
  }
  return undefined;
}

function practiceFor(w: WeakConcept): { href: string; subtitle: string } {
  const game = GAME_FOR_TAG[w.tag] ?? (TENSE_TAGS.has(w.tag) ? "tenses" : undefined);
  if (game) return { href: `/games/${game}`, subtitle: w.label };
  if (w.link) return { href: w.link.href, subtitle: w.label };
  return { href: "/practice", subtitle: w.label };
}

/** Today's plan, rebuilt only when missing, when the length changed, or when forced. */
export async function buildDailyPlan(minutes: PlanMinutes, opts: PlanOptions = {}): Promise<DailyPlan> {
  const db = getDb();
  const today = todayKey();
  const existing = (await db.sessions.get(today)) as unknown as DailyPlan | undefined;
  if (existing && existing.version === 2 && existing.minutes === minutes && !opts.force) return refreshPlanProgress();

  const settings: Settings = await getSettings();
  const immersion = opts.immersion ?? settings.immersion;
  const dailyNewWords = opts.dailyNewWords ?? settings.dailyNewWords ?? 10;
  const ai = opts.aiAvailable ?? false;
  const L = (k: PlanStepKind) => LABELS[k][immersion ? 1 : 0];

  const [o, weak, dueLessons, started, progress] = await Promise.all([
    computeOverview(),
    weakConcepts(3),
    dueLessonReviews(3),
    lastStartedLesson(),
    lessonProgressMap(),
  ]);
  const doneIds = new Set([...progress.values()].filter((p) => p.status === "done").map((p) => p.id));
  const next = started ?? (await nextPathLesson(settings.pathLevel ?? "A1"));
  const theme = goalModule(settings.goals ?? [], doneIds);
  const wantNew = o.newToday < dailyNewWords;

  // 1. Adapt the template.
  const slots: Slot[] = (TEMPLATES[minutes] ?? TEMPLATES[15]).map(([k, m]) => [k, m]);
  const bump = (kind: PlanStepKind, m: number, fallback: PlanStepKind) => {
    const s = slots.find(([k]) => k === kind) ?? slots.find(([k]) => k === fallback);
    if (s) s[1] += m;
    else slots.push([fallback, m]);
  };
  for (let i = slots.length - 1; i >= 0; i--) {
    const [kind, m] = slots[i];
    let drop = false;
    if (kind === "review" && o.dueNow === 0) {
      drop = true;
      if (wantNew) bump("new-words", m, "new-words");
      else bump("practice", m, "lesson");
    }
    if (kind === "new-words" && (!wantNew || o.dueNow > 60)) {
      drop = true;
      bump(o.dueNow > 0 ? "review" : "practice", m, "lesson");
    }
    if (kind === "lesson-review" && !dueLessons.length) {
      drop = true;
      bump("practice", m, "lesson");
    }
    if (kind === "conversation" && !ai) slots[i] = ["listening", m];
    if (drop) slots.splice(i, 1);
  }
  // Many overdue cards → give reviews a little more room.
  if (o.dueNow > 50) {
    const p = slots.find(([k]) => k === "practice");
    const r = slots.find(([k]) => k === "review");
    if (p && r && p[1] > 2) {
      p[1] -= 2;
      r[1] += 2;
    }
  }
  // Short plans with no new lesson to start but a lesson review due → review it instead.
  const lessonSlot = slots.find(([k]) => k === "lesson");
  if (lessonSlot && dueLessons.length && (!next || minutes <= 10) && !slots.some(([k]) => k === "lesson-review")) lessonSlot[0] = "lesson-review";
  // Merge duplicates (e.g. two listening blocks).
  const merged: Slot[] = [];
  for (const [k, m] of slots) {
    const ex = merged.find(([x]) => x === k);
    if (ex) ex[1] += m;
    else merged.push([k, m]);
  }

  // 2. Fill each block with concrete content.
  const steps: PlanStep[] = merged.map(([kind, m], i) => {
    const id = `${kind}-${i}`;
    const base = { id, kind, minutes: m, done: false };
    switch (kind) {
      case "review":
        return { ...base, title: L(kind), subtitle: immersion ? `${o.dueNow} cards due` : `${o.dueNow} carte${o.dueNow > 1 ? "s" : ""} à revoir`, href: "/review" };
      case "new-words":
        return { ...base, title: L(kind), subtitle: immersion ? `${Math.max(0, dailyNewWords - o.newToday)} left today` : `Encore ${Math.max(0, dailyNewWords - o.newToday)} aujourd'hui`, href: "/learn" };
      case "lesson":
        if (next) return { ...base, title: L(kind), subtitle: `${next.level} · ${next.title}`, href: `/cours/${next.id}`, lessonId: next.id };
        return { ...base, title: L(kind), subtitle: immersion ? "Choose a lesson" : "Choisis un cours", href: "/cours" };
      case "lesson-review": {
        const l = dueLessons[0];
        return { ...base, title: L(kind), subtitle: l ? `${l.level} · ${l.title}` : undefined, href: l ? `/cours/${l.id}` : "/cours", lessonId: l?.id };
      }
      case "practice": {
        const w = weak[0];
        if (w) {
          const p = practiceFor(w);
          return { ...base, title: L(kind), subtitle: p.subtitle, href: p.href };
        }
        if (theme) return { ...base, title: immersion ? "Real-life module" : "Module de la vie réelle", subtitle: theme.title, href: `/cours/${theme.id}`, lessonId: theme.id };
        return { ...base, title: immersion ? "Mini-games" : "Mini-jeux", subtitle: immersion ? "Vocabulary & grammar" : "Vocabulaire et grammaire", href: "/games" };
      }
      case "reading":
        if (o.currentBook && o.currentBook.progress < 1) return { ...base, title: L(kind), subtitle: o.currentBook.title, href: `/library/read/${o.currentBook.id}` };
        return { ...base, title: L(kind), subtitle: immersion ? "Pick a book at your level" : "Choisis un livre à ton niveau", href: "/library" };
      case "listening":
        return { ...base, title: L(kind), subtitle: immersion ? "Dialogues & dictation" : "Dialogues et dictée", href: "/listen" };
      case "conversation":
        return { ...base, title: L(kind), subtitle: immersion ? "Chat with the AI coach" : "Discute avec le coach IA", href: "/chat" };
    }
  });

  const act = o.days.find((d) => d.date === today);
  const plan: DailyPlan = {
    date: today,
    minutes,
    steps,
    createdAt: Date.now(),
    base: { games: act?.games ?? 0, chatMessages: act?.chatMessages ?? 0, readingWords: act?.readingWords ?? 0, reviews: act?.reviews ?? 0, newWords: act?.newWords ?? 0 },
    version: 2,
    updatedAt: Date.now(),
  };
  await db.sessions.put(plan as unknown as DailySession);
  return refreshPlanProgress();
}

/** Re-check each step against real activity and tick what is objectively done. Never unticks. */
export async function refreshPlanProgress(): Promise<DailyPlan> {
  const db = getDb();
  const today = todayKey();
  const plan = (await db.sessions.get(today)) as unknown as DailyPlan | undefined;
  if (!plan || plan.version !== 2) return buildDailyPlan(((await getSettings()).sessionMinutes ?? 15) as PlanMinutes);
  const [settings, act, lessons, games, dueNow] = await Promise.all([
    getSettings(),
    db.activity.get(today),
    lessonProgressMap(),
    db.games.where("at").aboveOrEqual(plan.createdAt).toArray(),
    db.srs.where("due").belowOrEqual(Date.now()).count(),
  ]);
  const doneToday = (id?: string) => {
    const p = id ? lessons.get(id) : undefined;
    return !!p && p.lastAt >= plan.createdAt - 60_000 && p.lastAt >= new Date(today + "T00:00:00").getTime();
  };
  const listened = games.some((g) => g.gameId.startsWith("listen:"));
  const played = games.some((g) => !g.gameId.startsWith("listen:"));
  let changed = false;
  const steps = plan.steps.map((s) => {
    if (s.done) return s;
    let ok = false;
    switch (s.kind) {
      case "review":
        ok = (act?.reviews ?? 0) > plan.base.reviews && (dueNow === 0 || (act?.reviews ?? 0) - plan.base.reviews >= s.minutes * 5);
        break;
      case "new-words":
        ok = (act?.newWords ?? 0) >= (settings.dailyNewWords ?? 10);
        break;
      case "lesson":
      case "lesson-review":
        ok = s.lessonId ? doneToday(s.lessonId) : [...lessons.values()].some((p) => p.lastAt >= plan.createdAt);
        break;
      case "practice":
        ok = s.lessonId ? doneToday(s.lessonId) : played;
        break;
      case "reading":
        ok = (act?.readingWords ?? 0) - plan.base.readingWords >= s.minutes * 80;
        break;
      case "listening":
        ok = listened;
        break;
      case "conversation":
        ok = (act?.chatMessages ?? 0) - plan.base.chatMessages >= 4;
        break;
    }
    if (ok) changed = true;
    return ok ? { ...s, done: true } : s;
  });
  if (!changed) return plan;
  const next = { ...plan, steps, updatedAt: Date.now() };
  await db.sessions.put(next as unknown as DailySession);
  return next;
}

/** Today's plan if it exists (any version), without building one. */
export async function getTodayPlan(): Promise<DailyPlan | undefined> {
  const p = (await getDb().sessions.get(todayKey())) as unknown as DailyPlan | undefined;
  return p && p.version === 2 ? p : undefined;
}

// ---------- Backward-compatible API (used by /session) ----------

/** @deprecated use buildDailyPlan — kept for existing callers; always rebuilds. */
export async function buildSession(minutes: number, opts: { aiAvailable: boolean; dailyNewWords: number; immersion: boolean }): Promise<DailySession> {
  const m = ([5, 10, 15, 20, 30, 60].includes(minutes) ? minutes : 15) as PlanMinutes;
  const plan = await buildDailyPlan(m, { ...opts, force: true });
  return plan as unknown as DailySession;
}

/** Manually tick / untick a step. */
export async function markStep(stepId: string, done: boolean) {
  const db = getDb();
  const s = await db.sessions.get(todayKey());
  if (!s) return;
  s.steps = s.steps.map((x) => (x.id === stepId ? { ...x, done } : x));
  await db.sessions.put(s);
}
