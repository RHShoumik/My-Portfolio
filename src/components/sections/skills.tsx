"use client";

import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";
import { skillGroups } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function SkillsSection() {
  return (
    <section id="skills" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--palette-swatch)_0%,transparent_50%)] opacity-[0.04]" />

      <div className="mx-auto max-w-6xl px-6">
        <FadeUp>
          <p className="mb-2 font-mono text-sm text-primary">04 — Skills</p>
          <h2 className="mb-12 text-3xl font-bold tracking-tight md:text-4xl">
            Tech <span className="text-gradient">stack</span>
          </h2>
        </FadeUp>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, gi) => (
            <FadeUp key={group.category} delay={gi * 0.08}>
              <div className="glass-card p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">
                  {group.category}
                </h3>
                <StaggerContainer staggerDelay={0.04}>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill) => (
                      <StaggerItem key={skill}>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge
                            variant="outline"
                            className="cursor-default border-border/60 font-normal transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                          >
                            {skill}
                          </Badge>
                        </motion.div>
                      </StaggerItem>
                    ))}
                  </div>
                </StaggerContainer>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
