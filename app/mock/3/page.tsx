"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  DEFAULT_TILES,
  InteractiveMosaic,
} from "@/components/home-mocks/InteractiveMosaic";
import { MockSwitcher } from "@/components/home-mocks/MockSwitcher";

/** Command — Raycast / Perplexity / Arc */
export default function Mock3Page() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const suggestions = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return DEFAULT_TILES.slice(0, 5);
    return DEFAULT_TILES.filter(
      (t) =>
        t.name.toLowerCase().includes(needle) || t.slug.includes(needle)
    ).slice(0, 6);
  }, [q]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const hit = suggestions[0];
    if (hit) router.push(`/${hit.slug}`);
    else router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0d12] text-white">
      <MockSwitcher active="3" />

      {/* Soft aurora — not purple cliché; teal/orange brand heat */}
      <div
        className="pointer-events-none absolute -left-32 top-20 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl nl-drift"
        style={{
          background:
            "radial-gradient(circle, rgba(24,143,167,0.55), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -right-20 top-40 h-[380px] w-[380px] rounded-full opacity-35 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(250,77,42,0.45), transparent 70%)",
        }}
      />

      <div className="relative z-[1] mx-auto flex min-h-[calc(100vh-6.5rem)] max-w-3xl flex-col justify-center px-5 py-16 sm:px-8">
        <p className="font-mono-mock nl-rise text-xs uppercase tracking-[0.3em] text-white/45">
          Newslines
        </p>
        <h1 className="font-mock nl-rise nl-rise-d1 mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          What’s the news
          <br />
          <span className="text-white/40">on…</span>
        </h1>
        <p className="nl-rise nl-rise-d2 mt-4 max-w-lg text-base text-white/60 sm:text-lg">
          Unbiased timelines on any topic. Type to cut the mosaic down to what
          you care about — then open the newsline.
        </p>

        <form
          onSubmit={onSubmit}
          className="nl-rise nl-rise-d3 mt-10 border border-white/15 bg-white/[0.04] p-2 shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
            <span className="font-mono-mock text-white/35">⌘K</span>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Elon Musk, Tesla, McGregor…"
              className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/25 sm:text-xl"
            />
            <button
              type="submit"
              className="shrink-0 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#fa4d2a] hover:text-white"
            >
              Open
            </button>
          </div>
          <ul className="border-t border-white/10">
            {suggestions.map((s, i) => (
              <li key={s.slug}>
                <Link
                  href={`/${s.slug}`}
                  className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-white/[0.06] sm:px-5"
                >
                  <span>
                    <span className="font-mono-mock mr-3 text-[10px] text-white/30">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.name}
                  </span>
                  <span className="font-mono-mock text-[10px] uppercase tracking-wider text-white/30">
                    Newsline
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </form>

        <p className="mt-6 font-mono-mock text-[10px] uppercase tracking-[0.22em] text-white/30">
          Mosaic reacts as you type
        </p>
      </div>

      <div className="relative z-[1] px-2 pb-16 sm:px-4">
        <InteractiveMosaic query={q} />
      </div>
    </div>
  );
}
