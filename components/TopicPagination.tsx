import Link from "next/link";
import { newslinePageHref, type NewslineOrder } from "@/lib/topic-page";
import { cn } from "@/lib/utils";

type Props = {
  basePath: string;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  order: NewslineOrder;
};

function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const keep = new Set([
    1,
    total,
    current,
    current - 1,
    current + 1,
    current - 2,
    current + 2,
  ]);
  const nums = [...keep]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (const n of nums) {
    const prev = out[out.length - 1];
    if (typeof prev === "number" && n - prev > 1) out.push("ellipsis");
    out.push(n);
  }
  return out;
}

export function TopicPagination({
  basePath,
  page,
  totalPages,
  total,
  pageSize,
  order,
}: Props) {
  if (totalPages <= 1 || total === 0) return null;

  const href = (p: number) => newslinePageHref({ basePath, page: p, order });
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav className="mt-8 mb-2" aria-label="Newsline pages">
      <p className="mb-3 text-center text-sm text-neutral-600">
        Showing {from}–{to} of {total} events
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {page > 1 && (
          <Link
            href={href(page - 1)}
            className="px-2.5 py-1 text-sm font-semibold text-[var(--nl-orange)] hover:underline"
          >
            ‹ Previous
          </Link>
        )}
        {pageWindow(page, totalPages).map((item, i) =>
          item === "ellipsis" ? (
            <span key={`e-${i}`} className="px-1.5 text-sm text-neutral-400">
              …
            </span>
          ) : (
            <Link
              key={item}
              href={href(item)}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                "min-w-8 px-2 py-1 text-center text-sm font-semibold",
                item === page
                  ? "bg-[var(--nl-orange)] text-white"
                  : "bg-white text-[var(--nl-orange)] hover:bg-neutral-100"
              )}
            >
              {item}
            </Link>
          )
        )}
        {page < totalPages && (
          <Link
            href={href(page + 1)}
            className="px-2.5 py-1 text-sm font-semibold text-[var(--nl-orange)] hover:underline"
          >
            Next ›
          </Link>
        )}
      </div>
    </nav>
  );
}
