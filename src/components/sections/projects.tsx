"use client";

import { useRef, useState } from "react";
import { FadeUp, ScrambleText } from "@/components/motion";
import { projects } from "@/lib/constants";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

export function ProjectsSection() {
  const [hovered, setHovered] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  return (
    <section id="projects" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <FadeUp>
          <p className="index-num mb-2 font-mono text-xs uppercase tracking-widest text-[var(--palette-swatch)]">
            03 — Projects
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
            Selected{" "}
            <span className="font-serif italic font-normal text-gradient">work</span>
          </h2>
          <p className="mb-14 max-w-xl text-muted-foreground">
            A curated selection of projects I&apos;ve architected and built.
            Hover a title on desktop for a preview.
          </p>
        </FadeUp>

        <div
          ref={containerRef}
          onMouseMove={(e) => {
            x.set(e.clientX);
            y.set(e.clientY);
          }}
          className="border-t border-border"
        >
          {projects.map((project, i) => (
            <FadeUp key={project.title} delay={i * 0.06}>
              <Link
                href={project.url}
                target={project.url.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="group block border-b border-border py-7 md:py-9"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-8">
                  <div className="flex items-baseline gap-4 md:gap-8">
                    <span className="index-num text-xs text-muted-foreground/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-3xl font-bold tracking-tight transition-colors group-hover:text-[var(--palette-swatch)] sm:text-4xl md:text-5xl">
                      <ScrambleText text={project.title} />
                    </h3>
                  </div>
                  <ArrowUpRight className="hidden size-6 shrink-0 -translate-x-1 translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 md:block" />
                </div>

                <div className="mt-3 flex flex-col gap-3 pl-0 md:flex-row md:items-center md:justify-between md:pl-14">
                  <p className="max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((t) => (
                      <span
                        key={t}
                        className="border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>

      {/* Cursor-follow preview tile (desktop only) */}
      <AnimatePresence>
        {hovered !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            style={{ x: springX, y: springY }}
            className="pointer-events-none fixed left-0 top-0 z-40 hidden w-72 -translate-x-1/2 -translate-y-[130%] overflow-hidden border border-foreground/15 bg-card shadow-2xl md:block"
          >
            <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
              <span className="size-2 rounded-full bg-muted-foreground/30" />
              <span className="size-2 rounded-full bg-muted-foreground/30" />
              <span className="size-2 rounded-full bg-muted-foreground/30" />
            </div>
            <div
              className="flex aspect-video flex-col items-center justify-center gap-2"
              style={{ backgroundColor: "color-mix(in oklch, var(--palette-swatch) 12%, var(--card))" }}
            >
              <span className="index-num text-5xl font-bold text-[var(--palette-swatch)]">
                {String(hovered + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {projects[hovered].title}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
