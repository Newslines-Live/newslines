/**
 * Topic images from Wikipedia REST summary thumbnails.
 * Processes most-posted topics first (Grid order) and flushes seed often.
 *
 *   npm run seed:wikidata-images
 *   npx tsx scripts/fetch-wikidata-images.ts --limit=200
 */
import { readFile, writeFile, mkdir, rename } from "fs/promises";
import path from "path";
import type { SeedData } from "../lib/types";

const ROOT = process.cwd();
const SEED_PATH = path.join(ROOT, "data", "seed.json");
const CACHE_PATH = path.join(ROOT, "data", "wikidata-images.json");
const UA =
  "NewslinesBot/1.0 (https://newslines.org; archive image backfill; local-dev)";
const SKIP_NAMES = new Set(["category header", "uncategorized"]);

type ImageCache = Record<string, string | null>;

function argFlag(name: string): boolean {
  return process.argv.includes(name);
}

function argValue(flag: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`${flag}=`));
  return hit ? hit.split("=")[1]! : fallback;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

function cleanThumbUrl(url: string): string {
  // Strip tracking query params for cleaner next/image URLs
  try {
    const u = new URL(url);
    u.search = "";
    return u.toString();
  } catch {
    return url;
  }
}

async function fetchJson(url: string): Promise<unknown> {
  for (let attempt = 0; attempt < 7; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (res.status === 429) {
      const wait = Math.min(45000, 2500 * 2 ** attempt);
      console.warn(`  429 — waiting ${Math.round(wait / 1000)}s…`);
      await sleep(wait);
      continue;
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  }
  throw new Error("HTTP 429 after retries");
}

async function resolveWikiTitle(name: string): Promise<string | null> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "opensearch");
  url.searchParams.set("search", name);
  url.searchParams.set("limit", "1");
  url.searchParams.set("namespace", "0");
  url.searchParams.set("format", "json");

  const data = (await fetchJson(url.toString())) as
    | [string, string[], string[], string[]]
    | null;
  const title = data?.[1]?.[0];
  return title || null;
}

async function fetchImageForName(name: string): Promise<string | null> {
  const title = (await resolveWikiTitle(name)) || name;
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title.replace(/ /g, "_")
  )}`;
  const summary = (await fetchJson(summaryUrl)) as {
    thumbnail?: { source?: string };
    originalimage?: { source?: string };
  } | null;
  if (!summary) return null;
  const src = summary.thumbnail?.source || summary.originalimage?.source;
  return src ? cleanThumbUrl(src) : null;
}

async function loadCache(): Promise<ImageCache> {
  try {
    return JSON.parse(await readFile(CACHE_PATH, "utf8")) as ImageCache;
  } catch {
    return {};
  }
}

async function saveCache(cache: ImageCache) {
  await mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
}

async function writeSeed(seed: SeedData) {
  // Overwrite in place — Windows rename fails while Next.js has seed.json open
  await writeFile(SEED_PATH, JSON.stringify(seed), "utf8");
}

function applyCacheToSeed(seed: SeedData, cache: ImageCache) {
  let updated = 0;
  for (const t of seed.topics) {
    const name = t.name.trim();
    const url = cache[name];
    if (url && t.image_url !== url) {
      t.image_url = url;
      updated += 1;
    }
  }
  return updated;
}

function isGoodUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // Accept Wikipedia REST thumbs; reject our old broken encoded-comma builds
  return (
    url.includes("upload.wikimedia.org") &&
    !url.includes("%2C") &&
    url.includes("px-")
  );
}

async function main() {
  const force = argFlag("--force");
  const limit = Number(argValue("--limit", "200"));
  const minPosts = Number(argValue("--min-posts", "1"));
  const delayMs = Number(argValue("--delay-ms", "1200"));
  const flushEvery = Number(argValue("--flush-every", "10"));

  console.log(`Loading ${SEED_PATH}…`);
  const seed = JSON.parse(await readFile(SEED_PATH, "utf8")) as SeedData;
  let cache = force ? ({} as ImageCache) : await loadCache();

  // Purge bad URLs from previous broken Commons builder
  let purged = 0;
  for (const [name, url] of Object.entries(cache)) {
    if (!isGoodUrl(url)) {
      delete cache[name];
      purged += 1;
    }
  }
  for (const t of seed.topics) {
    if (t.image_url && !isGoodUrl(t.image_url)) {
      t.image_url = null;
      purged += 1;
    }
  }
  if (purged) {
    console.log(`Purged ${purged} broken image urls`);
    await writeSeed(seed);
    await saveCache(cache);
  }

  const topics = seed.topics
    .filter(
      (t) =>
        t.post_count >= minPosts &&
        !SKIP_NAMES.has((t.name || "").trim().toLowerCase())
    )
    .sort((a, b) => b.post_count - a.post_count);

  const scoped = limit > 0 ? topics.slice(0, limit) : topics;
  const todo = scoped
    .map((t) => t.name.trim())
    .filter((name) => name && (force || !isGoodUrl(cache[name])));

  console.log(
    `Most-posted first. Scope ${scoped.length}; need fetch ${todo.length}`
  );
  if (todo.length) {
    console.log(`  starting: ${todo.slice(0, 8).join(" · ")}`);
  }

  let done = 0;
  let found = 0;
  let sinceFlush = 0;

  for (const name of todo) {
    try {
      const url = await fetchImageForName(name);
      cache[name] = url;
      if (url) {
        found += 1;
        sinceFlush += 1;
        console.log(`  ✓ ${name}`);
      } else {
        console.log(`  · ${name} (no image)`);
      }
    } catch (err) {
      console.warn(`  skip ${JSON.stringify(name)}:`, err);
      await sleep(8000);
    }

    done += 1;
    if (done % 5 === 0 || done === todo.length) {
      console.log(`  progress ${done}/${todo.length} (${found} images)`);
      await saveCache(cache);
    }

    if (sinceFlush >= flushEvery || done === todo.length) {
      const updated = applyCacheToSeed(seed, cache);
      await writeSeed(seed);
      console.log(`  flushed ${updated} urls → seed.json`);
      sinceFlush = 0;
    }

    await sleep(delayMs);
  }

  await saveCache(cache);
  applyCacheToSeed(seed, cache);
  await writeSeed(seed);
  console.log(
    `Done. With images: ${seed.topics.filter((t) => t.image_url).length}/${seed.topics.length}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
