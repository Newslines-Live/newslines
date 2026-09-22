/**
 * Re-validate a pilot out JSON without calling the LLM.
 *
 *   npm run generate:event:validate -- content/pilot-musk/out/....json
 */
import { readFile } from "fs/promises";
import {
  factBundleSchema,
  generatedNewsEventSchema,
} from "../lib/generate/schema";
import { validateGeneratedEvent } from "../lib/generate/validate";

async function main() {
  const pathArg = process.argv[2];
  if (!pathArg) {
    console.error("Usage: npx tsx scripts/validate-pilot-event.ts <out.json>");
    process.exit(1);
  }
  const raw = JSON.parse(await readFile(pathArg, "utf8")) as {
    event: unknown;
    fact_bundle: unknown;
  };
  const event = generatedNewsEventSchema.parse(raw.event);
  const bundle = factBundleSchema.parse(raw.fact_bundle);
  const result = validateGeneratedEvent(event, bundle, {
    requireHubTopic: "elon-musk",
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
