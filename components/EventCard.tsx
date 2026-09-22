import Link from "next/link";
import type { NewsEvent } from "@/lib/types";
import {
  decodeHtmlEntities,
  formatEventDate,
  transformSummaryHtml,
} from "@/lib/utils";

type Props = {
  event: NewsEvent;
  topicSlug: string;
};

export function EventCard({ event, topicSlug }: Props) {
  return (
    <article className="mb-2.5 border border-[#ddd] bg-white px-2.5 pt-[5px] pb-0">
      <header className="pb-2.5">
        <div className="entry-event-date">
          {formatEventDate(event.occurred_at, event.date_precision ?? "exact")}
        </div>
        <h2 className="mb-[3px] mt-0 font-[family-name:var(--font-display)] text-[26px] font-semibold leading-[1.3] tracking-tight text-[#222]">
          <Link
            href={`/${topicSlug}/${event.slug}`}
            className="text-[#222] hover:text-[var(--nl-orange)]"
          >
            {decodeHtmlEntities(event.title)}
          </Link>
        </h2>

        <div className="entry-more-categories">
          {event.topics?.map((t) => (
            <Link
              key={t.id}
              href={`/${t.slug}`}
              className="entry-category mr-[3px] mt-[3px] inline-block bg-[var(--nl-orange)] px-2 py-1.5 text-[15.2px] leading-none text-white hover:bg-[var(--nl-orange-dark)]"
            >
              {t.name}
            </Link>
          ))}
          {event.event_type && (
            <Link
              href={`/${topicSlug}/events/${event.event_type.slug}`}
              className="entry-event mr-[3px] mt-[3px] inline-block bg-[var(--nl-green)] px-2 py-1.5 text-[15.2px] leading-none text-white hover:opacity-90"
            >
              {event.event_type.name}
            </Link>
          )}
          <span className="comment_count mr-[3px] mt-[3px] inline-block px-2 py-1.5 text-[15.2px] leading-none text-black">
            0 Comments
          </span>
        </div>
      </header>

      <div
        className="prose-nl text-base leading-[1.65] text-black"
        dangerouslySetInnerHTML={{
          __html: transformSummaryHtml(event.summary_html),
        }}
      />
    </article>
  );
}
