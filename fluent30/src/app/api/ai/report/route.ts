import { ReportSchema, structured } from "@/lib/server/ai";
import { aiRoute, BadInput } from "@/lib/server/route";

type Msg = { role: "user" | "assistant"; content: string };

export const POST = aiRoute<{ messages?: Msg[]; level?: string; scenario?: string }>(async (b) => {
  const msgs = (Array.isArray(b.messages) ? b.messages : []).filter((m) => m && typeof m.content === "string").slice(-60);
  if (!msgs.some((m) => m.role === "user")) throw new BadInput("La conversation est vide.");
  const transcript = msgs.map((m) => `${m.role === "user" ? "LEARNER" : "PARTNER"}: ${m.content.slice(0, 2000)}`).join("\n");
  return structured({
    schema: ReportSchema,
    effort: "medium",
    system: `Task: write the post-conversation report for a French-speaking learner (level ${b.level ?? "unknown"}). Only list real errors made by the LEARNER. Natural alternatives should reflect how native speakers really talk and mention the register (familier, courant, professionnel, soutenu).`,
    user: `Scenario: ${b.scenario ?? "free conversation"}\n\nTranscript:\n${transcript}`,
  });
});
