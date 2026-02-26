import type { Metadata } from "next";
import { FadeUp, FadeIn } from "@/components/motion";
import { TravelStats } from "@/components/travel/travel-stats";
import { TravelMapLoader } from "@/components/travel/travel-map-loader";
import { TravelStories } from "@/components/travel/travel-stories";
import { TravelBlogCards } from "@/components/travel/travel-blog-cards";

export const metadata: Metadata = {
  title: "Travel — Ragib Hassan Shoumik",
  description:
    "Beyond code — the roads that shaped me. An interactive map and stories from the places I have explored.",
  openGraph: {
    title: "Travel — Ragib Hassan Shoumik",
    description:
      "Beyond code — the roads that shaped me. An interactive map and stories from the places I have explored.",
    url: "https://rhshoumik.dev/travel",
  },
};

export default function TravelPage() {
  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <FadeUp>
          <p className="mb-2 font-mono text-sm text-primary">Travel</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Beyond Code —{" "}
            <span className="text-gradient">The Roads That Shaped Me</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
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
          <h2 className="mb-2 font-mono text-sm text-primary">Stories</h2>
          <p className="mb-8 text-2xl font-bold tracking-tight md:text-3xl">
            Travel Journals
          </p>
          <TravelBlogCards />
        </FadeUp>
      </div>
    </main>
  );
}
