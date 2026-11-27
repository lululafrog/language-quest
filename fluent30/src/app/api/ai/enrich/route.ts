import { enrich } from "@/lib/server/ai";
import { aiRoute, optionalString, requireString } from "@/lib/server/route";

export const POST = aiRoute<{ input?: string; context?: string }>(async (b) => enrich(requireString(b.input, "input", 500), optionalString(b.context, 1000)));
