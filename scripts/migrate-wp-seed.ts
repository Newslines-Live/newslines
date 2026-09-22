/**
 * Fetch Musk + McGregor cluster posts via Playwright (bypasses Cloudflare)
 * and write data/seed.json.
 *
 *   npm run seed:wp
 *   npx tsx scripts/migrate-wp-seed.ts --per-topic=50
 */
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { chromium, type Page } from "playwright";
import {
  CLUSTER_HUBS,
  MCGREGOR_CLUSTER,
  MUSK_CLUSTER,
  clusterForSlug,
  isHubSlug,
} from "../lib/clusters";
import type { EventType, NewsEvent, SeedData, Topic } from "../lib/types";

const WP = "https://newslines.org/wp-json/wp/v2";
const DEFAULT_PER_TOPIC = 50;

type WpCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  yoast_head_json?: { og_image?: { url: string }[] };
};

type WpPost = {
  id: number;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  date: string;
  categories: number[];
};

function argValue(flag: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`${flag}=`));
  return hit ? hit.split("=")[1]! : fallback;
}

function stableId(prefix: string, key: string | number): string {
  const hash = createHash("sha256").update(`${prefix}:${key}`).digest("hex").slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function decodeEntities(html: string): string {
  return html
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rsquo;/g, "’")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/<[^>]+>/g, "")
    .trim();
}

async function pageJson<T>(page: Page, url: string): Promise<T> {
  return page.evaluate(async (u) => {
    const r = await fetch(u);
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${u}`);
    return r.json();
  }, url);
}

async function pageText(page: Page, url: string): Promise<string> {
  return page.evaluate(async (u) => {
    const r = await fetch(u);
    if (!r.ok) return "";
    return r.text();
  }, url);
}

async function resolveTopicImage(page: Page, cat: WpCategory): Promise<string | null> {
  const og = cat.yoast_head_json?.og_image?.[0]?.url;
  if (og) return og;
  const html = await pageText(page, `https://newslines.org/${cat.slug}/`);
  const ogMatch =
    html.match(/property="og:image"\s+content="([^"]+)"/i) ||
    html.match(/content="([^"]+)"\s+property="og:image"/i);
  return ogMatch?.[1] ?? null;
}

function parseEventTypesFromListing(html: string): Map<string, string> {
  const map = new Map<string, string>();
  const parts = html.split(/<article/i);
  for (const part of parts) {
    const titleLink = part.match(
      /href="https?:\/\/newslines\.org\/[^/]+\/([a-z0-9-]+)\/"/i
    );
    const typeLink = part.match(/\/events\/([a-z0-9-]+)\//i);
    if (titleLink?.[1] && typeLink?.[1] && titleLink[1] !== "events") {
      map.set(titleLink[1], typeLink[1]);
    }
  }
  return map;
}

async function main() {
  const perTopic = Number(argValue("--per-topic", String(DEFAULT_PER_TOPIC)));
  const clusterSlugs = [...MUSK_CLUSTER, ...MCGREGOR_CLUSTER];

  console.log(`Launching browser…`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  // Warm Cloudflare
  await page.goto("https://newslines.org/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);

  console.log(`Seeding clusters with up to ${perTopic} posts per topic…`);

  const topicsByWpId = new Map<number, Topic>();
  const postsById = new Map<number, WpPost>();
  const preferredTopicForPost = new Map<number, string>();
  const typeByPostSlug = new Map<string, string>();

  for (const slug of clusterSlugs) {
    const cats = await pageJson<WpCategory[]>(
      page,
      `${WP}/categories?slug=${encodeURIComponent(slug)}`
    );
    const cat = cats[0];
    if (!cat) {
      console.warn(`  skip missing category: ${slug}`);
      continue;
    }
    console.log(`  fetching ${slug} (${cat.id})…`);
    const image_url = await resolveTopicImage(page, cat);
    topicsByWpId.set(cat.id, {
      id: stableId("topic", cat.id),
      slug: cat.slug,
      name: decodeEntities(cat.name),
      bio: cat.description ? decodeEntities(cat.description) : null,
      image_url,
      is_featured: isHubSlug(cat.slug),
      cluster: clusterForSlug(cat.slug),
      wp_category_id: cat.id,
      post_count: 0,
      last_event_at: null,
    });

    const posts = await pageJson<WpPost[]>(
      page,
      `${WP}/posts?categories=${cat.id}&per_page=${Math.min(perTopic, 100)}&orderby=date&order=desc&_fields=id,slug,link,title,content,date,categories`
    );
    for (const p of posts.slice(0, perTopic)) {
      if (!postsById.has(p.id)) {
        postsById.set(p.id, p);
        preferredTopicForPost.set(p.id, slug);
      }
    }

    const listingHtml = await pageText(page, `https://newslines.org/${slug}/`);
    for (const [postSlug, typeSlug] of parseEventTypesFromListing(listingHtml)) {
      typeByPostSlug.set(postSlug, typeSlug);
    }
    console.log(`    posts=${posts.length}, unique=${postsById.size}`);
  }

  const allCatIds = new Set<number>();
  for (const p of postsById.values()) {
    for (const id of p.categories) allCatIds.add(id);
  }
  for (const id of allCatIds) {
    if (topicsByWpId.has(id)) continue;
    try {
      const cat = await pageJson<WpCategory>(page, `${WP}/categories/${id}`);
      const image_url = await resolveTopicImage(page, cat);
      topicsByWpId.set(id, {
        id: stableId("topic", cat.id),
        slug: cat.slug,
        name: decodeEntities(cat.name),
        bio: cat.description ? decodeEntities(cat.description) : null,
        image_url,
        is_featured: false,
        cluster: clusterForSlug(cat.slug),
        wp_category_id: cat.id,
        post_count: 0,
        last_event_at: null,
      });
    } catch {
      console.warn(`  failed category ${id}`);
    }
  }

  const eventTypes = new Map<string, EventType>();
  const events: NewsEvent[] = [];
  const eventTopics: { event_id: string; topic_id: string }[] = [];

  for (const post of postsById.values()) {
    const typeSlug = typeByPostSlug.get(post.slug) ?? null;
    let event_type_id: string | null = null;
    if (typeSlug) {
      if (!eventTypes.has(typeSlug)) {
        eventTypes.set(typeSlug, {
          id: stableId("etype", typeSlug),
          slug: typeSlug,
          name: typeSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          parent_slug: null,
        });
      }
      event_type_id = eventTypes.get(typeSlug)!.id;
    }

    const preferred = preferredTopicForPost.get(post.id) ?? "elon-musk";
    const canonical =
      post.link.match(/newslines\.org\/([^/]+)\//)?.[1] ?? preferred;
    const eventId = stableId("event", post.id);
    events.push({
      id: eventId,
      slug: post.slug,
      title: decodeEntities(post.title.rendered),
      summary_html: post.content.rendered,
      occurred_at: new Date(post.date).toISOString(),
      date_precision: "exact",
      event_type_id,
      canonical_topic_slug: canonical,
      media_url: null,
      source_url: null,
      wp_post_id: post.id,
    });

    for (const catId of post.categories) {
      const topic = topicsByWpId.get(catId);
      if (!topic) continue;
      eventTopics.push({ event_id: eventId, topic_id: topic.id });
    }
  }

  const topics = [...topicsByWpId.values()];
  for (const topic of topics) {
    const linked = eventTopics.filter((et) => et.topic_id === topic.id);
    topic.post_count = linked.length;
    const dates = linked
      .map((et) => events.find((e) => e.id === et.event_id)?.occurred_at)
      .filter(Boolean) as string[];
    topic.last_event_at = dates.sort().at(-1) ?? null;
  }

  const seed: SeedData = {
    topics: topics.sort((a, b) => b.post_count - a.post_count),
    eventTypes: [...eventTypes.values()],
    events,
    eventTopics,
  };

  await browser.close();

  const outDir = path.join(process.cwd(), "data");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "seed.json");
  await writeFile(outPath, JSON.stringify(seed, null, 2), "utf8");
  console.log(
    `Wrote ${outPath}: ${seed.topics.length} topics, ${seed.events.length} events, ${seed.eventTypes.length} types`
  );
  console.log(`  hubs: ${CLUSTER_HUBS.musk}, ${CLUSTER_HUBS.mcgregor}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
