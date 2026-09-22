import { notFound, redirect } from "next/navigation";
import { EventTypeNewsline } from "@/components/EventTypeNewsline";
import {
  eventTypeArchiveHref,
  eventTypeLabel,
  isEventTypeParent,
} from "@/lib/event-type-routes";
import { parseOrder, parsePageNum } from "@/lib/topic-page";

type Props = {
  params: Promise<{ parentSlug: string }>;
  searchParams: Promise<{ order?: string; page?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { parentSlug } = await params;
  return { title: eventTypeLabel(parentSlug) };
}

export default async function EventTypeParentPage({
  params,
  searchParams,
}: Props) {
  const { parentSlug } = await params;
  if (!isEventTypeParent(parentSlug)) notFound();
  const sp = await searchParams;
  const order = parseOrder(sp.order);
  const page = parsePageNum(sp.page);
  if (page == null) redirect(eventTypeArchiveHref({ parentSlug, order }));
  if (page > 1) {
    redirect(eventTypeArchiveHref({ parentSlug, page, order }));
  }
  return (
    <EventTypeNewsline parentSlug={parentSlug} page={1} order={order} />
  );
}
