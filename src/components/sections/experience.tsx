"use client";

import { useState } from "react";
import { FadeUp } from "@/components/motion";
import { experiences } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

export function ExperienceSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="experience" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <FadeUp>
          <p className="index-num mb-2 font-mono text-xs uppercase tracking-widest text-[var(--palette-swatch)]">
            02 — Experience
          </p>
          <h2 className="mb-14 text-3xl font-bold tracking-tight md:text-5xl">
            Where I&apos;ve{" "}
            <span className="font-serif italic font-normal text-gradient">worked</span>
          </h2>
        </FadeUp>

        <div className="border-t border-border">
          {experiences.map((exp, i) => {
            const isOpen = openIndex === i;
            return (
              <FadeUp key={exp.company} delay={i * 0.05}>
                <div className="border-b border-border">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="group flex w-full flex-col gap-2 py-6 text-left md:flex-row md:items-baseline md:justify-between md:gap-6"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-baseline gap-4 md:gap-8">
                      <span className="index-num shrink-0 text-xs text-muted-foreground/50">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`text-2xl font-bold tracking-tight transition-colors sm:text-3xl md:text-4xl ${
                          isOpen ? "text-[var(--palette-swatch)]" : "group-hover:text-[var(--palette-swatch)]"
                        }`}
                      >
                        {exp.company}
                      </span>
                    </div>

                    <div className="flex items-center gap-5 pl-10 font-mono text-xs uppercase tracking-wide text-muted-foreground md:pl-0">
                      <span className="hidden sm:inline">{exp.role}</span>
                      <span>{exp.period}</span>
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex size-6 shrink-0 items-center justify-center border border-foreground/40 text-foreground"
                      >
                        <Plus className="size-3.5" />
                      </motion.span>
                    </div>
                  </button>

                  <div className="pl-10 sm:hidden">
                    <p className="mb-3 -mt-2 font-mono text-xs text-muted-foreground">{exp.role}</p>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="overflow-hidden"
                      >
                        <div className="max-w-2xl pb-8 pl-10 md:pl-16">
                          <p className="mb-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                            {exp.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {exp.tech.map((t) => (
                              <span
                                key={t}
                                className="border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
