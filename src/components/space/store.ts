// SPIKE: throwaway prototype of the space game. Not production code.
import * as THREE from "three";
import { create } from "zustand";
import type { SectionId } from "./destinations";
import { LEVELS, type Level } from "./levels";

/**
 * ready → flying → (crashed → ready | gameover) → landing → eva.
 * "landing" is the automatic cinematic touchdown; "eva" is walking around the
 * landing site as an astronaut; "arrived" is parked on the pad (no longer used
 * by the normal flow, kept for the cinematic's parked camera).
 */
export type Phase = "ready" | "flying" | "crashed" | "landing" | "arrived" | "eva" | "takeoff" | "gameover";

export const MAX_LIVES = 3;

/** After this many crashes on a level, autopilot is offered. */
export const AUTOPILOT_AFTER = 2;

const UNLOCK_KEY = "space-unlocked";

/** The level being flown. */
export const currentLevel = (): Level => LEVELS[useSpace.getState().level];
export const useLevel = (): Level => LEVELS[useSpace((s) => s.level)];

interface SpaceState {
  phase: Phase;
  /** Index into LEVELS. */
  level: number;
  /** Highest level index you may pick (every landing unlocks the next). */
  unlocked: number;
  /** Go to a level you have unlocked, ready to launch. */
  selectLevel: (i: number) => void;
  /** After landing: on to the next planet. */
  nextLevel: () => void;
  /** Read the unlocked levels saved in this browser. */
  restore: () => void;
  lives: number;
  /** Crashes on the current level. */
  crashes: number;
  autopilot: boolean;
  /** 0 at Earth, 1 at Mars. */
  progress: number;
  /** Bumped on every launch so the scene can reset itself. */
  run: number;
  /** The portfolio section open in the side panel, if any. */
  open: SectionId | null;
  setOpen: (id: SectionId | null) => void;
  /** Which world is drawn: open space, or the surface of Mars after entry. */
  scene: "space" | "surface";
  setScene: (scene: "space" | "surface") => void;
  /** Subtitle shown during the landing cinematic. */
  caption: string | null;
  setCaption: (caption: string | null) => void;
  /** Landing done (or skipped): park on the pad and open the unlocked section. */
  land: () => void;
  /** Points from things you shot down this run, and how many. */
  score: number;
  kills: number;
  addScore: (points: number) => void;
  /** A short warning on screen ("Missile warning"); the id changes on every new alert. */
  alert: string | null;
  alertId: number;
  setAlert: (text: string | null) => void;
  /** On foot: stations you have opened on this world, the one in reach, and the one open. */
  visited: string[];
  near: string | null;
  setNear: (id: string | null) => void;
  activity: string | null;
  openActivity: (id: string | null) => void;
  /** On foot, close enough to the parked ship to climb back in. */
  nearShip: boolean;
  setNearShip: (near: boolean) => void;
  /** Climbed in: start the take-off cinematic. */
  takeoff: () => void;
  /** Take-off done (or skipped): on to the next planet, flying. */
  depart: () => void;
  /** Closed by hand: stays shut until you walk away from it. */
  dismissed: string | null;
  closeActivity: () => void;
  setDismissed: (id: string | null) => void;
  /** Missiles ready to launch. */
  ammo: number;
  setAmmo: (n: number) => void;
  launch: (autopilot?: boolean) => void;
  crash: () => void;
  afterCrash: () => void;
  arrive: () => void;
  retry: () => void;
  setProgress: (p: number) => void;
}

/** Back on the launch line with full lives. */
const fresh = {
  phase: "ready" as Phase,
  lives: MAX_LIVES,
  crashes: 0,
  progress: 0,
  autopilot: false,
  open: null,
  scene: "space" as const,
  caption: null,
  visited: [] as string[],
  near: null,
  activity: null,
  dismissed: null,
  nearShip: false,
};

export const useSpace = create<SpaceState>((set, get) => ({
  phase: "ready",
  level: 0,
  unlocked: 0,
  selectLevel: (i) => {
    const s = get();
    if (i < 0 || i > s.unlocked || i >= LEVELS.length) return;
    if (s.phase === "flying" || s.phase === "landing") return;
    set({ ...fresh, level: i });
  },
  nextLevel: () => {
    const s = get();
    if (s.level + 1 >= LEVELS.length) return;
    set({ ...fresh, level: s.level + 1 });
  },
  restore: () => {
    try {
      const n = Number(window.localStorage.getItem(UNLOCK_KEY));
      if (Number.isFinite(n) && n > 0) {
        const unlocked = Math.min(n, LEVELS.length - 1);
        set({ unlocked, level: unlocked });
      }
    } catch {
      /* storage blocked: start at level 1 */
    }
  },
  lives: MAX_LIVES,
  crashes: 0,
  autopilot: false,
  progress: 0,
  run: 0,
  open: null,
  setOpen: (id) => set({ open: id }),
  scene: "space",
  setScene: (scene) => set({ scene }),
  caption: null,
  setCaption: (caption) => set({ caption }),
  score: 0,
  kills: 0,
  addScore: (points) => set((s) => ({ score: s.score + points, kills: s.kills + 1 })),
  alert: null,
  alertId: 0,
  setAlert: (text) => set((s) => ({ alert: text, alertId: s.alertId + 1 })),
  visited: [],
  near: null,
  setNear: (id) => set({ near: id }),
  activity: null,
  openActivity: (id) =>
    set((s) => ({
      activity: id,
      visited: id && !s.visited.includes(id) ? [...s.visited, id] : s.visited,
    })),
  nearShip: false,
  setNearShip: (near) => set({ nearShip: near }),
  takeoff: () => {
    if (get().phase !== "eva") return;
    set({ phase: "takeoff", activity: null, near: null, nearShip: false, open: null, caption: null });
  },
  depart: () => {
    const s = get();
    if (s.phase !== "takeoff") return;
    if (s.level + 1 < LEVELS.length) {
      // Straight on to the next planet: skip the launch-line briefing.
      set({ ...fresh, level: s.level + 1 });
      get().launch(false);
    } else {
      // Last world done: home to Earth, back on the launch line.
      set({ ...fresh, level: 0 });
    }
  },
  dismissed: null,
  closeActivity: () => set((s) => ({ activity: null, dismissed: s.activity })),
  setDismissed: (id) => set({ dismissed: id }),
  ammo: 6,
  setAmmo: (n) => set({ ammo: n }),
  land: () => {
    const s = get();
    if (s.phase !== "landing") return;
    const unlocked = Math.min(LEVELS.length - 1, Math.max(s.unlocked, s.level + 1));
    if (unlocked !== s.unlocked) {
      try {
        window.localStorage.setItem(UNLOCK_KEY, String(unlocked));
      } catch {
        /* storage blocked: unlock for this visit only */
      }
    }
    set({ phase: "eva", scene: "surface", caption: null, open: null, unlocked, visited: [], near: null, activity: null, dismissed: null });
  },
  launch: (autopilot = false) => {
    const s = get();
    if (s.phase !== "ready") return;
    set({ phase: "flying", autopilot, progress: 0, run: s.run + 1, open: null, score: 0, kills: 0, alert: null });
  },
  crash: () => {
    const s = get();
    if (s.phase !== "flying") return;
    set({ phase: "crashed", lives: s.lives - 1, crashes: s.crashes + 1 });
  },
  afterCrash: () =>
    set((s) => ({ phase: s.lives > 0 ? "ready" : "gameover", progress: 0 })),
  arrive: () => {
    if (get().phase !== "flying") return;
    set({ phase: "landing", progress: 1 });
  },
  retry: () => set(fresh),
  setProgress: (p) => set({ progress: p }),
}));

/** Steering input from the keyboard or touch: x and y in -1..1. */
export const input = {
  x: 0,
  y: 0,
  boost: false,
  /** Hold to fire the guns even with nothing locked (they fire on their own at targets). */
  fire: false,
  /** Set once per press; the flight controller launches a missile and clears it. */
  missile: false,
  /** On foot: jump (once per press) and use whatever is in reach. */
  jump: false,
  act: false,
  /** On foot: climb back into the ship (once per press). */
  board: false,
};

/** Live ship values that other parts of the scene read every frame. */
export const rocketLive = {
  pos: new THREE.Vector3(0, 0, 0),
  speed: 0,
  /** Main engines, 0..1. */
  throttle: 0,
  /** Seconds left of camera shake. */
  shake: 0,
  /** Atmospheric entry glow, 0..1. */
  heat: 0,
  /** Landing gear, 0 (stowed) .. 1 (down). */
  gear: 0,
  /** Belly hover thrusters, 0..1. */
  hover: 0,
  /** Tyres and brakes biting the runway after touchdown, 0..1 (kicks up dust). */
  skid: 0,
  /** Seconds left of the muzzle flash on the left and right cannon. */
  muzzle: [0, 0] as [number, number],
};

/** Where shadows are sharpest on the surface: the ship while landing, the astronaut on foot. */
export const shadowFocus = new THREE.Vector3();

/** The full-screen haze used to cut from space to the Martian sky. */
export const fadeEl: { current: HTMLDivElement | null } = { current: null };
