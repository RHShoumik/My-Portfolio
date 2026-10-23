"use client";

import { FadeUp, Magnetic } from "@/components/motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/lib/constants";
import { Github, Linkedin, Mail, ArrowUpRight, Send } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export function ContactSection() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
        }),
      });

      if (res.ok) {
        setStatus("success");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const socialLinks = [
    { label: "GitHub", href: siteConfig.links.github, icon: Github },
    { label: "LinkedIn", href: siteConfig.links.linkedin, icon: Linkedin },
    { label: "Email", href: siteConfig.links.email, icon: Mail },
  ];

  const emailAddress = siteConfig.links.email.replace("mailto:", "");

  return (
    <section id="contact" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <FadeUp>
          <p className="index-num mb-2 font-mono text-xs uppercase tracking-widest text-[var(--palette-swatch)]">
            06 — Contact
          </p>
          <h2 className="mb-8 text-3xl font-bold tracking-tight md:text-5xl">
            Let&apos;s{" "}
            <span className="font-serif italic font-normal text-gradient">connect</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.1}>
          <Link
            href={siteConfig.links.email}
            data-cursor="SAY HI"
            className="ink-underline group mb-4 inline-block break-all font-serif text-3xl italic leading-tight text-foreground transition-colors hover:text-[var(--palette-swatch)] sm:text-5xl md:text-7xl"
          >
            {emailAddress}
          </Link>
          <p className="mb-16 font-mono text-xs uppercase tracking-wide text-muted-foreground">
            Based in Dhaka, BD — usually replies within 24–48h
          </p>
        </FadeUp>

        <div className="grid gap-12 border-t border-border pt-12 lg:grid-cols-12">
          {/* Contact Form */}
          <FadeUp delay={0.15} className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="grid gap-7 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    required
                    className="rounded-none border-0 border-b border-border bg-transparent px-0 py-2 shadow-none focus-visible:ring-0 focus-visible:border-[var(--palette-swatch)]"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="rounded-none border-0 border-b border-border bg-transparent px-0 py-2 shadow-none focus-visible:ring-0 focus-visible:border-[var(--palette-swatch)]"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="message" className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Tell me about your project..."
                  rows={4}
                  required
                  className="rounded-none border-0 border-b border-border bg-transparent px-0 py-2 shadow-none focus-visible:ring-0 focus-visible:border-[var(--palette-swatch)]"
                />
              </div>
              <Magnetic>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="group inline-flex items-center gap-2.5 border border-foreground bg-foreground px-6 py-3 font-mono text-xs uppercase tracking-widest text-background transition-colors hover:bg-[var(--palette-swatch)] hover:border-[var(--palette-swatch)] disabled:opacity-50"
                >
                  <Send className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  {status === "loading" ? "Sending..." : status === "success" ? "Sent!" : "Send Message"}
                </button>
              </Magnetic>
              {status === "error" && (
                <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
              )}
            </form>
          </FadeUp>

          {/* Social Links */}
          <FadeUp delay={0.25} className="lg:col-span-5">
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              I&apos;m always interested in new opportunities and
              collaborations. Whether it&apos;s a full-time role, freelance
              project, or just a chat — reach out.
            </p>

            <div className="border-t border-border">
              {socialLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  data-cursor="OPEN"
                  className="group flex items-center justify-between border-b border-border py-4 text-sm transition-colors hover:text-[var(--palette-swatch)]"
                >
                  <span className="flex items-center gap-3">
                    <link.icon className="size-4" />
                    {link.label}
                  </span>
                  <ArrowUpRight className="size-4 -translate-x-1 translate-y-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
