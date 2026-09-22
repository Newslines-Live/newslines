import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { SeedData } from "../lib/types";

async function main() {
  const raw = await readFile(path.join("data", "seed.json"), "utf8");
  const data = JSON.parse(raw) as SeedData;
  const musk = data.topics.find((t) => t.slug === "elon-musk");
  if (!musk) throw new Error("no musk");
  const eids = new Set(
    data.eventTopics
      .filter((et) => et.topic_id === musk.id)
      .map((et) => et.event_id),
  );
  const types = Object.fromEntries(data.eventTypes.map((t) => [t.id, t]));
  const events = data.events.filter((e) => eids.has(e.id));

  const typeSlug = (e: (typeof events)[0]) =>
    e.event_type_id ? types[e.event_type_id]?.slug : null;

  const candidates = events.filter(
    (e) =>
      e.source_url &&
      (e.summary_html?.length ?? 0) > 250 &&
      !e.source_url.includes("EXAMPLE"),
  );

  const byType = (slug: string) =>
    candidates.find((e) => typeSlug(e) === slug);

  const picks = [
    byType("unmanned-launch"),
    byType("makes-statement"),
    byType("files-suit") || byType("acquisition") || byType("hired"),
    candidates.find(
      (e) =>
        typeSlug(e) === "founding" ||
        /found/i.test(e.title) ||
        e.slug.includes("founded") ||
        e.slug.includes("founds"),
    ),
  ].filter(Boolean);

  // fill to 3 unique
  for (const e of candidates) {
    if (picks.length >= 3) break;
    if (!picks.find((p) => p!.id === e.id)) picks.push(e);
  }

  const out = picks.slice(0, 3).map((e) => {
    const plain = (e!.summary_html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return {
      title: e!.title,
      slug: e!.slug,
      occurred_at: e!.occurred_at,
      date_precision: e!.date_precision,
      type: typeSlug(e!),
      source_url: e!.source_url,
      media_url: e!.media_url,
      quotes: e!.quotes ?? [],
      body_plain: plain.slice(0, 1200),
      summary_html: e!.summary_html?.slice(0, 2000),
    };
  });

  await writeFile(
    path.join("content", "pilot-musk", "_seed-picks.json"),
    JSON.stringify(out, null, 2),
    "utf8",
  );
  console.log(`wrote ${out.length} picks`);
  for (const p of out) {
    console.log(
      `- ${p.type} | ${p.title} | ${p.source_url?.slice(0, 60)} | body ${p.body_plain.length}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
