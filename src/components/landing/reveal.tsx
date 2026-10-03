"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({ children, delay = 0, className, y = 24 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ eyebrow, title, body, align = "start", invert = false }: { eyebrow: string; title: string; body?: string; align?: "start" | "center"; invert?: boolean }) {
  return (
    <Reveal className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <div className={`mb-4 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] ${invert ? "text-copper" : "text-copper"}`}>
        <span className="h-px w-8 bg-copper/60" />
        {eyebrow}
      </div>
      <h2 className={`font-display text-4xl leading-[1.15] font-semibold text-balance sm:text-5xl ${invert ? "text-ivory" : ""}`}>{title}</h2>
      {body ? <p className={`mt-4 text-lg leading-relaxed ${invert ? "text-slate-blue" : "text-muted-foreground"}`}>{body}</p> : null}
    </Reveal>
  );
}
