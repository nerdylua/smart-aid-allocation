"use client";

import { motion } from "motion/react";

export default function CtaSection() {
  return (
    <section className="marketing-container mt-8 mb-8 md:mb-10">
      <div
        className="mb-8 h-[2px] w-full"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(127,238,100,0.5) 20%, rgba(127,238,100,0.5) 80%, transparent)",
        }}
      />
      <div className="grid gap-x-5 gap-y-10 md:grid-cols-2">
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <video
            loop
            muted
            playsInline
            disablePictureInPicture
            autoPlay
            className="h-full w-full max-w-[95%] md:max-w-[92%]"
            style={{ objectFit: "contain" }}
          >
            <source
              src="/assets/cta.mp4"
              type="video/mp4"
            />
          </video>
        </motion.div>
        <motion.div
          className="flex flex-col items-center justify-center md:items-start"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="marketing-h2 mb-7 max-w-lg text-center md:mb-14 md:text-left">
            Start coordinating impact today.
          </h2>
          <a
            className="btn-marketing btn-primary btn-dark"
            href="#"
          >
            Get Started
          </a>
          <p className="text-light-green/60 mt-6 text-sm">Free for community organizations</p>
        </motion.div>
      </div>
    </section>
  );
}
