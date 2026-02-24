"use client";

import { FadeUp, ScaleOnHover } from "@/components/motion";
import { projects } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function ProjectsSection() {
  return (
    <section id="projects" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <FadeUp>
          <p className="mb-2 font-mono text-sm text-primary">
            03 — Projects
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Selected <span className="text-gradient">work</span>
          </h2>
          <p className="mb-12 max-w-xl text-muted-foreground">
            A curated selection of projects I&apos;ve architected and built.
            Each represents a different challenge and a different solution.
          </p>
        </FadeUp>

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project, i) => (
            <FadeUp key={project.title} delay={i * 0.1}>
              <ScaleOnHover>
                <Link
                  href={project.url}
                  target={project.url.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="glass-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl">
                    {/* Project image placeholder */}
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/10 via-accent/20 to-primary/5">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                        layoutId={`project-overlay-${project.title}`}
                      />
                      <div className="flex h-full items-center justify-center">
                        <span className="font-mono text-lg font-semibold text-primary/40 transition-colors group-hover:text-primary/60">
                          {project.title}
                        </span>
                      </div>
                      {/* Arrow indicator */}
                      <div className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100">
                        <ArrowUpRight className="size-4" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                          {project.title}
                        </h3>
                        <ExternalLink className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {project.tech.map((t) => (
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
                </Link>
              </ScaleOnHover>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
