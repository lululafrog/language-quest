import { test } from "node:test";
import assert from "node:assert/strict";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

// Re-declared import path: server modules import "server-only", so we load the schemas through a shim.
test("AI output schemas convert to JSON Schema", async () => {
  const mod = await import("./shim-ai");
  for (const [name, schema] of Object.entries(mod.SCHEMAS)) {
    const f = betaZodOutputFormat(schema as z.ZodType);
    assert.ok(f, name);
    const json = JSON.stringify(f);
    assert.ok(json.includes('"type"'), `${name} has a JSON schema`);
  }
});
