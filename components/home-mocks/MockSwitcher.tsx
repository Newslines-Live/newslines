import Link from "next/link";

const MOCKS = [
  { id: "1", label: "Mosaic canvas", href: "/mock/1" },
  { id: "grid", label: "Grid sample", href: "/mock/grid" },
  { id: "2", label: "Swiss ink", href: "/mock/2" },
  { id: "3", label: "Command", href: "/mock/3" },
  { id: "4", label: "Split scroll", href: "/mock/4" },
] as const;

export function MockSwitcher({ active }: { active: string }) {
  return (
    <div className="sticky top-12 z-50 border-b border-white/10 bg-black/80 text-white backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-3 py-2 sm:px-5">
        <Link
          href="/mock"
          className="mr-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50 hover:text-white"
        >
          Lab
        </Link>
        {MOCKS.map((m) => {
          const on = active === m.id;
          return (
            <Link
              key={m.id}
              href={m.href}
              className={`px-2.5 py-1 text-xs font-medium tracking-wide transition sm:text-sm ${
                on
                  ? "bg-white text-black"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {m.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
