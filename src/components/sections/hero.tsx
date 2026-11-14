import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUpRight,
  Briefcase,
  FileText,
  MapPin,
} from "lucide-react";

const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden bg-[var(--tint)] pb-16 pt-32 md:pb-20 md:pt-40"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-44 -z-10 size-[34rem] rounded-full border border-[var(--palette-swatch)]/10 md:size-[48rem]"
      >
        <div className="absolute inset-10 rounded-full border border-[var(--palette-swatch)]/[0.08]" />
        <div className="absolute inset-24 rounded-full border border-[var(--palette-swatch)]/[0.06]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 md:px-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <p
            className="rise inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55"
            style={delay(0.05)}
          >
            <span className="size-2 rounded-full bg-[var(--palette-swatch)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--palette-swatch)_14%,transparent)]" />
            Ragib Hassan Shoumik · Frontend engineer
          </p>

          <h1
            className="rise mt-7 max-w-3xl font-display text-[3.5rem] font-semibold leading-[0.96] tracking-[-0.065em] sm:text-7xl lg:text-[6.2rem]"
            style={delay(0.12)}
          >
            Thoughtful code.
            <span className="mt-2 block text-[var(--palette-swatch)]">
              Human feeling.
            </span>
          </h1>

          <p
            className="rise mt-7 max-w-2xl text-lg leading-relaxed text-foreground/70 md:text-xl"
            style={delay(0.2)}
          >
            I&apos;m a frontend engineer in Dhaka building clear, dependable web
            experiences with React, Next.js, and TypeScript. I care about the
            small details that make complex products feel simple.
          </p>

          <div
            className="rise mt-9 flex flex-wrap items-center gap-3"
            style={delay(0.27)}
          >
            <Link href="#projects" className="btn btn-primary">
              Explore my work
              <ArrowDown className="size-4" />
            </Link>
            <Link
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn border-transparent bg-transparent hover:bg-card"
            >
              Résumé
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div
            className="rise mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-foreground/10 pt-6"
            style={delay(0.34)}
          >
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <Briefcase className="size-4 text-[var(--palette-swatch)]" />
              <span>
                Currently at <strong className="font-semibold text-foreground">JustGo</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <MapPin className="size-4 text-[var(--palette-swatch)]" />
              Dhaka, Bangladesh
            </div>
          </div>
        </div>

        <div
          className="rise relative mx-auto w-full max-w-md lg:col-span-5 lg:justify-self-end"
          style={delay(0.22)}
        >
          <div
            aria-hidden="true"
            className="absolute -bottom-5 -left-5 -z-10 size-32 rounded-bl-[4rem] border-b-2 border-l-2 border-[var(--palette-swatch)]/35"
          />
          <figure className="relative overflow-hidden rounded-[2rem_2rem_2rem_7rem] border border-foreground/10 bg-card shadow-[0_32px_80px_-42px_rgba(23,37,31,0.42)]">
            <Image
              src="/images/hero-photo.jpg"
              alt="Ragib Hassan Shoumik outdoors in the mountains"
              width={700}
              height={850}
              priority
              sizes="(min-width: 1024px) 420px, 90vw"
              className="aspect-[4/4.7] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#10231d]/90 via-[#10231d]/45 to-transparent px-6 pb-6 pt-24 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                Outside the viewport
              </p>
              <p className="mt-1 font-display text-2xl font-semibold tracking-tight">
                Usually chasing a trail.
              </p>
            </div>
          </figure>

          <div className="absolute -right-3 top-7 flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur-md sm:-right-7">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--palette-swatch)]/10 text-[var(--palette-swatch)]">
              <FileText className="size-5" />
            </span>
            <span>
              <span className="block font-display text-xl font-bold leading-none">4+</span>
              <span className="mt-1 block text-xs text-foreground/55">years building for the web</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
