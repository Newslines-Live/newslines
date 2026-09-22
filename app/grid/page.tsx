import { Suspense } from "react";
import { GridClient } from "@/components/GridClient";
import { listGridTopics, type GridSort } from "@/lib/data/seed-store";

const SORTS: GridSort[] = [
  "trending_day",
  "trending_week",
  "trending_month",
  "updated_day",
  "updated_week",
  "updated_month",
  "most_posts",
  "random",
  "featured",
];

type Props = {
  searchParams: Promise<{ sort?: string; page?: string; pageSize?: string }>;
};

export const metadata = {
  title: "Grid",
};

export default async function GridPage({ searchParams }: Props) {
  const sp = await searchParams;
  const sort = (SORTS.includes(sp.sort as GridSort) ? sp.sort : "most_posts") as GridSort;
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = [18, 27, 36, 45].includes(Number(sp.pageSize))
    ? Number(sp.pageSize)
    : 27;

  const { topics, total } = await listGridTopics({ sort, page, pageSize });

  return (
    <div className="mx-auto max-w-6xl px-3 py-8 sm:px-4">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
        Welcome to <span className="text-[var(--nl-orange)]">the grid…</span>
      </h1>
      <p className="mt-3 max-w-3xl text-neutral-700">
        Explore the grid to find topics you are interested in.{" "}
        <span className="font-semibold text-[var(--nl-orange)]">Browse, filter and open</span>{" "}
        any newsline from the full archive.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p>Loading grid…</p>}>
          <GridClient
            topics={topics}
            total={total}
            sort={sort}
            page={page}
            pageSize={pageSize}
          />
        </Suspense>
      </div>
    </div>
  );
}
