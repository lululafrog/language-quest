import { test } from "node:test";
import assert from "node:assert/strict";
import { CATALOG, SOVEREIGN_COUNT, byContinent, getCatalog } from "../src/lib/atlas/catalog";
import { LIBRARY } from "../src/lib/data/library";

test("atlas catalog: 195 countries + 16 special destinations", () => {
  assert.equal(SOVEREIGN_COUNT, 195);
  assert.equal(CATALOG.filter((e) => e.status === "observer").length, 2);
  assert.equal(CATALOG.length - SOVEREIGN_COUNT, 16);
  const counts = Object.fromEntries(
    Object.entries(byContinent()).map(([k, v]) => [k, v.filter((e) => e.status === "sovereign" || e.status === "observer").length]),
  );
  assert.deepEqual(counts, { europe: 44, asia: 48, africa: 54, "north-america": 23, "south-america": 12, oceania: 14, antarctica: 0 });
});

test("atlas catalog: unique ids and ISO codes, valid coordinates and themes", () => {
  assert.equal(new Set(CATALOG.map((e) => e.id)).size, CATALOG.length);
  assert.equal(new Set(CATALOG.map((e) => e.iso2)).size, CATALOG.length);
  const bookIds = new Set(LIBRARY.map((b) => b.id));
  for (const e of CATALOG) {
    assert.match(e.iso2, /^[A-Z]{2}$/, e.id);
    assert.ok(e.lat >= -90 && e.lat <= 90 && e.lon >= -180 && e.lon <= 180, e.id);
    assert.ok(e.themes.length >= 3 && e.tags.length >= 1 && e.languages.length >= 1, e.id);
    if (e.virtualOnly) assert.ok(e.virtualNote, e.id);
    for (const b of e.books ?? []) assert.ok(bookIds.has(b), `${e.id}: unknown book ${b}`);
  }
});

test("atlas catalog: content status of reference destinations", () => {
  for (const id of ["uk", "italy", "indonesia", "vietnam", "japan", "australia", "usa", "new-zealand", "egypt", "south-africa"])
    assert.equal(getCatalog(id)?.content, "complete", id);
  assert.equal(getCatalog("canada")?.content, "preview");
  assert.equal(CATALOG.filter((e) => e.content !== "coming").length, 11);
});
