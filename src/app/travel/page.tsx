import type { Metadata } from "next";
import { FadeUp, FadeIn } from "@/components/motion";
import { TravelStats } from "@/components/travel/travel-stats";
import { TravelMapLoader } from "@/components/travel/travel-map-loader";
import { TravelStories } from "@/components/travel/travel-stories";
import { TravelBlogCards } from "@/components/travel/travel-blog-cards";

export const metadata: Metadata = {
  title: "Travel",
  description:
    "Beyond code — the roads that shaped me. An interactive map and stories from the places I have explored.",
  openGraph: {
    title: "Travel — Ragib Hassan Shoumik",
    description:
      "Beyond code — the roads that shaped me. An interactive map and stories from the places I have explored.",
    url: "https://rhshoumik.dev/travel",
  },
  alternates: { canonical: "/travel" },
};

export default function TravelPage() {
  return (
    <main className="min-h-screen pt-28 pb-24 md:pt-36">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        {/* Section Header */}
        <FadeUp>
          <p className="text-sm font-semibold text-[var(--palette-swatch)]">
            off the clock
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold leading-[1.05] md:text-6xl">
            Beyond code, the roads that{" "}
            <span className="marker">shaped me</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-foreground/75">
            Every journey rewrote a part of me.
          </p>
        </FadeUp>

        {/* Instagram-style Story Slider */}
        <FadeIn delay={0.15} className="mt-10">
          <TravelStories />
        </FadeIn>

        {/* Travel Stats */}
        <FadeIn delay={0.2} className="mt-12">
          <TravelStats />
        </FadeIn>

        {/* Interactive Map with auto-tour */}
        <FadeIn delay={0.3} className="mt-12">
          <TravelMapLoader />
        </FadeIn>

        {/* Travel Blog Cards */}
        <FadeUp delay={0.2} className="mt-16">
          <h2 className="text-sm font-semibold text-[var(--palette-swatch)]">
            stories
          </h2>
          <p className="mb-8 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Travel journals
          </p>
          <TravelBlogCards />
        </FadeUp>
      </div>
    </main>
  );
}
