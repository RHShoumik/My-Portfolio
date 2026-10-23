"use client";

import { FadeUp, StaggerContainer, StaggerItem, Counter, TiltCard } from "@/components/motion";
import { Code2, Layers, ShoppingCart, Scaling } from "lucide-react";
import { experiences, projects } from "@/lib/constants";
import Image from "next/image";

const highlights = [
  {
    icon: Code2,
    title: "4+ Years React",
    description: "Deep expertise in React ecosystem, from hooks to server components.",
  },
  {
    icon: Layers,
    title: "TypeScript First",
    description: "End-to-end type safety with advanced patterns and generics.",
  },
  {
    icon: ShoppingCart,
    title: "E-commerce Systems",
    description: "Built multi-vendor marketplaces serving millions of users.",
  },
  {
    icon: Scaling,
    title: "Scalable Architecture",
    description: "Component systems, design tokens, and micro-frontend patterns.",
  },
];

const stats = [
  { value: 4, suffix: "+", label: "Years experience" },
  { value: experiences.length, suffix: "", label: "Companies" },
  { value: projects.length, suffix: "", label: "Flagship products" },
  { value: 40, suffix: "%", label: "Faster load times" },
];

export function AboutSection() {
  return (
    <section id="about" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <FadeUp>
          <p className="index-num mb-2 font-mono text-xs uppercase tracking-widest text-[var(--palette-swatch)]">
            01 — About
          </p>
          <h2 className="mb-16 max-w-2xl text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            From console logs to{" "}
            <span className="font-serif italic font-normal text-gradient">
              mountain fogs.
            </span>
          </h2>
        </FadeUp>

        <div className="grid gap-12 lg:grid-cols-12">
          {/* Photo + stats */}
          <FadeUp delay={0.1} className="lg:col-span-4">
            <div className="relative mx-auto max-w-xs lg:mx-0 lg:max-w-none">
              <TiltCard max={8} className="relative overflow-hidden border border-border">
                <Image
                  src="/images/about-photo.jpeg"
                  alt="Ragib Hassan Shoumik — hiking"
                  width={400}
                  height={500}
                  className="aspect-[4/5] h-auto w-full object-cover grayscale-[20%]"
                />
              </TiltCard>
              {/* eslint-disable-next-line react/jsx-no-comment-textnodes -- intentional caption text, not a JSX comment */}
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                // off-screen, trekking somewhere far
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-border bg-border">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-background p-4">
                  <div className="index-num text-3xl font-bold text-foreground md:text-4xl">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </FadeUp>

          {/* Bio + highlights */}
          <div className="lg:col-span-8">
            <FadeUp delay={0.2}>
              <div className="space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                <p>
                  I&apos;m a Frontend Engineer specializing in React and Next.js with a
                  passion for building products that are fast, accessible, and
                  beautifully crafted. Over the past 4+ years, I&apos;ve worked across
                  startups and product companies, shipping features used by millions.
                </p>
                <p>
                  My journey spans from early-stage startups where I wore multiple hats,
                  to enterprise-grade platforms at 6amTech where I architected
                  multi-vendor marketplace frontends. Currently at JustGo Technologies,
                  I lead frontend development for membership-management platforms with
                  complex booking flows and real-time data.
                </p>
                <p>
                  I care deeply about developer experience — clean abstractions,
                  reusable component systems, and codebases that scale gracefully.
                  When I&apos;m not coding, you&apos;ll find me traveling and exploring
                  new places — discovering cultures, trekking through nature, and
                  finding inspiration beyond the screen.
                </p>
              </div>
            </FadeUp>

            {/* Highlights */}
            <StaggerContainer className="mt-12" staggerDelay={0.1}>
              <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
                {highlights.map((item) => (
                  <StaggerItem key={item.title}>
                    <div className="group h-full bg-background p-5 transition-colors hover:bg-accent/40">
                      <item.icon className="mb-3 size-5 text-[var(--palette-swatch)] transition-transform group-hover:scale-110" />
                      <h3 className="mb-1 text-sm font-semibold">{item.title}</h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </StaggerItem>
                ))}
              </div>
            </StaggerContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
