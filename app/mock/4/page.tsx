"use client";

import Link from "next/link";
import { InteractiveMosaic } from "@/components/home-mocks/InteractiveMosaic";
import { MockSwitcher } from "@/components/home-mocks/MockSwitcher";

/** Split scroll — Apple / Locomotive storytelling */
export default function Mock4Page() {
  return (
    <div className="min-h-screen bg-[#111] text-white">
      <MockSwitcher active="4" />

      <div className="mx-auto grid max-w-[1400px] lg:grid-cols-[minmax(280px,380px)_1fr]">
        {/* Sticky column */}
        <aside className="border-b border-white/10 px-5 py-10 sm:px-8 lg:sticky lg:top-[6.5rem] lg:h-[calc(100vh-6.5rem)] lg:border-b-0 lg:border-r lg:border-white/10 lg:py-14">
          <div className="flex h-full flex-col">
            <p className="font-mono-mock text-[10px] uppercase tracking-[0.3em] text-[#fa4d2a]">
              Newslines
            </p>
            <h1 className="font-mock nl-rise mt-5 text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl">
              Scroll the noise
              <span className="text-white/35"> away.</span>
            </h1>
            <p className="nl-rise nl-rise-d1 mt-5 text-base leading-relaxed text-white/65">
              Feeds are engineered for outrage. We generate unbiased news
              timelines — then hand you the dials: sort, filter, keep the facts.
            </p>

            <div className="nl-rise nl-rise-d2 mt-8 space-y-5 font-mono-mock text-xs uppercase tracking-[0.18em] text-white/45">
              <p>
                <span className="text-[#fa4d2a]">01</span> — Pick any topic
              </p>
              <p>
                <span className="text-[#fa4d2a]">02</span> — Read just the facts
              </p>
              <p>
                <span className="text-[#fa4d2a]">03</span> — Filter until it’s
                yours
              </p>
            </div>

            <div className="mt-auto hidden pt-10 lg:block">
              <Link
                href="/grid"
                className="inline-flex bg-[#fa4d2a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e03d1a]"
              >
                Enter The Grid
              </Link>
            </div>
          </div>
        </aside>

        {/* Scrolling mosaic stage */}
        <div className="px-2 py-6 sm:px-4 sm:py-8">
          <div className="mb-4 flex items-center justify-between px-1">
            <p className="font-mono-mock text-[10px] uppercase tracking-[0.22em] text-white/35">
              Interactive mosaic
            </p>
            <Link
              href="/grid"
              className="text-sm font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline lg:hidden"
            >
              Open Grid
            </Link>
          </div>

          <InteractiveMosaic />

          <section className="mt-16 border-t border-white/10 px-2 py-14 sm:px-4">
            <h2 className="font-mock text-3xl font-bold tracking-tight sm:text-4xl">
              Timelines, not feeds
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/60">
              Every tile is a living newsline. Click in, strip the commentary,
              keep what actually happened.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/grid"
                className="bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#fa4d2a] hover:text-white"
              >
                Browse everything
              </Link>
              <Link
                href="/elon-musk"
                className="border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
              >
                Open a sample
              </Link>
            </div>
          </section>

          <div className="pb-20 pt-4">
            <InteractiveMosaic />
          </div>
        </div>
      </div>
    </div>
  );
}
