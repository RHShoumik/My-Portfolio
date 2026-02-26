"use client";

import { FadeUp, ScaleOnHover } from "@/components/motion";
import { travelLocations, getTravelStats } from "@/data/travel-data";
import { MapPin, Route, Globe, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export function TravelSection() {
  const stats = getTravelStats();
  // Show the 3 most recent locations
  const featured = [...travelLocations]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <section id="travel" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,var(--palette-swatch)_0%,transparent_50%)] opacity-[0.04]" />

      <div className="mx-auto max-w-6xl px-6">
        <FadeUp>
          <p className="mb-2 font-mono text-sm text-primary">05 — Travel</p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Beyond code —{" "}
            <span className="text-gradient">the roads that shaped me</span>
          </h2>
          <p className="mb-12 max-w-xl text-muted-foreground">
            The places I&apos;ve explored, the stories I carry. Every journey
            adds a new perspective to the way I think and build.
          </p>
        </FadeUp>

        {/* Stats strip */}
        <FadeUp delay={0.1}>
          <div className="mb-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 text-primary" />
              <strong className="text-foreground">{stats.placesVisited}</strong>{" "}
              places
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="size-4 text-primary" />
              <strong className="text-foreground">
                {stats.countriesExplored}
              </strong>{" "}
              {stats.countriesExplored === 1 ? "country" : "countries"}
            </span>
            <span className="flex items-center gap-1.5">
              <Route className="size-4 text-primary" />
              <strong className="text-foreground">
                {stats.totalDistance.toLocaleString()}
              </strong>{" "}
              km traveled
            </span>
          </div>
        </FadeUp>

        {/* Featured cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((loc, i) => (
            <FadeUp key={loc.slug} delay={i * 0.1}>
              <ScaleOnHover>
                <Link
                  href={`/travel/${loc.slug}`}
                  className="group block"
                >
                  <div className="glass-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl">
                    {/* Cover image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={loc.coverImage}
                        alt={loc.city}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-card via-card/30 to-transparent" />

                      {/* Location badge */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        <MapPin className="size-3" />
                        {loc.city}, {loc.country}
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {loc.description}
                      </p>
                      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        Read the story
                        <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </ScaleOnHover>
            </FadeUp>
          ))}
        </div>

        {/* View all link */}
        <FadeUp delay={0.4}>
          <div className="mt-10 text-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/travel"
                className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                Explore all journeys
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
