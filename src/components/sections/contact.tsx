"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, Send } from "lucide-react";
import { siteConfig } from "@/lib/constants";
import { playSound } from "@/lib/sound";

type Status = "idle" | "loading" | "success" | "error";

const label = "mb-1.5 block text-sm font-medium text-white/70";
const field =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-white/35 focus:border-[var(--palette-swatch)] focus:bg-white/[0.09] focus:ring-2 focus:ring-[var(--palette-swatch)]/30";

export function ContactSection() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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

      if (res.ok) {
        setStatus("success");
        playSound("send");
        form.reset();
      } else {
        setStatus("error");
        playSound("error");
      }
    } catch {
      setStatus("error");
      playSound("error");
    }
  }

  const emailAddress = siteConfig.links.email.replace("mailto:", "");

  return (
    <section id="contact" className="px-5 pb-16 pt-24 md:px-8 md:pb-24 md:pt-32">
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-panel p-7 text-panel-ink sm:p-10 md:p-14">
        {/* Ribbon in light lines on the dark card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-40 [--rb-1:#8fa7ff] [--rb-2:#ffffff] [--rb-3:#6c8cff] [-webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.3)_45%,black_90%)] [mask-image:linear-gradient(90deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.3)_45%,black_90%)]"
        >
          <div className="ribbon ribbon-b" />
        </div>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-white/60">
              <span className="size-1.5 rounded-full bg-[var(--palette-swatch)]" />
              Contact
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-[1.02] tracking-[-0.045em] md:text-[3.5rem]">
              Let&apos;s work
              <br />
              together.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/65">
              Got a project, a role, or just a question? Tell me what you&apos;re
              working on. I&apos;d like to hear about it.
            </p>

            <a
              href={siteConfig.links.email}
              className="mt-8 inline-block break-all text-lg font-semibold underline decoration-[var(--palette-swatch)] decoration-2 underline-offset-[6px] transition-colors hover:text-[var(--palette-swatch)]"
            >
              {emailAddress}
            </a>

            <ul className="mt-6 flex gap-5">
              {[
                { label: "GitHub", href: siteConfig.links.github },
                { label: "LinkedIn", href: siteConfig.links.linkedin },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 text-white/70 transition-colors hover:text-white"
                  >
                    {l.label}
                    <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm md:p-8 lg:col-span-7"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={label}>
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  data-sound="type"
                  className={field}
                />
              </div>
              <div>
                <label htmlFor="email" className={label}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  data-sound="type"
                  className={field}
                />
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="message" className={label}>
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                placeholder="Tell me about your project…"
                data-sound="type"
                className={`${field} resize-y`}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={status === "loading"}
                className="btn btn-accent disabled:opacity-60"
              >
                <Send className="size-4" />
                {status === "loading" ? "Sending…" : "Send message"}
              </button>

              <p
                role="status"
                aria-live="polite"
                className={`text-sm font-medium ${
                  status === "error" ? "text-[#ff8573]" : "text-[#6ee7b7]"
                }`}
              >
                {status === "success" && "Sent! Thank you, I'll write back soon."}
                {status === "error" &&
                  "That didn't go through. Try again, or email me directly."}
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
