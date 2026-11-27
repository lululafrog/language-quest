import { test } from "node:test";
import assert from "node:assert/strict";
import { mapLanguageTool, type LtMatch } from "../src/lib/server/free/languagetool";
import { pickOpenverse, type OpenverseItem } from "../src/lib/server/free/openverse";

// Recorded-shape fixture of a LanguageTool /v2/check answer for "She go to school yesterday and buyed a apple."
const TEXT = "She go to school yesterday and buyed a apple.";
const LT_MATCHES: LtMatch[] = [
  { message: "The verb 'go' does not agree with the subject 'She'.", shortMessage: "Agreement error", offset: 4, length: 2, replacements: [{ value: "goes" }, { value: "went" }], rule: { id: "HE_VERB_AGR", category: { id: "GRAMMAR", name: "Grammar" } } },
  { message: "Possible spelling mistake found.", offset: 31, length: 5, replacements: [{ value: "bought" }], rule: { id: "MORFOLOGIK_RULE_EN_US", category: { id: "TYPOS", name: "Possible Typo" } } },
  { message: "Use 'an' instead of 'a' if the following word starts with a vowel sound.", offset: 37, length: 1, replacements: [{ value: "an" }], rule: { id: "EN_A_VS_AN", category: { id: "MISC", name: "Miscellaneous" } } },
  // overlapping match must be ignored
  { message: "Overlap", offset: 32, length: 3, replacements: [{ value: "x" }], rule: { id: "X", category: { id: "STYLE" } } },
  // no replacement → ignored
  { message: "Consider rephrasing", offset: 0, length: 3, replacements: [], rule: { id: "Y", category: { id: "STYLE" } } },
];

test("LanguageTool matches become an AI-shaped correction", () => {
  const r = mapLanguageTool(TEXT, LT_MATCHES);
  assert.equal(r.corrected, "She goes to school yesterday and bought an apple.");
  assert.equal(r.engine, "languagetool");
  assert.equal(r.isAlreadyCorrect, false);
  assert.equal(r.changes.length, 3);
  assert.deepEqual(r.changes.map((c) => c.category), ["grammar", "spelling", "grammar"]);
  assert.ok(r.changes[0].explanationFr.startsWith("Grammaire"));
  assert.ok(r.changes[1].explanationFr.startsWith("Orthographe"));
  assert.ok(r.note.length > 0);
});

test("no LanguageTool match = no error detected", () => {
  const r = mapLanguageTool("I went to school.", []);
  assert.equal(r.isAlreadyCorrect, true);
  assert.equal(r.corrected, "I went to school.");
});

const OV: OpenverseItem[] = [
  { id: "1", url: "https://x/1.jpg", license: "by-sa", creator: "A", filetype: "jpg" }, // share-alike: excluded
  { id: "2", url: "https://x/2.jpg", license: "by", license_version: "4.0", creator: "Bob", title: "Red apple", foreign_landing_url: "https://flickr/2", filetype: "jpg" },
  { id: "3", url: "https://x/3.jpg", license: "cc0", creator: "Cleo", mature: true, filetype: "jpg" }, // mature: excluded
  { id: "4", url: "https://x/4.tiff", license: "cc0", filetype: "tiff" }, // unsupported format
  { id: "5", url: "https://x/5.png", thumbnail: "https://api.openverse.org/v1/images/5/thumb/", license: "pdm", filetype: "png" },
];

test("Openverse: only CC0 / public domain / CC BY, non-mature, preferred license first, credited", () => {
  const r = pickOpenverse(OV);
  assert.ok(r);
  assert.equal(r!.url, "https://api.openverse.org/v1/images/5/thumb/"); // pdm preferred over by; thumbnail used
  assert.equal(r!.license, "Domaine public");
  const onlyBy = pickOpenverse([OV[0], OV[1], OV[2]]);
  assert.equal(onlyBy!.license, "CC BY 4.0");
  assert.match(onlyBy!.attribution, /Bob/);
  assert.equal(onlyBy!.source, "https://flickr/2");
  assert.equal(pickOpenverse([OV[0], OV[2], OV[3]]), null);
});
