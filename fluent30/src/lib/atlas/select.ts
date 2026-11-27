// Atlas — pure helpers (no database): level-adapted exercise selection and meaning-based
// validation of free productions. Kept dependency-free so they are unit-tested in Node.
import { BAND_ORDER, type AtlasExercise, type AtlasMission, type Band, type Mechanic } from "./types";
import { canonical } from "../../components/lesson/check";

export const MECHANIC_TYPES = new Set<string>(["assemble", "steps", "decide", "bargain", "investigate", "identify", "produce"]);

export function isMechanic(ex: AtlasExercise): ex is Mechanic & AtlasExercise {
  return MECHANIC_TYPES.has(ex.type);
}

const bandIdx = (b: Band) => BAND_ORDER.indexOf(b);

/** Distance between an item's bands and the learner's band (items without bands suit everyone). */
export function bandDistance(ex: AtlasExercise, band: Band): number {
  if (!ex.bands?.length) return 0.5;
  return Math.min(...ex.bands.map((b) => Math.abs(bandIdx(b) - bandIdx(band))));
}

function minBand(ex: AtlasExercise): number {
  return ex.bands?.length ? Math.min(...ex.bands.map(bandIdx)) : -1;
}

/**
 * Picks 5–10 items for the learner's band: exact band first, then adjacent bands, then the rest
 * only if the pool is too small. Always includes a country mechanic when the pool has one,
 * and keeps a progression from easier to harder items.
 */
export function selectExercises(mission: Pick<AtlasMission, "exercises">, band: Band, opts: { min?: number; max?: number } = {}): AtlasExercise[] {
  const min = opts.min ?? 5;
  const max = opts.max ?? 10;
  const pool = mission.exercises.map((ex, i) => ({ ex, i, d: bandDistance(ex, band) }));
  const ranked = [...pool].sort((a, b) => a.d - b.d || a.i - b.i);
  const chosen: typeof pool = [];
  for (const p of ranked) {
    if (chosen.length >= max) break;
    if (p.d <= 1 || chosen.length < min) chosen.push(p);
  }
  if (!chosen.some((p) => isMechanic(p.ex))) {
    const mech = ranked.find((p) => isMechanic(p.ex));
    if (mech) {
      if (chosen.length >= max) {
        // replace the farthest non-mechanic item
        let worst = -1;
        chosen.forEach((p, k) => {
          if (!isMechanic(p.ex) && (worst < 0 || p.d >= chosen[worst].d)) worst = k;
        });
        if (worst >= 0) chosen.splice(worst, 1);
      }
      chosen.push(mech);
    }
  }
  // progression: easier items first, original order inside a band; the free production last
  return chosen
    .sort((a, b) => {
      const pa = a.ex.type === "produce" ? 1 : 0;
      const pb = b.ex.type === "produce" ? 1 : 0;
      return pa - pb || minBand(a.ex) - minBand(b.ex) || a.i - b.i;
    })
    .map((p) => p.ex);
}

// ---------- free production: validation by meaning ----------

const stem = (w: string) => w.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "");

function containsVariant(textCanon: string, words: string[], variant: string): boolean {
  const v = canonical(variant);
  if (!v) return false;
  if (` ${textCanon} `.includes(` ${v} `)) return true;
  const vw = v.split(" ");
  if (vw.length === 1) {
    const s = stem(vw[0]);
    return s.length >= 3 && words.some((w) => stem(w) === s);
  }
  // multi-word: every word present in order, allowing inflections and up to 2 words in between
  let pos = 0;
  for (const part of vw) {
    const s = stem(part);
    let found = -1;
    for (let k = pos; k < Math.min(words.length, pos + 3 + (pos === 0 ? words.length : 0)); k++) {
      if (words[k] === part || (s.length >= 3 && stem(words[k]) === s)) {
        found = k;
        break;
      }
    }
    if (found < 0) return false;
    pos = found + 1;
  }
  return true;
}

export interface ProduceCheck {
  ok: boolean;
  groups: boolean[]; // which ideas are present
  words: number;
  enoughWords: boolean;
}

/** Accepts any natural wording that contains every required idea (any variant per idea) and enough words. */
export function checkProduce(text: string, ex: Pick<Extract<Mechanic, { type: "produce" }>, "mustInclude" | "minWords">): ProduceCheck {
  const canon = canonical(text);
  const words = canon ? canon.split(" ") : [];
  const groups = ex.mustInclude.map((g) => g.some((v) => containsVariant(canon, words, v)));
  const count = text.trim() ? text.trim().split(/\s+/).length : 0;
  const enoughWords = count >= ex.minWords;
  return { ok: enoughWords && groups.every(Boolean), groups, words: count, enoughWords };
}

/** Order check for "steps": number of items in the right position and longest correct run. */
export function scoreSteps(order: number[]): { right: number; total: number; ok: boolean } {
  const right = order.filter((v, i) => v === i).length;
  return { right, total: order.length, ok: right === order.length };
}

/** Assemble: exact set match (order free). */
export function scoreAssemble(picked: string[], correct: string[]): { missing: string[]; extra: string[]; ok: boolean } {
  const p = new Set(picked);
  const c = new Set(correct);
  const missing = correct.filter((x) => !p.has(x));
  const extra = picked.filter((x) => !c.has(x));
  return { missing, extra, ok: !missing.length && !extra.length };
}
