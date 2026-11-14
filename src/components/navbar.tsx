"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Gamepad2, Menu, X } from "lucide-react";
import { navItems, siteConfig } from "@/lib/constants";
import { Logo } from "@/components/logo";

export function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-3 z-50 px-3 md:top-4 md:px-5">
        <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-full border border-border bg-background/75 py-2 pl-5 pr-2 shadow-sm backdrop-blur-xl">
          <Link href="/" className="group" aria-label="Home">
            <Logo />
          </Link>

          <ul className="hidden items-center gap-0.5 md:flex">
            {navItems.map((item) =>
              item.label === "Contact" ? (
                <li key={item.href} className="ml-1">
                  <Link
                    href={item.href}
                    className="inline-flex rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-85"
                  >
                    {item.label}
                  </Link>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-full px-3.5 py-2 text-sm text-foreground/65 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              )
            )}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href="/space"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--palette-swatch)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] transition-opacity hover:opacity-90"
            >
              <Gamepad2 className="size-4" />
              Play 3D
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-4" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between px-5 py-4">
            <Logo />
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
              aria-label="Close menu"
            >
              <X className="size-4" />
              Close
            </button>
          </div>

          <ul className="flex flex-1 flex-col justify-center px-6">
            <li className="border-b border-border">
              <Link
                href="/space"
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between py-4"
              >
                <span className="font-display text-4xl font-bold tracking-[-0.04em] text-[var(--palette-swatch)]">
                  Play 3D
                </span>
                <Gamepad2 className="size-6 text-[var(--palette-swatch)]" />
              </Link>
            </li>
            {navItems.map((item) => (
              <li key={item.href} className="border-b border-border">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center justify-between py-4"
                >
                  <span className="font-display text-4xl font-bold tracking-[-0.04em] transition-colors group-hover:text-[var(--palette-swatch)]">
                    {item.label}
                  </span>
                  <ArrowUpRight className="size-6 text-foreground/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-6 px-6 py-6 text-sm text-foreground/55">
            <Link href={siteConfig.links.github} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              GitHub
            </Link>
            <Link href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              LinkedIn
            </Link>
            <Link href={siteConfig.links.email} className="hover:text-foreground">
              Email
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
