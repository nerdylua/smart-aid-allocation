"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

type Benefit = {
  label: string;
  title: string;
  description: string;
  image: string;
};

const BENEFITS: Benefit[] = [
  {
    label: "AI-POWERED TRIAGE",
    title: "AI-powered triage",
    description:
      "Three specialized agents score severity, vulnerability, and freshness - surfacing the most urgent needs first while flagging uncertain cases for human review.",
    image: "/assets/placeholder.svg",
  },
  {
    label: "SMART VOLUNTEER MATCHING",
    title: "Smart volunteer matching",
    description:
      "Automatically rank and match volunteers by skill overlap, language preference, and geographic proximity - preventing overloading and ensuring the right person responds.",
    image: "/assets/placeholder.svg",
  },
  {
    label: "MULTI-CHANNEL INTAKE",
    title: "Multi-channel intake",
    description:
      "Accept need signals from web forms, CSV batch imports, and email - all feeding a single canonical pipeline with auto-geocoding and duplicate detection.",
    image: "/assets/placeholder.svg",
  },
  {
    label: "EQUITY MONITORING",
    title: "Equity monitoring",
    description:
      "Built-in bias auditing measures disparity by region, language, and need type - ensuring aid reaches every community fairly and verifiably.",
    image: "/assets/placeholder.svg",
  },
];

const CARD_STYLES = [
  { top: 128, height: 630, marginTop: 0 },
  { top: 188, height: 570, marginTop: -180 },
  { top: 248, height: 510, marginTop: -120 },
  { top: 308, height: 450, marginTop: -60 },
];

export default function BenefitsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const update = () => {
      const cards = cardRefs.current;
      let active = 0;

      for (let i = 0; i < cards.length; i++) {
        const el = cards[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.45) {
          active = i;
        }
      }

      setActiveIndex(active);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      id="features"
      className="marketing-container mb-32 mt-16 grid w-full grid-cols-1 sm:mt-20 lg:my-28 lg:grid-cols-[16.66%_1fr] lg:gap-12"
    >
      {/* Left sidebar */}
      <div className="row-2 col-1 relative hidden lg:block">
        <div className="sticky flex flex-col gap-4 lg:top-32">
          {BENEFITS.map((b, idx) => (
            <div key={b.label} className="flex items-start gap-4">
              <div
                className={`mt-[3px] h-2 w-2 flex-shrink-0 transition-colors duration-300 ${
                  idx === activeIndex
                    ? "bg-c-pale-green-100"
                    : "bg-c-pale-green-30"
                }`}
              />
              <div
                className={`text-xs leading-snug tracking-[1.2px] transition-colors duration-300 ${
                  idx === activeIndex
                    ? "text-c-pale-green-100"
                    : "text-c-pale-green-30"
                }`}
              >
                {b.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heading */}
      <div className="row-1 col-2">
        <motion.div
          className="mb-5 text-xs uppercase tracking-[1.2px]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          Why Sahaya
        </motion.div>
        <motion.h2
          className="text-c-pale-green-100 font-goga bg-black pb-8 text-5xl font-normal md:text-6xl lg:pb-0"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span>
            Designed to turn scattered needs
            <br className="hidden xl:block" /> into coordinated action.
          </span>
        </motion.h2>
      </div>

      {/* Cards */}
      <div className="row-2 col-2 min-w-0">
        <div className="relative">
          {BENEFITS.map((b, idx) => (
            <motion.section
              key={b.title}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="benefit-card border-landing-medium-green-border mb-8 w-full border-t bg-black text-white lg:sticky lg:mb-0 lg:flex lg:gap-15 gap-8"
              style={
                {
                  "--section-top": `${CARD_STYLES[idx].top}px`,
                  "--section-height": `${CARD_STYLES[idx].height}px`,
                  "--section-margin-top": `${CARD_STYLES[idx].marginTop}px`,
                } as React.CSSProperties
              }
            >
              <div className="flex flex-col items-start gap-4 py-8 lg:w-[40%] lg:gap-4 lg:pt-4">
                <h3 className="font-goga text-c-pale-green-100 text-2xl xl:min-w-[300px]">
                  {b.title}
                </h3>
                <p className="text-c-pale-green-60 leading-[1.5]">
                  {b.description}
                </p>
              </div>
              <div
                className="benefit-asset-bg border-landing-medium-green-border relative z-10 flex w-full items-center justify-center border bg-cover bg-center lg:border-t-0 lg:py-30"
              >
                <div className="benefit-asset-container flex max-w-full overflow-hidden">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl px-4 py-6 lg:py-0 xl:px-0">
                    <img
                      src={b.image}
                      alt={b.title}
                      className="h-auto w-full overflow-hidden rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}
