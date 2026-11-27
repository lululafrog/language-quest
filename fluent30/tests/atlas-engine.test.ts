import { test } from "node:test";
import assert from "node:assert/strict";
import { selectExercises, checkProduce, isMechanic, scoreSteps, scoreAssemble } from "../src/lib/atlas/select";
import type { AtlasExercise, Band } from "../src/lib/atlas/types";

const mcq = (bands: Band[], n: number): AtlasExercise => ({ type: "mcq", prompt: `q${n}`, options: ["a", "b"], answer: 0, explain: "x", bands });
const pool: AtlasExercise[] = [
  mcq(["A1"], 1), mcq(["A1"], 2), mcq(["A1", "A2"], 3), mcq(["A2"], 4), mcq(["A2", "B1"], 5),
  mcq(["B1"], 6), mcq(["B1", "B2"], 7), mcq(["B2"], 8), mcq(["B2", "C1"], 9), mcq(["C1"], 10), mcq(["C1"], 11),
  { type: "steps", title: "t", brief: "b", steps: ["1", "2", "3"], explain: "e", bands: ["B2"] },
  { type: "produce", title: "p", prompt: "p", fr: "p", mustInclude: [["book"]], minWords: 3, samples: ["s"], tip: "t", bands: ["A2", "B1", "B2", "C1"] },
];

test("selectExercises: 5–10 items, around the learner's band, with a country mechanic", () => {
  for (const band of ["A1", "A2", "B1", "B2", "C1"] as Band[]) {
    const sel = selectExercises({ exercises: pool }, band);
    assert.ok(sel.length >= 5 && sel.length <= 10, `${band}: ${sel.length}`);
    assert.ok(sel.some(isMechanic), `${band}: mechanic included`);
    const far = sel.filter((e) => !isMechanic(e) && e.bands && !e.bands.some((b) => Math.abs(["A1", "A2", "B1", "B2", "C1"].indexOf(b) - ["A1", "A2", "B1", "B2", "C1"].indexOf(band)) <= 1));
    assert.ok(far.length <= 2, `${band}: too many off-level items (${far.length})`);
  }
  const a1 = selectExercises({ exercises: pool }, "A1");
  assert.ok(a1.some((e) => e.type === "mcq" && e.prompt === "q1"), "A1 gets the A1 items");
  assert.ok(!a1.some((e) => e.type === "mcq" && e.prompt === "q11"), "A1 does not get C1 items");
  const c1 = selectExercises({ exercises: pool }, "C1");
  assert.ok(!c1.some((e) => e.type === "mcq" && e.prompt === "q1"), "C1 does not get pure A1 items");
  // the free production comes last
  assert.equal(selectExercises({ exercises: pool }, "B1").at(-1)?.type, "produce");
});

test("selectExercises: small pools still give at least 5 items", () => {
  const small = [mcq(["C1"], 1), mcq(["C1"], 2), mcq(["C1"], 3), mcq(["C1"], 4), mcq(["C1"], 5), mcq(["C1"], 6)];
  assert.equal(selectExercises({ exercises: small }, "A1").length, 5);
});

test("checkProduce accepts natural wordings that carry every idea", () => {
  const ex = { mustInclude: [["book", "reserve"], ["dive", "diving"], ["tomorrow", "next day"]], minWords: 6 };
  assert.ok(checkProduce("Hi, I'd like to book a dive for tomorrow morning, please.", ex).ok);
  assert.ok(checkProduce("Could I reserve two diving trips for tomorrow?", ex).ok, "inflections and other variants");
  assert.ok(checkProduce("I'm hoping to book a dive the next day if possible", ex).ok, "multi-word variant");
  const miss = checkProduce("I want to book a dive please now", ex);
  assert.equal(miss.ok, false);
  assert.deepEqual(miss.groups, [true, true, false]);
  assert.equal(checkProduce("Book dive tomorrow", ex).enoughWords, false);
  // contractions are equivalent to full forms
  assert.ok(checkProduce("I am not sure, I would like to know more", { mustInclude: [["I'm not sure"], ["I'd like"]], minWords: 4 }).ok);
});

test("steps and assemble scoring", () => {
  assert.deepEqual(scoreSteps([0, 1, 2]), { right: 3, total: 3, ok: true });
  assert.equal(scoreSteps([1, 0, 2]).right, 1);
  assert.ok(scoreAssemble(["b", "a"], ["a", "b"]).ok);
  assert.deepEqual(scoreAssemble(["a", "c"], ["a", "b"]), { missing: ["b"], extra: ["c"], ok: false });
});
