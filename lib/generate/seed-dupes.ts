import { readFile } from "fs/promises";
import path from "path";
import type { NewsEvent, SeedData, Topic } from "../types";

export type SeedTitleHit = { title: string; occurred_at: string; slug: string };

/**
 * Lightweight scan of seed.json for near-dupe checks on a topic.
 * Avoids full seed-store import overhead patterns; streams via JSON parse once.
 */
export async function loadSeedTitlesForTopic(
  topicSlug: string,
  seedPath = path.join(process.cwd(), "data", "seed.json"),
): Promise<SeedTitleHit[]> {
  let raw: string;
  try {
    raw = await readFile(seedPath, "utf8");
  } catch {
    return [];
  }

  const data = JSON.parse(raw) as SeedData;
  const topic = data.topics.find((t: Topic) => t.slug === topicSlug);
  if (!topic) return [];

  const eventIds = new Set(
    data.eventTopics
      .filter((et) => et.topic_id === topic.id)
      .map((et) => et.event_id),
  );

  const hits: SeedTitleHit[] = [];
  for (const e of data.events as NewsEvent[]) {
    if (!eventIds.has(e.id)) continue;
    hits.push({
      title: e.title,
      occurred_at: e.occurred_at,
      slug: e.slug,
    });
  }
  return hits;
}
