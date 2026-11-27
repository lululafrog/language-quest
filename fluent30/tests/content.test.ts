import { test } from "node:test";
import assert from "node:assert/strict";
import { SEED_VOCAB } from "../src/lib/data/vocab";
import { THEMES } from "../src/lib/data/types";
import { CORE_VERBS } from "../src/lib/data/verbs";
import { GRAMMAR_LESSONS } from "../src/lib/data/grammar";
import { GRAMMAR_ITEMS, READING_PASSAGES } from "../src/lib/data/test-bank";
import { IRREGULAR_VERBS } from "../src/lib/data/irregular";

const themeIds = new Set(THEMES.map((t) => t.id));

test("seed vocabulary: contiguous ranks, no duplicates, valid themes, translations present", () => {
  assert.ok(SEED_VOCAB.length >= 1500);
  const seen = new Set<string>();
  SEED_VOCAB.forEach((w, i) => {
    assert.equal(w.rank, i + 1);
    assert.ok(!seen.has(w.en.toLowerCase()), `duplicate ${w.en}`);
    seen.add(w.en.toLowerCase());
    assert.ok(w.fr.trim(), `missing fr for ${w.en}`);
    for (const t of w.themes ?? []) assert.ok(themeIds.has(t), `bad theme ${t} on ${w.en}`);
  });
});

test("core verbs: required verbs and complete forms", () => {
  for (const v of ["be", "have", "do", "get", "go", "make", "take", "come", "know", "think", "want", "need", "say", "tell", "see", "look", "give", "find", "feel", "keep", "let", "put", "mean", "try", "leave", "call", "ask", "work"]) {
    const verb = CORE_VERBS.find((x) => x.base === v);
    assert.ok(verb, `missing verb ${v}`);
    assert.ok(verb.past && verb.pp && verb.ing && verb.third && verb.ipa, `incomplete ${v}`);
    assert.ok(verb.meanings.length >= 2, `meanings ${v}`);
  }
  const get = CORE_VERBS.find((x) => x.base === "get")!;
  for (const e of ["get tired", "get home", "get better", "get ready", "get along"]) assert.ok([...get.expressions, ...get.phrasal].some((x) => x.en.includes(e)), `get: ${e}`);
});

test("grammar lessons: every MCQ answer exists and ids are unique", () => {
  const ids = new Set<string>();
  for (const l of GRAMMAR_LESSONS) {
    assert.ok(!ids.has(l.id), `dup ${l.id}`);
    ids.add(l.id);
    assert.ok(l.exercises.length >= 5, `${l.id} has few exercises`);
  }
  for (const g of GRAMMAR_ITEMS) assert.ok(g.answer >= 0 && g.answer < g.options.length, g.id);
  for (const p of READING_PASSAGES) for (const q of p.questions) assert.ok(q.answer < q.options.length);
});

test("irregular verbs table is well-formed", () => {
  for (const r of IRREGULAR_VERBS) assert.equal(r.length, 4);
});
