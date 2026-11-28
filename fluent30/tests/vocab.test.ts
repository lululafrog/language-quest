import { test } from "node:test";
import assert from "node:assert/strict";
import { fsrs, generatorParameters, createEmptyCard, Rating, type Grade as FGrade } from "ts-fsrs";
import { estimateLevel, gradeOf, levelLabel, levelMix, statusOf, type LevelAnswer } from "../src/lib/vocab/core";
import { lexicon, lexWord, lexiconCountByLevel, THEME_GROUPS } from "../src/lib/vocab/words";
import { ADV_B2 } from "../src/lib/data/vocab-b2";
import { ADV_C1 } from "../src/lib/data/vocab-c1";
import type { Cefr, Grade, SrsState } from "../src/lib/types";

const DAY = 86_400_000;

test("grading: miss, hint, slow, approximate, normal, instant first encounter", () => {
  assert.equal(gradeOf({ correct: false }, true), 1);
  assert.equal(gradeOf({ correct: true, hint: true, ms: 1000 }, true), 2);
  assert.equal(gradeOf({ correct: true, approximate: true }, false), 2);
  assert.equal(gradeOf({ correct: true, ms: 12_000 }, false), 2); // too slow for a choice
  assert.equal(gradeOf({ correct: true, ms: 12_000, typed: true }, false), 3); // fine for typing
  assert.equal(gradeOf({ correct: true, ms: 5000 }, false), 3);
  assert.equal(gradeOf({ correct: true, ms: 1500 }, true), 4); // known at once → provisionally mastered
  assert.equal(gradeOf({ correct: true, ms: 1500 }, false), 3); // a review is never "Easy" just for speed
});

test("long-term spacing (games): miss → next day, then ≈ 2 d → ≈ 5–10 d → weeks", () => {
  const f = fsrs(generatorParameters({ enable_fuzz: false, enable_short_term: false, request_retention: 0.9 }));
  const t0 = new Date("2026-01-01T10:00:00Z");
  const miss = f.next(createEmptyCard(t0), t0, Rating.Again as FGrade).card;
  assert.ok((miss.due.getTime() - t0.getTime()) / DAY <= 1.01, "a missed new word comes back the next day");
  let c = f.next(createEmptyCard(t0), t0, Rating.Good as FGrade).card;
  const i1 = (c.due.getTime() - t0.getTime()) / DAY;
  let now = c.due;
  c = f.next(c, now, Rating.Good as FGrade).card;
  const i2 = (c.due.getTime() - now.getTime()) / DAY;
  now = c.due;
  c = f.next(c, now, Rating.Good as FGrade).card;
  const i3 = (c.due.getTime() - now.getTime()) / DAY;
  assert.ok(i1 >= 1 && i1 <= 4, `first success ≈ 2 days (got ${i1})`);
  assert.ok(i2 > i1 && i2 <= 16, `second success ≈ 5–10 days (got ${i2})`);
  assert.ok(i3 > i2, `intervals keep growing (got ${i3})`);
  // a miss shortens the interval again
  const lapse = f.next(c, c.due, Rating.Again as FGrade).card;
  assert.ok((lapse.due.getTime() - c.due.getTime()) / DAY < i3);
});

function st(p: Partial<SrsState>): SrsState {
  return { id: "x:recognition", cardId: "x", skill: "recognition", due: Date.now() + 5 * DAY, stability: 3, difficulty: 5, elapsed_days: 0, scheduled_days: 3, learning_steps: 0, reps: 1, lapses: 0, state: 2, updatedAt: 0, ...p };
}

test("mastery states: new / learning / review / good / durable", () => {
  const now = Date.now();
  assert.equal(statusOf([], { successes: 0 }, now), "new");
  assert.equal(statusOf([st({ reps: 0 })], { successes: 0 }, now), "new");
  assert.equal(statusOf([st({ stability: 2.5 })], { successes: 1, last: { rating: 3, at: now } }, now), "learning");
  assert.equal(statusOf([st({ stability: 2.5 })], { successes: 1, last: { rating: 2, at: now } }, now), "review", "hint → review");
  assert.equal(statusOf([st({ state: 3 })], { successes: 1, last: { rating: 1, at: now } }, now), "review");
  assert.equal(statusOf([st({ due: now - DAY })], { successes: 1, last: { rating: 3, at: now - 5 * DAY } }, now), "review", "due date passed");
  assert.equal(statusOf([st({ stability: 8 })], { successes: 1, last: { rating: 4, at: now } }, now), "good", "found once at once: well mastered, not durable");
  assert.equal(statusOf([st({ stability: 30 })], { successes: 1, last: { rating: 3, at: now } }, now), "good", "one success is never durable");
  assert.equal(statusOf([st({ stability: 30, due: now + 20 * DAY })], { successes: 4, last: { rating: 3, at: now } }, now), "durable");
});

function answers(level: Cefr, n: number, okRate: number, start = 0): LevelAnswer[] {
  return Array.from({ length: n }, (_, i) => ({ cefr: level, grade: (i / n < okRate ? 3 : 1) as Grade, at: start + i }));
}

test("level: promotion only after solid results, one step at a time", () => {
  assert.equal(estimateLevel(answers("A2", 10, 1), { level: "A2" }).change, null, "too few answers");
  const up = estimateLevel(answers("A2", 22, 0.9), { level: "A2" });
  assert.equal(up.change, "up");
  assert.equal(up.state.level, "B1");
  // next level clearly too hard → stay
  const blocked = estimateLevel([...answers("A2", 22, 0.9), ...answers("B1", 10, 0.3, 100)], { level: "A2" });
  assert.equal(blocked.change, null);
  // never jumps two levels
  assert.equal(estimateLevel([...answers("A2", 25, 1), ...answers("B1", 25, 1, 100)], { level: "A2" }).state.level, "B1");
});

test("level: temporary step down, recovery, or settling lower", () => {
  const down = estimateLevel(answers("B1", 15, 0.4), { level: "B1" });
  assert.equal(down.change, "down");
  assert.deepEqual(down.state, { level: "B1", down: true });
  assert.equal(levelLabel(down.state), "Niveau actuel : B1 – on consolide le A2");
  const rec = estimateLevel([...answers("B1", 15, 0.4), ...answers("A2", 12, 0.9, 100)], { level: "B1", down: true });
  assert.equal(rec.change, "recovered");
  assert.equal(rec.state.down, false);
  const back = estimateLevel([...answers("B1", 15, 0.4), ...answers("A2", 14, 0.3, 100)], { level: "B1", down: true });
  assert.equal(back.change, "back");
  assert.equal(back.state.level, "A2");
  assert.equal(levelLabel({ level: "B1" }), "Niveau actuel : B1 – En route vers B2");
});

test("level mix: mostly the current level, a little above, never a big gap", () => {
  const mix = levelMix({ level: "B1" });
  assert.deepEqual(mix.map((m) => m.level), ["B1", "B2", "A2"]);
  assert.ok(Math.abs(mix.reduce((a, m) => a + m.share, 0) - 1) < 1e-9);
  assert.ok(mix[0].share >= 0.6);
  assert.deepEqual(levelMix({ level: "B1", down: true }).map((m) => m.level), ["A2", "B1"]);
  assert.deepEqual(levelMix({ level: "C1" }).map((m) => m.level), ["C1", "B2"]);
});

test("shared lexicon: every word has a level, examples from the brief are levelled sensibly", () => {
  const counts = lexiconCountByLevel();
  for (const l of ["A1", "A2", "B1", "B2", "C1"] as Cefr[]) assert.ok(counts[l] >= 150, `${l}: ${counts[l]} words`);
  const expect: Record<string, Cefr> = { house: "A1", food: "A1", happy: "A1", walk: "A1", crowded: "A2", borrow: "A2", journey: "A2", achievement: "B1", reliable: "B1", improve: "B1", overwhelmed: "B2", convincing: "B2", eventually: "B2", reluctant: "C1", compelling: "C1", unprecedented: "C1" };
  for (const [w, l] of Object.entries(expect)) assert.equal(lexWord(w)?.level, l, w);
  const lemmas = lexicon().map((w) => w.en.toLowerCase());
  assert.equal(new Set(lemmas).size, lemmas.length, "no duplicate word");
});

test("advanced lists: complete entries whose example uses the word, themes exist", () => {
  const themeIds = new Set(THEME_GROUPS.flatMap((g) => g.themes).concat(["adjectives", "action-verbs", "linking", "crime", "school", "shopping", "people", "opinions"]));
  for (const w of [...ADV_B2, ...ADV_C1]) {
    assert.ok(w.en && w.fr && w.ex && w.exFr && w.def, `incomplete: ${w.en}`);
    const stem = w.en.toLowerCase().split(" ")[0].slice(0, Math.max(3, w.en.length - 3));
    assert.ok(w.ex!.toLowerCase().includes(stem), `example of ${w.en} must contain it`);
    for (const t of w.themes ?? []) assert.ok(themeIds.has(t), `${w.en}: unknown theme ${t}`);
  }
});

test("every theme group offers words at every level (new-words mode never comes back empty)", () => {
  for (const g of THEME_GROUPS) {
    const words = lexicon().filter((w) => w.themes?.some((t) => g.themes.includes(t)));
    assert.ok(words.length >= 40, `${g.id}: ${words.length}`);
  }
});
