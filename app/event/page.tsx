import Link from "next/link";
import {
  EVENT_TYPE_PARENTS,
  eventTypeArchivePath,
  eventTypeLabel,
  leavesForParent,
} from "@/lib/event-type-routes";

export const metadata = { title: "Event types" };

export default function EventTypeIndexPage() {
  return (
    <div className="bg-[var(--nl-wash)]">
      <div className="mx-auto max-w-[850px] px-4 py-8 sm:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-[34px] font-semibold tracking-tight text-[#222]">
          Event types
        </h1>
        <p className="mt-3 text-base leading-[1.65] text-black">
          Browse every newsline by event type — the same{" "}
          <code className="text-[var(--nl-orange)]">/event/…</code> archives
          Google already indexes.
        </p>
        <div className="mt-8 space-y-8">
          {EVENT_TYPE_PARENTS.map((parent) => (
            <section key={parent}>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                <Link
                  href={eventTypeArchivePath({ parentSlug: parent })}
                  className="text-[var(--nl-orange)] hover:underline"
                >
                  {eventTypeLabel(parent)}
                </Link>
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {leavesForParent(parent).map((leaf) => (
                  <Link
                    key={leaf}
                    href={eventTypeArchivePath({ parentSlug: parent, leafSlug: leaf })}
                    className="bg-[var(--nl-green)] px-2 py-1.5 text-[15px] leading-none text-white hover:opacity-90"
                  >
                    {eventTypeLabel(leaf)}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
