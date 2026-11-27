import { chapterQuiz } from "@/lib/server/ai-reader";
import { aiRoute, requireString } from "@/lib/server/route";

export const maxDuration = 60;

export const POST = aiRoute<{ text?: string; title?: string; chapterTitle?: string; level?: string }>(async (b) => {
  const text = requireString(b.text, "text", 120000);
  const r = await chapterQuiz(text, requireString(b.title, "title", 200), String(b.chapterTitle ?? "").slice(0, 200), String(b.level ?? "B1").slice(0, 3));
  return { ...r, mcq: r.mcq.filter((q) => q.options.length >= 2 && q.answer >= 0 && q.answer < q.options.length).slice(0, 4) };
}, { feature: "reader" });
