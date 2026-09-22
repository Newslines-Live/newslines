import { notFound, permanentRedirect } from "next/navigation";
import { EventTypeNewsline } from "@/components/EventTypeNewsline";
import { getEventTypeBySlug } from "@/lib/data/seed-store";
import {
  eventTypeArchiveHref,
  eventTypeLabel,
  isEventTypeParent,
  parentForLeafSlug,
} from "@/lib/event-type-routes";
import { parseOrder, parsePageNum } from "@/lib/topic-page";

type Props = {
  params: Promise<{ parentSlug: string; leafSlug: string; pageNum: string }>;
  searchParams: Promise<{ order?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { leafSlug, pageNum } = await params;
  const page = parsePageNum(pageNum);
  const type = await getEventTypeBySlug(leafSlug);
  const name = type?.name ?? eventTypeLabel(leafSlug);
  return { title: page && page > 1 ? `${name} – Page ${page}` : name };
}

export default async function EventTypeLeafPagedPage({
  params,
  searchParams,
}: Props) {
  const { parentSlug, leafSlug, pageNum } = await params;
  if (leafSlug === "page") notFound();
  if (!isEventTypeParent(parentSlug) || parentForLeafSlug(leafSlug) !== parentSlug) {
    notFound();
  }
  const order = parseOrder((await searchParams).order);
  const page = parsePageNum(pageNum);
  if (page == null) notFound();
  if (page === 1) {
    permanentRedirect(eventTypeArchiveHref({ parentSlug, leafSlug, order }));
  }
  return (
    <EventTypeNewsline
      parentSlug={parentSlug}
      leafSlug={leafSlug}
      page={page}
      order={order}
    />
  );
}
