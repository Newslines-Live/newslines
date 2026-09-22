export type NewslineOrder = "asc" | "desc";

export function parseOrder(value: string | undefined): NewslineOrder {
  return value === "asc" ? "asc" : "desc";
}

/** WordPress-style page number. Invalid values return null. */
export function parsePageNum(raw: string | undefined): number | null {
  if (raw == null || raw === "") return 1;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

export function newslinePageHref(opts: {
  basePath: string;
  page?: number;
  order?: NewslineOrder;
}): string {
  const page = opts.page ?? 1;
  const path = page > 1 ? `${opts.basePath}/page/${page}` : opts.basePath;
  return opts.order === "asc" ? `${path}?order=asc` : path;
}

export function topicNewslineHref(opts: {
  topicSlug: string;
  eventTypeSlug?: string;
  page?: number;
  order?: NewslineOrder;
}): string {
  const basePath = opts.eventTypeSlug
    ? `/${opts.topicSlug}/events/${opts.eventTypeSlug}`
    : `/${opts.topicSlug}`;
  return newslinePageHref({
    basePath,
    page: opts.page,
    order: opts.order,
  });
}
