import { HeroSection } from "@/components/sections/hero";
import { AboutSection } from "@/components/sections/about";
import { ExperienceSection } from "@/components/sections/experience";
import { ProjectsSection } from "@/components/sections/projects";
import { SkillsSection } from "@/components/sections/skills";
import { ContactSection } from "@/components/sections/contact";
import { GitHubGraph } from "@/components/github-graph";

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ExperienceSection />
      <ProjectsSection />
      <SkillsSection />

      {/* GitHub Activity */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <GitHubGraph username="rhshoumik" />
        </div>
      </section>

      <ContactSection />
    </>
  );
}
