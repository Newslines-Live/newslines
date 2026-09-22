import { readFile, stat } from "fs/promises";
import path from "path";
import {
  canonicalEventTypeSlug,
  isEventTypeParent,
  leavesForParent,
} from "@/lib/event-type-routes";
import type { EventType, NewsEvent, SeedData, Topic } from "@/lib/types";
import { decodeHtmlEntities } from "@/lib/utils";

type SeedIndex = {
  data: SeedData;
  mtimeMs: number;
  topicBySlug: Map<string, Topic>;
  topicById: Map<string, Topic>;
  eventById: Map<string, NewsEvent>;
  eventBySlug: Map<string, NewsEvent>;
  eventByWpPostId: Map<number, NewsEvent>;
  eventTypeById: Map<string, EventType>;
  eventTypeBySlug: Map<string, EventType>;
  eventIdsByTopicId: Map<string, string[]>;
  topicIdsByEventId: Map<string, string[]>;
  eventIdsByTypeId: Map<string, string[]>;
};

let cache: SeedIndex | null = null;
let loadPromise: Promise<SeedIndex> | null = null;

function seedPath() {
  return path.join(process.cwd(), "data", "seed.json");
}

function buildIndex(data: SeedData, mtimeMs: number): SeedIndex {
  const topicBySlug = new Map<string, Topic>();
  const topicById = new Map<string, Topic>();
  for (const t of data.topics) {
    topicBySlug.set(t.slug, t);
    topicById.set(t.id, t);
  }

  const eventById = new Map<string, NewsEvent>();
  const eventBySlug = new Map<string, NewsEvent>();
  const eventByWpPostId = new Map<number, NewsEvent>();
  const eventIdsByTypeId = new Map<string, string[]>();
  for (const e of data.events) {
    eventById.set(e.id, e);
    eventBySlug.set(e.slug, e);
    if (e.wp_post_id != null) eventByWpPostId.set(e.wp_post_id, e);
    if (e.event_type_id) {
      let ids = eventIdsByTypeId.get(e.event_type_id);
      if (!ids) {
        ids = [];
        eventIdsByTypeId.set(e.event_type_id, ids);
      }
      ids.push(e.id);
    }
  }

  const eventTypeById = new Map<string, EventType>();
  const eventTypeBySlug = new Map<string, EventType>();
  for (const et of data.eventTypes) {
    eventTypeById.set(et.id, et);
    eventTypeBySlug.set(et.slug, et);
  }

  const eventIdsByTopicId = new Map<string, string[]>();
  const topicIdsByEventId = new Map<string, string[]>();
  for (const { event_id, topic_id } of data.eventTopics) {
    let eids = eventIdsByTopicId.get(topic_id);
    if (!eids) {
      eids = [];
      eventIdsByTopicId.set(topic_id, eids);
    }
    eids.push(event_id);

    let tids = topicIdsByEventId.get(event_id);
    if (!tids) {
      tids = [];
      topicIdsByEventId.set(event_id, tids);
    }
    tids.push(topic_id);
  }

  return {
    data,
    mtimeMs,
    topicBySlug,
    topicById,
    eventById,
    eventBySlug,
    eventByWpPostId,
    eventTypeById,
    eventTypeBySlug,
    eventIdsByTopicId,
    topicIdsByEventId,
    eventIdsByTypeId,
  };
}

function normalizeSeed(data: SeedData): SeedData {
  // Mutate in place — avoid cloning 35k event objects
  for (const e of data.events) {
    e.title = decodeHtmlEntities(e.title);
    e.date_precision = e.date_precision ?? "exact";
    e.source_url = e.source_url ?? null;
  }
  for (const t of data.topics) {
    t.name = decodeHtmlEntities(t.name);
    if (t.bio) t.bio = decodeHtmlEntities(t.bio);
  }
  return data;
}

export async function loadSeedData(): Promise<SeedData> {
  const idx = await loadIndex();
  return idx.data;
}

async function readSeedFile(): Promise<SeedIndex> {
  const filePath = seedPath();
  const st = await stat(filePath);
  const raw = await readFile(filePath, "utf8");
  const data = normalizeSeed(JSON.parse(raw) as SeedData);
  console.info(
    `[seed] loaded ${data.topics.length} topics, ${data.events.length} events (${(st.size / 1e6).toFixed(1)} MB)`
  );
  return buildIndex(data, st.mtimeMs);
}

async function loadIndex(): Promise<SeedIndex> {
  const filePath = seedPath();
  try {
    const st = await stat(filePath);
    if (cache && cache.mtimeMs === st.mtimeMs) return cache;
  } catch {
    // fall through to load / empty
  }

  if (!loadPromise) {
    loadPromise = readSeedFile()
      .then((idx) => {
        cache = idx;
        return idx;
      })
      .catch((err) => {
        console.error("[seed] failed to load data/seed.json:", err);
        // Do NOT cache failure — retry on next request
        throw err;
      })
      .finally(() => {
        loadPromise = null;
      });
  }

  try {
    return await loadPromise;
  } catch {
    // Temporary empty so pages don't crash hard mid-write; never sticky-cache it
    return buildIndex(
      { topics: [], eventTypes: [], events: [], eventTopics: [] },
      0
    );
  }
}

export function clearSeedCache() {
  cache = null;
}

function hydrateEvent(idx: SeedIndex, event: NewsEvent): NewsEvent {
  const topicIds = idx.topicIdsByEventId.get(event.id) ?? [];
  const topics = topicIds
    .map((id) => idx.topicById.get(id))
    .filter(Boolean) as Topic[];
  const event_type = event.event_type_id
    ? (idx.eventTypeById.get(event.event_type_id) ?? null)
    : null;
  return { ...event, topics, event_type };
}

export async function listTopics(opts?: {
  withImageOnly?: boolean;
  cluster?: string;
  featuredOnly?: boolean;
}): Promise<Topic[]> {
  const idx = await loadIndex();
  let topics = [...idx.data.topics];
  if (opts?.withImageOnly) topics = topics.filter((t) => t.image_url);
  if (opts?.cluster) topics = topics.filter((t) => t.cluster === opts.cluster);
  if (opts?.featuredOnly) topics = topics.filter((t) => t.is_featured);
  return topics;
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const idx = await loadIndex();
  return idx.topicBySlug.get(slug) ?? null;
}

export const TOPIC_PAGE_SIZE = 100;

async function collectEventsForTopic(
  topicSlug: string,
  opts?: { order?: "asc" | "desc"; eventTypeSlug?: string }
): Promise<NewsEvent[]> {
  const idx = await loadIndex();
  const topic = idx.topicBySlug.get(topicSlug);
  if (!topic) return [];

  const eventIds = idx.eventIdsByTopicId.get(topic.id) ?? [];
  let events = eventIds
    .map((id) => idx.eventById.get(id))
    .filter(Boolean)
    .map((e) => hydrateEvent(idx, e!));

  if (opts?.eventTypeSlug) {
    events = events.filter((e) => e.event_type?.slug === opts.eventTypeSlug);
  }

  events.sort((a, b) => {
    const av = new Date(a.occurred_at).getTime();
    const bv = new Date(b.occurred_at).getTime();
    return opts?.order === "asc" ? av - bv : bv - av;
  });

  return events;
}

export async function listEventsForTopic(
  topicSlug: string,
  opts?: {
    order?: "asc" | "desc";
    eventTypeSlug?: string;
    limit?: number;
    offset?: number;
  }
): Promise<NewsEvent[]> {
  const events = await collectEventsForTopic(topicSlug, opts);
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 50;
  return events.slice(offset, offset + limit);
}

export async function listTopicNewsline(
  topicSlug: string,
  opts: {
    order?: "asc" | "desc";
    eventTypeSlug?: string;
    page: number;
    pageSize?: number;
  }
): Promise<{
  events: NewsEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const events = await collectEventsForTopic(topicSlug, opts);
  const pageSize = opts.pageSize ?? TOPIC_PAGE_SIZE;
  const total = events.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const page = Math.max(1, opts.page);
  const offset = (page - 1) * pageSize;
  return {
    events: events.slice(offset, offset + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getEventTypeBySlug(slug: string): Promise<EventType | null> {
  const idx = await loadIndex();
  return (
    idx.eventTypeBySlug.get(slug) ??
    idx.eventTypeBySlug.get(canonicalEventTypeSlug(slug)) ??
    null
  );
}

export async function getEventByWpPostId(
  wpPostId: number
): Promise<NewsEvent | null> {
  const idx = await loadIndex();
  const event = idx.eventByWpPostId.get(wpPostId);
  return event ? hydrateEvent(idx, event) : null;
}

function typeIdsForArchive(
  idx: SeedIndex,
  opts: { parentSlug: string; leafSlug?: string }
): string[] {
  if (opts.leafSlug) {
    const canon = canonicalEventTypeSlug(opts.leafSlug);
    const type =
      idx.eventTypeBySlug.get(opts.leafSlug) ?? idx.eventTypeBySlug.get(canon);
    return type ? [type.id] : [];
  }

  const leafSlugs = new Set(leavesForParent(opts.parentSlug).map(canonicalEventTypeSlug));
  leafSlugs.add(opts.parentSlug);
  const ids: string[] = [];
  for (const et of idx.data.eventTypes) {
    if (
      et.parent_slug === opts.parentSlug ||
      leafSlugs.has(et.slug) ||
      et.slug === opts.parentSlug
    ) {
      ids.push(et.id);
    }
  }
  return ids;
}

export async function listEventTypeNewsline(opts: {
  parentSlug: string;
  leafSlug?: string;
  order?: "asc" | "desc";
  page: number;
  pageSize?: number;
}): Promise<{
  events: NewsEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} | null> {
  if (!isEventTypeParent(opts.parentSlug)) return null;
  if (opts.leafSlug) {
    const parent = leavesForParent(opts.parentSlug);
    const leaf = opts.leafSlug;
    const canon = canonicalEventTypeSlug(leaf);
    if (!parent.includes(leaf) && !parent.includes(canon)) return null;
  }

  const idx = await loadIndex();
  const typeIds = typeIdsForArchive(idx, opts);
  const seen = new Set<string>();
  const events: NewsEvent[] = [];
  for (const typeId of typeIds) {
    for (const id of idx.eventIdsByTypeId.get(typeId) ?? []) {
      if (seen.has(id)) continue;
      seen.add(id);
      const event = idx.eventById.get(id);
      if (event) events.push(hydrateEvent(idx, event));
    }
  }

  events.sort((a, b) => {
    const av = new Date(a.occurred_at).getTime();
    const bv = new Date(b.occurred_at).getTime();
    return opts.order === "asc" ? av - bv : bv - av;
  });

  const pageSize = opts.pageSize ?? TOPIC_PAGE_SIZE;
  const total = events.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const page = Math.max(1, opts.page);
  const offset = (page - 1) * pageSize;
  return {
    events: events.slice(offset, offset + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getEventBySlug(
  topicSlug: string,
  eventSlug: string
): Promise<NewsEvent | null> {
  const idx = await loadIndex();
  const event = idx.eventBySlug.get(eventSlug);
  if (!event) return null;
  const hydrated = hydrateEvent(idx, event);
  if (!hydrated.topics?.some((t) => t.slug === topicSlug)) {
    return null;
  }
  return hydrated;
}

export async function listEventTypesForTopic(
  topicSlug: string
): Promise<EventType[]> {
  const events = await listEventsForTopic(topicSlug, { limit: 10000 });
  const map = new Map<string, EventType>();
  for (const e of events) {
    if (e.event_type) map.set(e.event_type.id, e.event_type);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function searchAll(
  q: string
): Promise<{ topics: Topic[]; events: NewsEvent[] }> {
  const idx = await loadIndex();
  const query = q.trim().toLowerCase();
  if (!query) return { topics: [], events: [] };

  const topics = idx.data.topics
    .filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.slug.includes(query) ||
        (t.bio ?? "").toLowerCase().includes(query)
    )
    .slice(0, 40);

  const events: NewsEvent[] = [];
  for (const e of idx.data.events) {
    if (e.title.toLowerCase().includes(query) || e.slug.includes(query)) {
      events.push(hydrateEvent(idx, e));
      if (events.length >= 40) break;
    }
  }
  return { topics, events };
}

export type GridSort =
  | "trending_day"
  | "trending_week"
  | "trending_month"
  | "updated_day"
  | "updated_week"
  | "updated_month"
  | "most_posts"
  | "random"
  | "featured";

export async function listGridTopics(opts: {
  sort: GridSort;
  page: number;
  pageSize: number;
}): Promise<{ topics: Topic[]; total: number }> {
  const idx = await loadIndex();
  let topics = idx.data.topics.filter((t) => t.post_count > 0);

  const now = Date.now();
  const dayMs = 86400000;
  const inWindow = (iso: string | null, days: number) => {
    if (!iso) return false;
    return now - new Date(iso).getTime() <= days * dayMs;
  };

  switch (opts.sort) {
    case "trending_day":
      topics = topics.filter((t) => inWindow(t.last_event_at, 1));
      topics.sort((a, b) => b.post_count - a.post_count);
      break;
    case "trending_week":
      topics = topics.filter((t) => inWindow(t.last_event_at, 7));
      topics.sort((a, b) => b.post_count - a.post_count);
      break;
    case "trending_month":
      topics = topics.filter((t) => inWindow(t.last_event_at, 30));
      topics.sort((a, b) => b.post_count - a.post_count);
      break;
    case "updated_day":
      topics = topics.filter((t) => inWindow(t.last_event_at, 1));
      topics.sort(
        (a, b) =>
          new Date(b.last_event_at ?? 0).getTime() -
          new Date(a.last_event_at ?? 0).getTime()
      );
      break;
    case "updated_week":
      topics = topics.filter((t) => inWindow(t.last_event_at, 7));
      topics.sort(
        (a, b) =>
          new Date(b.last_event_at ?? 0).getTime() -
          new Date(a.last_event_at ?? 0).getTime()
      );
      break;
    case "updated_month":
      topics = topics.filter((t) => inWindow(t.last_event_at, 30));
      topics.sort(
        (a, b) =>
          new Date(b.last_event_at ?? 0).getTime() -
          new Date(a.last_event_at ?? 0).getTime()
      );
      break;
    case "most_posts":
      topics.sort((a, b) => b.post_count - a.post_count);
      break;
    case "featured":
      topics = topics.filter((t) => t.is_featured || t.cluster);
      if (topics.length === 0) {
        topics = idx.data.topics.filter((t) => t.post_count > 0);
      }
      topics.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return b.post_count - a.post_count;
      });
      break;
    case "random":
      topics = topics.sort(() => Math.random() - 0.5);
      break;
    default:
      topics.sort((a, b) => b.post_count - a.post_count);
  }

  if (
    topics.length === 0 &&
    (opts.sort.startsWith("trending") || opts.sort.startsWith("updated"))
  ) {
    topics = idx.data.topics
      .filter((t) => t.post_count > 0)
      .sort((a, b) => b.post_count - a.post_count);
  }

  const total = topics.length;
  const start = (opts.page - 1) * opts.pageSize;
  return { topics: topics.slice(start, start + opts.pageSize), total };
}
