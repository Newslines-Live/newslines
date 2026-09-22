import { redirect } from "next/navigation";
import { TopicNewsline } from "@/components/TopicNewsline";
import { getTopicBySlug } from "@/lib/data/seed-store";
import { parseOrder, parsePageNum, topicNewslineHref } from "@/lib/topic-page";

type Props = {
  params: Promise<{ topicSlug: string }>;
  searchParams: Promise<{ order?: string; page?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { topicSlug } = await params;
  const topic = await getTopicBySlug(topicSlug);
  return { title: topic?.name ?? "Newsline" };
}

export default async function TopicPage({ params, searchParams }: Props) {
  const { topicSlug } = await params;
  const sp = await searchParams;
  const order = parseOrder(sp.order);
  const page = parsePageNum(sp.page);
  if (page == null) redirect(topicNewslineHref({ topicSlug, order }));
  if (page > 1) {
    redirect(topicNewslineHref({ topicSlug, page, order }));
  }

  return <TopicNewsline topicSlug={topicSlug} page={1} order={order} />;
}
