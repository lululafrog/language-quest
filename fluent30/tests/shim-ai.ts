// Loads src/lib/server/ai.ts without the "server-only" guard (test environment only).
import Module from "node:module";
const req = Module.createRequire(import.meta.url);
const orig = (Module as unknown as { _load: (r: string, ...a: unknown[]) => unknown })._load;
(Module as unknown as { _load: (r: string, ...a: unknown[]) => unknown })._load = function (r: string, ...a: unknown[]) {
  if (r === "server-only") return {};
  return orig.call(this, r, ...a);
};
const ai = req("../src/lib/server/ai.ts");
export const SCHEMAS = {
  EnrichSchema: ai.EnrichSchema, LookupSchema: ai.LookupSchema, TranslateSchema: ai.TranslateSchema, CorrectSchema: ai.CorrectSchema,
  PhraseSchema: ai.PhraseSchema, ReportSchema: ai.ReportSchema, InlineCorrectionSchema: ai.InlineCorrectionSchema, WordListSchema: ai.WordListSchema,
  ImageTextSchema: ai.ImageTextSchema, SvgSchema: ai.SvgSchema,
};
