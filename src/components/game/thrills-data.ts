// SPIKE: throwaway prototype of the island game. Not production code.
/** Where the thrill rides and the treasure chests are. Plain data, no 3D. */
import { DOCK_Y } from "./world";

/** The human cannon on the dockyard, aimed out to open sea. */
export const CANNON = { x: -22, z: -9, y: DOCK_Y, heading: -0.46, elevation: 0.73 };

/** The hot-air balloon's landing pad on the Skills island. */
export const BALLOON = { x: 42, z: 522 };
/** The skydiving target, also on the Skills island. */
export const TARGET = { x: -42, z: 520, r: 6 };

/** The trampoline on the Skills island's east side. */
export const TRAMPOLINE = { x: 58, z: 468, r: 2.6 };

/** The zipline from the Travel island's hill out over the sea. */
export const ZIP = {
  tower: { x: 396, z: 212, height: 15 },
  end: { x: 492, z: 248, y: 5 },
};

export type Chest = {
  id: string;
  x: number;
  z: number;
  /** Floating on a raft out at sea rather than on land. */
  raft?: boolean;
  hint: string;
};

export const CHESTS: Chest[] = [
  { id: "dock", x: -20, z: -28.6, hint: "Behind the dockyard warehouse" },
  { id: "skills", x: -58, z: 478, hint: "West side of the Skills island" },
  { id: "experience", x: -398, z: 192, hint: "Behind the shipyard" },
  { id: "travel", x: 302, z: 222, hint: "Deep in the Travel island woods" },
  { id: "contact", x: 26, z: 1046, hint: "Behind the lighthouse" },
  { id: "raft", x: 150, z: 330, raft: true, hint: "Adrift at sea, east of the route to Skills" },
];

/** Places decoration must keep clear of. */
export const THRILL_CLEAR = [
  { x: BALLOON.x, z: BALLOON.z, r: 9 },
  { x: TARGET.x, z: TARGET.z, r: TARGET.r + 3 },
  { x: TRAMPOLINE.x, z: TRAMPOLINE.z, r: 6 },
  { x: ZIP.tower.x, z: ZIP.tower.z, r: 6 },
  ...CHESTS.map((c) => ({ x: c.x, z: c.z, r: 3.5 })),
];
