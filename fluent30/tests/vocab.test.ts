import { test } from "node:test";
import assert from "node:assert/strict";
import { fsrs, generatorParameters, createEmptyCard, Rating, type Grade as FGrade } from "ts-fsrs";
import { estimateLevel, gradeOf, levelLabel, levelMix, statusOf, type LevelAnswer } from "../src/lib/vocab/core";
import { lexicon, lexWord, lexiconCountByLevel, THEME_GROUPS } from "../src/lib/vocab/words";
import { ADV_B2 } from "../src/lib/data/vocab-b2";
import { ADV_C1 } from "../src/lib/data/vocab-c1";
import type { Cefr, Grade, SrsState } from "../src/lib/types";
import { buildFullLexicon } from "../src/lib/vocab/lexicon-full";
import { isSub } from "../src/lib/vocab/universes";
import META from "../src/lib/data/lexicon/core-meta.json";
import EXT from "../src/lib/data/lexicon/ext.json";

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
  assert.equal(statusOf([st({ stability: 30, due: now + 20 * DAY })], { successes: 4, last: { rating: 3, at: now } }, now), "good", "recognised only: not durable");
  assert.equal(statusOf([st({ stability: 30, due: now + 20 * DAY }), st({ id: "x:production", skill: "production", stability: 9, due: now + 9 * DAY })], { successes: 4, last: { rating: 3, at: now } }, now), "durable");
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

test("every universe offers words (new-words mode never comes back empty) and every sub-theme exists", () => {
  const full = buildFullLexicon(META as never, EXT as never);
  for (const g of THEME_GROUPS) {
    const words = full.filter((w) => w.unis.includes(g.id));
    assert.ok(words.length >= 40, `${g.id}: ${words.length}`);
  }
  for (const w of full) for (const sb of w.subs) assert.ok(isSub(sb), `${w.en}: ${sb}`);
});

import { COLLECTIONS, collectionWords } from "../src/lib/vocab/collections";
import { gardenStage } from "../src/lib/vocab/space";
import { UNIVERSES, ALL_SUBS, subForLegacy } from "../src/lib/vocab/universes";
import { THEMES } from "../src/lib/data/types";

test("taxonomy: 20 universes, several hundred sub-themes, every legacy theme has a home", () => {
  assert.equal(UNIVERSES.length, 20);
  assert.ok(ALL_SUBS.length >= 200, `${ALL_SUBS.length} sub-themes`);
  assert.equal(new Set(ALL_SUBS.map((s) => s.id)).size, ALL_SUBS.length);
  for (const t of THEMES) if (!["action-verbs", "adjectives", "grammar-words", "phrasal-verbs", "irregular-verbs"].includes(t.id)) assert.ok(subForLegacy(t.id), `legacy theme ${t.id}`);
});

test("full lexicon: ≈ 10,000 entries, all levels, all categories, every sub-theme populated", () => {
  const full = buildFullLexicon(META as never, EXT as never);
  assert.ok(full.length >= 9600, `${full.length} entries`);
  const lv = new Map<string, number>();
  for (const e of full) lv.set(e.level, (lv.get(e.level) ?? 0) + 1);
  for (const l of ["A1", "A2", "B1", "B2", "C1"]) assert.ok((lv.get(l) ?? 0) >= 800, `${l}: ${lv.get(l)}`);
  const cats = new Set(full.map((e) => e.cat));
  for (const c of ["phrasal", "idiom", "connector", "slang", "collocation", "native", "falsefriend", "phrase", "ukus", "irregular"]) assert.ok(cats.has(c as never), `category ${c}`);
  const perSub = new Map<string, number>();
  for (const e of full) for (const s of e.subs) perSub.set(s, (perSub.get(s) ?? 0) + 1);
  for (const s of ALL_SUBS) assert.ok((perSub.get(s.id) ?? 0) >= 15, `${s.id}: ${perSub.get(s.id) ?? 0}`);
  const lemmas = full.map((e) => e.lemma);
  assert.equal(new Set(lemmas).size, lemmas.length, "no duplicate entry");
  for (const e of full.filter((x) => !x.core)) {
    assert.ok(e.fr && e.ex && e.exFr, `incomplete: ${e.en}`);
    if (e.cat === "falsefriend" || e.cat === "ukus") assert.ok(e.note, `${e.en}: note required`);
  }
});

test("collections: each one has enough words and a reward", () => {
  const full = buildFullLexicon(META as never, EXT as never);
  for (const c of COLLECTIONS) {
    const words = collectionWords(c, full);
    assert.ok(words.length >= Math.min(60, c.size * 0.75), `${c.id}: ${words.length}`);
    assert.ok(c.reward.startsWith("x-col-"));
  }
});

test("garden: grows with consolidated words only, never goes back to nothing", () => {
  assert.equal(gardenStage({ discovered: 0, consolidated: 0 }), 0);
  assert.equal(gardenStage({ discovered: 30, consolidated: 0 }), 1, "seen words make a seed, not a tree");
  assert.equal(gardenStage({ discovered: 30, consolidated: 3 }), 2);
  assert.equal(gardenStage({ discovered: 80, consolidated: 20 }), 3);
  assert.equal(gardenStage({ discovered: 100, consolidated: 60 }), 4);
  assert.equal(gardenStage({ discovered: 400, consolidated: 150 }), 5);
});
