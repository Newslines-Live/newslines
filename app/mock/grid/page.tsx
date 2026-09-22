import { Suspense } from "react";
import { GridMosaicSample } from "@/components/home-mocks/GridMosaicSample";
import { MockSwitcher } from "@/components/home-mocks/MockSwitcher";
import { listGridTopics, type GridSort } from "@/lib/data/seed-store";
import { topicsToMosaicTiles } from "@/lib/mosaic";

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
  title: "Sample — Grid mosaic style",
};

export default async function MockGridPage({ searchParams }: Props) {
  const sp = await searchParams;
  const sort = (
    SORTS.includes(sp.sort as GridSort) ? sp.sort : "most_posts"
  ) as GridSort;
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = [18, 27, 36, 45].includes(Number(sp.pageSize))
    ? Number(sp.pageSize)
    : 36;

  // Pull a wider window, keep only imaged topics for a dense mosaic page
  const { topics: raw, total } = await listGridTopics({
    sort,
    page,
    pageSize: pageSize * 3,
  });
  const imaged = raw.filter((t) => t.image_url).slice(0, pageSize);
  const tiles = topicsToMosaicTiles(imaged);

  return (
    <div>
      <MockSwitcher active="grid" />
      <Suspense fallback={<p className="p-8 text-white/50">Loading mosaic…</p>}>
        <GridMosaicSample
          tiles={tiles}
          total={total}
          sort={sort}
          page={page}
          pageSize={pageSize}
        />
      </Suspense>
    </div>
  );
}
