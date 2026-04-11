"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import BackgroundGrid from "./BackgroundGrid";

const EASE = [0.16, 1, 0.3, 1] as const;

function AnnouncementPill() {
  return (
    <Link
      href="/dashboard"
      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full p-px transition-shadow duration-300 shadow-[0_0_20px_-8px_rgba(127,238,100,0.5)] hover:shadow-[0_0_30px_-5px_rgba(127,238,100,0.6)]"
    >
      <div
        className="absolute inset-[-100%] animate-spin opacity-50"
        style={{
          animationDuration: "8s",
          background:
            "conic-gradient(from 0deg, #7fee64, #7fee64 55%, #09AF58 70%, #1d231c 85%, #7fee64)",
        }}
      />
      <span className="relative z-10 inline-flex items-center gap-2 rounded-full bg-[rgba(10,25,12,0.92)] px-4 py-1.5 text-sm text-c-green-100 backdrop-blur-sm transition-colors group-hover:text-light-green">
        New: Built-in Equity Auditing
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-hover:translate-x-0.5"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}

const HERO_GRID_STYLES: Record<number, React.CSSProperties> = {
  0: {
    background:
      "linear-gradient(to bottom, transparent 25%, rgba(127,238,100,0.03) 45%, rgba(127,238,100,0.03) 75%, transparent)",
  },
  1: {
    background:
      "linear-gradient(to bottom, transparent 15%, rgba(127,238,100,0.05) 35%, rgba(127,238,100,0.05) 75%, transparent)",
  },
  2: {
    background:
      "linear-gradient(to bottom, transparent 8%, rgba(127,238,100,0.07) 25%, rgba(127,238,100,0.07) 80%, transparent)",
  },
  3: {
    background:
      "linear-gradient(to bottom, transparent 15%, rgba(127,238,100,0.05) 35%, rgba(127,238,100,0.05) 75%, transparent)",
  },
  4: {
    background:
      "linear-gradient(to bottom, transparent 25%, rgba(127,238,100,0.03) 45%, rgba(127,238,100,0.03) 75%, transparent)",
  },
};

const HERO_METRICS = [
  { label: "Cases Triaged", value: "2.4k" },
  { label: "Active Volunteers", value: "312" },
  { label: "Closure Rate", value: "94%" },
] as const;

function HeroProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[1080px]">
      <div className="absolute inset-x-[14%] -top-8 h-24 rounded-full bg-c-green-100/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,17,11,0.94),rgba(6,10,7,0.9))] shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(127,238,100,0.08),transparent_30%,transparent_70%,rgba(127,238,100,0.06))]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-px bg-[linear-gradient(90deg,transparent,rgba(127,238,100,0.08)_18%,rgba(127,238,100,0.2)_82%,transparent)]" />

        <div className="relative z-[2] border-b border-white/8 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a6a]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#f7c948]" />
              <span className="h-2.5 w-2.5 rounded-full bg-c-green-100" />
            </div>
            <div className="rounded-full border border-c-green-100/20 bg-c-green-100/8 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-c-green-100 uppercase">
              Command Center
            </div>
          </div>
        </div>

        <div className="relative z-[2] grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="rounded-[22px] border border-white/8 bg-black/30 p-4 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.18em] text-light-green/45 uppercase">
                  triage.pipeline
                </p>
                <p className="mt-1 text-sm text-light-green/80">
                  AI agents processing incoming needs
                </p>
              </div>
              <div className="rounded-full border border-c-green-100/18 bg-c-green-100/8 px-3 py-1 text-xs text-c-green-100">
                Live
              </div>
            </div>

            <div className="space-y-2 font-mono text-[12px] leading-6 text-light-green/78 sm:text-[13px]">
              <div>
                <span className="text-c-green-100">&gt;</span> sahaya triage --intake flood-response
              </div>
              <div className="text-light-green/45">
                scoring severity, vulnerability, freshness...
              </div>
              <div className="flex items-center gap-2 text-c-pale-green-80">
                <span className="h-1.5 w-1.5 rounded-full bg-c-green-100" />
                3 cases flagged for human review
              </div>
              <div className="flex items-center gap-2 text-c-pale-green-80">
                <span className="h-1.5 w-1.5 rounded-full bg-c-green-100" />
                12 volunteers matched by skill &amp; proximity
              </div>
              <div className="flex items-center gap-2 text-c-pale-green-80">
                <span className="h-1.5 w-1.5 rounded-full bg-c-green-100" />
                dispatch complete, SLA assigned
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {HERO_METRICS.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3"
                >
                  <p className="text-[11px] tracking-[0.18em] text-light-green/45 uppercase">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-light-green">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:pr-14">
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.18em] text-light-green/45 uppercase">
                    Response Volume
                  </p>
                  <p className="mt-1 text-sm text-light-green/75">
                    cases resolved across all active incidents
                  </p>
                </div>
                <p className="text-lg font-semibold text-c-green-100">1.8k</p>
              </div>

              <div className="mt-5 flex h-24 items-end gap-2">
                <div className="h-[28%] flex-1 rounded-t-full bg-c-green-100/25" />
                <div className="h-[42%] flex-1 rounded-t-full bg-c-green-100/30" />
                <div className="h-[54%] flex-1 rounded-t-full bg-c-green-100/35" />
                <div className="h-[68%] flex-1 rounded-t-full bg-c-green-100/45" />
                <div className="h-[82%] flex-1 rounded-t-full bg-c-green-100/60" />
                <div className="h-[72%] flex-1 rounded-t-full bg-c-green-100/50" />
                <div className="h-[92%] flex-1 rounded-t-full bg-c-green-100" />
              </div>
            </div>

            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs tracking-[0.18em] text-light-green/45 uppercase">
                  Coverage
                </p>
                <span className="inline-flex items-center gap-2 text-xs text-light-green/70">
                  <span className="h-2 w-2 rounded-full bg-c-green-100" />
                  equity monitoring active
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Medical & Health", load: "92%" },
                  { name: "Food & Shelter", load: "78%" },
                  { name: "Elder & Child Care", load: "64%" },
                ].map((region) => (
                  <div key={region.name}>
                    <div className="mb-1 flex items-center justify-between text-sm text-light-green/75">
                      <span>{region.name}</span>
                      <span>{region.load}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/6">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#3f7b34,#7fee64)]"
                        style={{ width: region.load }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [hasMouseMoved, setHasMouseMoved] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    let raf = 0;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        if (!hasMouseMoved) setHasMouseMoved(true);
      });
    };

    el.addEventListener("mousemove", handleMouseMove);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(raf);
    };
  }, [hasMouseMoved]);

  return (
    <div
      ref={heroRef}
      id="platform"
      className="relative flex min-h-[90vh] items-center justify-center overflow-hidden"
    >
      {/* Background grid - curtain fade effect */}
      <BackgroundGrid gridLineStyles={HERO_GRID_STYLES} />

      {/* Radial gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 55%, rgba(127,238,100,0.12), transparent 70%), radial-gradient(ellipse 60% 40% at 30% 40%, rgba(9,175,88,0.10), transparent 70%), radial-gradient(ellipse 50% 30% at 70% 50%, rgba(191,249,180,0.06), transparent 70%)",
        }}
      />

      {/* Interactive cursor glow - desktop only */}
      <div
        className="pointer-events-none absolute left-1/2 top-[11%] z-[1] h-[42vh] min-h-[260px] w-[min(92vw,980px)] -translate-x-1/2 rounded-[40px] opacity-45"
        style={{
          backgroundImage:
            "linear-gradient(rgba(221,255,220,0.075) 1px, transparent 1px), linear-gradient(90deg, rgba(221,255,220,0.075) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 48%, rgba(0,0,0,0.18) 74%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 48%, rgba(0,0,0,0.18) 74%, transparent 100%)",
        }}
      />

      <div
        className="pointer-events-none absolute left-1/2 top-[18%] z-[1] h-[28vh] min-h-[180px] w-[min(88vw,900px)] -translate-x-1/2 rounded-[32px] opacity-35"
        style={{
          background:
            "linear-gradient(180deg, rgba(127,238,100,0.08), transparent 45%, transparent 100%)",
          filter: "blur(18px)",
        }}
      />

      <div
        className="pointer-events-none absolute z-[1] hidden md:block"
        style={{
          top: 0,
          left: 0,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(127,238,100,0.15), transparent 70%)",
          filter: "blur(60px)",
          transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)`,
          transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: hasMouseMoved ? 1 : 0,
        }}
      />

      {/* SVG noise texture */}
      <svg
        className="pointer-events-none absolute inset-0 z-[3] h-full w-full opacity-[0.03]"
        aria-hidden="true"
      >
        <filter id="heroNoise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#heroNoise)" />
      </svg>

      {/* Top fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] h-32 bg-gradient-to-b from-black to-transparent" />
      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-40 bg-gradient-to-t from-black to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-[1220px] flex-col items-center gap-y-6 px-4 pt-16 pb-10 sm:gap-y-7 sm:pt-20 sm:pb-14">
        {/* Announcement Pill */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
        >
          <AnnouncementPill />
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="marketing-h1 shrink-0 text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: EASE }}
        >
          <span className="text-c-green-100">Need intelligence</span> that
          <br className="hidden min-[500px]:block" /> saves lives
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-c-pale-green-80 marketing-h5-medium max-w-[640px] text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
        >
          Transform scattered community need signals into prioritized, equitable
          responses - with AI-powered triage, smart volunteer matching, and
          closed-loop accountability from intake to verified closure.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex justify-center gap-4 pt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
        >
          {/* Primary */}
          <Link
            className="group/btn relative inline-flex items-center justify-center overflow-hidden rounded-full bg-c-green-100 px-6 py-2.5 text-sm font-medium text-black transition-all active:scale-[0.97]"
            href="/dashboard"
          >
            <span className="absolute inset-0 origin-left scale-x-0 rounded-full bg-light-green transition-transform duration-300 ease-out group-hover/btn:scale-x-100" />
            <span className="relative z-10">Open Dashboard</span>
          </Link>

          {/* Secondary */}
          <a
            className="group/btn relative inline-flex items-center justify-center overflow-hidden rounded-full border border-light-green/30 px-6 py-2.5 text-sm font-medium text-light-green transition-all active:scale-[0.97]"
            href="#features"
          >
            <span className="absolute inset-0 origin-left scale-x-0 rounded-full bg-c-green-100 transition-transform duration-300 ease-out group-hover/btn:scale-x-100" />
            <span className="relative z-10 transition-colors duration-300 group-hover/btn:text-black">
              See How It Works
            </span>
          </a>
        </motion.div>

        <motion.div
          className="w-full pt-6 sm:pt-8"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.85, ease: EASE }}
        >
          <HeroProductPreview />
        </motion.div>
      </div>
    </div>
  );
}
