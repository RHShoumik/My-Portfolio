// SPIKE: the space game prototype. The 2D site is at / and the island game at /island.
import type { Metadata } from "next";
import { SpaceLoader } from "@/components/space/space-loader";

export const metadata: Metadata = {
  title: "Space game",
  description: "Fly a spaceplane from Earth to Mars to explore Ragib Hassan Shoumik's portfolio.",
};

export default function SpacePage() {
  return <SpaceLoader />;
}
