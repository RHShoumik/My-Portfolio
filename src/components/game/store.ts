// SPIKE: throwaway prototype of the island game. Not production code.
import { create } from "zustand";

export type Mode = "walk" | "buggy" | "boat" | "swim";

export const isLandMode = (m: Mode) => m === "walk" || m === "buggy";

interface GameState {
  destination: string;
  setDestination: (id: string) => void;
  mode: Mode;
  /** Close enough to a shoreline to change between land and sea. */
  nearShore: boolean;
  /** Metres to the selected island shore (0 when on it). */
  distance: number;
  /** Angle to the island relative to where the player faces, in radians. */
  bearing: number;
  x: number;
  z: number;
  heading: number;
  setHud: (
    h: Partial<
      Pick<
        GameState,
        "mode" | "nearShore" | "distance" | "bearing" | "x" | "z" | "heading"
      >
    >,
  ) => void;
}

export const useGame = create<GameState>((set) => ({
  destination: "skills",
  setDestination: (destination) => set({ destination }),
  mode: "walk",
  nearShore: true,
  distance: 0,
  bearing: 0,
  x: 0,
  z: 18,
  heading: 0,
  setHud: (h) => set(h),
}));

/** Movement input, written by the keyboard and the touch joystick. */
export const input = { forward: 0, turn: 0 };

/** A requested change of mode, consumed by the player on the next frame. */
export const cmd: { pending: Mode | null } = { pending: null };

/** Live motion values the 3D models read to animate themselves. */
export const motion = { speed: 0, turn: 0, mode: "walk" as Mode };

/** Where the speed boat is moored while the player is not in it. */
export const boatPark = { x: 5.4, z: 20, heading: 0 };

/** Orbit offsets shared by the canvas controls and reset button. */
export const cameraOrbit = { yaw: 0, pitch: 0, zoom: 1 };
export function resetCamera() {
  cameraOrbit.yaw = 0;
  cameraOrbit.pitch = 0;
  cameraOrbit.zoom = 1;
}
