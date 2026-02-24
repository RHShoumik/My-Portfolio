"use client";

import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";
import { Code2, Layers, ShoppingCart, Scaling } from "lucide-react";
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

export function AboutSection() {
  return (
    <section id="about" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <FadeUp>
          <p className="mb-2 font-mono text-sm text-primary">01 — About</p>
          <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
            Engineering interfaces that{" "}
            <span className="text-gradient">matter</span>
          </h2>
        </FadeUp>

        <div className="grid gap-12 md:grid-cols-5">
          {/* Photo */}
          <FadeUp delay={0.1} className="md:col-span-2">
            <div className="relative mx-auto max-w-xs md:max-w-none">
              <div className="relative overflow-hidden rounded-2xl border border-border/40 shadow-xl">
                <Image
                  src="/images/about-photo.jpeg"
                  alt="Ragib Hassan Shoumik — hiking"
                  width={400}
                  height={500}
                  className="h-auto w-full object-cover"
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
              </div>
              {/* Decorative accent */}
              <div className="absolute -bottom-3 -right-3 -z-10 size-full rounded-2xl border border-primary/20" />
            </div>
          </FadeUp>

          {/* Bio */}
          <FadeUp delay={0.2} className="md:col-span-3">
            <div className="space-y-4 text-muted-foreground leading-relaxed">
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
                I lead frontend development for travel-tech platforms with complex
                booking flows and real-time data.
              </p>
              <p>
                I care deeply about developer experience — clean abstractions,
                reusable component systems, and codebases that scale gracefully.
                When I&apos;m not coding, you&apos;ll find me traveling and exploring
                new places — I love discovering different cultures, trekking
                through nature, and finding inspiration beyond the screen.
              </p>
            </div>
          </FadeUp>

          {/* Highlights grid */}
          <StaggerContainer className="md:col-span-5" staggerDelay={0.1}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {highlights.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="glass-card group p-4 transition-colors hover:border-primary/30">
                    <item.icon className="mb-2 size-5 text-primary transition-transform group-hover:scale-110" />
                    <h3 className="mb-1 text-sm font-semibold">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
