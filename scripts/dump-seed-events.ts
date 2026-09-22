import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { SeedData } from "../lib/types";

const SLUGS = [
  "starship-6-test",
  "musk-ctiticizes-f-35-builders-agsinst-drone-swarms",
  "musk-ordered-to-appear-at-lottery-hearing",
];

async function main() {
  const data = JSON.parse(
    await readFile(path.join("data", "seed.json"), "utf8"),
  ) as SeedData;
  const types = Object.fromEntries(data.eventTypes.map((t) => [t.id, t]));
  const out = [];
  for (const slug of SLUGS) {
    const e = data.events.find((x) => x.slug === slug);
    if (!e) {
      console.log("missing", slug);
      continue;
    }
    out.push({
      slug: e.slug,
      title: e.title,
      occurred_at: e.occurred_at,
      date_precision: e.date_precision,
      type: e.event_type_id ? types[e.event_type_id]?.slug : null,
      source_url: e.source_url,
      media_url: e.media_url,
      quotes: e.quotes ?? [],
      summary_html: e.summary_html,
    });
  }
  await writeFile(
    path.join("content", "pilot-musk", "_seed-full.json"),
    JSON.stringify(out, null, 2),
    "utf8",
  );
  console.log("ok", out.length);
}

main();
