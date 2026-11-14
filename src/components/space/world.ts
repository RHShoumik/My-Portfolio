// SPIKE: throwaway prototype of the space game. Not production code.
import * as THREE from "three";

/** Length of the journey, in world units. The rocket flies toward -Z. */
export const TRACK = 3200;

/** How far the rocket may move sideways and up/down. */
export const CORRIDOR = { x: 22, y: 13 };

/** Direction the sunlight comes from. */
export const SUN_DIR = new THREE.Vector3(0.85, 0.28, 0.45).normalize();

export const EARTH = { pos: new THREE.Vector3(-70, -390, -200), r: 230 };
export const MOON = { pos: new THREE.Vector3(260, 95, -1150), r: 42 };
export const MARS = { pos: new THREE.Vector3(30, -10, -TRACK - 430), r: 190 };

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

/** The asteroid field between Earth and Mars. Seeded, so it is the same every time. */
export const rocks: Rock[] = (() => {
  const rng = mulberry32(2024);
  const list: Rock[] = [];
  const slots = new Array(ROCK_VARIANTS).fill(0);

  const add = (z: number) => {
    const big = rng() < 0.06;
    const r = big ? 6 + rng() * 3 : 1.2 + Math.pow(rng(), 2) * 4.3;
    const drifting = rng() < 0.3;
    const x0 = (rng() * 2 - 1) * (CORRIDOR.x + 8);
    const y0 = (rng() * 2 - 1) * (CORRIDOR.y + 6);
    const variant = Math.floor(rng() * ROCK_VARIANTS);
    list.push({
      x: x0,
      y: y0,
      z,
      x0,
      y0,
      r,
      dx: drifting ? 3 + rng() * 6 : 0,
      dy: drifting ? 2 + rng() * 4 : 0,
      dw: 0.3 + rng() * 0.6,
      dp: rng() * Math.PI * 2,
      axis: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize(),
      spin: 0.2 + rng() * 0.8,
      variant,
      slot: slots[variant]++,
      maxHp: Math.ceil(r / 3),
      hp: Math.ceil(r / 3),
      alive: true,
    });
  };

  // A loose scatter along the whole route…
  for (let i = 0; i < 150; i++) add(-260 - rng() * (TRACK - 520));
  // …and a denser belt in the middle of the journey.
  for (let i = 0; i < 70; i++) add(-1450 - rng() * 700);

  return list;
})();

export const rocksPerVariant = Array.from(
  { length: ROCK_VARIANTS },
  (_, v) => rocks.filter((r) => r.variant === v).length
);
