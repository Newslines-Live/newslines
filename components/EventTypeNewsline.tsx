import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownUp } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { TopicPagination } from "@/components/TopicPagination";
import { getEventTypeBySlug, listEventTypeNewsline } from "@/lib/data/seed-store";
import {
  eventTypeArchiveHref,
  eventTypeArchivePath,
  eventTypeLabel,
} from "@/lib/event-type-routes";
import { type NewslineOrder } from "@/lib/topic-page";

type Props = {
  parentSlug: string;
  leafSlug?: string;
  page: number;
  order: NewslineOrder;
};

export async function EventTypeNewsline({
  parentSlug,
  leafSlug,
  page,
  order,
}: Props) {
  const result = await listEventTypeNewsline({
    parentSlug,
    leafSlug,
    page,
    order,
  });
  if (!result) notFound();

  const { events, total, totalPages, pageSize } = result;
  if (page > 1 && (total === 0 || page > totalPages)) notFound();

  const type = leafSlug ? await getEventTypeBySlug(leafSlug) : null;
  const title = type?.name ?? eventTypeLabel(leafSlug ?? parentSlug);
  const parentLabel = eventTypeLabel(parentSlug);
  const basePath = eventTypeArchivePath({ parentSlug, leafSlug });
  const hrefForOrder = (next: NewslineOrder) =>
    eventTypeArchiveHref({ parentSlug, leafSlug, order: next });

  return (
    <div className="bg-[var(--nl-wash)]">
      <div className="mx-auto max-w-[850px] px-4 pb-12 pt-2.5 sm:px-8">
        <section className="px-0 pb-2 pt-2">
          <p className="text-base leading-[1.65] text-black">
            <strong className="font-bold text-[var(--nl-orange)]">
              What&apos;s this?
            </strong>{" "}
            This is an unbiased just-the-facts news timeline (&apos;newsline&apos;)
            about{" "}
            <strong className="font-bold text-[var(--nl-orange)]">{title}</strong>,
            created by Newslines contributors.{" "}
            <Link
              href="/getting-started"
              className="text-[var(--nl-orange)] hover:underline"
            >
              Become a contributor
            </Link>
          </p>

          <h1 className="mt-[17px] font-[family-name:var(--font-display)] text-[34px] font-semibold leading-tight tracking-tight text-[#222]">
            {title}
          </h1>

          <p className="mt-2 text-base">
            <Link href="/event" className="text-[var(--nl-orange)] hover:underline">
              All
            </Link>
            <span className="mx-2 text-neutral-400">&gt;&gt;</span>
            {leafSlug ? (
              <>
                <Link
                  href={eventTypeArchivePath({ parentSlug })}
                  className="text-[var(--nl-orange)] hover:underline"
                >
                  {parentLabel}
                </Link>
                <span className="mx-2 text-neutral-400">&gt;&gt;</span>
                <span className="font-semibold text-[var(--nl-orange)]">
                  {title}
                </span>
              </>
            ) : (
              <span className="font-semibold text-[var(--nl-orange)]">
                {parentLabel}
              </span>
            )}
          </p>

          <p className="mt-3 text-sm text-neutral-600">{total} posts</p>

          <div className="sort-view-button mt-4 mb-2.5 inline-flex max-w-full items-center gap-2 border border-[#919191] bg-white px-2.5 py-1 text-base text-[#444]">
            <ArrowDownUp className="size-4 shrink-0 text-neutral-600" />
            {order === "desc" ? (
              <>
                <span>Latest News view &gt;</span>
                <Link
                  href={hrefForOrder("asc")}
                  className="text-[var(--nl-orange)] hover:underline"
                >
                  Click for Biography view
                </Link>
              </>
            ) : (
              <>
                <span>Biography view &gt;</span>
                <Link
                  href={hrefForOrder("desc")}
                  className="text-[var(--nl-orange)] hover:underline"
                >
                  Click for Latest News view
                </Link>
              </>
            )}
          </div>
        </section>

        <div>
          {events.map((event) => {
            const topicSlug =
              event.canonical_topic_slug ?? event.topics?.[0]?.slug ?? parentSlug;
            return (
              <EventCard key={event.id} event={event} topicSlug={topicSlug} />
            );
          })}
          {events.length === 0 && (
            <p className="py-10 text-center text-neutral-500">
              No events for this type yet.
            </p>
          )}
        </div>
        <TopicPagination
          basePath={basePath}
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
