"use client";

import { useEffect, useRef, useState } from "react";

interface Testimonial {
  text: string;
  author: string;
  title: string;
  placeholder: boolean;
}

const testimonials: Testimonial[] = [
  {
    text: "I used to spend hours writing different posts for PH, Reddit, and Twitter. ShipProof generates all of them in one click. Saved me an entire day on my last launch.",
    author: "Alex K.",
    title: "Indie maker, shipped 3 products",
    placeholder: true,
  },
  {
    text: "The launch checklist alone is worth it. But the AI-generated content is what sold me. It actually understands the tone each platform expects.",
    author: "Sarah M.",
    title: "Solo founder",
    placeholder: true,
  },
  {
    text: "Finally a tool that gets the full cycle. Ship, collect feedback, display it. I embedded the widget on my landing page in 2 minutes.",
    author: "James R.",
    title: "Developer & maker",
    placeholder: true,
  },
  {
    text: "As an engineer, marketing was my weakest point. ShipProof\u2019s launch content generator saved me from writing terrible Reddit posts that would get instantly removed.",
    author: "Dev P.",
    title: "Ex-FAANG, now indie",
    placeholder: true,
  },
  {
    text: "The Wall of Proof page is genius. I share it in my Twitter bio and email signature. Way more credible than a screenshot of a nice comment.",
    author: "Michelle L.",
    title: "SaaS founder",
    placeholder: true,
  },
  {
    text: "Free tier is surprisingly generous for testing. Upgraded to Pro after my first launch because I needed unlimited proofs. Worth every penny at $12/mo.",
    author: "Tom H.",
    title: "Bootstrapped founder",
    placeholder: true,
  },
];

const COLORS = ["#6366F1", "#F59E0B", "#22C55E", "#EC4899", "#8B5CF6", "#3B82F6"];

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const color = COLORS[index % COLORS.length];

  return (
    <div
      ref={ref}
      className="break-inside-avoid mb-4 rounded-xl border border-[#1E1E24] bg-[#141418] p-6 motion-safe:transition-all motion-safe:duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transitionDelay: `${index * 50}ms`,
      }}
    >
      <p className="text-sm text-[#EDEDEF] leading-[1.7]">
        &ldquo;{testimonial.text}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {testimonial.author.charAt(0)}
        </div>
        <div>
          <div className="text-sm font-medium text-[#EDEDEF]">
            {testimonial.author}
          </div>
          <div className="text-xs text-[#8B8B92]">{testimonial.title}</div>
        </div>
      </div>
    </div>
  );
}

export default function WallOfLove() {
  return (
    <section className="border-t border-[#2A2A30] py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-[28px] font-medium text-white">
          Loved by indie hackers
        </h2>
        <p className="mt-2 text-center text-sm text-[#8B8B92] mb-10">
          See what builders are saying about ShipProof
        </p>
        <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
