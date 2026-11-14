// SPIKE: throwaway prototype of the island game (served at /island). Not production code.
import type { Metadata } from "next";
import { getAllTravelPosts } from "@/lib/travel";
import { GameLoader } from "@/components/game/game-loader";

export const metadata: Metadata = {
  title: "Island game (prototype)",
  robots: { index: false },
};

export default function GamePage() {
  return (
    <GameLoader
      publishedTravelSlugs={getAllTravelPosts().map((post) => post.slug)}
    />
  );
}
