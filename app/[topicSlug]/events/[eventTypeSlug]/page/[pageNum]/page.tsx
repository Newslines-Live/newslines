import { notFound, permanentRedirect } from "next/navigation";
import { TopicNewsline } from "@/components/TopicNewsline";
import { getTopicBySlug } from "@/lib/data/seed-store";
import { parseOrder, parsePageNum, topicNewslineHref } from "@/lib/topic-page";

type Props = {
  params: Promise<{
    topicSlug: string;
    eventTypeSlug: string;
    pageNum: string;
  }>;
  searchParams: Promise<{ order?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { topicSlug, eventTypeSlug, pageNum } = await params;
  const topic = await getTopicBySlug(topicSlug);
  const page = parsePageNum(pageNum);
  const typeLabel = eventTypeSlug.replace(/-/g, " ");
  const name = topic ? `${topic.name} – ${typeLabel}` : "Newsline";
  return { title: page && page > 1 ? `${name} – Page ${page}` : name };
}

export default async function FilteredTopicPagedPage({
  params,
  searchParams,
}: Props) {
  const { topicSlug, eventTypeSlug, pageNum } = await params;
  const order = parseOrder((await searchParams).order);
  const page = parsePageNum(pageNum);
  if (page == null) notFound();
  if (page === 1) {
    permanentRedirect(topicNewslineHref({ topicSlug, eventTypeSlug, order }));
  }

  return (
    <TopicNewsline
      topicSlug={topicSlug}
      eventTypeSlug={eventTypeSlug}
      page={page}
      order={order}
    />
  );
}
