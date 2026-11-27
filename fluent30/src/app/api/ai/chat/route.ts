import { chatText, InlineCorrectionSchema, structured } from "@/lib/server/ai";
import { aiRoute, BadInput } from "@/lib/server/route";

type Msg = { role: "user" | "assistant"; content: string };
interface Body {
  messages?: Msg[];
  level?: string;
  mode?: "immediate" | "end" | "free";
  scenario?: { title?: string; role?: string; setting?: string; goal?: string };
  register?: string;
}

const LEVEL_GUIDE: Record<string, string> = {
  A1: "Use very short sentences, the 500 most common words, present tense mostly. Speak slowly and clearly.",
  A2: "Use short, simple sentences and common words. Avoid idioms except very common ones.",
  B1: "Use everyday natural English with some common phrasal verbs and idioms.",
  B2: "Speak naturally, with phrasal verbs, idioms and varied tenses, as with a friend.",
  C1: "Speak fully naturally, including slang where appropriate, nuance and humour.",
  C2: "Speak like a native in every respect.",
};

export const POST = aiRoute<Body>(async (b) => {
  const messages = (Array.isArray(b.messages) ? b.messages : []).filter((m) => m && typeof m.content === "string" && m.content.trim()).slice(-40);
  const level = b.level && LEVEL_GUIDE[b.level] ? b.level : "B1";
  const sc = b.scenario ?? {};
  const system = `You are a friendly native English speaker taking part in a role-play to help a French speaker practise conversation.
Scenario: ${sc.title ?? "Free conversation"}. ${sc.setting ?? ""}
Your role: ${sc.role ?? "a friendly person the learner just met"}. The learner's goal: ${sc.goal ?? "have a natural conversation"}.
Learner level: ${level}. ${LEVEL_GUIDE[level]}
Rules: stay in character; reply in English only; keep replies short (1-3 sentences) like real speech; ask a question to keep the conversation going;
use natural spoken English (contractions, common chunks) rather than textbook phrasing; register: ${b.register ?? "match the situation"}.
Never correct the learner yourself — corrections are handled separately. If the learner writes in French, gently reply in English and help them say it in English.
If messages is empty, open the conversation yourself in character.`;

  const history = messages.length ? messages.map((m) => ({ role: m.role, content: m.content.slice(0, 3000) })) : [{ role: "user" as const, content: "(Start the conversation.)" }];
  if (history[0].role !== "user") history.unshift({ role: "user", content: "(Start the conversation.)" });

  const last = messages[messages.length - 1];
  const wantCorrection = b.mode === "immediate" && last?.role === "user";
  const [reply, correction] = await Promise.all([
    chatText({ system, messages: history, effort: "low", maxTokens: 1500 }),
    wantCorrection
      ? structured({
          schema: InlineCorrectionSchema,
          effort: "low",
          maxTokens: 1500,
          system: "Task: check the learner's last message for real errors (grammar, vocabulary, unnatural phrasing). Ignore missing capital letters and casual punctuation typical of chat.",
          user: `Previous partner line: ${JSON.stringify(messages[messages.length - 2]?.content ?? "")}\nLearner's message: ${JSON.stringify(last.content)}`,
        })
      : Promise.resolve(null),
  ]);
  if (!reply) throw new BadInput("Réponse vide.");
  return { reply, correction: correction?.hasErrors ? correction.correction : null };
}, { feature: "chat" });
