import {
  ArrowUpRight,
  FileText,
  Megaphone,
  ShoppingBag,
  ShoppingBasket,
  Store,
  Tv,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { projects } from "@/lib/constants";
import { SectionHeader } from "@/components/section-header";

// One icon per project, in a tile tinted with the site accent.
const icons: LucideIcon[] = [ShoppingBasket, UtensilsCrossed, ShoppingBag, Megaphone, Tv, Store, FileText];

export function ProjectsSection() {
  return (
    <section id="projects" className="bg-[var(--tint)] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader eyebrow="Projects" title="Things I've built">
          A few products I&apos;ve worked on. Click a card to visit the live
          site.
        </SectionHeader>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {projects.map((project, i) => {
            const Icon = icons[i % icons.length];
            const isLive = project.url.startsWith("http");

            const content = (
              <>
                <div className="relative grid aspect-[16/9] place-items-center overflow-hidden bg-[var(--palette-swatch)]/[0.07]">
                  <span className="absolute left-5 top-4 text-sm font-medium text-foreground/40">
                    0{i + 1}
                  </span>
                  <span className="grid size-20 place-items-center rounded-3xl border border-border bg-card shadow-sm transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3">
                    <Icon className="size-9 text-[var(--palette-swatch)]" strokeWidth={1.6} />
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6 md:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-2xl font-bold leading-tight tracking-[-0.035em] md:text-[1.75rem]">
                      {project.title}
                    </h3>
                    {isLive && (
                      <ArrowUpRight className="mt-1 size-6 shrink-0 text-foreground/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--palette-swatch)]" />
                    )}
                  </div>
                  <p className="mt-3 leading-7 text-foreground/70">
                    {project.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.tech.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground/70"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="mt-auto pt-6 text-sm font-semibold">
                    {isLive ? (
                      <span className="text-[var(--palette-swatch)]">
                        Visit site →
                      </span>
                    ) : (
                      <span className="text-foreground/45">Not public yet</span>
                    )}
                  </p>
                </div>
              </>
            );

            const className = "card group flex h-full flex-col overflow-hidden";

            return isLive ? (
              <a
                key={project.title}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {content}
              </a>
            ) : (
              <div key={project.title} className={className}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
