"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const TESTIMONIALS = [
  {
    quote:
      "Newslines is like a ‘Wikipedia for news’. If you love researching news this is great fun!",
    name: "Paul L",
    role: "Newsline Contributor",
    image:
      "https://newslines.org/wp-content/uploads/2023/01/Paul-L-for-Newslines-Testimonial-250x250.jpg",
  },
  {
    quote:
      "Newslines lets me catch up with the latest Elon Musk news, without having to Google it",
    name: "Sammy",
    role: "Newslines Subscriber",
    image:
      "https://newslines.org/wp-content/uploads/2023/01/Sammy-for-Newslines-Testimonial-250x250.jpg",
  },
  {
    quote:
      "Finally, a place where I can get just the facts with no bias. Thank you to everyone who contributes to Newslines.",
    name: "Ahmed",
    role: "Newslines Subscriber",
    image:
      "https://newslines.org/wp-content/uploads/2023/01/Ahmed-for-Newslines-Testimonial-250x250.jpg",
  },
];

export function TestimonialCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const t = TESTIMONIALS[index];

  return (
    <div className="mt-8 max-w-md">
      <div className="relative bg-[var(--nl-teal)] px-[15px] py-[15px] text-lg leading-normal text-white">
        <p>{t.quote}</p>
        <div className="absolute -bottom-2 left-8 size-0 border-x-[10px] border-t-[10px] border-x-transparent border-t-[var(--nl-teal)]" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="relative size-12 overflow-hidden rounded-full">
          <Image src={t.image} alt="" fill className="object-cover" unoptimized />
        </div>
        <div className="text-sm leading-tight text-neutral-800">
          <strong className="font-semibold">{t.name}</strong>
          <span className="text-neutral-500"> / {t.role}</span>
        </div>
      </div>
    </div>
  );
}
