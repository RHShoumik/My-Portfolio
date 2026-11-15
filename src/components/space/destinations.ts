// SPIKE: throwaway prototype of the space game. Not production code.

export type SectionId = "about" | "skills" | "experience" | "projects" | "travel" | "contact";

export interface Destination {
  id: SectionId;
  /** Where in the solar system this section lives. */
  place: string;
  label: string;
  /** A short line under the place name. */
  note: string;
  /** NASA surface map, drawn as a turning sphere. Contact has none: it is a radio call. */
  map?: string;
  ring?: boolean;
}

/**
 * Every part of the portfolio, as a stop on the journey. All of them can be
 * opened at any time from the planet menu, so nobody has to play to read.
 */
export const DESTINATIONS: Destination[] = [
  { id: "about", place: "Earth", label: "About", note: "Home base", map: "/space/earth.jpg" },
  { id: "skills", place: "Mars", label: "Skills", note: "Level 1", map: "/space/mars.jpg" },
  { id: "experience", place: "Jupiter", label: "Experience", note: "Level 2", map: "/space/jupiter.jpg" },
  { id: "projects", place: "Saturn", label: "Projects", note: "Level 3", map: "/space/saturn.jpg", ring: true },
  { id: "travel", place: "Earth", label: "Travel", note: "Level 4 · back home", map: "/space/earth.jpg" },
  { id: "contact", place: "Radio", label: "Contact", note: "Call mission control" },
];
