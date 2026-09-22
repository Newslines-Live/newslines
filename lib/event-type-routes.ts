import hierarchy from "@/lib/wp/event-type-hierarchy.json";
import { parentForEventType } from "@/lib/generate/event-type-leaves";
import { newslinePageHref, type NewslineOrder } from "@/lib/topic-page";

const parentToLeaves = hierarchy as Record<string, string[]>;

/** WP URL slugs that the importer collapsed onto a single seed type. */
const TYPE_ALIASES: Record<string, string> = {
  statement: "makes-statement",
  "make-statement": "makes-statement",
};

export const EVENT_TYPE_PARENTS = Object.keys(parentToLeaves);

export function canonicalEventTypeSlug(slug: string): string {
  return TYPE_ALIASES[slug] ?? slug;
}

export function isEventTypeParent(slug: string): boolean {
  return slug in parentToLeaves;
}

export function leavesForParent(parentSlug: string): string[] {
  return parentToLeaves[parentSlug] ?? [];
}

export function parentForLeafSlug(leafSlug: string): string | null {
  return parentForEventType(leafSlug) ?? parentForEventType(canonicalEventTypeSlug(leafSlug));
}

export function eventTypeLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function eventTypeArchivePath(opts: {
  parentSlug: string;
  leafSlug?: string;
}): string {
  return opts.leafSlug
    ? `/event/${opts.parentSlug}/${opts.leafSlug}`
    : `/event/${opts.parentSlug}`;
}

export function eventTypeArchiveHref(opts: {
  parentSlug: string;
  leafSlug?: string;
  page?: number;
  order?: NewslineOrder;
}): string {
  return newslinePageHref({
    basePath: eventTypeArchivePath(opts),
    page: opts.page,
    order: opts.order,
  });
}
