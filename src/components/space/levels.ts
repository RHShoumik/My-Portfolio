// SPIKE: throwaway prototype of the space game. Not production code.
import type { SectionId } from "./destinations";

/*
 * The four flights. Each one leaves the planet the last one reached, crosses
 * a different stretch of space, and lands somewhere you can stand: Mars
 * itself, then a moon of each giant planet (they have no ground to land on).
 */

export interface Body {
  name: string;
  /** NASA map in /public/space. */
  map: string;
  /** Multiplies the map, to turn the Moon's map into an icy or hazy moon. */
  tint?: string;
  r: number;
  atmosphere?: string;
  atmosphereStrength?: number;
  ring?: boolean;
  /** Draw a moving cloud layer (Earth). */
  clouds?: boolean;
  /** Axial tilt, radians. */
  tilt?: number;
}

/** How the landing site looks: ground, sky, light and haze. */
export interface Site {
  name: string;
  /** Ground colours: low, high, bright highlights and dark rock. */
  ground: [string, string, string, string];
  boulder: string;
  /** Sky at the horizon and straight up (linear-ish RGB 0..1). */
  horizon: [number, number, number];
  zenith: [number, number, number];
  /** Airless moons show stars in a black sky. */
  stars: boolean;
  /** Clouds to descend through. */
  clouds: string | null;
  sun: string;
  sunIntensity: number;
  hemi: [string, string, number];
  fog: [number, number];
  /** The colour of the haze that covers the cut from space to the surface. */
  haze: string;
  dust: string;
  /** Surface gravity, m/s² (how high the astronaut bounces). */
  gravity: number;
  /** A planet hanging in the sky above the moon. */
  skyPlanet?: { map: string; size: number; dir: [number, number, number]; ring?: boolean };
}

export type WaveSpec = ["fighters" | "missiles" | "note", number, number, string?];

export interface Level {
  number: number;
  from: string;
  to: string;
  section: SectionId;
  unlocks: string;
  /** Million km, for the countdown in the progress bar. */
  distance: number;
  departure: Body;
  /** The big planet ahead. */
  target: Body;
  /** Where you land: the target itself (Mars) or one of its moons. */
  landing: Body | null;
  site: Site;
  /** Asteroid layout: seed, where the dense belt starts and how long it is, how many rocks drift. */
  rocks: { seed: number; beltStart: number; beltLength: number; drift: number; tint: string };
  /** Satellites and the two minefields along the route. */
  satellites: number[];
  minefields: [number, number];
  waves: WaveSpec[];
  /** Enemy toughness and aggression. */
  enemy: { hp: number; fireGap: number; missileSpeed: number; fighterSpeed: number };
  intro: string;
}

const MARS_SITE: Site = {
  name: "Mars",
  ground: ["#9b4a2a", "#c27a4e", "#d29a70", "#4e2a1d"],
  boulder: "#c87048",
  horizon: [0.86, 0.62, 0.47],
  zenith: [0.36, 0.22, 0.17],
  stars: false,
  clouds: "#f7e4d4",
  sun: "#ffe3c6",
  sunIntensity: 2.4,
  hemi: ["#f3cfb0", "#5c3322", 0.85],
  fog: [140, 3300],
  haze: "#e3a882",
  dust: "#caa07c",
  gravity: 3.7,
};

export const LEVELS: Level[] = [
  {
    number: 1,
    from: "Earth",
    to: "Mars",
    section: "skills",
    unlocks: "Skills",
    distance: 225,
    departure: { name: "Earth", map: "/space/earth.jpg", r: 230 },
    target: { name: "Mars", map: "/space/mars.jpg", r: 190, atmosphere: "#ffa070", atmosphereStrength: 1.1, tilt: 0.44 },
    landing: null,
    site: MARS_SITE,
    rocks: { seed: 2024, beltStart: -1450, beltLength: 700, drift: 0.3, tint: "#ffffff" },
    satellites: [-260, -540, -780, -2080, -2420, -2720, -2960],
    minefields: [-960, -2330],
    waves: [
      ["note", -60, 0, "Guns fire on their own · Space launches a missile"],
      ["fighters", -380, 3],
      ["note", -880, 0, "Minefield · one shot sets off the whole cluster"],
      ["fighters", -1240, 4],
      ["note", -1400, 0, "Entering the asteroid belt"],
      ["missiles", -1620, 2],
      ["missiles", -1960, 3],
      ["fighters", -2220, 5, "Enemy squadron ahead"],
      ["missiles", -2600, 2],
      ["fighters", -2800, 3, "Last wave before Mars"],
      ["missiles", -3010, 2],
    ],
    enemy: { hp: 2, fireGap: 1, missileSpeed: 92, fighterSpeed: 46 },
    intro: "Fight your way to Mars through enemy fighters, missiles, mines and asteroids",
  },
  {
    number: 2,
    from: "Mars",
    to: "Jupiter",
    section: "experience",
    unlocks: "Experience",
    distance: 550,
    departure: { name: "Mars", map: "/space/mars.jpg", r: 210, atmosphere: "#ffa070", atmosphereStrength: 1.1, tilt: 0.44 },
    target: { name: "Jupiter", map: "/space/jupiter.jpg", r: 1100, atmosphere: "#ffd9a8", atmosphereStrength: 0.8, tilt: 0.05 },
    landing: { name: "Europa", map: "/space/moon.jpg", tint: "#f1e3cf", r: 150, atmosphere: "#cfe4ff", atmosphereStrength: 0.35 },
    site: {
      name: "Europa",
      ground: ["#9fb0c2", "#d9e2ec", "#f6f8fb", "#7b5e4c"],
      boulder: "#c9d3de",
      horizon: [0.05, 0.05, 0.07],
      zenith: [0.0, 0.0, 0.01],
      stars: true,
      clouds: null,
      sun: "#fff6ea",
      sunIntensity: 2.1,
      hemi: ["#c7d6ff", "#4a3a30", 0.5],
      fog: [900, 6000],
      haze: "#d9e4ff",
      dust: "#e8e4dc",
      gravity: 1.3,
      skyPlanet: { map: "/space/jupiter.jpg", size: 900, dir: [-0.62, 0.2, -0.76] },
    },
    rocks: { seed: 77, beltStart: -500, beltLength: 2100, drift: 0.45, tint: "#d9cbb8" },
    satellites: [-300, -720, -1180, -1660, -2140, -2580, -2940],
    minefields: [-820, -1900],
    waves: [
      ["note", -60, 0, "Level 2 · the main asteroid belt lies ahead"],
      ["fighters", -300, 4],
      ["missiles", -620, 2],
      ["note", -760, 0, "Minefield ahead"],
      ["fighters", -1100, 5, "Enemy squadron ahead"],
      ["missiles", -1420, 3],
      ["fighters", -1780, 4],
      ["missiles", -2080, 3],
      ["fighters", -2360, 6, "Heavy squadron ahead"],
      ["missiles", -2700, 3],
      ["fighters", -2900, 4, "Last wave before Jupiter"],
      ["missiles", -3050, 3],
    ],
    enemy: { hp: 2, fireGap: 0.85, missileSpeed: 100, fighterSpeed: 50 },
    intro: "Cross the main asteroid belt to Jupiter and land on its icy moon Europa",
  },
  {
    number: 3,
    from: "Jupiter",
    to: "Saturn",
    section: "projects",
    unlocks: "Projects",
    distance: 650,
    departure: { name: "Jupiter", map: "/space/jupiter.jpg", r: 420, atmosphere: "#ffd9a8", atmosphereStrength: 0.8, tilt: 0.05 },
    target: { name: "Saturn", map: "/space/saturn.jpg", r: 820, atmosphere: "#ffe7b8", atmosphereStrength: 0.7, ring: true, tilt: 0.38 },
    landing: { name: "Titan", map: "/space/moon.jpg", tint: "#d99a45", r: 165, atmosphere: "#ffb24a", atmosphereStrength: 2.2 },
    site: {
      name: "Titan",
      ground: ["#5a3a1c", "#7d5426", "#a8783a", "#2e1d10"],
      boulder: "#8a6a48",
      horizon: [0.78, 0.5, 0.18],
      zenith: [0.42, 0.24, 0.07],
      stars: false,
      clouds: "#e8b56c",
      sun: "#ffd29a",
      sunIntensity: 1.5,
      hemi: ["#f0b066", "#3a2410", 1.0],
      fog: [60, 1800],
      haze: "#d08a3c",
      dust: "#a07a4c",
      gravity: 1.35,
      skyPlanet: { map: "/space/saturn.jpg", size: 520, dir: [-0.45, 0.16, -0.88], ring: true },
    },
    rocks: { seed: 913, beltStart: -1700, beltLength: 1300, drift: 0.55, tint: "#e9eef8" },
    satellites: [-240, -620, -1020, -1380, -2060, -2460, -2880],
    minefields: [-700, -1500],
    waves: [
      ["note", -60, 0, "Level 3 · enemy fighters are tougher here"],
      ["fighters", -260, 5],
      ["missiles", -540, 3],
      ["note", -640, 0, "Minefield ahead"],
      ["fighters", -980, 5],
      ["missiles", -1260, 3],
      ["note", -1680, 0, "Entering Saturn's ring debris"],
      ["fighters", -1820, 6, "Heavy squadron ahead"],
      ["missiles", -2140, 4],
      ["fighters", -2480, 6],
      ["missiles", -2760, 3],
      ["fighters", -2950, 5, "Last wave before Saturn"],
    ],
    enemy: { hp: 3, fireGap: 0.75, missileSpeed: 108, fighterSpeed: 54 },
    intro: "Thread Saturn's ring debris and land under the orange haze of Titan",
  },
  {
    number: 4,
    from: "Saturn",
    to: "Earth",
    section: "travel",
    unlocks: "Travel",
    distance: 1280,
    departure: { name: "Saturn", map: "/space/saturn.jpg", r: 380, atmosphere: "#ffe7b8", atmosphereStrength: 0.7, ring: true, tilt: 0.38 },
    // Home: you land on Earth itself, in Bangladesh, where the trips are.
    target: { name: "Earth", map: "/space/earth.jpg", r: 620, atmosphere: "#5aa8ff", atmosphereStrength: 2.2, clouds: true, tilt: 0.41 },
    landing: null,
    site: {
      name: "Earth",
      ground: ["#5f7a3a", "#86a04e", "#c9b98a", "#4a3d2a"],
      boulder: "#8d877c",
      horizon: [0.66, 0.78, 0.92],
      zenith: [0.22, 0.42, 0.8],
      stars: false,
      clouds: "#ffffff",
      sun: "#fff4dc",
      sunIntensity: 2.6,
      hemi: ["#c4dcff", "#4d5a30", 0.95],
      fog: [260, 4200],
      haze: "#d6e8ff",
      dust: "#b9a37c",
      gravity: 9.8,
      // A pale daytime Moon over the fields.
      skyPlanet: { map: "/space/moon.jpg", size: 130, dir: [-0.62, 0.3, -0.72] },
    },
    rocks: { seed: 4242, beltStart: -300, beltLength: 2700, drift: 0.65, tint: "#c9d6ff" },
    satellites: [-280, -700, -1120, -1540, -1960, -2380, -2800],
    minefields: [-900, -2200],
    waves: [
      ["note", -60, 0, "Final level · the long way home"],
      ["fighters", -240, 5],
      ["missiles", -480, 3],
      ["fighters", -780, 6, "Heavy squadron ahead"],
      ["note", -860, 0, "Minefield ahead"],
      ["missiles", -1180, 4],
      ["fighters", -1480, 6],
      ["missiles", -1760, 4],
      ["fighters", -2060, 7, "Enemy fleet ahead"],
      ["missiles", -2380, 4],
      ["fighters", -2660, 6],
      ["missiles", -2880, 4],
      ["fighters", -3000, 5, "Last wave before Earth"],
    ],
    enemy: { hp: 3, fireGap: 0.65, missileSpeed: 116, fighterSpeed: 58 },
    intro: "Fly home from Saturn and land on Earth, where my travel stories are waiting",
  },
];

/** The body you actually land on. */
export const landingBody = (l: Level) => l.landing ?? l.target;
