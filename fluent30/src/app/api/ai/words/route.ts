import { structured, WordListSchema } from "@/lib/server/ai";
import { aiRoute, BadInput } from "@/lib/server/route";

// Generates new vocabulary beyond the built-in lists: frequency tiers 2000/3000/advanced,
// or the personalised 30 % based on the learner's interests.
export const POST = aiRoute<{ mode?: "tier" | "interests"; tier?: number; interests?: string[]; exclude?: string[]; count?: number }>(async (b) => {
  const count = Math.min(Math.max(Number(b.count) || 10, 1), 20);
  const exclude = (Array.isArray(b.exclude) ? b.exclude : []).slice(-400).join(", ");
  let task: string;
  if (b.mode === "interests") {
    const interests = (Array.isArray(b.interests) ? b.interests : []).slice(0, 10).map(String);
    if (!interests.length) throw new BadInput("Aucun centre d'intérêt défini.");
    task = `Give ${count} very useful English words or short expressions for real conversations about: ${interests.join(", ")}. Mix nouns, verbs and natural chunks people actually say.`;
  } else {
    const tier = Number(b.tier) || 2000;
    const band = tier <= 2000 ? "ranked roughly 1000-2000" : tier <= 3000 ? "ranked roughly 2000-3000" : "intermediate/advanced (beyond the 3000 most frequent), useful in conversation";
    task = `Give ${count} English words ${band} in frequency lists of spoken English (e.g. NGSL / spoken BNC), prioritising conversational usefulness.`;
  }
  return structured({
    schema: WordListSchema,
    effort: "low",
    system: "Task: suggest vocabulary to learn. Each item: headword, French translation, part of speech, a natural example sentence and its French translation, and 1-2 theme ids.",
    user: `${task}\nDo NOT include any of these already-known items: ${exclude || "(none)"}`,
  });
}, { feature: "words" });
