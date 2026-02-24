"use client";

import { motion } from "framer-motion";
import { ArrowDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedText, Magnetic, FadeUp } from "@/components/motion";
import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
    >
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--palette-swatch)_0%,transparent_50%)] opacity-[0.08]" />
        <motion.div
          className="absolute -top-1/2 left-1/2 size-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 size-[600px] rounded-full bg-primary/3 blur-3xl"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px),
              linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left — Text content */}
        <div className="text-center lg:text-left">
          {/* Status badge */}
          <FadeUp delay={0.1}>
            <motion.div
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-accent/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Available for opportunities
            </motion.div>
          </FadeUp>

          {/* Name */}
          <FadeUp delay={0.2}>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <AnimatedText text="Ragib Hassan" delay={0.3} />
              <br />
              <span className="text-gradient">
                <AnimatedText text="Shoumik" delay={0.5} />
              </span>
            </h1>
          </FadeUp>

          {/* Title */}
          <FadeUp delay={0.4}>
            <p className="mb-3 font-mono text-sm text-primary md:text-base">
              Frontend Engineer
            </p>
          </FadeUp>

          {/* Intro */}
          <FadeUp delay={0.5}>
            <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg lg:mx-0">
              I craft performant, pixel-perfect web experiences with modern
              React architectures. 4+ years turning complex requirements into
              elegant, scalable solutions.
            </p>
          </FadeUp>

          {/* CTAs */}
          <FadeUp delay={0.6}>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Magnetic>
                <Button asChild size="lg" className="gap-2 rounded-full px-8">
                  <Link href="#projects">
                    <ArrowDown className="size-4" />
                    View Projects
                  </Link>
                </Button>
              </Magnetic>
              <Magnetic>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="gap-2 rounded-full px-8"
                >
                  <Link href="/resume.pdf" target="_blank">
                    <FileText className="size-4" />
                    Download Resume
                  </Link>
                </Button>
              </Magnetic>
            </div>
          </FadeUp>
        </div>

        {/* Right — Photo */}
        <FadeUp delay={0.4}>
          <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
            {/* Decorative ring */}
            <motion.div
              className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-primary/10 blur-2xl"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative overflow-hidden rounded-2xl border-2 border-border/40 shadow-2xl">
              <Image
                src="/images/hero-photo.jpg"
                alt="Ragib Hassan Shoumik"
                width={480}
                height={600}
                className="h-auto w-full object-cover"
                priority
              />

              {/* Subtle overlay gradient at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background/60 to-transparent" />
            </div>

            {/* Floating accent dot */}
            <motion.div
              className="absolute -right-3 -top-3 size-6 rounded-full bg-primary/80 shadow-lg shadow-primary/30"
              animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-2 -left-2 size-4 rounded-full bg-primary/50"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>
        </FadeUp>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown className="size-5 text-muted-foreground/50" />
      </motion.div>
    </section>
  );
}
