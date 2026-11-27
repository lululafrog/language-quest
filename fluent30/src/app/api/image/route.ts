import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { structured, SvgSchema } from "@/lib/server/ai";
import { config } from "@/lib/server/config";
import { jsonError } from "@/lib/server/guard";
import { requireString, withAi } from "@/lib/server/route";
import { recordCall } from "@/lib/server/usage";
import { IMAGE_COST_USD } from "@/lib/server/costs-core";
import { sanitizeSvg } from "@/lib/svg";
import { openverseSearch } from "@/lib/server/free/openverse";

// Memorable illustration for a flashcard. Provider: OpenAI Images (OPENAI_API_KEY) if set,
// otherwise a Claude-drawn SVG pictogram (ANTHROPIC_API_KEY), otherwise — or when those fail — a free,
// openly licensed photo/drawing from Openverse (CC0 / public domain / CC BY, credited). Results are cached:
// in memory, in Supabase Storage (if SUPABASE_SERVICE_ROLE_KEY is set) and on the device (IndexedDB).

const STYLE =
  "Flat vector illustration, consistent house style: soft rounded shapes, thick clean outlines, limited palette (deep indigo, coral, mint, warm yellow, off-white background), friendly but not childish, single clear focal subject, no text, no letters, no numbers, no captions.";

type ImageOut = { data: string; mime: string; provider: string; attribution?: string; license?: string; sourceUrl?: string };
const memory = new Map<string, ImageOut>();

/** Free fallback: an openly licensed image found on Openverse, downloaded (thumbnail size) so it works offline. */
async function fromOpenverse(term: string): Promise<ImageOut | null> {
  try {
    const hit = await openverseSearch(term);
    if (!hit) return null;
    const r = await fetch(hit.url, { signal: AbortSignal.timeout(8000) });
    const mime = r.headers.get("content-type")?.split(";")[0] ?? "";
    if (!r.ok || !/^image\/(jpeg|png|webp|gif)$/.test(mime)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 600_000) return null;
    return { data: `data:${mime};base64,${buf.toString("base64")}`, mime, provider: "openverse", attribution: hit.attribution, license: hit.license, sourceUrl: hit.source };
  } catch {
    return null;
  }
}

function storage() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config.supabaseUrl || !key) return null;
  return createClient(config.supabaseUrl, key, { auth: { persistSession: false } }).storage.from("illustrations");
}

function safeKey(k: string) {
  return k.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "img";
}

type Body = { key?: string; term?: string; meaning?: string; prompt?: string; kind?: string; allowFree?: boolean };

export function POST(req: Request) {
  return withAi<Body>("images", req, async (body) => {
    const term = requireString(body.term, "term", 120);
    const key = safeKey(body.key || term);
    const meaning = (body.meaning ?? "").slice(0, 200);
    const scene = (body.prompt ?? "").slice(0, 400);

    const hit = memory.get(key);
    if (hit) return NextResponse.json({ ...hit, cached: true });

    const bucket = storage();
    if (bucket) {
      for (const ext of ["webp", "svg"]) {
        const { data } = await bucket.download(`${key}.${ext}`);
        if (data) {
          const buf = Buffer.from(await data.arrayBuffer());
          const mime = ext === "svg" ? "image/svg+xml" : "image/webp";
          const out = { data: `data:${mime};base64,${buf.toString("base64")}`, mime, provider: ext === "svg" ? "claude-svg" : "openai" };
          memory.set(key, out);
          return NextResponse.json({ ...out, cached: true });
        }
      }
    }

    const kindHint =
      body.kind === "verb" || body.kind === "phrasal"
        ? "Show a person performing the action."
        : body.kind === "expression" || body.kind === "phrase"
          ? "Show a concrete everyday situation where this would be said."
          : "If the idea is abstract, use a clear visual metaphor.";

    let out: ImageOut | null = null;
    if (config.openaiKey) {
      const started = Date.now();
      const prompt = `${STYLE}\nSubject: the meaning of the English "${term}"${meaning ? ` (${meaning})` : ""}. ${scene} ${kindHint}`;
      const r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${config.openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: config.imageModel, prompt, size: "1024x1024", quality: "low", output_format: "webp", output_compression: 70, n: 1 }),
        signal: AbortSignal.timeout(60_000),
      }).catch((e) => {
        console.error("image api unreachable", (e as Error)?.message);
        return null;
      });
      if (!r) {
        // provider unreachable: fall through to the next engine
      } else if (!r.ok) {
        console.error("image api", r.status, (await r.text()).slice(0, 300));
      } else {
        const j = (await r.json()) as { data?: { b64_json?: string }[] };
        const b64 = j.data?.[0]?.b64_json;
        if (b64) {
          recordCall({ model: config.imageModel, usage: { input: 0, output: 0 }, latencyMs: Date.now() - started, costUsd: IMAGE_COST_USD });
          out = { data: `data:image/webp;base64,${b64}`, mime: "image/webp", provider: "openai" };
          if (bucket) await bucket.upload(`${key}.webp`, Buffer.from(b64, "base64"), { contentType: "image/webp", upsert: true });
        }
      }
    }
    if (!out && config.anthropicKey) {
      try {
      const res = await structured({
        schema: SvgSchema,
        effort: "low",
        maxTokens: 6000,
        system: `Task: draw a memorable pictogram as SVG (viewBox 0 0 200 200) that conveys a meaning WITHOUT any text. Style: soft rounded shapes, 4px dark indigo (#2E2A6B) outlines, palette #2E2A6B, #FF7A6B, #5FD3B5, #FFD166, #FFF8EE background rect with rx=28. No <text>, no scripts, no external references, no filters. Under 4 KB.`,
        user: `Meaning to illustrate: "${term}"${meaning ? ` = ${meaning}` : ""}. ${scene} ${kindHint}`,
      });
      const svg = sanitizeSvg(res.svg);
      if (svg) {
        out = { data: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, mime: "image/svg+xml", provider: "claude-svg" };
        if (bucket) await bucket.upload(`${key}.svg`, Buffer.from(svg), { contentType: "image/svg+xml", upsert: true });
      }
      } catch (e) {
        console.warn("image: AI pictogram failed, trying Openverse:", (e as Error)?.message);
      }
    }
    // free openly licensed image, unless the caller wants a custom illustration only (e.g. a personal memory)
    if (!out && body.allowFree !== false) out = await fromOpenverse(term);
    if (!out) return jsonError(503, "service_unavailable", "Aucune illustration n'a pu être trouvée pour ce mot pour le moment.");
    if (memory.size > 500) memory.delete(memory.keys().next().value as string);
    memory.set(key, out);
    return out;
  });
}
