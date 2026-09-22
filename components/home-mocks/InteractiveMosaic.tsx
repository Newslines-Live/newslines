"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import mosaicTiles from "@/components/home-mocks/mosaic-tiles.json";

export type MosaicTile = {
  name: string;
  slug: string;
  src: string;
  remote?: string;
  span: "sm" | "md" | "lg" | "wide" | "tall";
  tint: string;
};

const DEFAULT_TILES = mosaicTiles as MosaicTile[];

const SPAN_CLASS: Record<MosaicTile["span"], string> = {
  sm: "col-span-1 row-span-1 min-h-[120px]",
  md: "col-span-1 row-span-2 min-h-[240px]",
  lg: "col-span-2 row-span-2 min-h-[240px]",
  wide: "col-span-2 row-span-1 min-h-[120px]",
  tall: "col-span-1 row-span-2 min-h-[240px]",
};

type Props = {
  tiles?: MosaicTile[];
  query?: string;
  className?: string;
  filterable?: boolean;
  /** Keep faces readable — light wash only */
  vivid?: boolean;
};

export function InteractiveMosaic({
  tiles = DEFAULT_TILES,
  query = "",
  className,
  filterable = true,
  vivid = true,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const q = query.trim().toLowerCase();

  const scored = useMemo(() => {
    if (!filterable || !q) {
      return tiles.map((t) => ({ tile: t, match: true }));
    }
    return tiles.map((t) => ({
      tile: t,
      match: t.name.toLowerCase().includes(q) || t.slug.includes(q),
    }));
  }, [tiles, q, filterable]);

  return (
    <div
      className={cn(
        "grid auto-rows-[120px] grid-cols-2 gap-2 sm:auto-rows-[130px] sm:grid-cols-4 md:grid-cols-6 md:gap-2.5 lg:auto-rows-[150px]",
        className
      )}
    >
      {scored.map(({ tile, match }, i) => {
        const active = hovered === tile.slug;
        return (
          <Link
            key={`${tile.slug}-${i}`}
            href={`/${tile.slug}`}
            onMouseEnter={() => setHovered(tile.slug)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "group relative overflow-hidden bg-neutral-900 transition-[transform,opacity,filter,box-shadow] duration-500 ease-out",
              SPAN_CLASS[tile.span],
              match ? "opacity-100" : "pointer-events-none opacity-[0.12] grayscale",
              active &&
                match &&
                "z-20 scale-[1.03] shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tile.src}
              alt={tile.name}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition duration-700 ease-out",
                active ? "scale-110" : "scale-100 group-hover:scale-[1.06]"
              )}
              loading={i < 6 ? "eager" : "lazy"}
            />
            {!vivid && (
              <div
                className="absolute inset-0 mix-blend-multiply opacity-45 transition duration-500 group-hover:opacity-25"
                style={{
                  background: `linear-gradient(145deg, ${tile.tint}, #0a0a0a 70%)`,
                }}
              />
            )}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t to-transparent transition duration-300",
                vivid
                  ? "from-black/75 via-black/15"
                  : "from-black/90 via-black/25"
              )}
            />

            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
              <p className="font-mock text-sm font-bold tracking-tight text-white drop-shadow sm:text-base md:text-lg">
                {tile.name}
              </p>
              <p
                className={cn(
                  "font-mono-mock mt-1 text-[10px] uppercase tracking-[0.2em] text-white/80 transition duration-300",
                  active
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                )}
              >
                Open newsline →
              </p>
            </div>

            <span
              className="absolute left-0 top-0 h-full w-1 opacity-90"
              style={{ background: tile.tint }}
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}

export { DEFAULT_TILES };
