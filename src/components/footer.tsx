"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import { Github, Linkedin, Mail, ArrowUp } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Dhaka",
      }).format(new Date());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- server/client clocks differ; must set after mount to avoid a hydration mismatch
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-serif text-2xl italic text-foreground">
              rhshoumik<span className="text-[var(--palette-swatch)]">.dev</span>
            </p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Dhaka, Bangladesh — {time ?? "--:--:--"} local
            </p>
          </div>

          <div className="flex items-center gap-5">
            <Link href={siteConfig.links.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-[var(--palette-swatch)]" aria-label="GitHub">
              <Github className="size-4" />
            </Link>
            <Link href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-[var(--palette-swatch)]" aria-label="LinkedIn">
              <Linkedin className="size-4" />
            </Link>
            <Link href={siteConfig.links.email} className="text-muted-foreground transition-colors hover:text-[var(--palette-swatch)]" aria-label="Email">
              <Mail className="size-4" />
            </Link>
            <a
              href="#hero"
              className="ml-2 flex items-center gap-1.5 border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-[var(--palette-swatch)] hover:text-[var(--palette-swatch)]"
            >
              <ArrowUp className="size-3" />
              Top
            </a>
          </div>
        </div>

        <p className="mt-8 font-mono text-[11px] text-muted-foreground/60">
          &copy; {currentYear} {siteConfig.name}. Built with Next.js &amp; Tailwind CSS.
        </p>
      </div>
    </footer>
  );
}
