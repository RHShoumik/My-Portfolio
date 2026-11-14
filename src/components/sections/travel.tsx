import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTravelStats, travelLocations } from "@/data/travel-data";
import { SectionHeader } from "@/components/section-header";

export function TravelSection() {
  const stats = getTravelStats();
  const featured = [...travelLocations]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const figures = [
    { value: stats.placesVisited, label: "places" },
    {
      value: stats.countriesExplored,
      label: stats.countriesExplored === 1 ? "country" : "countries",
    },
    { value: `${stats.totalDistance.toLocaleString()} km`, label: "travelled" },
  ];

  return (
    <section id="travel" className="bg-[var(--tint)] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeader eyebrow="Travel" title="Beyond the keyboard">
            The places I&apos;ve been and the stories I carried home. Every trip
            changes how I think, and a little of how I build.
          </SectionHeader>

          <dl className="flex gap-8">
            {figures.map((f) => (
              <div key={f.label}>
                <dt className="sr-only">{f.label}</dt>
                <dd className="font-display text-3xl font-bold tracking-[-0.04em]">
                  {f.value}
                </dd>
                <p className="text-sm text-foreground/55">{f.label}</p>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((loc) => (
            <Link
              key={loc.slug}
              href={`/travel/${loc.slug}`}
              className="card group flex h-full flex-col overflow-hidden"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={loc.coverImage}
                  alt={`${loc.city}, ${loc.country}`}
                  fill
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-xl font-bold tracking-[-0.03em]">
                  {loc.city}
                </h3>
                <p className="mt-0.5 text-sm text-foreground/50">
                  {new Date(loc.date).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-foreground/70">
                  {loc.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12">
          <Link href="/travel" className="btn">
            See all trips
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
