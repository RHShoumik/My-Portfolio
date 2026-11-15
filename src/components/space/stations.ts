// SPIKE: throwaway prototype of the space game. Not production code.
import { experiences, projects, skillGroups } from "@/lib/constants";
import { travelLocations } from "@/data/travel-data";
import type { Level } from "./levels";

/*
 * Things to walk up to on each landing site. Every one holds a piece of the
 * portfolio: a skill group, a job, a project, a trip. The base's radio mast
 * is on every site and calls mission control (the contact form).
 */

export type StationKind = "skill" | "job" | "project" | "trip" | "radio";

export interface Station {
  id: string;
  kind: StationKind;
  title: string;
  subtitle: string;
  x: number;
  z: number;
  /** Index into the matching list in constants / travel data. */
  index: number;
}

/** What you find on each world, and what it is called there. */
export const ACTIVITY = {
  skills: { noun: "skill crystals", verb: "Scan", kind: "skill" as const },
  experience: { noun: "career outposts", verb: "Visit", kind: "job" as const },
  projects: { noun: "project monoliths", verb: "Inspect", kind: "project" as const },
  travel: { noun: "travel beacons", verb: "Open", kind: "trip" as const },
};

/** The radio mast beside the base dome (see Base in mars-surface.tsx). */
export const RADIO = { x: -45, z: 23 };

/**
 * Spread the stations in an arc beside where the ship stops: off the runway
 * (which runs through the origin toward about -2.6 rad and on past it toward
 * 0.55 rad) and away from the base (about 2.45 rad).
 */
function arc(n: number, i: number) {
  const a0 = -1.75;
  const a1 = -0.35;
  const a = n === 1 ? 0 : a0 + ((a1 - a0) * i) / (n - 1);
  const r = i % 2 === 0 ? 30 : 42;
  return { x: Math.cos(a) * r, z: Math.sin(a) * r };
}

export function stationsFor(level: Level): Station[] {
  let items: { title: string; subtitle: string }[] = [];
  const kind = ACTIVITY[level.section as keyof typeof ACTIVITY]?.kind ?? "skill";
  if (kind === "skill") items = skillGroups.map((g) => ({ title: g.category, subtitle: `${g.skills.length} skills` }));
  if (kind === "job") items = experiences.map((j) => ({ title: j.company, subtitle: j.role }));
  if (kind === "project") items = projects.map((p) => ({ title: p.title, subtitle: p.tech.slice(0, 2).join(" · ") }));
  if (kind === "trip")
    items = [...travelLocations]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((t) => ({ title: t.city, subtitle: t.country }));

  const list: Station[] = items.map((it, i) => ({
    id: `${kind}-${i}`,
    kind,
    title: it.title,
    subtitle: it.subtitle,
    index: kind === "trip" ? travelLocations.findIndex((t) => t.city === it.title) : i,
    ...arc(items.length, i),
  }));
  list.push({ id: "radio", kind: "radio", title: "Radio mast", subtitle: "Call mission control", index: 0, ...RADIO });
  return list;
}

/** How close you must be to open a station. */
export const REACH = 4.2;
