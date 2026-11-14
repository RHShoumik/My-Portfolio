import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/hero";
import { AboutSection } from "@/components/sections/about";
import { ExperienceSection } from "@/components/sections/experience";
import { ProjectsSection } from "@/components/sections/projects";
import { SkillsSection } from "@/components/sections/skills";
import { TravelSection } from "@/components/sections/travel";
import { ContactSection } from "@/components/sections/contact";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Explore Ragib Hassan Shoumik's work, experience, skills, and travel stories.",
};

export default function PlainPortfolio() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ExperienceSection />
      <ProjectsSection />
      <SkillsSection />
      <TravelSection />
      <ContactSection />
    </>
  );
}
