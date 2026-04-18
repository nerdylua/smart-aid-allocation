"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

type Example = {
  title: string;
  stat: string;
  statLabel: string;
  desc: string;
  image: string;
  category: string;
};

const EXAMPLES: Example[] = [
  {
    title: "Flood response coordination across 3 districts",
    stat: "Pilot",
    statLabel: "rapid triage workflow",
    desc: "AI severity scoring can prioritize incoming reports quickly so coordinators can focus on the most urgent queues first.",
    image: "/assets/built1.webp",
    category: "Disaster Response",
  },
  {
    title: "Earthquake relief volunteer matching",
    stat: "Field",
    statLabel: "matching playbook",
    desc: "Skill overlap, language preference and proximity ranking help coordinators shortlist suitable responders faster.",
    image: "/assets/built2.webp",
    category: "Disaster Response",
  },
  {
    title: "Urban food distribution equity audit",
    stat: "Audit",
    statLabel: "equity signal",
    desc: "Bias reporting highlights disparity by region, language and need type so teams can review and rebalance decisions.",
    image: "/assets/built3.webp",
    category: "Urban Aid",
  },
  {
    title: "Community health outreach routing",
    stat: "Route",
    statLabel: "nearest-neighbor plan",
    desc: "Itinerary planning orders assignment stops using distance estimates to support more predictable field operations.",
    image: "/assets/built4.webp",
    category: "Public Health",
  },
  {
    title: "Refugee intake pipeline via email and CSV",
    stat: "Intake",
    statLabel: "email + CSV",
    desc: "Partner updates from email and CSV can enter the same case pipeline used by form-based intake.",
    image: "/assets/built5.webp",
    category: "Refugee Support",
  },
  {
    title: "Rural elder care need detection",
    stat: "Alert",
    statLabel: "vulnerability review",
    desc: "High-severity and high-vulnerability signals are surfaced for human review instead of being silently deprioritized.",
    image: "/assets/built6.webp",
    category: "Rural Outreach",
  },
];

const SCROLL_AMOUNT = 340;

export default function BuiltMoments() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") scroll("left");
      if (e.key === "ArrowRight") scroll("right");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [scroll]);

  return (
    <div className="my-32 mx-2 lg:mx-9">
      <motion.div
        className="marketing-container mb-10"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-end gap-6">
          <div className="mr-auto">
            <p className="text-xs uppercase tracking-[1.2px] text-c-green-100 mb-3">What&apos;s Possible</p>
            <h2 id="use-cases" className="marketing-h3 text-light-green scroll-mt-28 md:scroll-mt-32">Built for Moments That Matter</h2>
          </div>
          <div className="flex">
            <button
              className="hover:enabled:bg-light-green/10 group rounded-sm p-1 disabled:opacity-50"
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              onClick={() => scroll("left")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              className="hover:enabled:bg-light-green/10 group rounded-sm p-1 disabled:opacity-50"
              disabled={!canScrollRight}
              aria-label="Scroll right"
              onClick={() => scroll("right")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>

      <div className="no-scrollbar overflow-x-auto" ref={scrollRef}>
        <div className="marketing-container flex gap-4">
          {EXAMPLES.map((ex, idx) => (
            <motion.div
              key={ex.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex h-[420px] w-[340px] shrink-0 flex-col justify-end overflow-hidden rounded-2xl"
            >
              {/* Background image with hover zoom */}
              <div
                className="absolute inset-0 rounded-2xl bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                style={{ backgroundImage: `url(${ex.image})` }}
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

              {/* Hover border glow */}
              <div className="absolute inset-0 rounded-2xl border border-white/5 transition-all duration-300 group-hover:border-c-green-100/30 group-hover:shadow-[inset_0_0_30px_rgba(127,238,100,0.06)]" />

              {/* Category badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-block rounded-full border border-c-green-100/25 bg-black/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[1.5px] text-c-green-100 backdrop-blur-sm">
                  {ex.category}
                </span>
              </div>

              {/* Content */}
              <div className="relative z-10 px-5 pb-5 pt-8">
                {/* Stat callout */}
                <div className="mb-4 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-c-green-100">{ex.stat}</span>
                  <span className="text-xs uppercase tracking-wider text-light-green/60">{ex.statLabel}</span>
                </div>

                <h3 className="marketing-h4 text-light-green mb-2 leading-snug">{ex.title}</h3>
                <p className="text-sm leading-relaxed text-light-green/60">{ex.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
