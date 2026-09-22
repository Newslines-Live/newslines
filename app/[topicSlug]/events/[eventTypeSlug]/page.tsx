import { redirect } from "next/navigation";
import { TopicNewsline } from "@/components/TopicNewsline";
import { getTopicBySlug } from "@/lib/data/seed-store";
import { parseOrder, parsePageNum, topicNewslineHref } from "@/lib/topic-page";

type Props = {
  params: Promise<{ topicSlug: string; eventTypeSlug: string }>;
  searchParams: Promise<{ order?: string; page?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { topicSlug, eventTypeSlug } = await params;
  const topic = await getTopicBySlug(topicSlug);
  const typeLabel = eventTypeSlug.replace(/-/g, " ");
  return {
    title: topic ? `${topic.name} – ${typeLabel}` : "Newsline",
  };
}

export default async function FilteredTopicPage({ params, searchParams }: Props) {
  const { topicSlug, eventTypeSlug } = await params;
  const sp = await searchParams;
  const order = parseOrder(sp.order);
  const page = parsePageNum(sp.page);
  if (page == null) {
    redirect(topicNewslineHref({ topicSlug, eventTypeSlug, order }));
  }
  if (page > 1) {
    redirect(topicNewslineHref({ topicSlug, eventTypeSlug, page, order }));
  }

  return (
    <TopicNewsline
      topicSlug={topicSlug}
      eventTypeSlug={eventTypeSlug}
      page={1}
      order={order}
    />
  );
}
