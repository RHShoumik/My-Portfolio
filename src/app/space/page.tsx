// SPIKE: the space game prototype. The 2D site is at / and the island game at /island.
import type { Metadata } from "next";
import { SpaceLoader } from "@/components/space/space-loader";

export const metadata: Metadata = {
  title: "Space game · 3D Three.js portfolio",
  description:
    "Fly a jet from Earth to Mars, Europa, Titan and back, then explore Ragib Hassan Shoumik's skills, experience, projects and travel on foot. Built with Three.js.",
  alternates: { canonical: "/space" },
};

export default function SpacePage() {
  return <SpaceLoader />;
}
