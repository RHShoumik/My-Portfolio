"use client";

import { FadeUp } from "@/components/motion";
import { experiences } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";

export function ExperienceSection() {
  return (
    <section id="experience" className="relative py-24 md:py-32">
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,var(--palette-swatch)_0%,transparent_50%)] opacity-[0.04]" />

      <div className="mx-auto max-w-4xl px-6">
        <FadeUp>
          <p className="mb-2 font-mono text-sm text-primary">
            02 — Experience
          </p>
          <h2 className="mb-12 text-3xl font-bold tracking-tight md:text-4xl">
            Where I&apos;ve <span className="text-gradient">worked</span>
          </h2>
        </FadeUp>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border md:left-1/2 md:-translate-x-px" />

          {experiences.map((exp, i) => (
            <FadeUp key={exp.company} delay={i * 0.1}>
              <div
                className={`relative mb-12 flex flex-col pl-12 md:mb-16 md:pl-0 ${
                  i % 2 === 0
                    ? "md:pr-[calc(50%+2rem)] md:text-right"
                    : "md:pl-[calc(50%+2rem)]"
                }`}
              >
                {/* Timeline dot */}
                <motion.div
                  className={`absolute left-2 top-1.5 z-10 flex size-[14px] items-center justify-center rounded-full border-2 border-primary bg-background md:left-1/2 md:-translate-x-1/2`}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2, type: "spring" }}
                >
                  <span className="size-[6px] rounded-full bg-primary" />
                </motion.div>

                {/* Content */}
                <div className="glass-card group p-5 transition-all hover:border-primary/30 hover:shadow-lg">
                  <div className={`flex items-start gap-3 ${i % 2 === 0 ? "md:flex-row-reverse" : ""}`}>
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Briefcase className="size-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {exp.role}
                      </h3>
                      <p className="mb-1 text-sm font-medium text-primary">
                        {exp.company}
                      </p>
                      <p className="mb-3 font-mono text-xs text-muted-foreground">
                        {exp.period}
                      </p>
                      <p className={`mb-3 text-sm text-muted-foreground leading-relaxed ${i % 2 === 0 ? "md:text-right" : ""}`}>
                        {exp.description}
                      </p>
                      <div className={`flex flex-wrap gap-1.5 ${i % 2 === 0 ? "md:justify-end" : ""}`}>
                        {exp.tech.map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
