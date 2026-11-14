import { skillGroups } from "@/lib/constants";
import { SectionHeader } from "@/components/section-header";
import { cn } from "@/lib/utils";

// The tools I reach for first, highlighted in the accent colour.
const favourites = new Set([
  "React.js",
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "React Query",
]);

export function SkillsSection() {
  return (
    <section id="skills" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader eyebrow="Skills" title="What I work with">
          The ones I reach for first are highlighted.
        </SectionHeader>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group) => (
            <div key={group.category} className="card p-6">
              <h3 className="font-display text-xl font-bold tracking-[-0.03em]">
                {group.category}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm font-medium",
                      favourites.has(skill)
                        ? "border-[var(--palette-swatch)]/30 bg-[var(--palette-swatch)]/10 text-[var(--palette-swatch)]"
                        : "border-border bg-secondary text-foreground/70"
                    )}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
