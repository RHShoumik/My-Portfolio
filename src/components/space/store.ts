// SPIKE: throwaway prototype of the space game. Not production code.
import * as THREE from "three";
import { create } from "zustand";
import type { SectionId } from "./destinations";

/**
 * ready → flying → (crashed → ready | gameover) → landing → arrived.
 * "landing" is the automatic cinematic touchdown; "arrived" is parked on the pad.
 */
export type Phase = "ready" | "flying" | "crashed" | "landing" | "arrived" | "gameover";

export const MAX_LIVES = 3;

/** After this many crashes on a level, autopilot is offered. */
export const AUTOPILOT_AFTER = 2;

export const LEVEL = {
  number: 1,
  total: 4,
  from: "Earth",
  to: "Mars",
  unlocks: "Skills",
  section: "skills" as SectionId,
  next: "Jupiter",
};

interface SpaceState {
  phase: Phase;
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

export const useSpace = create<SpaceState>((set, get) => ({
  phase: "ready",
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
  ammo: 6,
  setAmmo: (n) => set({ ammo: n }),
  land: () => {
    if (get().phase !== "landing") return;
    set({ phase: "arrived", scene: "surface", caption: null, open: LEVEL.section });
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
  retry: () =>
    set({
      phase: "ready",
      lives: MAX_LIVES,
      crashes: 0,
      progress: 0,
      autopilot: false,
      open: null,
      scene: "space",
      caption: null,
    }),
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
  /** Seconds left of the muzzle flash on the left and right cannon. */
  muzzle: [0, 0] as [number, number],
};

/** The full-screen haze used to cut from space to the Martian sky. */
export const fadeEl: { current: HTMLDivElement | null } = { current: null };
