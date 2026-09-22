import Link from "next/link";
import { InteractiveMosaic } from "@/components/home-mocks/InteractiveMosaic";
import { MockSwitcher } from "@/components/home-mocks/MockSwitcher";

export const metadata = {
  title: "Mock 2 — Swiss ink",
};

/** Swiss ink — Monolith / brutal gallery */
export default function Mock2Page() {
  return (
    <div className="min-h-screen bg-white text-black">
      <MockSwitcher active="2" />

      <section className="border-b border-black">
        <div className="mx-auto grid max-w-[1400px] md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between border-b border-black px-5 py-10 sm:px-8 md:border-b-0 md:border-r md:py-14">
            <div>
              <p className="font-mono-mock text-xs uppercase tracking-[0.28em]">
                Newslines — 01 / Index
              </p>
              <h1 className="font-mock nl-rise mt-6 text-[clamp(3.5rem,12vw,9rem)] font-extrabold leading-[0.85] tracking-[-0.04em]">
                JUST
                <br />
                THE
                <br />
                <span className="text-[#fa4d2a]">FACTS</span>
              </h1>
            </div>
            <div className="nl-rise nl-rise-d2 mt-12 max-w-md">
              <p className="text-lg leading-snug text-neutral-700">
                The industry is in crisis. Feeds sell bias and trash. We
                generate unbiased timelines on any topic — then you sort and
                filter the rest away.
              </p>
              <div className="mt-8 flex flex-wrap gap-0 border border-black">
                <Link
                  href="/grid"
                  className="bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#fa4d2a]"
                >
                  Open The Grid
                </Link>
                <Link
                  href="/elon-musk"
                  className="border-l border-black px-5 py-3 text-sm font-semibold transition hover:bg-neutral-100"
                >
                  Sample newsline
                </Link>
              </div>
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden bg-black text-white md:min-h-[640px]">
            <div className="absolute inset-0 opacity-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mock-mosaic/elon-musk.jpg"
                alt=""
                className="h-full w-full object-cover grayscale"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <p className="font-mono-mock text-[10px] uppercase tracking-[0.25em] text-white/50">
                Featured timeline
              </p>
              <p className="font-mock mt-2 text-3xl font-bold sm:text-4xl">
                Elon Musk
              </p>
              <p className="mt-2 max-w-sm text-sm text-white/70">
                A living index of what happened — not what someone wants you to
                feel.
              </p>
              <Link
                href="/elon-musk"
                className="mt-5 inline-block font-mono-mock text-xs uppercase tracking-[0.2em] text-[#fa4d2a] underline underline-offset-4"
              >
                View newsline →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0a0a0a] px-3 py-10 sm:px-5">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="font-mono-mock text-[10px] uppercase tracking-[0.25em] text-white/40">
                02 / Living index
              </p>
              <h2 className="font-mock mt-2 text-2xl font-bold text-white sm:text-3xl">
                Browse the mosaic
              </h2>
            </div>
            <Link
              href="/grid"
              className="font-mono-mock text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-white"
            >
              Full grid →
            </Link>
          </div>
          <InteractiveMosaic />
        </div>
      </section>
    </div>
  );
}
