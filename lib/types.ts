export type TopicCluster = "musk" | "mcgregor";

export type DatePrecision = "exact" | "month" | "year";

export type Topic = {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  is_featured: boolean;
  cluster: TopicCluster | null;
  wp_category_id: number | null;
  post_count: number;
  last_event_at: string | null;
};

export type EventType = {
  id: string;
  slug: string;
  name: string;
  parent_slug: string | null;
};

export type EventQuote = {
  text: string;
  speaker: string | null;
};

export type NewsEvent = {
  id: string;
  slug: string;
  title: string;
  summary_html: string;
  occurred_at: string;
  date_precision: DatePrecision;
  event_type_id: string | null;
  canonical_topic_slug: string | null;
  media_url: string | null;
  source_url: string | null;
  wp_post_id: number | null;
  quotes?: EventQuote[];
  event_type?: EventType | null;
  topics?: Topic[];
};

export type SeedData = {
  topics: Topic[];
  eventTypes: EventType[];
  events: NewsEvent[];
  eventTopics: { event_id: string; topic_id: string }[];
};
