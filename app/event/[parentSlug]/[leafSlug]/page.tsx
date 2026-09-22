import { notFound, redirect } from "next/navigation";
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
  params: Promise<{ parentSlug: string; leafSlug: string }>;
  searchParams: Promise<{ order?: string; page?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { leafSlug } = await params;
  const type = await getEventTypeBySlug(leafSlug);
  return { title: type?.name ?? eventTypeLabel(leafSlug) };
}

export default async function EventTypeLeafPage({
  params,
  searchParams,
}: Props) {
  const { parentSlug, leafSlug } = await params;
  if (leafSlug === "page") notFound();
  if (!isEventTypeParent(parentSlug) || parentForLeafSlug(leafSlug) !== parentSlug) {
    notFound();
  }
  const sp = await searchParams;
  const order = parseOrder(sp.order);
  const page = parsePageNum(sp.page);
  if (page == null) {
    redirect(eventTypeArchiveHref({ parentSlug, leafSlug, order }));
  }
  if (page > 1) {
    redirect(eventTypeArchiveHref({ parentSlug, leafSlug, page, order }));
  }
  return (
    <EventTypeNewsline
      parentSlug={parentSlug}
      leafSlug={leafSlug}
      page={1}
      order={order}
    />
  );
}
