import { test } from "node:test";
import assert from "node:assert/strict";
import { checkAnswer, lemmaCandidates, speechSimilarity, tokenize } from "../src/lib/text";
import { sanitizeSvg } from "../src/lib/svg";
import { lookupLocal } from "../src/lib/lexicon";
import { fsrs, generatorParameters, createEmptyCard, Rating } from "ts-fsrs";

test("checkAnswer tolerates articles and small typos", () => {
  assert.equal(checkAnswer("the house", "house"), "exact");
  assert.equal(checkAnswer("to get along", "get along"), "exact");
  assert.equal(checkAnswer("beautifull", "beautiful"), "close");
  assert.equal(checkAnswer("cat", "dog"), "wrong");
  assert.equal(checkAnswer("maison", "maison, foyer"), "exact");
});

test("lemmatisation finds base forms", () => {
  assert.equal(lemmaCandidates("went")[0], "go");
  assert.ok(lemmaCandidates("running").includes("run"));
  assert.ok(lemmaCandidates("studies").includes("study"));
  assert.equal(lookupLocal("went")?.lemma, "go");
  assert.equal(lookupLocal("went")?.isInflected, true);
});

test("tokenize keeps contractions", () => {
  const words = tokenize("I'm sure it's fine.").filter((t) => t.word).map((t) => t.text);
  assert.deepEqual(words, ["I'm", "sure", "it's", "fine"]);
});

test("speech similarity", () => {
  assert.equal(speechSimilarity("I would like a coffee", "I would like a coffee").score, 1);
  assert.ok(speechSimilarity("I like coffee", "I would like a coffee").score < 0.8);
});

test("sanitizeSvg strips scripts, handlers and external refs", () => {
  const s = sanitizeSvg('<svg viewBox="0 0 10 10"><script>alert(1)</script><rect onclick="x()" width="5" fill="url(http://evil)"/><image href="http://x"/><text>hi</text></svg>')!;
  assert.ok(!/script|onclick|evil|http:\/\/x|<text|<image/.test(s), s);
});

test("FSRS: Good increases interval, Again creates a lapse", () => {
  const f = fsrs(generatorParameters({ enable_fuzz: false }));
  let c = createEmptyCard(new Date("2026-01-01"));
  c = f.next(c, new Date("2026-01-01"), Rating.Good).card;
  c = f.next(c, c.due, Rating.Good).card;
  const before = c.scheduled_days;
  const good = f.next(c, c.due, Rating.Good).card;
  assert.ok(good.scheduled_days > before);
  const again = f.next(good, good.due, Rating.Again).card;
  assert.equal(again.lapses, 1);
});
