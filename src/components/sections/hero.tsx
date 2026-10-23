"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { ArrowDown, ArrowUpRight, FileText } from "lucide-react";
import { Magnetic, FadeUp, Marquee, ScrambleText, TiltCard } from "@/components/motion";
import Link from "next/link";
import Image from "next/image";

const HeroScene = dynamic(() => import("@/components/three/hero-scene"), {
  ssr: false,
});

function useCanRenderScene() {
  const [can, setCan] = useState(false);
  useEffect(() => {
    const fineQuery = window.matchMedia("(pointer: fine)");
    const wideQuery = window.matchMedia("(min-width: 768px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const evaluate = () => setCan(fineQuery.matches && wideQuery.matches && !motionQuery.matches);

    evaluate();
    fineQuery.addEventListener("change", evaluate);
    wideQuery.addEventListener("change", evaluate);
    motionQuery.addEventListener("change", evaluate);
    return () => {
      fineQuery.removeEventListener("change", evaluate);
      wideQuery.removeEventListener("change", evaluate);
      motionQuery.removeEventListener("change", evaluate);
    };
  }, []);
  return can;
}

const tickerWords = [
  "REACT.JS",
  "NEXT.JS",
  "TYPESCRIPT",
  "E-COMMERCE",
  "SAAS PLATFORMS",
  "PERFORMANCE",
  "ACCESSIBILITY",
  "DESIGN SYSTEMS",
];

function InteractiveField() {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-400);
  const mouseY = useMotionValue(-400);
  const spotlight = useMotionTemplate`radial-gradient(480px circle at ${mouseX}px ${mouseY}px, var(--palette-swatch) 0%, transparent 70%)`;
  const canRenderScene = useCanRenderScene();

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }}
      className="absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-dot-grid opacity-[0.4] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]" />
      {canRenderScene ? (
        <div className="absolute inset-0 opacity-90 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_20%,black,transparent)]">
          <HeroScene />
        </div>
      ) : (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: spotlight }}
        />
      )}
      {/* Oversized editorial backdrop word */}
      <span className="pointer-events-none absolute -bottom-[6vw] left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-serif text-[26vw] italic leading-none text-foreground/[0.035] sm:text-[20vw]">
        Engineer
      </span>
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col overflow-hidden pt-24 md:pt-28"
    >
      <InteractiveField />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 md:px-8">
        {/* Top strip — availability + coordinates */}
        <FadeUp delay={0.05}>
          <div className="mb-10 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground md:mb-14">
            <span className="inline-flex items-center gap-2 border border-border px-3 py-1.5">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              Available for opportunities
            </span>
            <span className="hidden sm:inline">23.8103° N / 90.4125° E — Dhaka, BD</span>
          </div>
        </FadeUp>

        <div className="relative grid gap-10 lg:grid-cols-[1fr_auto]">
          {/* Headline block */}
          <div>
            <FadeUp delay={0.1}>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-[var(--palette-swatch)]">
                Frontend Engineer — 04
                <span className="ml-1 inline-block animate-pulse">_</span>
              </p>
            </FadeUp>

            <h1 className="mb-6 text-[13vw] font-bold leading-[0.92] tracking-tight sm:text-6xl md:text-7xl lg:text-[6.4vw]">
              <span className="block overflow-hidden">
                <motion.span
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="block"
                >
                  <ScrambleText text="Ragib Hassan" trigger="mount" delay={0.35} />
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.8, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="block font-serif italic font-normal text-[var(--palette-swatch)]"
                >
                  <ScrambleText text="Shoumik." trigger="mount" delay={0.55} />
                </motion.span>
              </span>
            </h1>

            <FadeUp delay={0.5}>
              <p className="mb-10 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                I craft performant, pixel-perfect web experiences with modern
                React architectures — turning complex requirements into
                elegant, scalable products. 4+ years, shipping to millions of
                users.
              </p>
            </FadeUp>

            <FadeUp delay={0.6}>
              <div className="flex flex-wrap items-center gap-4">
                <Magnetic>
                  <Button href="#projects" variant="solid">
                    View Projects
                  </Button>
                </Magnetic>
                <Magnetic>
                  <Button href="/resume.pdf" variant="outline" external>
                    Download Resume
                  </Button>
                </Magnetic>
              </div>
            </FadeUp>
          </div>

          {/* Photo — interactive 3D tilt frame */}
          <FadeUp delay={0.35} className="justify-self-center lg:justify-self-end">
            <TiltCard max={10} className="group relative w-[220px] sm:w-[260px] lg:w-[280px]">
              <div className="relative overflow-hidden border border-foreground/15 bg-card shadow-xl">
                <Image
                  src="/images/hero-photo.jpg"
                  alt="Ragib Hassan Shoumik"
                  width={420}
                  height={520}
                  className="aspect-[4/5] w-full object-cover grayscale-[15%] transition-all duration-500 group-hover:grayscale-0"
                  priority
                />
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {/* eslint-disable-next-line react/jsx-no-comment-textnodes -- intentional caption text, not a JSX comment */}
                <span>// portrait.jpg</span>
                <span>2026</span>
              </div>
              <span className="absolute -right-3 -top-3 size-2.5 rounded-full bg-[var(--palette-swatch)] shadow-[0_0_0_4px_var(--background)]" />
            </TiltCard>
          </FadeUp>
        </div>
      </div>

      {/* Full-bleed marquee strip */}
      <FadeUp delay={0.4} className="relative mt-12 border-y border-border py-4">
        <Marquee speed="slow">
          {tickerWords.map((word, i) => (
            <span key={word} className="mx-6 flex items-center gap-6 font-mono text-sm tracking-wide text-muted-foreground">
              {word}
              <span className="text-[var(--palette-swatch)]">
                {i === tickerWords.length - 1 ? "" : "•"}
              </span>
            </span>
          ))}
        </Marquee>
      </FadeUp>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-[4.5rem] left-1/2 hidden -translate-x-1/2 md:block"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown className="size-4 text-muted-foreground/50" />
      </motion.div>
    </section>
  );
}

function Button({
  href,
  children,
  variant,
  external,
}: {
  href: string;
  children: React.ReactNode;
  variant: "solid" | "outline";
  external?: boolean;
}) {
  const base =
    "group inline-flex items-center gap-2.5 border px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors";
  const styles =
    variant === "solid"
      ? "border-foreground bg-foreground text-background hover:bg-[var(--palette-swatch)] hover:border-[var(--palette-swatch)] hover:text-background"
      : "border-foreground/70 text-foreground hover:border-[var(--palette-swatch)] hover:text-[var(--palette-swatch)]";

  return (
    <Link href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={`${base} ${styles}`}>
      {variant === "solid" ? (
        <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      ) : (
        <FileText className="size-3.5" />
      )}
      {children}
    </Link>
  );
}
