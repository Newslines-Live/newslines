"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Topic } from "@/lib/types";
import type { GridSort } from "@/lib/data/seed-store";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [18, 27, 36, 45];

type Props = {
  topics: Topic[];
  total: number;
  sort: GridSort;
  page: number;
  pageSize: number;
};

function SortChip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-2.5 py-1 text-xs font-semibold sm:text-sm",
        active
          ? "bg-[var(--nl-orange)] text-white"
          : "text-neutral-700 hover:bg-black/5"
      )}
    >
      {children}
    </Link>
  );
}

export function GridClient({ topics, total, sort, page, pageSize }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function hrefFor(next: Partial<{ sort: string; page: number; pageSize: number }>) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.sort) params.set("sort", next.sort);
    if (next.page) params.set("page", String(next.page));
    if (next.pageSize) params.set("pageSize", String(next.pageSize));
    return `/grid?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-4 space-y-3 bg-neutral-100 px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500">Trending:</span>
          <SortChip active={sort === "trending_day"} href={hrefFor({ sort: "trending_day", page: 1 })}>
            Today
          </SortChip>
          <SortChip active={sort === "trending_week"} href={hrefFor({ sort: "trending_week", page: 1 })}>
            Week
          </SortChip>
          <SortChip active={sort === "trending_month"} href={hrefFor({ sort: "trending_month", page: 1 })}>
            Month
          </SortChip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500">Updated:</span>
          <SortChip active={sort === "updated_day"} href={hrefFor({ sort: "updated_day", page: 1 })}>
            Today
          </SortChip>
          <SortChip active={sort === "updated_week"} href={hrefFor({ sort: "updated_week", page: 1 })}>
            Week
          </SortChip>
          <SortChip active={sort === "updated_month"} href={hrefFor({ sort: "updated_month", page: 1 })}>
            Month
          </SortChip>
          <SortChip active={sort === "most_posts"} href={hrefFor({ sort: "most_posts", page: 1 })}>
            Most Posts
          </SortChip>
          <SortChip active={sort === "random"} href={hrefFor({ sort: "random", page: 1 })}>
            Random
          </SortChip>
          <SortChip active={sort === "featured"} href={hrefFor({ sort: "featured", page: 1 })}>
            Featured
          </SortChip>
          <select
            className="ml-auto border border-neutral-300 bg-white px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) =>
              router.push(hrefFor({ pageSize: Number(e.target.value), page: 1 }))
            }
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/${topic.slug}`}
            className="group relative aspect-square overflow-hidden bg-neutral-200"
          >
            {topic.image_url ? (
              <Image
                src={topic.image_url}
                alt={topic.name}
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="120px"
                unoptimized
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center bg-neutral-300 px-1 text-center text-xs font-semibold text-neutral-700"
                aria-hidden
              >
                {topic.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-[var(--nl-orange)] px-1 py-1.5 text-center text-[10px] font-semibold leading-tight text-white sm:text-xs">
              {topic.name}
            </span>
          </Link>
        ))}
      </div>

      {topics.length === 0 && (
        <p className="py-12 text-center text-neutral-500">
          No topics match this filter yet. Run the seed migration, or try Most Posts / Featured.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-1">
        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
          <Link
            key={p}
            href={hrefFor({ page: p })}
            className={cn(
              "min-w-8 px-2 py-1 text-center text-sm font-semibold",
              p === page
                ? "bg-[var(--nl-orange)] text-white"
                : "bg-neutral-100 text-[var(--nl-orange)] hover:bg-neutral-200"
            )}
          >
            {p}
          </Link>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-neutral-500">
        {total} topics · page {page} of {totalPages}
      </p>
    </div>
  );
}
