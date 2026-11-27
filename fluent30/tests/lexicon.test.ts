import { test } from "node:test";
import assert from "node:assert/strict";
import { SEED_VOCAB } from "../src/lib/data/vocab";
import { THEMES } from "../src/lib/data/types";
import { isInSharedLexicon, lookupLocal } from "../src/lib/lexicon";

test("shared lexicon: at least 3,000 unique entries with contiguous ranks", () => {
  assert.ok(SEED_VOCAB.length >= 3000, `only ${SEED_VOCAB.length} entries`);
  const keys = SEED_VOCAB.map((w) => w.en.toLowerCase().trim());
  assert.equal(new Set(keys).size, keys.length, "duplicate headwords");
  SEED_VOCAB.forEach((w, i) => assert.equal(w.rank, i + 1, `rank gap at ${w.en}`));
});

test("shared lexicon: every entry has translation, definition and a translated example", () => {
  const themeIds = new Set(THEMES.map((t) => t.id));
  for (const w of SEED_VOCAB) {
    assert.ok(w.fr?.trim(), `no fr: ${w.en}`);
    assert.ok(w.def?.trim(), `no def: ${w.en}`);
    assert.ok(w.def!.split(/\s+/).length <= 12, `definition too long: ${w.en}`);
    assert.ok(w.ex?.trim() && w.exFr?.trim(), `no example: ${w.en}`);
    for (const t of w.themes ?? []) assert.ok(themeIds.has(t), `unknown theme ${t} on ${w.en}`);
  }
});

test("local-first lookup: words, inflected forms and expressions answer offline", () => {
  assert.ok(lookupLocal("negotiate")?.fr, "new verb found");
  const went = lookupLocal("went");
  assert.ok(went && went.lemma === "go", "irregular form resolved to its lemma");
  assert.ok(lookupLocal("waterfall")?.def, "new word carries its definition");
  assert.ok(lookupLocal("give up")?.fr, "phrasal verb found as a whole");
  assert.ok(isInSharedLexicon("sunscreen"));
  assert.ok(!isInSharedLexicon("zxqv"));
});
