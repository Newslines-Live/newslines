import { loadSeedData, TOPIC_PAGE_SIZE } from "@/lib/data/seed-store";
import {
  EVENT_TYPE_PARENTS,
  leavesForParent,
} from "@/lib/event-type-routes";
import { absoluteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

/** App routes that win over /[topicSlug]. Do not emit those as topic URLs. */
const RESERVED_TOPIC_SLUGS = new Set([
  "about",
  "admin",
  "api",
  "contact",
  "event",
  "getting-started",
  "grid",
  "login",
  "media",
  "mock",
  "privacy-policy",
  "search",
  "wp-content",
]);

export type SitemapKind = "page" | "event";

export type SitemapEntry = MetadataRoute.Sitemap[number] & {
  kind: SitemapKind;
};

function entry(
  path: string,
  opts: {
    kind: SitemapKind;
    lastModified?: string | Date | null;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  }
): SitemapEntry {
  return {
    url: absoluteUrl(path),
    lastModified: opts.lastModified || undefined,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    kind: opts.kind,
  };
}

export async function listSitemapEntries(): Promise<SitemapEntry[]> {
  const seed = await loadSeedData();
  const topicById = new Map(seed.topics.map((t) => [t.id, t]));
  const topicIdsByEvent = new Map<string, string[]>();
  for (const row of seed.eventTopics) {
    const ids = topicIdsByEvent.get(row.event_id);
    if (ids) ids.push(row.topic_id);
    else topicIdsByEvent.set(row.event_id, [row.topic_id]);
  }

  const pages: SitemapEntry[] = [
    entry("/", {
      kind: "page",
      changeFrequency: "weekly",
      priority: 1,
    }),
    entry("/grid/", {
      kind: "page",
      changeFrequency: "weekly",
      priority: 0.9,
    }),
    entry("/about/", {
      kind: "page",
      changeFrequency: "yearly",
      priority: 0.6,
    }),
    entry("/contact/", {
      kind: "page",
      changeFrequency: "yearly",
      priority: 0.4,
    }),
    entry("/privacy-policy/", {
      kind: "page",
      changeFrequency: "yearly",
      priority: 0.3,
    }),
    entry("/getting-started/", {
      kind: "page",
      changeFrequency: "yearly",
      priority: 0.4,
    }),
    entry("/event/", {
      kind: "page",
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  ];

  for (const parent of EVENT_TYPE_PARENTS) {
    pages.push(
      entry(`/event/${parent}/`, {
        kind: "page",
        changeFrequency: "weekly",
        priority: 0.6,
      })
    );
    for (const leaf of leavesForParent(parent)) {
      pages.push(
        entry(`/event/${parent}/${leaf}/`, {
          kind: "page",
          changeFrequency: "weekly",
          priority: 0.5,
        })
      );
    }
  }

  for (const topic of seed.topics) {
    if (topic.post_count <= 0 || RESERVED_TOPIC_SLUGS.has(topic.slug)) continue;
    pages.push(
      entry(`/${topic.slug}/`, {
        kind: "page",
        lastModified: topic.last_event_at,
        changeFrequency: "weekly",
        priority: topic.is_featured ? 0.8 : 0.6,
      })
    );
    const totalPages = Math.ceil(topic.post_count / TOPIC_PAGE_SIZE);
    for (let page = 2; page <= totalPages; page++) {
      pages.push(
        entry(`/${topic.slug}/page/${page}/`, {
          kind: "page",
          lastModified: topic.last_event_at,
          changeFrequency: "weekly",
          priority: 0.4,
        })
      );
    }
  }

  const events: SitemapEntry[] = [];
  for (const event of seed.events) {
    const slugs = (topicIdsByEvent.get(event.id) ?? [])
      .map((id) => topicById.get(id)?.slug)
      .filter((slug): slug is string => !!slug && !RESERVED_TOPIC_SLUGS.has(slug));
    const topicSlug =
      (event.canonical_topic_slug && slugs.includes(event.canonical_topic_slug)
        ? event.canonical_topic_slug
        : slugs[0]) ?? null;
    if (!topicSlug) continue;
    events.push(
      entry(`/${topicSlug}/${event.slug}/`, {
        kind: "event",
        lastModified: event.occurred_at,
        changeFrequency: "yearly",
        priority: 0.5,
      })
    );
  }

  return [...pages, ...events];
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function lastmodXml(value: SitemapEntry["lastModified"]): string {
  if (!value) return "";
  const iso = typeof value === "string" ? value : value.toISOString();
  return `<lastmod>${iso.slice(0, 10)}</lastmod>`;
}

export function renderUrlset(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (entry) =>
        `  <url><loc>${xmlEscape(entry.url)}</loc>${lastmodXml(entry.lastModified)}</url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderSitemapIndex(locs: string[]): string {
  const items = locs
    .map((loc) => `  <sitemap><loc>${xmlEscape(loc)}</loc></sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}
