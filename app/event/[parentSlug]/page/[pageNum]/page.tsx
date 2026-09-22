import { notFound, permanentRedirect } from "next/navigation";
import { EventTypeNewsline } from "@/components/EventTypeNewsline";
import {
  eventTypeArchiveHref,
  eventTypeLabel,
  isEventTypeParent,
} from "@/lib/event-type-routes";
import { parseOrder, parsePageNum } from "@/lib/topic-page";

type Props = {
  params: Promise<{ parentSlug: string; pageNum: string }>;
  searchParams: Promise<{ order?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { parentSlug, pageNum } = await params;
  const page = parsePageNum(pageNum);
  const name = eventTypeLabel(parentSlug);
  return { title: page && page > 1 ? `${name} – Page ${page}` : name };
}

export default async function EventTypeParentPagedPage({
  params,
  searchParams,
}: Props) {
  const { parentSlug, pageNum } = await params;
  if (!isEventTypeParent(parentSlug)) notFound();
  const order = parseOrder((await searchParams).order);
  const page = parsePageNum(pageNum);
  if (page == null) notFound();
  if (page === 1) {
    permanentRedirect(eventTypeArchiveHref({ parentSlug, order }));
  }
  return (
    <EventTypeNewsline parentSlug={parentSlug} page={page} order={order} />
  );
}
