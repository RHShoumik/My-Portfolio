"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUp, Github, Linkedin, Mail } from "lucide-react";
import { siteConfig } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Dhaka",
      }).format(new Date());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- server and client clocks differ; set after mount to avoid a hydration mismatch
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);

  const icon = "text-foreground/55 transition-colors hover:text-foreground";

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="text-sm text-foreground/55">
          <p>
            &copy; {year} {siteConfig.name}
            {time ? <span> · it&apos;s {time} in Dhaka</span> : null}
          </p>
          <p className="mt-1 text-foreground/40">
            Built with Next.js and Tailwind CSS.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <Link href={siteConfig.links.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={icon}>
            <Github className="size-5" />
          </Link>
          <Link href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={icon}>
            <Linkedin className="size-5" />
          </Link>
          <Link href={siteConfig.links.email} aria-label="Email" className={icon}>
            <Mail className="size-5" />
          </Link>
          <a
            href="#hero"
            className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm text-foreground/70 transition-colors hover:border-foreground hover:text-foreground"
          >
            <ArrowUp className="size-3.5" />
            Top
          </a>
        </div>
      </div>
    </footer>
  );
}
