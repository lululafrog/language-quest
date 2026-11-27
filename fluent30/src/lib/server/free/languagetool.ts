// Free grammar/spelling check via LanguageTool (open source). Public API by default
// (https://api.languagetool.org — rate-limited: ~20 requests/min, 20 KB/request), or a self-hosted
// server through LANGUAGETOOL_URL. Used when the AI correction is unavailable.

export interface LtMatch {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: { value: string }[];
  rule: { id: string; description?: string; issueType?: string; category: { id: string; name?: string } };
}

export type CorrectionCategory = "grammar" | "vocabulary" | "spelling" | "word order" | "style" | "punctuation";

const CATEGORY_FR: Record<string, { fr: string; cat: CorrectionCategory }> = {
  GRAMMAR: { fr: "Grammaire", cat: "grammar" },
  TYPOS: { fr: "Orthographe", cat: "spelling" },
  SPELLING: { fr: "Orthographe", cat: "spelling" },
  PUNCTUATION: { fr: "Ponctuation", cat: "punctuation" },
  TYPOGRAPHY: { fr: "Typographie", cat: "punctuation" },
  CASING: { fr: "Majuscules", cat: "spelling" },
  CONFUSED_WORDS: { fr: "Mots souvent confondus", cat: "vocabulary" },
  COLLOCATIONS: { fr: "Association de mots", cat: "vocabulary" },
  REDUNDANCY: { fr: "Répétition inutile", cat: "style" },
  STYLE: { fr: "Style", cat: "style" },
  PLAIN_ENGLISH: { fr: "Style (plus simple)", cat: "style" },
  SEMANTICS: { fr: "Sens", cat: "vocabulary" },
  MISC: { fr: "Divers", cat: "grammar" },
};

export function categoryFr(id: string): { fr: string; cat: CorrectionCategory } {
  return CATEGORY_FR[id] ?? { fr: "Remarque", cat: "grammar" };
}

/** Same shape as the AI correction (CorrectSchema), built from LanguageTool matches. */
export interface SimpleCorrection {
  corrected: string;
  moreNatural: string;
  isAlreadyCorrect: boolean;
  changes: { original: string; corrected: string; explanationFr: string; category: CorrectionCategory }[];
  grammarPoints: string[];
  register: "courant";
  engine: "languagetool";
  note: string;
}

export function mapLanguageTool(text: string, matches: LtMatch[]): SimpleCorrection {
  // apply the first replacement of each non-overlapping match, from the end so offsets stay valid
  const usable = matches
    .filter((m) => m.replacements?.length && m.length > 0)
    .sort((a, b) => a.offset - b.offset)
    .filter((m, i, arr) => i === 0 || m.offset >= arr[i - 1].offset + arr[i - 1].length);
  let corrected = text;
  for (const m of [...usable].reverse()) corrected = corrected.slice(0, m.offset) + m.replacements[0].value + corrected.slice(m.offset + m.length);
  const changes = usable.map((m) => {
    const c = categoryFr(m.rule.category.id);
    return {
      original: text.slice(m.offset, m.offset + m.length),
      corrected: m.replacements[0].value,
      // LanguageTool explains in English; we prefix the French category so the learner knows what kind of issue it is
      explanationFr: `${c.fr} — ${m.shortMessage || m.message}`,
      category: c.cat,
    };
  });
  const grammarPoints = [...new Set(usable.map((m) => categoryFr(m.rule.category.id).fr))];
  return {
    corrected,
    moreNatural: corrected,
    isAlreadyCorrect: changes.length === 0,
    changes,
    grammarPoints,
    register: "courant",
    engine: "languagetool",
    note: "Correction automatique simple (orthographe et grammaire de base), sans reformulation naturelle.",
  };
}

export class FreeServiceError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

export async function languageToolCheck(text: string): Promise<SimpleCorrection> {
  const base = (process.env.LANGUAGETOOL_URL || "https://api.languagetool.org").replace(/\/$/, "");
  const body = new URLSearchParams({ text: text.slice(0, 18000), language: "en-US" });
  let r: Response;
  try {
    r = await fetch(`${base}/v2/check`, { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(8000) });
  } catch {
    throw new FreeServiceError("Le correcteur gratuit est injoignable pour le moment. Réessaie plus tard.");
  }
  if (r.status === 429) throw new FreeServiceError("Le correcteur gratuit est très sollicité. Réessaie dans une minute.", 429);
  if (!r.ok) throw new FreeServiceError("Le correcteur gratuit est indisponible pour le moment.");
  const j = (await r.json()) as { matches?: LtMatch[] };
  return mapLanguageTool(text, j.matches ?? []);
}
