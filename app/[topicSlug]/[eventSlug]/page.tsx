import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug, getTopicBySlug } from "@/lib/data/seed-store";
import {
  decodeHtmlEntities,
  formatEventDate,
  transformSummaryHtml,
} from "@/lib/utils";

type Props = {
  params: Promise<{ topicSlug: string; eventSlug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { topicSlug, eventSlug } = await params;
  const event = await getEventBySlug(topicSlug, eventSlug);
  return { title: event ? decodeHtmlEntities(event.title) : "Event" };
}

export default async function EventPage({ params }: Props) {
  const { topicSlug, eventSlug } = await params;
  if (eventSlug === "events" || eventSlug === "page") notFound();

  const [topic, event] = await Promise.all([
    getTopicBySlug(topicSlug),
    getEventBySlug(topicSlug, eventSlug),
  ]);
  if (!topic || !event) notFound();

  return (
    <div className="bg-[var(--nl-wash)]">
      <article className="mx-auto max-w-[850px] px-4 py-6 sm:px-8">
        <p className="text-base leading-[1.65] text-black">
          <strong className="font-bold text-[var(--nl-orange)]">What&apos;s this?</strong>{" "}
          This is an unbiased just-the-facts news summary about{" "}
          {event.topics?.map((t, i) => (
            <span key={t.id}>
              {i > 0 && (i === event.topics!.length - 1 ? " and " : ", ")}
              <strong className="font-bold text-[var(--nl-orange)]">{t.name}</strong>
            </span>
          ))}
          . To see the full newsline, click the tabs below.
        </p>

        <div className="entry-event-date mt-6">
          {formatEventDate(event.occurred_at, event.date_precision ?? "exact")}
        </div>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-[26px] font-semibold leading-tight tracking-tight text-[#222] sm:text-[34px]">
          {decodeHtmlEntities(event.title)}
        </h1>

        <div className="mt-2.5 flex flex-wrap items-center">
          {event.topics?.map((t) => (
            <Link
              key={t.id}
              href={`/${t.slug}`}
              className="mb-0 mr-[3px] mt-[3px] inline-block bg-[var(--nl-orange)] px-2 py-1.5 text-[15px] leading-none text-white hover:bg-[var(--nl-orange-dark)]"
            >
              {t.name}
            </Link>
          ))}
          {event.event_type && (
            <Link
              href={`/${topicSlug}/events/${event.event_type.slug}`}
              className="mb-0 mr-[3px] mt-[3px] inline-block bg-[var(--nl-green)] px-2 py-1.5 text-[15px] leading-none text-white hover:opacity-90"
            >
              {event.event_type.name}
            </Link>
          )}
          <span className="mb-0 ml-2 mt-[3px] inline-block text-[15px] text-black">
            0 Comments
          </span>
        </div>

        <div
          className="prose-nl mt-4 text-base leading-[1.65] text-black"
          dangerouslySetInnerHTML={{
            __html: transformSummaryHtml(event.summary_html),
          }}
        />

        <div className="mt-10 border-t border-[#ebebeb] pt-6">
          <p className="text-base font-semibold text-black">Check out the full newsline:</p>
          <div className="mt-3 flex flex-wrap">
            {event.topics?.map((t) => (
              <Link
                key={t.id}
                href={`/${t.slug}`}
                className="mb-0 mr-[3px] mt-[3px] inline-block bg-[var(--nl-orange)] px-2 py-1.5 text-[15px] leading-none text-white hover:bg-[var(--nl-orange-dark)]"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
