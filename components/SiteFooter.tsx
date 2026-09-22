import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#1a1a1a] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="max-w-3xl text-sm leading-relaxed text-white/85">
          Newslines aims to give readers the complete unbiased news history of any topic.{" "}
          <Link href="/grid" className="text-[var(--nl-orange)] hover:underline">
            Explore the grid
          </Link>{" "}
          to browse topics.
        </p>
        <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href="/about" className="text-[var(--nl-orange)] hover:underline">
            About
          </Link>
          <Link
            href="/getting-started"
            className="text-[var(--nl-orange)] hover:underline"
          >
            Getting started
          </Link>
          <Link href="/blog" className="text-[var(--nl-orange)] hover:underline">
            Blog
          </Link>
          <Link href="/contact" className="text-[var(--nl-orange)] hover:underline">
            Contact
          </Link>
          <Link
            href="/privacy-policy"
            className="text-[var(--nl-orange)] hover:underline"
          >
            Privacy
          </Link>
        </nav>
        <p className="mt-4 text-xs text-white/60">
          ©{" "}
          <span className="text-[var(--nl-orange)]">The Social News Company Ltd.</span>
        </p>
      </div>
    </footer>
  );
}
