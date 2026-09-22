import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Check,
  CloudUpload,
  Pencil,
  Search,
  Tag,
  ThumbsUp,
} from "lucide-react";
import { TestimonialCarousel } from "@/components/home/TestimonialCarousel";
import { getEventByWpPostId } from "@/lib/data/seed-store";

const IMG = {
  blob: "https://newslines.org/wp-content/uploads/2023/01/light_green_blob.jpg",
  phone:
    "https://newslines.org/wp-content/uploads/2022/12/Musk-newsline-phone-e1671937673837.png",
  elon: "https://newslines.org/wp-content/uploads/2014/07/Elon-Musk.jpg",
  twitter:
    "https://newslines.org/wp-content/uploads/2014/11/Twitter-Logo-e1673889881275-250x250.png",
  tesla:
    "https://newslines.org/wp-content/uploads/2014/07/Tesla-Motors-Logo-300x300.jpg",
  grid: "https://newslines.org/wp-content/uploads/2023/01/Grid-image-thin.jpg",
} as const;

function TriangleDivider({
  fill,
  flip = false,
}: {
  fill: string;
  flip?: boolean;
}) {
  return (
    <div
      className="pointer-events-none relative z-10 -mb-px h-[70px] w-full overflow-hidden leading-none"
      aria-hidden
    >
      <svg
        className={`absolute inset-x-0 h-full w-full ${flip ? "rotate-180" : ""}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
      >
        <path d="M500.2,94.7L0,0v100h1000V0L500.2,94.7z" fill={fill} />
      </svg>
    </div>
  );
}

const checklist = [
  { label: "A better news experience", Icon: ThumbsUp },
  { label: "Reduce fake news", Icon: Search },
  { label: "Eliminate bias", Icon: Check },
] as const;

const steps = [
  {
    title: "Find News",
    body: "Find current and/or past new articles about your favourite topics",
    Icon: Search,
  },
  {
    title: "Extract facts",
    body: "Extract the facts to create your news event, removing bias and commentary",
    Icon: Pencil,
  },
  {
    title: "Categorise",
    body: "Add category and event types to your news event",
    Icon: Tag,
  },
  {
    title: "Post!",
    body: "Post your news event to add it to newslines",
    Icon: CloudUpload,
  },
] as const;

const topics = [
  { name: "Elon Musk", href: "/elon-musk", src: IMG.elon },
  { name: "Twitter", href: "/twitter", src: IMG.twitter },
  { name: "Tesla Motors", href: "/tesla-inc", src: IMG.tesla },
] as const;

type HomeProps = {
  searchParams: Promise<{ p?: string }>;
};

export default async function HomePage({ searchParams }: HomeProps) {
  const { p } = await searchParams;
  if (p) {
    const id = Number(p);
    if (!Number.isInteger(id) || id < 1) notFound();
    const event = await getEventByWpPostId(id);
    const topic =
      event?.canonical_topic_slug ?? event?.topics?.[0]?.slug ?? null;
    if (!event || !topic) notFound();
    redirect(`/${topic}/${event.slug}`);
  }
  return (
    <div className="bg-white">
      {/* Hero — matches live #av_section_1 */}
      <section className="relative overflow-hidden bg-[var(--nl-wash)]">
        {/* Same blob as live #av_section_1 — stretch/cover, centered */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMG.blob}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="relative z-[1] mx-auto grid max-w-[1210px] items-center gap-8 px-5 pb-16 pt-10 md:grid-cols-[1fr_1fr] md:gap-6 md:pb-20 md:pt-14 lg:px-8">
          <div className="max-w-[540px]">
            <h1 className="font-[family-name:var(--font-display)] text-[2rem] font-semibold leading-[1.1] tracking-tight text-[#222] sm:text-[2.75rem] lg:text-[48px] lg:leading-[52.8px]">
              Let’s organise the world’s news.{" "}
              <span className="text-[var(--nl-orange)]">Together.</span>
            </h1>

            <p className="mt-5 text-lg leading-[1.65] text-black">
              The news industry is in crisis. Our feeds are full of bias, fake
              news and trash. What can be done? How about we{" "}
              <span className="font-semibold text-[var(--nl-orange)]">
                work together
              </span>{" "}
              to build{" "}
              <span className="font-semibold text-[var(--nl-orange)]">
                unbiased news timelines
              </span>{" "}
              – newslines! – on any topic.
            </p>

            <ul className="mt-8 space-y-5">
              {checklist.map(({ label, Icon }) => (
                <li key={label} className="flex items-center gap-4">
                  <span
                    className="inline-flex size-16 shrink-0 items-center justify-center rounded-full text-[var(--nl-orange)]"
                    style={{
                      backgroundColor: "rgb(249, 194, 182)",
                      boxShadow: "rgba(51, 51, 51, 0.48) 0px 0px 13px 0px",
                    }}
                  >
                    <Icon className="size-7" strokeWidth={2.25} />
                  </span>
                  <h4 className="font-[family-name:var(--font-display)] text-xl font-semibold text-neutral-900 sm:text-2xl">
                    {label}
                  </h4>
                </li>
              ))}
            </ul>

            <TestimonialCarousel />
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <Link
              href="/elon-musk"
              className="block aspect-square overflow-hidden rounded-full transition duration-300 hover:scale-105"
            >
              <Image
                src={IMG.phone}
                alt="Elon Musk newsline on a phone"
                width={600}
                height={600}
                className="h-full w-full object-cover"
                priority
                unoptimized
              />
            </Link>
          </div>
        </div>

        <div className="relative z-[1]">
          <TriangleDivider fill="#fa4d2a" />
        </div>
      </section>

      {/* How it works — #howitworks */}
      <section className="bg-[var(--nl-orange)] px-5 pb-16 pt-6 text-white">
        <div className="mx-auto max-w-[1210px] text-center">
          <h2 className="font-[family-name:var(--font-display)] text-[2rem] font-semibold sm:text-[2.75rem] lg:text-[48px]">
            How Newslines works
          </h2>
          <p className="mt-2 text-lg text-white/95">
            It’s easy to create newslines on your favourite topics
          </p>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {steps.map(({ title, body, Icon }) => (
              <div key={title} className="px-2">
                <div
                  className="mx-auto flex size-[90px] items-center justify-center rounded-full bg-white text-[var(--nl-teal)]"
                  style={{
                    boxShadow: "rgba(51, 51, 51, 0.48) 0px 0px 20px 1px",
                  }}
                >
                  <Icon className="size-10" strokeWidth={1.75} />
                </div>
                <h3 className="mt-6 font-[family-name:var(--font-display)] text-lg font-bold uppercase tracking-wide">
                  {title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/95">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/getting-started"
            className="mt-12 inline-flex items-center rounded-[5px] bg-white px-[30px] py-[15px] text-xl text-[var(--nl-orange)] transition hover:bg-neutral-100"
          >
            Become a contributor now
          </Link>
        </div>
      </section>

      {/* Help us work on — #helpus */}
      <section className="bg-[var(--nl-wash)] px-5 py-16">
        <div className="mx-auto max-w-[1210px]">
          <h2 className="text-center font-[family-name:var(--font-display)] text-[2rem] font-light text-black sm:text-[2.75rem] lg:text-[48px]">
            Help us work on…
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {topics.map((topic) => (
              <Link
                key={topic.name}
                href={topic.href}
                className="group text-center"
              >
                <h4 className="font-[family-name:var(--font-display)] text-xl font-semibold text-neutral-900">
                  {topic.name}
                </h4>
                <div className="mx-auto mt-4 max-w-[180px] overflow-hidden transition duration-300 group-hover:scale-105">
                  <Image
                    src={topic.src}
                    alt={topic.name}
                    width={180}
                    height={180}
                    className="h-auto w-full"
                    unoptimized
                  />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-14 text-center">
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] font-light text-black sm:text-[2.5rem] lg:text-[48px]">
              And hundreds more…
            </h2>
            <p className="mt-1 text-lg text-neutral-700">Click to explore…</p>
            <Link href="/grid" className="mx-auto mt-8 block max-w-[504px]">
              <Image
                src={IMG.grid}
                alt="The Grid — browse topics"
                width={504}
                height={997}
                className="mx-auto h-auto w-full shadow-md transition hover:opacity-95"
                unoptimized
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Signup — #signupnow */}
      <section
        id="signupnow"
        className="bg-[var(--nl-teal)] px-5 py-16 text-white"
      >
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="font-[family-name:var(--font-display)] text-[2rem] font-semibold sm:text-[2.75rem] lg:text-[48px]">
            Help shape the future of news
          </h2>
          <p className="mt-3 text-xl font-medium text-white/95">
            Become a Newslines editor now
          </p>
          <div className="mt-8 space-y-5 text-left text-lg leading-relaxed text-white/95">
            <p>
              The news industry is in crisis. All we want is news, but our feeds
              are full of bias, fakery and clutter. Now, you can be part of the
              solution. With your help, Newslines, the ‘Wikipedia for News’,
              aims to organise all the world’s news into unbiased, just-the-facts
              news timelines.
            </p>
            <p>
              If you’re an exceptional editor, or someone who wants to become an
              exceptional editor, this is the place for you. If you love
              researching, writing and editing news, this is the place for you.
              If you’re a superfan or topic specialist, this is the place for
              you. If you want to help shape the growth of a completely new form
              of news, free of bias, fakery and clutter, then this is the place
              for you.
            </p>
          </div>
          <Link
            href="/getting-started"
            className="mt-10 inline-block text-xl font-semibold text-white underline underline-offset-4 hover:opacity-90"
          >
            Join us now.
          </Link>
        </div>
      </section>
    </div>
  );
}
