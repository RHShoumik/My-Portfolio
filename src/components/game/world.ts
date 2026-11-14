// SPIKE: throwaway prototype of the island game. Not production code.
import * as THREE from "three";

export const SKY = "#b9d0d5";
export const DOCK_Y = 1;
export const SAND_Y = 0.6;

export type RectLand = {
  kind: "rect";
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  y: number;
};
export type IslandLand = {
  kind: "island";
  cx: number;
  cz: number;
  r: number;
  top: number;
  sx?: number;
  sz?: number;
  relief?: number;
};
export type Land = RectLand | IslandLand;

export const QUAY: RectLand = {
  kind: "rect",
  minX: -34,
  maxX: 34,
  minZ: -30,
  maxZ: -4,
  y: DOCK_Y,
};
export const PIER: RectLand = {
  kind: "rect",
  minX: -3,
  maxX: 3,
  minZ: -4,
  maxZ: 26,
  y: DOCK_Y,
};
export const SKILLS_ISLAND: IslandLand = {
  kind: "island",
  cx: 0,
  cz: 490,
  r: 70,
  top: 3,
};

export const islands = [
  {
    ...SKILLS_ISLAND,
    sx: 1.15,
    sz: 0.85,
    relief: 0,
    id: "skills",
    approach: [0, 430] as [number, number],
    label: "Skills",
    href: "/#skills",
    accent: "#b7d9ad",
  },
  {
    kind: "island" as const,
    cx: -360,
    cz: 165,
    r: 63,
    top: 3,
    sx: 1.3,
    sz: 0.8,
    relief: 0,
    id: "experience",
    approach: [-360, 95] as [number, number],
    label: "Experience",
    href: "/#experience",
    accent: "#a9c8ee",
  },
  {
    kind: "island" as const,
    cx: 360,
    cz: 165,
    r: 86,
    top: 3,
    sx: 0.85,
    sz: 1.2,
    relief: 5,
    id: "travel",
    approach: [360, 235] as [number, number],
    label: "Travel",
    href: "/travel",
    accent: "#e6bc7b",
  },
  {
    kind: "island" as const,
    cx: 0,
    cz: 1010,
    r: 64,
    top: 3,
    sx: 0.85,
    sz: 1.15,
    relief: 3,
    id: "contact",
    approach: [0, 930] as [number, number],
    label: "Contact",
    href: "/#contact",
    accent: "#dcb7dc",
  },
];
export const lands: Land[] = [QUAY, PIER, ...islands];

/** Shared, mutable player position (read by the sea, the sun and the camera). */
export const playerPos = new THREE.Vector3(0, DOCK_Y, 18);

/** Shared footprint for rendering, landing and water foam. */
export function islandDistance(i: IslandLand, x: number, z: number): number {
  const dx = (x - i.cx) / (i.sx ?? 1),
    dz = (z - i.cz) / (i.sz ?? 1);
  const angle = Math.atan2(dz, dx);
  return (
    Math.hypot(dx, dz) -
    i.r -
    2 * Math.sin(angle * 3) -
    1.2 * Math.cos(angle * 5)
  );
}
export function islandGround(i: IslandLand, x: number, z: number): number {
  const d = islandDistance(i, x, z);
  if (d > 0) return SAND_Y - d * 0.5;
  const t = THREE.MathUtils.smoothstep(-d, 4, 15);
  const hill =
    (i.relief ?? 0) *
    Math.exp(-((x - i.cx - 10) ** 2 + (z - i.cz - 20) ** 2) / 160);
  return SAND_Y + (i.top - SAND_Y) * t + hill * t;
}

/** Ground height at a point, or null if it is water. */
export function heightAt(x: number, z: number): number | null {
  for (const l of lands) {
    if (l.kind === "rect") {
      if (x >= l.minX && x <= l.maxX && z >= l.minZ && z <= l.maxZ) return l.y;
    } else {
      if (islandDistance(l, x, z) <= 0) return islandGround(l, x, z);
    }
  }
  return null;
}

/** Signed distance to the nearest shoreline: negative on land, positive at sea. */
export function landSDF(x: number, z: number): number {
  let best = Infinity;
  for (const l of lands) {
    let d: number;
    if (l.kind === "rect") {
      const dx = Math.max(l.minX - x, 0, x - l.maxX);
      const dz = Math.max(l.minZ - z, 0, z - l.maxZ);
      d =
        dx > 0 || dz > 0
          ? Math.hypot(dx, dz)
          : -Math.min(x - l.minX, l.maxX - x, z - l.minZ, l.maxZ - z);
    } else {
      d = islandDistance(l, x, z) * Math.min(l.sx ?? 1, l.sz ?? 1);
    }
    if (d < best) best = d;
  }
  return best;
}

/** Direction pointing away from land (gradient of the shoreline distance). */
export function shoreNormal(x: number, z: number): [number, number] {
  const e = 0.5;
  const gx = landSDF(x + e, z) - landSDF(x - e, z);
  const gz = landSDF(x, z + e) - landSDF(x, z - e);
  const len = Math.hypot(gx, gz);
  return len < 1e-3 ? [0, 0] : [gx / len, gz / len];
}

/** Wave height. The sea shader uses the same formula, so boats sit on the surface. */
export function waveHeight(x: number, z: number, t: number): number {
  return (
    0.28 * Math.sin(x * 0.22 + t * 1.1) +
    0.22 * Math.sin(z * 0.31 + t * 0.9) +
    0.12 * Math.sin((x + z) * 0.5 + t * 1.6)
  );
}

/** Photo-walk locations also define the solid exhibit footprints. */
export const travelGalleryStops = [
  { x: 330, z: 122 },
  { x: 350, z: 100 },
  { x: 379, z: 106 },
  { x: 406, z: 128 },
  { x: 408, z: 163 },
  { x: 384, z: 191 },
];

/** Solid landmark footprints; scenery and collision share these positions. */
export const obstacles = [
  ...travelGalleryStops.map((stop) => ({ ...stop, r: 4 })),
  { x: 0, z: 497, r: 3 },
  { x: -360, z: 179, r: 5 },
  { x: 342, z: 179, r: 3.5 },
  { x: 10, z: 1030, r: 3.8 },
];
export function blockedByProp(x: number, z: number, padding: number) {
  return obstacles.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + padding);
}
