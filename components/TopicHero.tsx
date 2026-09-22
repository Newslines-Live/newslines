import Image from "next/image";
import Link from "next/link";
import { ArrowDownUp } from "lucide-react";
import type { Topic } from "@/lib/types";
import { topicNewslineHref } from "@/lib/topic-page";

type Props = {
  topic: Topic;
  order: "asc" | "desc";
  eventTypeSlug?: string;
};

export function TopicHero({ topic, order, eventTypeSlug }: Props) {
  const base = `/${topic.slug}`;
  const qs = (next: "asc" | "desc") =>
    topicNewslineHref({ topicSlug: topic.slug, eventTypeSlug, order: next });

  return (
    <section className="px-0 pb-2 pt-2">
      <p className="text-base leading-[1.65] text-black">
        <strong className="font-bold text-[var(--nl-orange)]">What&apos;s this?</strong>{" "}
        This is an unbiased just-the-facts news timeline (&apos;newsline&apos;) about{" "}
        <strong className="font-bold text-[var(--nl-orange)]">{topic.name}</strong>,
        created by Newslines contributors.{" "}
        <Link
          href="/getting-started"
          className="text-[var(--nl-orange)] hover:underline"
        >
          Become a contributor
        </Link>
      </p>

      <h1 className="mt-[17px] font-[family-name:var(--font-display)] text-[34px] font-semibold leading-tight tracking-tight text-[#222]">
        {topic.name}
      </h1>

      {eventTypeSlug && (
        <p className="mt-2 text-base">
          <Link href={base} className="text-[var(--nl-orange)] hover:underline">
            All
          </Link>
          <span className="mx-2 text-neutral-400">&gt;&gt;</span>
          <span className="font-semibold capitalize text-[var(--nl-orange)]">
            {eventTypeSlug.replace(/-/g, " ")}
          </span>
        </p>
      )}

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div className="relative h-[150px] w-[150px] shrink-0 overflow-hidden bg-neutral-200">
          {topic.image_url ? (
            <Image
              src={topic.image_url}
              alt={topic.name}
              fill
              className="object-cover"
              sizes="150px"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-neutral-500">
              {topic.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div
            className="absolute inset-x-0 bottom-0 py-0.5 text-center text-sm text-white"
            style={{ backgroundColor: "rgba(250, 74, 42, 0.8)" }}
          >
            {topic.post_count} posts
          </div>
        </div>
        {topic.bio && (
          <p className="text-base leading-[1.65] text-black">{topic.bio}</p>
        )}
      </div>

      <div className="sort-view-button mt-4 mb-2.5 inline-flex max-w-full items-center gap-2 border border-[#919191] bg-white px-2.5 py-1 text-base text-[#444]">
        <ArrowDownUp className="size-4 shrink-0 text-neutral-600" />
        {order === "desc" ? (
          <>
            <span>Latest News view &gt;</span>
            <Link href={qs("asc")} className="text-[var(--nl-orange)] hover:underline">
              Click for Biography view
            </Link>
          </>
        ) : (
          <>
            <span>Biography view &gt;</span>
            <Link href={qs("desc")} className="text-[var(--nl-orange)] hover:underline">
              Click for Latest News view
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
