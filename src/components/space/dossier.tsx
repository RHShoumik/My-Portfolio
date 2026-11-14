// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Github,
  Linkedin,
  Mail,
  Mountain,
  RadioTower,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { LocalTime } from "@/components/local-time";
import { experiences, projects, siteConfig, skillGroups } from "@/lib/constants";
import { getTravelStats, travelLocations } from "@/data/travel-data";
import { playSound } from "@/lib/sound";
import { DESTINATIONS, type Destination, type SectionId } from "./destinations";
import { LEVEL, useSpace } from "./store";

export const glass =
  "rounded-2xl border border-white/12 bg-[#0b0e18]/75 text-white shadow-2xl backdrop-blur-md";

export const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0b0e18] transition-transform active:scale-95";
export const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10";

const chipClass =
  "rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-xs text-white/80";

/** A destination's planet (or a radio tower for Contact), as a small turning sphere. */
export function PlanetBadge({ d, className = "size-9" }: { d: Destination; className?: string }) {
  if (!d.map) {
    return (
      <span
        className={`${className} grid shrink-0 place-items-center rounded-full border border-white/20 bg-gradient-to-br from-[#2a3350] to-[#0d1120] text-[#8fa7ff]`}
      >
        <RadioTower className="size-1/2" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`planet ${d.ring ? "planet-ring" : ""} ${className}`}
      style={{ backgroundImage: `url(${d.map})` }}
    />
  );
}

export const emailAddress = siteConfig.links.email.replace("mailto:", "");

export const contactLinks = [
  { label: "Email", href: siteConfig.links.email, icon: Mail },
  { label: "GitHub", href: siteConfig.links.github, icon: Github },
  { label: "LinkedIn", href: siteConfig.links.linkedin, icon: Linkedin },
];

/* ------------------------------------------------------------------ */
/*  Section contents                                                   */
/* ------------------------------------------------------------------ */

function About() {
  return (
    <div className="space-y-5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10">
        <Image
          src="/images/about-photo.jpeg"
          alt="Ragib on a hike, surrounded by hills and fog"
          fill
          sizes="(min-width: 768px) 420px, 92vw"
          className="object-cover"
        />
      </div>
      <div className="space-y-4 text-[15px] leading-7 text-white/75">
        <p>
          I&apos;m Shoumik, a frontend engineer from Dhaka. For over four years I&apos;ve been
          building web apps with React, Next.js and TypeScript, and most of what I&apos;ve shipped
          is used by real people every day: shoppers, restaurant owners, club members.
        </p>
        <p>
          I started out in 2020 at a small company, then moved through a few startups where I got
          to do a bit of everything. At 6amTech I shipped major features for 6amMart and StackFood,
          two marketplaces with millions of users. These days I&apos;m at JustGo Technologies,
          building a membership system for clubs and national governing bodies.
        </p>
        <p>
          What I enjoy most is the unglamorous side of the job: components other people can pick
          up without a tour, pages that load fast, forms that don&apos;t fight you. When I log off,
          I go trekking. It clears my head better than any debugger.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="font-display text-2xl font-bold">4+</p>
          <p className="mt-1 text-xs text-white/55">years on the web</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <Clock className="size-4 text-[#8fa7ff]" />
          <p className="mt-1.5 text-sm font-semibold">
            <LocalTime />
          </p>
          <p className="text-xs text-white/55">in Dhaka</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <Mountain className="size-4 text-[#8fa7ff]" />
          <p className="mt-1.5 text-sm font-semibold">Trekking</p>
          <p className="text-xs text-white/55">off the clock</p>
        </div>
      </div>
    </div>
  );
}

function Skills() {
  return (
    <div className="space-y-5">
      {skillGroups.map((g) => (
        <div key={g.category}>
          <p className="text-sm font-semibold text-white/85">{g.category}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {g.skills.map((skill) => (
              <span key={skill} className={chipClass}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Experience() {
  return (
    <ol className="relative space-y-7 border-l border-white/15 pl-5">
      {experiences.map((job, i) => (
        <li key={job.company} className="relative">
          <span
            className={`absolute -left-[1.6rem] top-1.5 size-2.5 rounded-full ring-4 ring-[#0b0e18] ${
              i === 0 ? "bg-[#ff9a73]" : "bg-white/40"
            }`}
          />
          <p className="text-xs font-medium text-white/50">{job.period}</p>
          <h3 className="mt-1 font-display text-lg font-bold leading-snug">{job.role}</h3>
          <p className="text-sm font-medium text-[#8fa7ff]">{job.company}</p>
          <p className="mt-2 text-sm leading-6 text-white/70">{job.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.tech.map((t) => (
              <span key={t} className={chipClass}>
                {t}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Projects() {
  return (
    <div className="space-y-3">
      {projects.map((p, i) => {
        const live = p.url.startsWith("http");
        const body = (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-white/40">0{i + 1}</p>
                <h3 className="font-display text-lg font-bold">{p.title}</h3>
              </div>
              {live && (
                <ArrowUpRight className="mt-1 size-5 shrink-0 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-white/70">{p.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <span key={t} className={chipClass}>
                  {t}
                </span>
              ))}
            </div>
          </>
        );
        const box = "block rounded-xl border border-white/10 bg-white/[0.04] p-4";
        return live ? (
          <a
            key={p.title}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${box} group transition-colors hover:border-white/25 hover:bg-white/[0.07]`}
          >
            {body}
          </a>
        ) : (
          <div key={p.title} className={box}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

function Travel() {
  const stats = getTravelStats();
  const featured = [...travelLocations]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-7 text-white/75">
        The places I&apos;ve been and the stories I carried home.
      </p>
      <dl className="grid grid-cols-3 gap-2">
        {[
          { v: stats.placesVisited, l: "places" },
          { v: stats.countriesExplored, l: stats.countriesExplored === 1 ? "country" : "countries" },
          { v: `${stats.totalDistance.toLocaleString()} km`, l: "travelled" },
        ].map((f) => (
          <div key={f.l} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <dd className="font-display text-xl font-bold">{f.v}</dd>
            <dt className="text-xs text-white/55">{f.l}</dt>
          </div>
        ))}
      </dl>
      <div className="space-y-3">
        {featured.map((loc) => (
          <Link
            key={loc.slug}
            href={`/travel/${loc.slug}`}
            className="group flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 transition-colors hover:border-white/25"
          >
            <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
              <Image src={loc.coverImage} alt="" fill sizes="80px" className="object-cover" />
            </div>
            <div className="min-w-0 py-0.5">
              <p className="font-semibold">{loc.city}</p>
              <p className="text-xs text-white/50">
                {new Date(loc.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/65">{loc.description}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/travel" className={secondaryBtn}>
          All trips
        </Link>
        <Link href="/blog" className={secondaryBtn}>
          Blog
        </Link>
      </div>
    </div>
  );
}

type Status = "idle" | "loading" | "success" | "error";
const field =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-base text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#6c8cff] focus:ring-2 focus:ring-[#6c8cff]/30";

function Contact() {
  const [status, setStatus] = useState<Status>("idle");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
        }),
      });
      setStatus(res.ok ? "success" : "error");
      playSound(res.ok ? "send" : "error");
      if (res.ok) form.reset();
    } catch {
      setStatus("error");
      playSound("error");
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-7 text-white/75">
        Got a project, a role, or just a question? Tell me what you&apos;re working on. I&apos;d
        like to hear about it.
      </p>
      <a
        href={siteConfig.links.email}
        className="block break-all text-lg font-semibold underline decoration-[#6c8cff] decoration-2 underline-offset-[6px]"
      >
        {emailAddress}
      </a>
      <div className="flex gap-2">
        {contactLinks.slice(1).map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryBtn}
          >
            <l.icon className="size-4" />
            {l.label}
          </a>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <input name="name" required autoComplete="name" placeholder="Your name" aria-label="Your name" data-sound="type" className={field} />
        <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" aria-label="Your email" data-sound="type" className={field} />
        <textarea name="message" required rows={4} placeholder="Tell me about your project…" aria-label="Message" data-sound="type" className={`${field} resize-y`} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={status === "loading"} className={`${primaryBtn} disabled:opacity-60`}>
            <Send className="size-4" />
            {status === "loading" ? "Sending…" : "Send message"}
          </button>
          <p role="status" aria-live="polite" className={`text-sm ${status === "error" ? "text-[#ff8573]" : "text-[#6ee7b7]"}`}>
            {status === "success" && "Sent! I'll write back soon."}
            {status === "error" && "That didn't go through. Email me instead."}
          </p>
        </div>
      </form>
    </div>
  );
}

const CONTENT: Record<SectionId, { title: string; body: () => React.ReactNode }> = {
  about: { title: "About me", body: About },
  skills: { title: "Skills", body: Skills },
  experience: { title: "Experience", body: Experience },
  projects: { title: "Projects", body: Projects },
  travel: { title: "Travel", body: Travel },
  contact: { title: "Let's work together", body: Contact },
};

/* ------------------------------------------------------------------ */
/*  The panel                                                          */
/* ------------------------------------------------------------------ */

export function Dossier() {
  const open = useSpace((s) => s.open);
  const phase = useSpace((s) => s.phase);
  const setOpen = useSpace((s) => s.setOpen);
  const retry = useSpace((s) => s.retry);
  const score = useSpace((s) => s.score);
  const kills = useSpace((s) => s.kills);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;
  const index = DESTINATIONS.findIndex((d) => d.id === open);
  const d = DESTINATIONS[index];
  const prev = DESTINATIONS[(index - 1 + DESTINATIONS.length) % DESTINATIONS.length];
  const next = DESTINATIONS[(index + 1) % DESTINATIONS.length];
  const { title, body: Body } = CONTENT[open];
  const justLanded = phase === "arrived" && open === LEVEL.section;

  return (
    <aside
      aria-label={title}
      className={`pointer-events-auto absolute inset-x-2 bottom-2 select-text top-[8rem] flex flex-col overflow-hidden md:inset-x-auto md:bottom-4 md:right-4 md:w-[27rem] lg:top-[5.5rem] ${glass} animate-in fade-in slide-in-from-bottom-4 duration-300 md:slide-in-from-right-4`}
    >
      <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <PlanetBadge d={d} className="size-11" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8fa7ff]">
            {d.place} · {d.note}
          </p>
          <h2 className="truncate font-display text-2xl font-bold">{title}</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(null)}
          aria-label="Close"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:bg-white/10"
        >
          <X className="size-4" />
        </button>
      </header>

      <div key={open} className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        {justLanded && (
          <div className="mb-5 rounded-xl border border-[#ff9a73]/30 bg-[#ff9a73]/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ffb394]">
              Landed on {LEVEL.to} · Level {LEVEL.number} complete
            </p>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums">
              {score.toLocaleString()} <span className="text-sm font-medium text-white/60">pts · {kills} destroyed</span>
            </p>
            <p className="mt-1 text-sm text-white/75">
              You unlocked my {LEVEL.unlocks}. The flight to {LEVEL.next} is coming soon, and every
              other section is open from the planet menu.
            </p>
            <button type="button" onClick={retry} className={`${secondaryBtn} mt-3`}>
              <RotateCcw className="size-4" />
              Fly again
            </button>
          </div>
        )}
        <Body />
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen(prev.id)}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          {prev.label}
        </button>
        <button
          type="button"
          onClick={() => setOpen(next.id)}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          {next.label}
          <ArrowRight className="size-4" />
        </button>
      </footer>
    </aside>
  );
}
