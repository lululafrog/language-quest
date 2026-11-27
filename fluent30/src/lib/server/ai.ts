import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { config } from "./config";
import { FEATURES, modelForTier, supportsServerFallback, type Tier } from "./costs-core";
import { assertBudget, assertUserBudget, currentAiContext, recordCall, recordFailure } from "./usage";
import { BadResponseError, NotConfiguredError, RefusalError, classifyAiError } from "./errors";

let client: Anthropic | null = null;
export function ai(): Anthropic {
  if (!config.anthropicKey) throw new NotConfiguredError();
  if (!client) client = new Anthropic({ apiKey: config.anthropicKey, timeout: config.aiTimeoutMs, maxRetries: 2 });
  return client;
}

export { NotConfiguredError, RefusalError, BadResponseError } from "./errors";

type Effort = "low" | "medium" | "high";

const TEACHER = `You are an expert English teacher who specialises in French-speaking learners, working inside the app "Fluent30".
Principles: teach the English people really speak (natural, current usage), prefer useful chunks and collocations over isolated words,
explain differences with French and typical mistakes made by French speakers ("faux amis", word order, tenses, prepositions),
be accurate and concise. French explanations must be natural French. Never invent facts; if something is ambiguous, say so.`;

/** Model tier for the current request: explicit, else from the feature of the running route (see costs-core FEATURES). */
function routing(tier?: Tier): { model: string; tier: Tier; maxTokensCap: number } {
  const ctx = currentAiContext();
  const spec = ctx ? FEATURES[ctx.feature] : undefined;
  const t = tier ?? spec?.tier ?? "standard";
  return { model: modelForTier(t), tier: t, maxTokensCap: spec?.maxTokens || 16000 };
}

/** Effort per tier: fast → low; standard → at most medium; premium → as requested. */
function effortFor(t: Tier, requested?: Effort): Effort {
  if (t === "fast") return "low";
  if (t === "standard") return requested === "high" ? "medium" : (requested ?? "low");
  return requested ?? "low";
}

type Usage = { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null };

/**
 * Single wrapper for every Anthropic call: budget caps, timing, real token usage → cost tracking, typed failures.
 * The call itself is passed as `fn(model)`; usage is read from the response.
 */
async function callAnthropic<R extends { usage: Usage; stop_reason?: string | null }>(model: string, fn: (model: string) => Promise<R>): Promise<R> {
  ai(); // throws NotConfiguredError first
  await assertBudget();
  const ctx = currentAiContext();
  if (ctx) await assertUserBudget(ctx.user);
  const t0 = Date.now();
  try {
    const res = await fn(model);
    const u = res.usage;
    recordCall({
      model,
      latencyMs: Date.now() - t0,
      usage: { input: u.input_tokens, output: u.output_tokens, cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0 },
    });
    if (res.stop_reason === "refusal") throw new RefusalError("refusal");
    return res;
  } catch (e) {
    if (!(e instanceof BadResponseError)) recordFailure({ code: classifyAiError(e).code, message: technicalMessage(e), provider: "anthropic" });
    throw e;
  }
}

function technicalMessage(e: unknown): string {
  if (e instanceof Anthropic.APIError) return `${e.status ?? ""} ${e.name}`.trim();
  if (e instanceof Error) return e.name + (e.message ? `: ${e.message.slice(0, 120)}` : "");
  return "unknown";
}

/** One structured call: returns data validated against the zod schema. */
export async function structured<T extends z.ZodType>(opts: {
  schema: T;
  system?: string;
  user: Anthropic.Beta.BetaContentBlockParam[] | string;
  effort?: Effort;
  maxTokens?: number;
  tier?: Tier;
}): Promise<z.infer<T>> {
  const r = routing(opts.tier);
  const max = Math.min(opts.maxTokens ?? 8000, r.maxTokensCap);
  const res = await callAnthropic(r.model, (model) =>
    ai().beta.messages.parse({
      model,
      max_tokens: max,
      ...(supportsServerFallback(model) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      system: [{ type: "text", text: TEACHER + (opts.system ? `\n\n${opts.system}` : ""), cache_control: { type: "ephemeral" } }],
      output_config: { effort: effortFor(r.tier, opts.effort), format: betaZodOutputFormat(opts.schema) },
      messages: [{ role: "user", content: opts.user }],
    }),
  );
  if (!res.parsed_output) {
    const err = new BadResponseError(`invalid_output stop_reason=${res.stop_reason}`);
    recordFailure({ code: "bad_response", message: err.message, provider: "anthropic" });
    throw err;
  }
  return res.parsed_output as z.infer<T>;
}

/** Free-text multi-turn call (conversation partner). */
export async function chatText(opts: { system: string; messages: Anthropic.Beta.BetaMessageParam[]; effort?: Effort; maxTokens?: number; tier?: Tier }) {
  const r = routing(opts.tier);
  const max = Math.min(opts.maxTokens ?? 2000, r.maxTokensCap);
  const res = await callAnthropic(r.model, (model) =>
    ai().beta.messages.create({
      model,
      max_tokens: max,
      ...(supportsServerFallback(model) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      // automatic caching of the growing conversation history (cache reads cost a fraction of input tokens)
      cache_control: { type: "ephemeral" },
      output_config: { effort: effortFor(r.tier, opts.effort) },
      messages: opts.messages,
    }),
  );
  const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
  if (!text) {
    recordFailure({ code: "bad_response", message: `empty_text stop_reason=${res.stop_reason}`, provider: "anthropic" });
    throw new BadResponseError("empty");
  }
  return text;
}

/** Lightweight health check: lists one model (no tokens billed). */
export async function anthropicHealth(): Promise<void> {
  await ai().models.list({ limit: 1 }, { timeout: 5000, maxRetries: 0 });
}

// ---------------- Schemas ----------------

export const THEME_IDS = [
  "greetings", "introductions", "daily", "numbers", "time", "directions", "transport", "airport", "accommodation", "restaurant", "shopping", "health", "emergency", "travel-problems", "people", "home", "food", "body", "clothes", "emotions", "opinions", "nature", "city", "work", "school", "tech", "travel", "relationships", "dating", "party", "sport", "adventure", "beach", "animals", "cooking", "music", "movies", "books", "art", "crime", "slang", "action-verbs", "irregular-verbs", "phrasal-verbs", "adjectives", "linking", "idioms", "grammar-words",
] as const;

export const EnrichSchema = z.object({
  term: z.string().describe("The English term, corrected and in its natural form (e.g. 'get along', 'to be honest')"),
  lemma: z.string().describe("Lowercase base form used to detect duplicates (infinitive for verbs, singular for nouns)"),
  kind: z.enum(["word", "verb", "expression", "phrase", "phrasal"]),
  fr: z.string().describe("Main French translations, most common first, comma-separated"),
  definition: z.string().describe("Simple English definition (B1 level)"),
  ipaUK: z.string().describe("British IPA between slashes"),
  ipaUS: z.string().describe("American IPA between slashes"),
  pos: z.string().describe("Part of speech in English: noun, verb, adjective, adverb, phrasal verb, idiom, expression, sentence…"),
  example: z.string().describe("Natural spoken English example sentence"),
  exampleFr: z.string(),
  synonyms: z.array(z.string()).describe("0-5 genuinely relevant synonyms"),
  antonyms: z.array(z.string()).describe("0-3 relevant antonyms, empty if none"),
  forms: z.array(z.object({ name: z.string(), value: z.string() })).describe("Useful forms: for verbs past/past participle/-ing/3rd person; plural for nouns; comparative for adjectives"),
  themes: z.array(z.string()).describe(`1-3 theme ids (always include "action-verbs" for verbs, "phrasal-verbs" for phrasal verbs, "adjectives" for adjectives) among: ${THEME_IDS.join(", ")}. If none fits, a new short French theme name prefixed with 'custom:'`),
  difficulty: z.number().int().describe("1 (beginner) to 5 (advanced)"),
  frequency: z.enum(["very common", "common", "less common", "rare"]),
  register: z.enum(["familier", "courant", "professionnel", "soutenu"]),
  imagePrompt: z.string().describe("Short visual scene (English) that would make the meaning memorable without text: an action for verbs, a concrete situation for expressions, a visual metaphor for abstract ideas"),
  notes: z.string().describe("Short tip in French for French speakers (faux ami, prononciation, usage). Empty string if nothing useful"),
  originalLanguage: z.enum(["en", "fr"]).describe("Language of the user's input"),
});
export type EnrichOutput = z.infer<typeof EnrichSchema>;

export async function enrich(input: string, context?: string): Promise<EnrichOutput> {
  return structured({
    schema: EnrichSchema,
    effort: "low",
    system:
      "Task: turn the learner's input into a complete flashcard. The input may be an English word, a French word (translate it to the most useful English equivalent), a verb, an expression or a whole sentence. Keep the most useful sense, or the sense matching the context if one is given.",
    user: `Input: ${JSON.stringify(input)}${context ? `\nContext sentence: ${JSON.stringify(context)}` : ""}`,
  });
}

export const LookupSchema = z.object({
  word: z.string(),
  lemma: z.string(),
  isInflected: z.boolean(),
  inflectionNote: z.string().describe("In French, e.g. 'prétérit de go'. Empty if base form"),
  contextualFr: z.string().describe("French translation that fits THIS sentence"),
  definition: z.string().describe("Simple English definition of this sense"),
  ipa: z.string(),
  pos: z.string(),
  example: z.string(),
  exampleFr: z.string(),
  otherSenses: z.array(z.object({ fr: z.string(), definition: z.string() })).describe("Up to 3 other common senses"),
  isPartOfExpression: z.string().describe("If the word belongs to a phrasal verb / idiom / collocation in this sentence, give it (e.g. 'give up'), else empty"),
  expressionFr: z.string().describe("French meaning of that expression, else empty"),
  imageWorthy: z.boolean().describe("true if a picture would clearly help (concrete noun, action)"),
});

export async function lookupInContext(word: string, sentence: string) {
  return structured({
    schema: LookupSchema,
    effort: "low",
    maxTokens: 3000,
    system: "Task: the learner tapped a word while reading. Explain it as used in the given sentence.",
    user: `Word: ${JSON.stringify(word)}\nSentence: ${JSON.stringify(sentence)}`,
  });
}

export const TranslateSchema = z.object({
  sourceText: z.string().describe("The English text that was analysed (transcribed from the image if one was given)"),
  translationFr: z.string(),
  register: z.enum(["familier", "courant", "professionnel", "soutenu"]),
  registerExplanation: z.string().describe("In French: why this register, tone, intention"),
  difficultExpressions: z.array(z.object({ en: z.string(), fr: z.string(), explanation: z.string() })),
  unknownWords: z.array(z.object({ en: z.string(), fr: z.string(), pos: z.string() })).describe("Words a B1 learner might not know"),
  suggestedReplies: z.array(z.object({ en: z.string(), fr: z.string(), tone: z.string().describe("e.g. décontracté, poli, chaleureux, professionnel"), why: z.string().describe("In French: why this phrasing works") })).describe("3 natural replies"),
});

export async function translateMessage(text: string, image?: { data: string; mediaType: string }) {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (image) content.push({ type: "image", source: { type: "base64", media_type: image.mediaType as "image/png", data: image.data } });
  content.push({ type: "text", text: image ? `Analyse the English conversation in this screenshot (focus on the most recent message received).${text ? `\nUser note: ${text}` : ""}` : `Message received:\n${text}` });
  return structured({
    schema: TranslateSchema,
    effort: "low",
    system: "Task: help a French speaker understand an English message they received and reply naturally. Replies must sound like a native speaker would write them in the same medium (text message, email…).",
    user: content,
  });
}

export const CorrectSchema = z.object({
  corrected: z.string().describe("Corrected text that keeps the learner's personal style, tone and ideas"),
  moreNatural: z.string().describe("How a native speaker would naturally phrase it (may equal corrected)"),
  isAlreadyCorrect: z.boolean(),
  changes: z.array(z.object({ original: z.string(), corrected: z.string(), explanationFr: z.string(), category: z.enum(["grammar", "vocabulary", "spelling", "word order", "style", "punctuation"]) })),
  grammarPoints: z.array(z.string()).describe("Grammar topics to review, in French"),
  register: z.enum(["familier", "courant", "professionnel", "soutenu"]),
});

export async function correctText(text: string) {
  return structured({
    schema: CorrectSchema,
    effort: "medium",
    system: "Task: correct the learner's English pedagogically. Fix real errors only; do not rewrite their style. Explanations in French, short and clear.",
    user: text,
  });
}

export const PhraseSchema = z.object({
  translationFr: z.string(),
  literal: z.string().describe("Word-for-word gloss in French when helpful, else empty"),
  explanation: z.string().describe("In French: meaning, register and any idiom/grammar point"),
  keyItems: z.array(z.object({ en: z.string(), fr: z.string() })).describe("Expressions or words worth learning from it"),
});

export async function explainPhrase(text: string, context?: string) {
  return structured({
    schema: PhraseSchema,
    effort: "low",
    maxTokens: 3000,
    system: "Task: translate and explain an English sentence or expression selected by the learner while reading.",
    user: `Selection: ${JSON.stringify(text)}${context ? `\nSurrounding text: ${JSON.stringify(context)}` : ""}`,
  });
}

export const ReportSchema = z.object({
  summary: z.string().describe("2-3 encouraging sentences in French about the learner's performance"),
  errors: z.array(z.object({ original: z.string(), corrected: z.string(), explanation: z.string().describe("In French") })),
  naturalAlternatives: z.array(z.object({ original: z.string(), natural: z.string(), register: z.string() })),
  newWords: z.array(z.object({ term: z.string(), fr: z.string(), example: z.string() })).describe("Useful words from the conversation the learner should learn"),
  expressions: z.array(z.object({ term: z.string(), fr: z.string(), example: z.string() })),
  grammarPoints: z.array(z.string()).describe("Grammar topics to review, in French"),
});

export const InlineCorrectionSchema = z.object({
  hasErrors: z.boolean(),
  correction: z.string().describe("If errors: the corrected sentence followed by a very short French explanation. Else empty"),
});

export const WordListSchema = z.object({
  words: z.array(z.object({ en: z.string(), fr: z.string(), pos: z.string(), ex: z.string(), exFr: z.string(), themes: z.array(z.string()) })),
});

export const ImageTextSchema = z.object({
  text: z.string().describe("All English text visible in the image, in reading order, one message per line, prefixed by the sender if visible"),
});

export const SvgSchema = z.object({
  svg: z.string().describe("A complete standalone <svg> element"),
});

// ---------------- CEFR writing assessment (full level test) ----------------

export const WritingAssessmentSchema = z.object({
  level: z.enum(["pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"]).describe("CEFR level demonstrated by this text (written production), judged with the CEFR written-assessment criteria"),
  taskAchievement: z.number().int().describe("0-5: how well the task is fulfilled (content, length, relevance)"),
  coherence: z.number().int().describe("0-5: organisation, linking, paragraphing"),
  range: z.number().int().describe("0-5: range of vocabulary and structures"),
  accuracy: z.number().int().describe("0-5: grammatical and lexical accuracy"),
  feedbackFr: z.string().describe("2-4 sentences in French explaining the level, encouraging and concrete"),
  strengthsFr: z.array(z.string()).describe("1-3 strengths, in French"),
  improvementsFr: z.array(z.string()).describe("2-4 concrete things to work on to reach the next level, in French"),
  corrections: z.array(z.object({ original: z.string(), corrected: z.string() })).describe("Up to 5 of the most important corrections"),
});

export async function assessWriting(text: string, taskPrompt: string, taskLevel: string) {
  return structured({
    schema: WritingAssessmentSchema,
    effort: "medium",
    system:
      "Task: act as a trained CEFR examiner (Council of Europe CEFR written assessment criteria: overall written production, range, coherence, accuracy, task achievement). Rate ONLY what the text demonstrates. A short or off-task text cannot be rated above the level it shows; a text that fully achieves a lower-level task with no evidence of higher-level language should be rated at that level. Be fair and calibrated, not generous.",
    user: `Task given (target level ${taskLevel}): ${taskPrompt}\n\nLearner's text:\n"""${text}"""`,
  });
}

// ---------------- "Autour de moi": name the objects in a photo ----------------

export const IdentifySchema = z.object({
  objects: z.array(z.object({
    en: z.string().describe("Natural everyday English name (with a/an only if needed), e.g. 'mug', 'kettle', 'phone charger'"),
    fr: z.string().describe("French translation"),
    pos: z.string().describe("noun, verb, adjective…"),
    example: z.string().describe("Short natural sentence using the word, about this scene"),
  })).describe("3 to 8 clearly visible, useful objects, most useful first"),
});
