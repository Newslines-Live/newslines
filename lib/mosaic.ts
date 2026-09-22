import { existsSync } from "fs";
import path from "path";
import type { Topic } from "@/lib/types";
import type { MosaicTile } from "@/components/home-mocks/InteractiveMosaic";

const SPANS: MosaicTile["span"][] = [
  "lg",
  "tall",
  "md",
  "wide",
  "md",
  "tall",
  "sm",
  "md",
  "sm",
  "wide",
  "md",
  "sm",
  "lg",
  "tall",
  "wide",
  "md",
];

const TINTS = [
  "#fa4d2a",
  "#188fa7",
  "#e8b84a",
  "#5dceba",
  "#c084fc",
  "#f59e0b",
  "#38bdf8",
  "#fb7185",
  "#34d399",
  "#60a5fa",
  "#f472b6",
  "#22b715",
];

function localMosaicPath(slug: string): string | null {
  const dir = path.join(process.cwd(), "public", "mock-mosaic");
  for (const ext of ["jpg", "png", "jpeg", "webp"] as const) {
    const file = `${slug}.${ext}`;
    if (existsSync(path.join(dir, file))) return `/mock-mosaic/${file}`;
  }
  return null;
}

/** Prefer local mock cache, else proxy remote Wikimedia URLs. */
export function topicImageSrc(topic: Topic): string | null {
  if (!topic.image_url) return null;
  if (topic.image_url.startsWith("/")) return topic.image_url;

  const local = localMosaicPath(topic.slug);
  if (local) return local;

  return `/api/topic-image?url=${encodeURIComponent(topic.image_url)}`;
}

export function topicsToMosaicTiles(topics: Topic[]): MosaicTile[] {
  return topics
    .map((t, i) => {
      const src = topicImageSrc(t);
      if (!src) return null;
      return {
        name: t.name,
        slug: t.slug,
        src,
        remote: t.image_url ?? undefined,
        span: SPANS[i % SPANS.length],
        tint: TINTS[i % TINTS.length],
      } satisfies MosaicTile;
    })
    .filter(Boolean) as MosaicTile[];
}
