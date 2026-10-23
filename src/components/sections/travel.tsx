"use client";

import { FadeUp, ScaleOnHover } from "@/components/motion";
import { travelLocations, getTravelStats } from "@/data/travel-data";
import { MapPin, Route, Globe, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function TravelSection() {
  const stats = getTravelStats();
  // Show the 3 most recent locations
  const featured = [...travelLocations]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <section id="travel" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <FadeUp>
          <p className="index-num mb-2 font-mono text-xs uppercase tracking-widest text-[var(--palette-swatch)]">
            05 — Travel
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
            Beyond code —{" "}
            <span className="font-serif italic font-normal text-gradient">the roads that shaped me</span>
          </h2>
          <p className="mb-12 max-w-xl text-muted-foreground">
            The places I&apos;ve explored, the stories I carry. Every journey
            adds a new perspective to the way I think and build.
          </p>
        </FadeUp>

        {/* Stats strip */}
        <FadeUp delay={0.1}>
          <div className="mb-10 flex flex-wrap gap-x-8 gap-y-3 border-y border-border py-4 font-mono text-xs uppercase tracking-wide text-muted-foreground">
            <span className="flex items-center gap-2">
              <MapPin className="size-3.5 text-[var(--palette-swatch)]" />
              <strong className="text-foreground">{stats.placesVisited}</strong>{" "}
              places
            </span>
            <span className="flex items-center gap-2">
              <Globe className="size-3.5 text-[var(--palette-swatch)]" />
              <strong className="text-foreground">
                {stats.countriesExplored}
              </strong>{" "}
              {stats.countriesExplored === 1 ? "country" : "countries"}
            </span>
            <span className="flex items-center gap-2">
              <Route className="size-3.5 text-[var(--palette-swatch)]" />
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
                  data-cursor="READ"
                  className="group block"
                >
                  <div className="glass-card overflow-hidden transition-colors hover:border-[var(--palette-swatch)]">
                    {/* Cover image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={loc.coverImage}
                        alt={loc.city}
                        fill
                        className="object-cover grayscale-[10%] transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {/* Location badge */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 border border-white/20 bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-white backdrop-blur-sm">
                        <MapPin className="size-3" />
                        {loc.city}, {loc.country}
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {loc.description}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-[var(--palette-swatch)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
          <div className="mt-10">
            <Link
              href="/travel"
              className="group inline-flex items-center gap-2.5 border border-foreground/70 px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors hover:border-[var(--palette-swatch)] hover:text-[var(--palette-swatch)]"
            >
              Explore all journeys
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
