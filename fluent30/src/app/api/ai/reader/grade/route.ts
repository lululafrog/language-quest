import { gradeOpenAnswer } from "@/lib/server/ai-reader";
import { aiRoute, requireString } from "@/lib/server/route";

export const POST = aiRoute<{ question?: string; answer?: string; summary?: string }>(async (b) =>
  gradeOpenAnswer(requireString(b.question, "question", 500), requireString(b.answer, "answer", 2000), String(b.summary ?? "").slice(0, 4000)),
);
