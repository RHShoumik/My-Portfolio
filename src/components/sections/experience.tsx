import { experiences } from "@/lib/constants";
import { SectionHeader } from "@/components/section-header";

export function ExperienceSection() {
  return (
    <section id="experience" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader eyebrow="Experience" title="Where I've worked">
          Four teams since 2020, from my first job building React apps to
          marketplaces with millions of users.
        </SectionHeader>

        <ol className="mt-14 space-y-3">
          {experiences.map((exp, i) => (
            <li
              key={exp.company}
              className="card grid gap-4 p-6 md:grid-cols-12 md:gap-8 md:p-8"
            >
              <div className="md:col-span-3">
                <p className="text-sm font-medium text-foreground/55">
                  {exp.period}
                </p>
                {i === 0 && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--palette-swatch)]/12 px-2.5 py-1 text-xs font-semibold text-[var(--palette-swatch)]">
                    <span className="size-1.5 rounded-full bg-[var(--palette-swatch)]" />
                    Current
                  </span>
                )}
              </div>

              <div className="md:col-span-9">
                <h3 className="font-display text-2xl font-bold leading-tight tracking-[-0.035em] md:text-3xl">
                  {exp.company}
                </h3>
                <p className="mt-1 text-foreground/60">{exp.role}</p>
                <p className="mt-4 max-w-3xl leading-7 text-foreground/75">
                  {exp.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {exp.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
