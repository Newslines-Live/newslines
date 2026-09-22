/**
 * Phase 0 Musk pilot: source-grounded Newslines event generation.
 *
 *   npm run generate:event -- --case content/pilot-musk/cases/statement-x-paste.json
 *   npm run generate:event -- --topic elon-musk --facts-file facts.txt --url https://...
 */
import { config as loadEnv } from "dotenv";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { buildFactBundle } from "../lib/generate/fetch-source";
import { chatCompletion, parseJsonFromLlm } from "../lib/generate/llm";
import { buildSystemPrompt, buildUserPrompt } from "../lib/generate/prompts";
import {
  generatedNewsEventSchema,
  pilotCaseSchema,
  type FactBundle,
  type GeneratedNewsEvent,
  type PilotCase,
} from "../lib/generate/schema";
import { loadSeedTitlesForTopic } from "../lib/generate/seed-dupes";
import {
  toSeedScalars,
  validateGeneratedEvent,
  type ValidationResult,
} from "../lib/generate/validate";

loadEnv({ path: ".env.local" });
loadEnv(); // .env fallback

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function parseArgs(argv: string[]) {
  const urls: string[] = [];
  let topic = "elon-musk";
  let casePath: string | undefined;
  let textFile: string | undefined;
  let factsFile: string | undefined;
  let outDir = path.join("content", "pilot-musk", "out");
  let skipExtract = false;
  let skipDupe = false;
  let dryRun = false;
  let occurredAt: string | undefined;
  let datePrecision: "exact" | "month" | "year" | undefined;
  let eventType: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--case") casePath = argv[++i];
    else if (a === "--topic") topic = argv[++i];
    else if (a === "--url") urls.push(argv[++i]);
    else if (a === "--text-file") textFile = argv[++i];
    else if (a === "--facts-file") factsFile = argv[++i];
    else if (a === "--out") outDir = argv[++i];
    else if (a === "--skip-extract") skipExtract = true;
    else if (a === "--skip-dupe") skipDupe = true;
    else if (a === "--dry-run") dryRun = true;
    else if (a === "--occurred-at") occurredAt = argv[++i];
    else if (a === "--date-precision") {
      datePrecision = argv[++i] as "exact" | "month" | "year";
    } else if (a === "--event-type") eventType = argv[++i];
    else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return {
    urls,
    topic,
    casePath,
    textFile,
    factsFile,
    outDir,
    skipExtract,
    skipDupe,
    dryRun,
    occurredAt,
    datePrecision,
    eventType,
  };
}

function printHelp() {
  console.log(`generate-event — Phase 0 Musk pilot

Usage:
  npx tsx scripts/generate-event.ts --case content/pilot-musk/cases/....json
  npx tsx scripts/generate-event.ts --topic elon-musk --facts-file facts.txt [--url URL]

Env:
  OPENAI_API_KEY (required for live generation)
  OPENAI_BASE_URL, OPENAI_MODEL (optional)
`);
}

async function loadCase(casePath: string): Promise<PilotCase> {
  const raw = JSON.parse(await readFile(casePath, "utf8"));
  return pilotCaseSchema.parse(raw);
}

async function loadLines(filePath: string): Promise<string[]> {
  const text = await readFile(filePath, "utf8");
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

async function generateEvent(
  bundle: FactBundle,
): Promise<{ event: GeneratedNewsEvent; model: string }> {
  const { content, model } = await chatCompletion(
    [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(bundle) },
    ],
    { temperature: 0.25 },
  );
  const raw = parseJsonFromLlm(content) as Record<string, unknown>;
  // Inject provenance if missing
  if (!raw.provenance) {
    raw.provenance = {
      pipeline: "pilot",
      input_urls: bundle.source_urls,
      model,
      generated_at: new Date().toISOString(),
    };
  } else {
    const p = raw.provenance as Record<string, unknown>;
    p.pipeline = p.pipeline ?? "pilot";
    p.input_urls = p.input_urls ?? bundle.source_urls;
    p.model = p.model ?? model;
    p.generated_at = p.generated_at ?? new Date().toISOString();
  }

  // Ensure hub topic first for pilot
  if (Array.isArray(raw.topic_slugs)) {
    const topics = raw.topic_slugs as string[];
    if (!topics.includes("elon-musk")) topics.unshift("elon-musk");
    else {
      raw.topic_slugs = [
        "elon-musk",
        ...topics.filter((t) => t !== "elon-musk"),
      ];
    }
  }

  // defaults
  if (!Array.isArray(raw.quotes)) raw.quotes = [];
  if (!Array.isArray(raw.media)) raw.media = [];

  const parsed = generatedNewsEventSchema.parse(raw);
  return { event: parsed, model };
}

function printScorecard(
  id: string,
  validation: ValidationResult,
  extras?: { fetchErrors?: { url: string; error: string }[]; model?: string },
) {
  console.log("\n======== SCORECARD ========");
  console.log(`case/id: ${id}`);
  if (extras?.model) console.log(`model: ${extras.model}`);
  console.log(`schema+rules: ${validation.ok ? "PASS" : "FAIL"}`);
  if (validation.errors.length) {
    console.log("\nERRORS:");
    for (const e of validation.errors) console.log(`  [error] ${e.code}: ${e.message}`);
  }
  if (validation.warnings.length) {
    console.log("\nWARNINGS (human check):");
    for (const w of validation.warnings)
      console.log(`  [warn] ${w.code}: ${w.message}`);
  }
  if (extras?.fetchErrors?.length) {
    console.log("\nFETCH:");
    for (const f of extras.fetchErrors)
      console.log(`  ${f.url}: ${f.error}`);
  }
  console.log("\nHuman checklist:");
  console.log("  [ ] Factual fidelity to sources only");
  console.log("  [ ] Present tense + Newslines tone");
  console.log("  [ ] Neutral narrator");
  console.log("  [ ] Event date / precision correct");
  console.log("  [ ] Event type + topics correct");
  console.log("  [ ] Quotes accurate + speaker");
  console.log("  [ ] Sources / not near-dupe of seed");
  console.log("============================\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let caseData: PilotCase | null = null;
  let runId = `adhoc-${Date.now()}`;

  const urls = [...args.urls];
  let pastedText: string | undefined;
  let preFacts: string[] | undefined;
  let preQuotes: PilotCase["subject_quotes"];
  let suggested_occurred_at = args.occurredAt;
  let suggested_date_precision = args.datePrecision;
  let suggested_event_type_slug = args.eventType;
  let notes: string | undefined;
  let topic = args.topic;

  if (args.casePath) {
    caseData = await loadCase(args.casePath);
    runId = caseData.id;
    topic = caseData.topic ?? topic;
    urls.push(...(caseData.urls ?? []));
    pastedText = caseData.pasted_text;
    preFacts = caseData.facts;
    preQuotes = caseData.subject_quotes;
    suggested_occurred_at =
      suggested_occurred_at ?? caseData.suggested_occurred_at;
    suggested_date_precision =
      suggested_date_precision ?? caseData.suggested_date_precision;
    suggested_event_type_slug =
      suggested_event_type_slug ?? caseData.suggested_event_type_slug;
    notes = caseData.notes;
  }

  if (args.textFile) {
    pastedText = await readFile(args.textFile, "utf8");
  }
  if (args.factsFile) {
    preFacts = await loadLines(args.factsFile);
  }

  // Prefer case facts → skip LLM extract when facts provided
  const skipExtract =
    args.skipExtract || Boolean(preFacts && preFacts.length > 0);

  console.log(`Building fact bundle for ${runId}…`);
  const { bundle, fetchErrors, usedLlmExtract } = await buildFactBundle({
    urls: [...new Set(urls)],
    pastedText,
    preFacts,
    preQuotes,
    suggested_occurred_at,
    suggested_date_precision,
    suggested_event_type_slug,
    notes,
    skipLlmExtract: skipExtract,
  });

  console.log(
    `Facts: ${bundle.facts.length}; quotes: ${bundle.subject_quotes.length}; llmExtract: ${usedLlmExtract}`,
  );

  if (args.dryRun) {
    console.log("\n--- SYSTEM PROMPT (truncated) ---\n");
    console.log(buildSystemPrompt().slice(0, 800) + "…\n");
    console.log("\n--- USER PROMPT ---\n");
    console.log(buildUserPrompt(bundle));
    console.log("\nFetch errors:", fetchErrors);
    return;
  }

  console.log("Calling LLM…");
  let event: GeneratedNewsEvent;
  let model: string;
  try {
    const gen = await generateEvent(bundle);
    event = gen.event;
    model = gen.model;
  } catch (err) {
    console.error("Generation failed:", err);
    await mkdir(args.outDir, { recursive: true });
    const failPath = path.join(args.outDir, `${runId}__FAILED.json`);
    await writeFile(
      failPath,
      JSON.stringify(
        {
          case_id: runId,
          error: err instanceof Error ? err.message : String(err),
          fact_bundle: bundle,
          fetch_errors: fetchErrors,
        },
        null,
        2,
      ),
      "utf8",
    );
    console.error(`Wrote ${failPath}`);
    process.exit(1);
  }

  let seedTitles: { title: string; occurred_at: string; slug: string }[] = [];
  if (!args.skipDupe) {
    console.log(`Scanning seed for near-dupes on topic=${topic}…`);
    seedTitles = await loadSeedTitlesForTopic(topic);
    console.log(`Loaded ${seedTitles.length} seed titles for dupe check`);
  }

  const validation = validateGeneratedEvent(event, bundle, {
    requireHubTopic: "elon-musk",
    seedTitleMatches: seedTitles,
  });

  printScorecard(runId, validation, { fetchErrors, model });

  const outSlug = slugify(event.title) || runId;
  await mkdir(args.outDir, { recursive: true });
  const outPath = path.join(args.outDir, `${runId}__${outSlug}.json`);

  const payload = {
    case_id: runId,
    validation: {
      ok: validation.ok,
      errors: validation.errors,
      warnings: validation.warnings,
    },
    event: validation.event ?? event,
    seed_mapping: toSeedScalars(validation.event ?? event),
    fact_bundle: bundle,
    fetch_errors: fetchErrors,
    model,
    generated_at: new Date().toISOString(),
  };

  await writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote ${outPath}`);

  if (!validation.ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
