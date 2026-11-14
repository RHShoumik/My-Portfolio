// SPIKE: throwaway prototype of the island game. Not production code.
"use client";

import dynamic from "next/dynamic";

const Game = dynamic(() => import("./game"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#bfe3f5] text-sm font-medium text-[#0b0d14]/70">
      Filling the sea…
    </div>
  ),
});

export function GameLoader({
  publishedTravelSlugs,
}: {
  publishedTravelSlugs: string[];
}) {
  return <Game publishedTravelSlugs={publishedTravelSlugs} />;
}
