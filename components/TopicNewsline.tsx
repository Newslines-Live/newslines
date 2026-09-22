import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/EventCard";
import { TopicHero } from "@/components/TopicHero";
import { TopicPagination } from "@/components/TopicPagination";
import { getTopicBySlug, listTopicNewsline } from "@/lib/data/seed-store";
import { type NewslineOrder } from "@/lib/topic-page";

type Props = {
  topicSlug: string;
  page: number;
  order: NewslineOrder;
  eventTypeSlug?: string;
};

export async function TopicNewsline({
  topicSlug,
  page,
  order,
  eventTypeSlug,
}: Props) {
  const topic = await getTopicBySlug(topicSlug);
  if (!topic) notFound();

  const { events, total, totalPages, pageSize } = await listTopicNewsline(
    topicSlug,
    { order, eventTypeSlug, page }
  );

  if (page > 1 && (total === 0 || page > totalPages)) notFound();

  return (
    <div className="bg-[var(--nl-wash)]">
      <div className="mx-auto max-w-[850px] px-4 pb-12 pt-2.5 sm:px-8">
        <TopicHero
          topic={topic}
          order={order}
          eventTypeSlug={eventTypeSlug}
        />
        <div>
          {events.map((event) => (
            <EventCard key={event.id} event={event} topicSlug={topicSlug} />
          ))}
          {events.length === 0 &&
            (eventTypeSlug ? (
              <p className="py-10 text-center text-neutral-500">
                No events for this type.{" "}
                <Link
                  href={`/${topicSlug}`}
                  className="text-[var(--nl-orange)] hover:underline"
                >
                  View all
                </Link>
              </p>
            ) : (
              <p className="py-10 text-center text-neutral-500">No events yet.</p>
            ))}
        </div>
        <TopicPagination
          basePath={
            eventTypeSlug
              ? `/${topicSlug}/events/${eventTypeSlug}`
              : `/${topicSlug}`
          }
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          order={order}
        />
      </div>
    </div>
  );
}
