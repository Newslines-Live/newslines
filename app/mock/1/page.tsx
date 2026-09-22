"use client";

import Link from "next/link";
import { useState } from "react";
import { InteractiveMosaic } from "@/components/home-mocks/InteractiveMosaic";
import { MockSwitcher } from "@/components/home-mocks/MockSwitcher";

/** Mosaic canvas — Are.na / Palmer / Cosmos energy */
export default function Mock1Page() {
  const [q, setQ] = useState("");

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <MockSwitcher active="1" />

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
        {/* Dock */}
        <aside className="flex flex-col justify-between border-b border-white/10 px-5 py-10 sm:px-7 lg:sticky lg:top-[6.5rem] lg:h-[calc(100vh-6.5rem)] lg:border-b-0 lg:border-r lg:border-white/10 lg:py-12">
          <div>
            <p className="font-mono-mock text-[10px] uppercase tracking-[0.32em] text-[#fa4d2a]">
              Newslines
            </p>
            <h1 className="font-mock nl-rise mt-4 text-4xl font-extrabold leading-[0.98] tracking-tight xl:text-5xl">
              The world’s news,
              <span className="text-white/40"> cut to facts.</span>
            </h1>
            <p className="nl-rise nl-rise-d1 mt-5 text-[15px] leading-relaxed text-white/60">
              Bias, fake news, trash — that’s the feed. This is the mosaic:
              uneven, alive, clickable. Open a timeline. Sort until it’s yours.
            </p>

            <label className="nl-rise nl-rise-d2 mt-8 flex items-center gap-3 border border-white/15 bg-white/[0.03] px-3 py-3">
              <span className="font-mono-mock text-[10px] uppercase tracking-wider text-white/35">
                Filter
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type a name…"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
              />
            </label>

            <div className="nl-rise nl-rise-d3 mt-5 flex flex-wrap gap-2">
              <Link
                href="/mock/grid"
                className="bg-[#fa4d2a] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#e03d1a]"
              >
                Enter The Grid
              </Link>
              <Link
                href="/elon-musk"
                className="border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/50 hover:text-white"
              >
                Sample newsline
              </Link>
            </div>
          </div>

          <p className="mt-10 font-mono-mock text-[10px] uppercase tracking-[0.22em] text-white/30 lg:mt-0">
            Hover · expand · open
          </p>
        </aside>

        <div className="px-2 py-4 sm:px-3 sm:py-5 lg:py-6">
          <InteractiveMosaic query={q} />
        </div>
      </div>
    </div>
  );
}
