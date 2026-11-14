// SPIKE: throwaway prototype of the space game. Not production code.
import * as THREE from "three";
import { landingBody, LEVELS, type Level } from "./levels";

/** Length of the journey, in world units. The rocket flies toward -Z. */
export const TRACK = 3200;

/** How far the rocket may move sideways and up/down. */
export const CORRIDOR = { x: 22, y: 13 };

/** Direction the sunlight comes from. */
export const SUN_DIR = new THREE.Vector3(0.85, 0.28, 0.45).normalize();

export const EARTH = { pos: new THREE.Vector3(-70, -390, -200), r: 230 };
export const MOON = { pos: new THREE.Vector3(260, 95, -1150), r: 42 };

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ROCK_VARIANTS = 4;

export interface Rock {
  /** Current position (updated every frame by the asteroid field). */
  x: number;
  y: number;
  z: number;
  /** Rest position the rock drifts around. */
  x0: number;
  y0: number;
  r: number;
  /** Side-to-side drift: amplitude, speed and phase. */
  dx: number;
  dy: number;
  dw: number;
  dp: number;
  axis: THREE.Vector3;
  spin: number;
  variant: number;
  slot: number;
  /** Shots it takes to break; big rocks take several. */
  maxHp: number;
  hp: number;
  alive: boolean;
}

const ROCK_COUNT = 220;

/** The asteroid field. Fixed count (it is drawn instanced); laid out again for each level. */
export const rocks: Rock[] = Array.from({ length: ROCK_COUNT }, (_, i) => ({
  x: 0, y: 0, z: 0, x0: 0, y0: 0, r: 1, dx: 0, dy: 0, dw: 0, dp: 0,
  axis: new THREE.Vector3(0, 1, 0),
  spin: 0,
  variant: i % ROCK_VARIANTS,
  slot: Math.floor(i / ROCK_VARIANTS),
  maxHp: 1,
  hp: 1,
  alive: true,
}));

/** Scatter the rocks for a level. Seeded, so a level is the same every time. */
export function layoutRocks(level: Level) {
  const { seed, beltStart, beltLength, drift } = level.rocks;
  const rng = mulberry32(seed);
  rocks.forEach((rock, i) => {
    // About two thirds scattered along the route, the rest packed into the belt.
    const z = i < 150 ? -260 - rng() * (TRACK - 520) : beltStart - rng() * beltLength;
    const big = rng() < 0.06;
    const r = big ? 6 + rng() * 3 : 1.2 + Math.pow(rng(), 2) * 4.3;
    const drifting = rng() < drift;
    const x0 = (rng() * 2 - 1) * (CORRIDOR.x + 8);
    const y0 = (rng() * 2 - 1) * (CORRIDOR.y + 6);
    Object.assign(rock, {
      x: x0, y: y0, z, x0, y0, r,
      dx: drifting ? 3 + rng() * 6 : 0,
      dy: drifting ? 2 + rng() * 4 : 0,
      dw: 0.3 + rng() * 0.6,
      dp: rng() * Math.PI * 2,
      spin: 0.2 + rng() * 0.8,
      maxHp: Math.ceil(r / 3),
      hp: Math.ceil(r / 3),
      alive: true,
    });
    rock.axis.set(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize();
  });
}
layoutRocks(LEVELS[0]);

/** Where the planets of a level sit. */
export function departurePos(l: Level) {
  return new THREE.Vector3(-70, -160 - l.departure.r, -200);
}
export function landingPos(l: Level) {
  return new THREE.Vector3(30, -10, -TRACK - 240 - landingBody(l).r);
}
/** The big planet ahead. When you land on one of its moons, it hangs behind that moon. */
export function targetPos(l: Level) {
  if (!l.landing) return landingPos(l);
  const r = l.target.r;
  return new THREE.Vector3(-r * 0.5, r * 0.1, -TRACK - 700 - r);
}

export const rocksPerVariant = Array.from(
  { length: ROCK_VARIANTS },
  (_, v) => rocks.filter((r) => r.variant === v).length
);
