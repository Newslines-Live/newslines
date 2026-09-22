import Link from "next/link";

const MOCKS = [
  {
    id: "1",
    title: "Mosaic canvas",
    href: "/mock/1",
    ref: "Are.na · Palmer · Cosmos",
    pitch:
      "Homepage direction: uneven interactive tiles, dock copy, hover to open.",
  },
  {
    id: "grid",
    title: "Grid sample",
    href: "/mock/grid",
    ref: "Same archive · mosaic style",
    pitch:
      "The actual Grid restyled to match mock 1 — sorts, pagination, real topics.",
  },
  {
    id: "2",
    title: "Swiss ink",
    href: "/mock/2",
    ref: "Monolith NYC · brutal Swiss",
    pitch:
      "Giant type, black field, mosaic as a living index — almost gallery-site energy.",
  },
  {
    id: "3",
    title: "Command",
    href: "/mock/3",
    ref: "Raycast · Perplexity · Arc",
    pitch:
      "Type any topic; the mosaic filters live. Product as a command surface.",
  },
  {
    id: "4",
    title: "Split scroll",
    href: "/mock/4",
    ref: "Apple stories · Locomotive",
    pitch:
      "Sticky manifesto left, scrolling interactive mosaic right. Motion with purpose.",
  },
] as const;

export const metadata = {
  title: "Homepage lab",
};

export default function MockIndexPage() {
  return (
    <div className="min-h-screen bg-[#070707] px-5 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono-mock text-xs uppercase tracking-[0.28em] text-[#fa4d2a]">
          Newslines · lab
        </p>
        <h1 className="font-mock mt-4 text-5xl font-extrabold tracking-tight sm:text-6xl">
          Fresh directions
        </h1>
        <p className="mt-5 max-w-xl text-lg text-white/65">
          Unrestricted takes. Cool-site DNA. Interactive mosaic where it makes
          sense — not a flat wallpaper of equal squares.
        </p>

        <ol className="mt-14 space-y-0">
          {MOCKS.map((m, i) => (
            <li key={m.id} className="border-t border-white/10">
              <Link
                href={m.href}
                className="group flex gap-5 py-7 transition"
              >
                <span className="font-mono-mock text-sm text-[#fa4d2a]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="font-mock block text-2xl font-bold tracking-tight group-hover:text-[#fa4d2a] sm:text-3xl">
                    {m.title}
                  </span>
                  <span className="font-mono-mock mt-1 block text-[11px] uppercase tracking-[0.18em] text-white/35">
                    {m.ref}
                  </span>
                  <span className="mt-2 block text-white/60">{m.pitch}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
