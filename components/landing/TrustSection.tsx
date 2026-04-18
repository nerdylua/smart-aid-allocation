"use client";

import { useState } from "react";
import { motion } from "motion/react";

type AccordionItem = {
  title: string;
  content: string;
};

const ITEMS: AccordionItem[] = [
  {
    title: "Role-based access & audit trail",
    content:
      "Core workflows write audit events with timestamps and actor metadata. The data model includes user roles and row-level security is enabled as a foundation for stricter production policies.",
  },
  {
    title: "Human-in-the-loop AI oversight",
    content:
      "Critical cases with severity 9-10 automatically escalate for human review. Low-confidence triage scores are flagged, never silently deprioritized. AI assists and humans decide.",
  },
  {
    title: "Explainable decisions",
    content:
      "Every AI assessment includes a written rationale citing specific case details. Coordinators see exactly why a case was scored the way it was, enabling informed overrides.",
  },
  {
    title: "Data minimization & compliance",
    content:
      "Case records focus on operational essentials, and authentication is handled through Supabase Auth with Google OAuth and email/password support.",
  },
];

function PlusIcon({ open }: { open: boolean }) {
  return (
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
      className={`ml-auto shrink-0 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function Accordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      {ITEMS.map((item, idx) => (
        <div key={item.title}>
          <hr className="border-light-green/30 marketing-contained-negate-mx" />
          <div className="scroll-mt-32 py-5">
            <div className="group flex flex-col">
              <button
                className="flex w-full items-center gap-5"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <p className="marketing-h4 text-left">{item.title}</p>
                <PlusIcon open={openIndex === idx} />
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                style={{
                  gridTemplateRows: openIndex === idx ? "1fr" : "0fr",
                }}
              >
                <div className="overflow-hidden">
                  <p className="text-c-pale-green-60 pt-4 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <hr className="border-light-green/30 marketing-contained-negate-mx" />
    </>
  );
}

export default function TrustSection() {
  return (
    <>
      <div id="impact" />
      <section className="mb-8 mx-2 lg:mx-9">
        <div className="marketing-container">
        <div className="grid gap-5 md:grid-cols-12">
          <motion.div
            className="md:col-span-5"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 id="security" className="marketing-h3 mb-8 scroll-mt-28 md:mb-14 md:scroll-mt-32">
              <span className="text-c-green-100">Trust</span> and accountability
            </h2>
            <div className="hidden md:block">
              <Accordion />
            </div>
          </motion.div>
          <div className="hidden md:col-span-1 md:block" />
          <motion.div
            className="order-1 md:col-span-6 flex items-start justify-center -mt-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <video
              className="pointer-events-none select-none max-w-[560px] w-full object-contain"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              disablePictureInPicture
              disableRemotePlayback
              preload="auto"
              tabIndex={-1}
              draggable={false}
              onContextMenu={(event) => event.preventDefault()}
              src="/assets/accordian.mp4"
            />
          </motion.div>
        </div>
        <div className="mt-12 md:hidden">
          <Accordion />
        </div>
        </div>
      </section>
    </>
  );
}
