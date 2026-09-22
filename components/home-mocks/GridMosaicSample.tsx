"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  InteractiveMosaic,
  type MosaicTile,
} from "@/components/home-mocks/InteractiveMosaic";
import { cn } from "@/lib/utils";
import type { GridSort } from "@/lib/data/seed-store";

const SORTS: { id: GridSort; label: string; group: string }[] = [
  { id: "most_posts", label: "Most posts", group: "Browse" },
  { id: "featured", label: "Featured", group: "Browse" },
  { id: "random", label: "Random", group: "Browse" },
  { id: "trending_day", label: "Today", group: "Trending" },
  { id: "trending_week", label: "Week", group: "Trending" },
  { id: "trending_month", label: "Month", group: "Trending" },
  { id: "updated_day", label: "Today", group: "Updated" },
  { id: "updated_week", label: "Week", group: "Updated" },
  { id: "updated_month", label: "Month", group: "Updated" },
];

type Props = {
  tiles: MosaicTile[];
  total: number;
  sort: GridSort;
  page: number;
  pageSize: number;
};

export function GridMosaicSample({
  tiles,
  total,
  sort,
  page,
  pageSize,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function hrefFor(next: Partial<{ sort: string; page: number; pageSize: number }>) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.sort) params.set("sort", next.sort);
    if (next.page) params.set("page", String(next.page));
    if (next.pageSize) params.set("pageSize", String(next.pageSize));
    return `/mock/grid?${params.toString()}`;
  }

  const groups = ["Browse", "Trending", "Updated"] as const;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-[1600px] px-3 py-6 sm:px-5 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="font-mono-mock text-[10px] uppercase tracking-[0.3em] text-[#fa4d2a]">
              Sample · The Grid · mosaic style
            </p>
            <h1 className="font-mock mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              The Grid
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/55 sm:text-base">
              Same archive as today — restyled as an uneven interactive mosaic.
              Sort, filter, open a newsline.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/mock/1"
              className="border border-white/20 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-white/50 hover:text-white"
            >
              ← Homepage mock
            </Link>
            <Link
              href="/grid"
              className="border border-white/20 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-white/50 hover:text-white"
            >
              Current Grid
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group} className="flex flex-wrap items-center gap-2">
                <span className="font-mono-mock w-16 text-[10px] uppercase tracking-[0.18em] text-white/35">
                  {group}
                </span>
                {SORTS.filter((s) => s.group === group).map((s) => (
                  <Link
                    key={s.id}
                    href={hrefFor({ sort: s.id, page: 1 })}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold transition sm:text-sm",
                      sort === s.id
                        ? "bg-[#fa4d2a] text-white"
                        : "bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <label className="flex w-full max-w-sm items-center gap-3 border border-white/15 bg-white/[0.03] px-3 py-2.5 lg:mt-0">
            <span className="font-mono-mock text-[10px] uppercase tracking-wider text-white/35">
              Filter
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter this page…"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 font-mono-mock text-[10px] uppercase tracking-[0.18em] text-white/35">
          <span>
            {total.toLocaleString()} topics · page {page} of {totalPages}
          </span>
          <select
            className="border border-white/15 bg-black px-2 py-1 text-white/80"
            value={pageSize}
            onChange={(e) =>
              router.push(hrefFor({ pageSize: Number(e.target.value), page: 1 }))
            }
          >
            {[18, 27, 36, 45].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <InteractiveMosaic tiles={tiles} query={q} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-1">
          {Array.from({ length: Math.min(totalPages, 12) }, (_, i) => i + 1).map(
            (p) => (
              <Link
                key={p}
                href={hrefFor({ page: p })}
                className={cn(
                  "min-w-8 px-2 py-1 text-center text-sm font-semibold",
                  p === page
                    ? "bg-[#fa4d2a] text-white"
                    : "bg-white/[0.06] text-white/70 hover:bg-white/10"
                )}
              >
                {p}
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
