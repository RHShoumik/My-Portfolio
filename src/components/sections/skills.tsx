"use client";

import { FadeUp, Marquee } from "@/components/motion";
import { skillGroups } from "@/lib/constants";

const allSkills = Array.from(new Set(skillGroups.flatMap((g) => g.skills)));
const half = Math.ceil(allSkills.length / 2);
const rowA = allSkills.slice(0, half);
const rowB = allSkills.slice(half);

export function SkillsSection() {
  return (
    <section id="skills" className="relative py-24 md:py-32">
      <div className="mx-auto mb-14 max-w-7xl px-5 md:px-8">
        <FadeUp>
          <p className="index-num mb-2 font-mono text-xs uppercase tracking-widest text-[var(--palette-swatch)]">
            04 — Skills
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Tech{" "}
            <span className="font-serif italic font-normal text-gradient">stack</span>
          </h2>
        </FadeUp>
      </div>

      {/* Full-bleed skill ticker */}
      <FadeUp delay={0.1} className="mb-16 flex flex-col gap-3 border-y border-border py-6">
        <Marquee speed="normal">
          {rowA.map((skill) => (
            <span
              key={skill}
              className="mx-5 flex items-center gap-5 font-serif text-3xl italic text-foreground/25 md:text-4xl"
            >
              {skill}
              <span className="font-mono text-lg not-italic text-[var(--palette-swatch)]">/</span>
            </span>
          ))}
        </Marquee>
        <Marquee speed="normal" reverse>
          {rowB.map((skill) => (
            <span
              key={skill}
              className="mx-5 flex items-center gap-5 font-serif text-3xl italic text-foreground/25 md:text-4xl"
            >
              {skill}
              <span className="font-mono text-lg not-italic text-[var(--palette-swatch)]">/</span>
            </span>
          ))}
        </Marquee>
      </FadeUp>

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid gap-x-8 gap-y-10 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, gi) => (
            <FadeUp key={group.category} delay={gi * 0.06}>
              <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {String(gi + 1).padStart(2, "0")} / {group.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    className="cursor-default border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-[var(--palette-swatch)] hover:bg-[var(--palette-swatch)] hover:text-background"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
