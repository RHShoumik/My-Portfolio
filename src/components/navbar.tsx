"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { navItems, siteConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ScrambleText } from "@/components/motion";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Dhaka",
      }).format(new Date());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- server/client clocks differ; must set after mount to avoid a hydration mismatch
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "glass" : "border-b border-transparent bg-transparent"
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center border border-foreground/70 text-[11px] font-mono font-semibold tracking-tight transition-colors group-hover:border-[var(--palette-swatch)] group-hover:text-[var(--palette-swatch)]">
              RH
            </span>
            <span className="hidden font-mono text-xs tracking-wide text-muted-foreground sm:inline">
              rhshoumik<span className="text-foreground">.dev</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden items-center gap-7 md:flex">
            {navItems.map((item, i) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="ink-underline group flex items-baseline gap-1.5 pb-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="index-num text-[10px] text-muted-foreground/50 group-hover:text-[var(--palette-swatch)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <ScrambleText text={item.label} />
                </Link>
              </li>
            ))}
          </ul>

          {/* Right cluster */}
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 border-l border-border pl-4 font-mono text-[11px] text-muted-foreground lg:flex">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--palette-swatch)] opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[var(--palette-swatch)]" />
              </span>
              DHAKA — {time ?? "--:--"}
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 border border-foreground/70 px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors hover:border-[var(--palette-swatch)] hover:text-[var(--palette-swatch)] md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="size-3.5" />
              Menu
            </button>
          </div>
        </nav>
      </header>

      {/* Full-screen mobile takeover menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[100] flex flex-col bg-background"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <span className="font-mono text-xs tracking-wide text-muted-foreground">
                rhshoumik<span className="text-foreground">.dev</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 border border-foreground/70 px-3 py-1.5 font-mono text-xs uppercase tracking-wide"
                aria-label="Close navigation menu"
              >
                <X className="size-3.5" />
                Close
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-1 px-6">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="paper-line"
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center justify-between py-4"
                  >
                    <span className="font-serif text-4xl italic tracking-tight text-foreground transition-colors group-hover:text-[var(--palette-swatch)] sm:text-5xl">
                      {item.label}
                    </span>
                    <span className="flex items-center gap-3 text-muted-foreground">
                      <span className="index-num text-xs">{String(i + 1).padStart(2, "0")}</span>
                      <ArrowUpRight className="size-5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-border px-6 py-6">
              <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                <Link href={siteConfig.links.github} target="_blank" className="hover:text-foreground">
                  Github
                </Link>
                <Link href={siteConfig.links.linkedin} target="_blank" className="hover:text-foreground">
                  LinkedIn
                </Link>
                <Link href={siteConfig.links.email} className="hover:text-foreground">
                  Email
                </Link>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground/60">
                Based in Dhaka, Bangladesh — {time ?? "--:--"} local
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
