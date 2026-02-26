"use client";

import dynamic from "next/dynamic";

const TravelMap = dynamic(
  () =>
    import("@/components/travel/travel-map").then((mod) => mod.TravelMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-2xl border border-border/50 bg-card/30">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export function TravelMapLoader() {
  return <TravelMap />;
}
