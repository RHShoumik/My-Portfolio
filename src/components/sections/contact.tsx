"use client";

import { FadeUp, Magnetic } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/lib/constants";
import { Github, Linkedin, Mail, Send, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";

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
    {
      label: "GitHub",
      href: siteConfig.links.github,
      icon: Github,
    },
    {
      label: "LinkedIn",
      href: siteConfig.links.linkedin,
      icon: Linkedin,
    },
    {
      label: "Email",
      href: siteConfig.links.email,
      icon: Mail,
    },
  ];

  return (
    <section id="contact" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <FadeUp>
          <p className="mb-2 font-mono text-sm text-primary">06 — Contact</p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Let&apos;s <span className="text-gradient">connect</span>
          </h2>
          <p className="mb-12 max-w-xl text-muted-foreground">
            Have a project in mind, want to collaborate, or just say hello?
            I&apos;d love to hear from you.
          </p>
        </FadeUp>

        <div className="grid gap-12 md:grid-cols-5">
          {/* Contact Form */}
          <FadeUp delay={0.1} className="md:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="glass-card space-y-5 p-6 md:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    required
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="bg-background/50"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Tell me about your project..."
                  rows={5}
                  required
                  className="bg-background/50"
                />
              </div>
              <Magnetic>
                <Button
                  type="submit"
                  size="lg"
                  className="gap-2 rounded-full px-8"
                  disabled={status === "loading"}
                >
                  <Send className="size-4" />
                  {status === "loading"
                    ? "Sending..."
                    : status === "success"
                    ? "Sent!"
                    : "Send Message"}
                </Button>
              </Magnetic>
              {status === "error" && (
                <p className="text-sm text-destructive">
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
          </FadeUp>

          {/* Social Links & Info */}
          <FadeUp delay={0.2} className="md:col-span-2">
            <div className="glass-card flex h-full flex-col justify-between p-6 md:p-8">
              <div>
                <h3 className="mb-4 text-lg font-semibold">Get in touch</h3>
                <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
                  I&apos;m always interested in new opportunities and
                  collaborations. Whether it&apos;s a full-time role, freelance
                  project, or just a chat — reach out!
                </p>
              </div>

              <div className="space-y-3">
                {socialLinks.map((link) => (
                  <motion.div key={link.label} whileHover={{ x: 4 }}>
                    <Link
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-lg p-3 text-sm transition-colors hover:bg-accent"
                    >
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <link.icon className="size-4" />
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground">
                        {link.label}
                      </span>
                      <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
