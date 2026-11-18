// SPIKE: throwaway prototype of the island game. Not production code.
/*
 * Where decoration may go. Trees, bushes, flowers and animals are scattered
 * with a fixed seed, but never on the walking routes, around landmarks, at
 * activity spots or on the crab's beach, so nothing blocks the game.
 */
import { islands, islandDistance, travelGalleryStops } from "./world";
import { THRILL_CLEAR } from "./thrills-data";

export type Island = (typeof islands)[number];
type Circle = { x: number; z: number; r: number };

/** Activity spots (see `sites` in activities.tsx). */
const SITES: Record<string, [number, number]> = {
  skills: [0, 491],
  experience: [-360, 165],
  travel: [342, 172],
  contact: [0, 1018],
};

/** Room kept clear around buildings, signs, the gallery and the crab. */
const CLEAR: Circle[] = [
  { x: 0, z: 494, r: 13 }, // workshop
  { x: -358, z: 180, r: 13 }, // shipyard shed
  { x: -343, z: 182, r: 9 }, // containers
  { x: -378, z: 184, r: 5 }, // crane mast
  { x: 342, z: 177, r: 11 }, // campsite
  { x: 6, z: 1026, r: 11 }, // lighthouse and radio house
  { x: 364, z: 247, r: 14 }, // crab beach
  ...travelGalleryStops.map((s) => ({ ...s, r: 7 })),
  ...Object.values(SITES).map(([x, z]) => ({ x, z, r: 12 })),
  ...islands.map((i) => ({ x: i.cx, z: i.cz - i.r * i.sz + 6, r: 5 })), // island signs
  ...THRILL_CLEAR, // rides and treasure chests
];

/** Distance from a point to a segment. */
function segment(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax,
    dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}

/** True where decoration must not go: routes, landmarks, activity spots. */
export function isClear(island: Island, x: number, z: number, pad = 0) {
  for (const c of CLEAR) if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return false;
  // The route from the landing beach to the island's activity, and the
  // central strip the existing paths use.
  const [sx, sz] = SITES[island.id];
  const [ax, az] = island.approach;
  if (segment(x, z, ax, az, sx, sz) < 7 + pad) return false;
  if (Math.abs(x - island.cx) < 5 + pad && z < island.cz) return false;
  return true;
}

/** Small deterministic random generator. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export type Spot = { x: number; z: number; s: number; a: number; r: number };

/**
 * Scatter `count` spots on an island between `inner` and `edge` metres in
 * from the shore, at least `gap` apart from each other and from `avoid`.
 */
export function scatter(
  island: Island,
  count: number,
  seed: number,
  {
    edge = 6,
    inner = Infinity,
    gap = 3,
    avoid = [] as { x: number; z: number }[],
    near,
  }: {
    edge?: number;
    inner?: number;
    gap?: number;
    avoid?: { x: number; z: number }[];
    /** Keep within this circle (for herds and groves). */
    near?: Circle;
  } = {},
): Spot[] {
  const random = rng(seed);
  const out: Spot[] = [];
  const span = island.r + 10;
  for (let tries = 0; out.length < count && tries < count * 60; tries++) {
    const x = near
      ? near.x + (random() * 2 - 1) * near.r
      : island.cx + (random() * 2 - 1) * span * island.sx;
    const z = near
      ? near.z + (random() * 2 - 1) * near.r
      : island.cz + (random() * 2 - 1) * span * island.sz;
    if (near && Math.hypot(x - near.x, z - near.z) > near.r) continue;
    const d = -islandDistance(island, x, z);
    if (d < edge || d > inner) continue;
    if (!isClear(island, x, z, 1)) continue;
    if (out.some((p) => Math.hypot(p.x - x, p.z - z) < gap)) continue;
    if (avoid.some((p) => Math.hypot(p.x - x, p.z - z) < gap + 1)) continue;
    out.push({ x, z, s: random(), a: random() * Math.PI * 2, r: random() });
  }
  return out;
}
