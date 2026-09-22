import Link from "next/link";
import { searchAll } from "@/lib/data/seed-store";
import { decodeHtmlEntities } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const { topics, events } = q ? await searchAll(q) : { topics: [], events: [] };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        Search
      </h1>
      <form className="mt-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search topics and events…"
          className="w-full rounded-sm border border-neutral-300 bg-white px-4 py-3 text-base outline-none ring-[var(--nl-orange)] focus:ring-2"
        />
      </form>

      {q && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              Topics ({topics.length})
            </h2>
            <ul className="mt-3 space-y-2">
              {topics.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/${t.slug}`}
                    className="font-semibold text-[var(--nl-orange)] hover:underline"
                  >
                    {t.name}
                  </Link>
                  <span className="ml-2 text-xs text-neutral-500">
                    {t.post_count} posts
                  </span>
                </li>
              ))}
              {topics.length === 0 && (
                <li className="text-sm text-neutral-500">No topics found</li>
              )}
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              Events ({events.length})
            </h2>
            <ul className="mt-3 space-y-3">
              {events.map((e) => {
                const topicSlug = e.topics?.[0]?.slug ?? e.canonical_topic_slug ?? "elon-musk";
                return (
                  <li key={e.id}>
                    <Link
                      href={`/${topicSlug}/${e.slug}`}
                      className="font-semibold text-neutral-900 hover:text-[var(--nl-orange)]"
                    >
                      {decodeHtmlEntities(e.title)}
                    </Link>
                  </li>
                );
              })}
              {events.length === 0 && (
                <li className="text-sm text-neutral-500">No events found</li>
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
