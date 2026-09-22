import Link from "next/link";
import { Grid3X3, Search } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--nl-orange)] text-white shadow-sm">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-3 sm:px-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-bold tracking-wide sm:text-2xl"
        >
          NEWSLINES
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium sm:gap-5">
          <Link
            href="/grid"
            className="inline-flex items-center gap-1.5 hover:opacity-90"
            aria-label="The Grid"
          >
            <Grid3X3 className="size-5" />
            <span className="hidden sm:inline">The Grid</span>
          </Link>
          <Link href="/search" className="inline-flex items-center gap-1.5 hover:opacity-90">
            <Search className="size-5" />
            <span className="hidden sm:inline">Search</span>
          </Link>
          <Link href="/admin" className="hidden text-white/90 hover:text-white sm:inline">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
