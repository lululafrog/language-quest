"use client";
// Irregular verbs track: 70/30 selection, cards and memorisation families.
import { getDb, uid } from "./db";
import { saveCard, lemmaOf } from "./cards";
import { seedByLemma } from "./data/vocab";
import { CORE_VERBS } from "./data/verbs";
import { IRREGULAR_BY_THEME, IRREGULAR_RANKED, type RankedIrregular } from "./data/irregular-rank";
import type { Card } from "./types";

export interface IrregularPick {
  verb: RankedIrregular;
  reason: "frequent" | "interest" | "reading";
  interest?: string;
}

/** Next verbs to learn: 70 % by importance, 30 % personalised (interests and verbs met while reading). */
export async function nextIrregulars(count: number, interests: string[]): Promise<IrregularPick[]> {
  const db = getDb();
  const cards = await db.cards.toArray();
  const learned = new Set(cards.filter((c) => c.themes.includes("irregular-verbs")).map((c) => c.lemma));
  const available = IRREGULAR_RANKED.filter((v) => !learned.has(v.base));
  const personalCount = Math.round(count * 0.3);
  const picks: IrregularPick[] = [];
  const taken = new Set<string>();
  const push = (p: IrregularPick) => {
    if (taken.has(p.verb.base) || picks.length >= count) return;
    taken.add(p.verb.base);
    picks.push(p);
  };
  // 30 %: verbs met while reading or in conversations, then verbs linked to interests.
  const personal: IrregularPick[] = [];
  const met = new Set(cards.filter((c) => c.source === "reader" || c.source === "conversation" || c.source === "translator").map((c) => c.lemma));
  for (const v of available) if (met.has(v.base)) personal.push({ verb: v, reason: "reading" });
  for (const th of interests) for (const b of IRREGULAR_BY_THEME[th] ?? []) {
    const v = available.find((x) => x.base === b);
    if (v) personal.push({ verb: v, reason: "interest", interest: th });
  }
  // Prefer the most useful personalised verbs.
  personal.sort((a, b) => a.verb.rank - b.verb.rank);
  // 70 %: most important first.
  const frequent = available.map<IrregularPick>((v) => ({ verb: v, reason: "frequent" }));
  for (const p of frequent.slice(0, count - Math.min(personalCount, personal.length))) push(p);
  for (const p of personal) if (picks.length < count) push(p);
  for (const p of frequent) if (picks.length < count) push(p);
  return picks;
}

export function irregularCard(v: RankedIrregular): Card {
  const now = Date.now();
  const core = CORE_VERBS.find((c) => c.base === v.base);
  const seed = seedByLemma(v.base);
  return {
    id: uid("c"), term: v.base, lemma: v.base, kind: "verb", pos: "verb", fr: v.fr, ipa: core?.ipa ?? seed?.ipa,
    example: core?.meanings[0]?.example ?? seed?.ex, exampleFr: core?.meanings[0]?.exampleFr ?? seed?.exFr,
    forms: { prétérit: v.past, "participe passé": v.pp }, themes: ["irregular-verbs", "action-verbs"],
    frequencyRank: seed?.rank, difficulty: v.rank <= 25 ? 1 : v.rank <= 60 ? 2 : 3, source: "verbs", enriched: true,
    notes: `${v.base} – ${v.past} – ${v.pp}`, createdAt: now, updatedAt: now,
  };
}

/** Adds the verb to the learner's cards (or completes an existing card with its forms). */
export async function learnIrregular(v: RankedIrregular) {
  const db = getDb();
  const existing = await db.cards.where("lemma").equals(lemmaOf(v.base)).first();
  if (existing) {
    await db.cards.update(existing.id, {
      themes: [...new Set(["irregular-verbs", ...existing.themes])],
      forms: { ...(existing.forms ?? {}), prétérit: v.past, "participe passé": v.pp },
      notes: existing.notes ?? `${v.base} – ${v.past} – ${v.pp}`,
      suspended: false,
    });
    return saveCard({ ...existing }, {});
  }
  return saveCard(irregularCard(v));
}

/** Memorisation families (pattern of the three forms). */
export function familyOf(v: { base: string; past: string; pp: string }): string {
  const p = v.past.split("/")[0];
  const pp = v.pp.split("/")[0];
  if (v.base === p && p === pp) return "aaa";
  if (/(ought|aught)$/.test(p)) return "ought";
  if (/i/.test(v.base) && /a/.test(p) && /u/.test(pp) && p.replace("a", "i") === v.base) return "iau";
  if (/ew$/.test(p) && /(own|awn)$/.test(pp)) return "ew";
  if (p === pp) return "abb";
  if (v.base === pp) return "aba";
  return "abc";
}

export const FAMILIES: Record<string, { fr: string; en: string; hint: string }> = {
  aaa: { fr: "Trois formes identiques", en: "All three the same", hint: "cut – cut – cut : rien à changer !" },
  ought: { fr: "Famille -ought / -aught", en: "-ought / -aught", hint: "buy → bought, think → thought, teach → taught" },
  iau: { fr: "Famille i – a – u", en: "i – a – u", hint: "sing → sang → sung, drink → drank → drunk" },
  ew: { fr: "Famille -ew / -own", en: "-ew / -own", hint: "fly → flew → flown, know → knew → known" },
  abb: { fr: "Prétérit = participe passé", en: "Past = past participle", hint: "keep → kept → kept : une seule forme à retenir" },
  aba: { fr: "Participe = base verbale", en: "Participle = base", hint: "come → came → come, run → ran → run" },
  abc: { fr: "Trois formes différentes", en: "Three different forms", hint: "go → went → gone : à apprendre par cœur" },
};
