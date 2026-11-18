// SPIKE: throwaway prototype of the island game. Not production code.
"use client";
/*
 * Thrill rides and a treasure hunt, all started with G (or the on-screen
 * button) when you are close:
 *  - Human cannon on the dockyard: a countdown, a boom, and a barrel-rolling
 *    flight out to sea. Your best distance is kept for the visit.
 *  - Hot-air balloon on the Skills island: a slow tour over every island.
 *    Press G to jump out, G again (or wait) for the parachute, steer with
 *    WASD and try to land on the target.
 *  - Trampoline on the Skills island: each bounce higher, with flips.
 *  - Zipline from the Travel island's hill, dropping you into the sea.
 *  - Six treasure chests hidden around the archipelago, each with a fact
 *    about Ragib. Find them all for fireworks.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { create } from "zustand";
import { playSound } from "@/lib/sound";
import { experiences, projects } from "@/lib/constants";
import { travelLocations } from "@/data/travel-data";
import { heightAt, playerPos, waveHeight } from "./world";
import { input, motion, ride, useIntro } from "./store";
import { useActivity } from "./activities";
import { BALLOON, CANNON, CHESTS, TARGET, TRAMPOLINE, ZIP } from "./thrills-data";

/* ------------------------------------------------------------------ */
/*  Shared state                                                      */
/* ------------------------------------------------------------------ */

export type ThrillId = "cannon" | "balloon" | "trampoline" | "zipline";
type Phase = "idle" | "countdown" | "fly" | "balloon" | "freefall" | "chute" | "bounce" | "zip";

const FOUND_KEY = "island-treasure";

export const useThrill = create<{
  near: ThrillId | null;
  phase: Phase;
  count: number;
  alt: number;
  bounces: number;
  toast: { text: string; id: number } | null;
  found: string[];
  best: number;
}>(() => ({
  near: null,
  phase: "idle",
  count: 0,
  alt: 0,
  bounces: 0,
  toast: null,
  found: [],
  best: 0,
}));

let toastId = 0;
function toast(text: string) {
  useThrill.setState({ toast: { text, id: ++toastId } });
}

/** Facts revealed by the treasure chests, drawn from the portfolio data. */
const FACTS = [
  `Ragib is a ${experiences[0].role} at ${experiences[0].company}.`,
  `He has built products at ${experiences.length} companies since 2020.`,
  `${projects[0].title} and ${projects[1].title} are marketplaces serving millions of users.`,
  `${travelLocations.length} places are pinned on his travel map so far.`,
  "This whole archipelago is built with React Three Fiber, no 3D files for the islands.",
  "He is based in Dhaka, Bangladesh, and loves a good hiking trail.",
];

/** Mutable simulation state, read and written every frame. */
const sim = {
  t: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  landing: "" as "" | "cannon" | "zip",
  from: { x: 0, z: 0 },
  stop: false,
  bounce: { n: 0, t: 0, air: 1, h: 0, top: 0, dir: 1, highest: 0 },
  zip: 0,
  zipSpeed: 0,
  chute: 0,
  balloon: { u: 0, flying: false, rider: false },
  fireworks: 0,
};

/* ------------------------------------------------------------------ */
/*  Particle bursts: smoke, splashes, coins and fireworks             */
/* ------------------------------------------------------------------ */

type Particle = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; age: number; size: number; grow: number; gravity: number; color: THREE.Color };
const POOL = 420;
const particles: Particle[] = [];
let cursor = 0;

function burst({
  x, y, z, count, colors, speed, up = 0, gravity = -9.8, size = 0.25, grow = 0, life = 1.4,
}: {
  x: number; y: number; z: number; count: number; colors: string[]; speed: number;
  up?: number; gravity?: number; size?: number; grow?: number; life?: number;
}) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = Math.random() * 2 - 1;
    const r = Math.sqrt(1 - v * v);
    const s = speed * (0.55 + Math.random() * 0.45);
    const p: Particle = {
      x, y, z,
      vx: Math.cos(a) * r * s, vy: v * s + up, vz: Math.sin(a) * r * s,
      life: life * (0.7 + Math.random() * 0.5), age: 0, size, grow, gravity,
      color: new THREE.Color(colors[i % colors.length]),
    };
    particles[cursor] = p;
    cursor = (cursor + 1) % POOL;
  }
}

function Bursts() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < POOL; i++) {
      const p = particles[i];
      if (!p || p.age >= p.life) {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        continue;
      }
      p.age += dt;
      p.vy += p.gravity * dt;
      const drag = Math.exp(-dt * 0.8);
      p.vx *= drag;
      p.vz *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const k = p.age / p.life;
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(Math.max(0, (p.size + p.grow * k) * (1 - k * k)));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, p.color);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, POOL]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Ride helpers                                                      */
/* ------------------------------------------------------------------ */

const BODY = 0.9; // height of the player's middle above the feet

/** Pose the player, flipping around the body's middle instead of the feet. */
function place(x: number, y: number, z: number, heading: number, pitch = 0, roll = 0) {
  ride.x = x - Math.sin(heading) * BODY * Math.sin(pitch);
  ride.z = z - Math.cos(heading) * BODY * Math.sin(pitch);
  ride.y = y + BODY - BODY * Math.cos(pitch);
  ride.heading = heading;
  ride.pitch = pitch;
  ride.roll = roll;
}

function ground(x: number, z: number, t: number) {
  const h = heightAt(x, z);
  return h === null ? { y: waveHeight(x, z, t), water: true } : { y: h, water: false };
}

function finish(x: number, z: number, heading: number, water: boolean) {
  ride.active = false;
  ride.camYaw = 0;
  ride.release = { x, z, heading, mode: water ? "swim" : "walk" };
  useThrill.setState({ phase: "idle" });
}

/** Path of the balloon tour: up from the pad, round every island, back down. */
const BALLOON_PATH = new THREE.CatmullRomCurve3(
  [
    [BALLOON.x, 3, BALLOON.z], [BALLOON.x, 30, BALLOON.z], [80, 70, 470], [200, 90, 380],
    [340, 95, 230], [260, 90, 80], [80, 85, -10], [-120, 90, 30], [-330, 95, 150],
    [-280, 90, 320], [-120, 80, 480], [10, 45, 545], [BALLOON.x, 14, BALLOON.z], [BALLOON.x, 3, BALLOON.z],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
);
const BALLOON_SPEED = 21;

const ZIP_A = new THREE.Vector3(ZIP.tower.x, 3 + ZIP.tower.height, ZIP.tower.z);
const ZIP_B = new THREE.Vector3(ZIP.end.x, ZIP.end.y + 3, ZIP.end.z);
const ZIP_LEN = ZIP_A.distanceTo(ZIP_B);
function zipPoint(s: number, out = new THREE.Vector3()) {
  out.lerpVectors(ZIP_A, ZIP_B, s);
  out.y -= Math.sin(s * Math.PI) * 4; // the cable sags in the middle
  return out;
}

/** Scratch vector for aiming the fireworks. */
const ahead = new THREE.Vector3();

/* ------------------------------------------------------------------ */
/*  Starting and acting                                               */
/* ------------------------------------------------------------------ */

function start(id: ThrillId) {
  const t = sim.t;
  ride.active = true;
  ride.camYaw = 0;
  if (id === "cannon") {
    sim.from = { x: CANNON.x, z: CANNON.z };
    ride.cam = [11, 2.5];
    ride.camYaw = 2.1; // film the countdown from the side
    place(CANNON.x, CANNON.y + 1.3, CANNON.z, CANNON.heading, 0.5);
    sim.bounce.t = t; // countdown start
    useThrill.setState({ phase: "countdown", count: 3 });
    playSound("tick");
  } else if (id === "balloon") {
    if (sim.balloon.flying) return;
    Object.assign(sim.balloon, { u: 0, flying: true, rider: true });
    ride.cam = [20, 9];
    useThrill.setState({ phase: "balloon" });
    playSound("whoosh");
    toast("Up, up and away. Press G to jump out whenever you like.");
  } else if (id === "trampoline") {
    Object.assign(sim.bounce, { n: 0, t: 0, air: 0.5, h: 0.6, top: (heightAt(TRAMPOLINE.x, TRAMPOLINE.z) ?? 2) + 0.9, dir: 1, highest: 0 });
    sim.stop = false;
    ride.cam = [11, 4];
    ride.heading = Math.atan2(playerPos.x - TRAMPOLINE.x, playerPos.z - TRAMPOLINE.z) + Math.PI;
    useThrill.setState({ phase: "bounce", bounces: 0 });
  } else {
    sim.zip = 0;
    sim.zipSpeed = 2;
    ride.cam = [9, 3.5];
    useThrill.setState({ phase: "zip" });
    playSound("whoosh");
  }
}

/** G or the on-screen button: start, jump, open the chute or hop off. */
export function act() {
  if (useIntro.getState().active || useActivity.getState().panel) return;
  const { phase, near } = useThrill.getState();
  if (phase === "idle" && near) start(near);
  else if (phase === "balloon") {
    // Jump: keep some of the balloon's drift.
    const p = BALLOON_PATH.getPoint(sim.balloon.u);
    const tangent = BALLOON_PATH.getTangent(sim.balloon.u);
    sim.vx = tangent.x * BALLOON_SPEED * 0.5;
    sim.vz = tangent.z * BALLOON_SPEED * 0.5;
    sim.vy = 2;
    sim.balloon.rider = false;
    ride.cam = [10, 6];
    place(p.x + tangent.z * 1.5, p.y + 0.4, p.z - tangent.x * 1.5, ride.heading);
    useThrill.setState({ phase: "freefall" });
    playSound("whoosh");
  } else if (phase === "freefall") openChute();
  else if (phase === "bounce") sim.stop = true;
}

function openChute() {
  sim.chute = 0;
  ride.cam = [15, 4];
  useThrill.setState({ phase: "chute" });
  playSound("paper");
}

/* ------------------------------------------------------------------ */
/*  The simulation                                                    */
/* ------------------------------------------------------------------ */

function useSimulation() {
  const v = useMemo(() => new THREE.Vector3(), []);
  const lastAlt = useRef(0);

  useFrame(({ clock, camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    sim.t = t;
    const state = useThrill.getState();
    const { phase } = state;

    // The unmanned balloon keeps flying its tour after you jump.
    if (sim.balloon.flying) {
      sim.balloon.u = Math.min(1, sim.balloon.u + (BALLOON_SPEED / BALLOON_PATH.getLength()) * dt * (sim.balloon.rider ? 1 : 1.6));
      if (sim.balloon.u >= 1) {
        sim.balloon.flying = false;
        if (sim.balloon.rider) {
          sim.balloon.rider = false;
          finish(BALLOON.x + 5, BALLOON.z, ride.heading, false);
          toast("Touchdown. Hope you enjoyed the view!");
        }
      }
    }

    /* ---- nearby things, only while on foot ---- */
    if (phase === "idle") {
      let near: ThrillId | null = null;
      if (motion.mode === "walk") {
        const d = (x: number, z: number) => Math.hypot(playerPos.x - x, playerPos.z - z);
        if (d(CANNON.x, CANNON.z) < 4) near = "cannon";
        else if (d(BALLOON.x, BALLOON.z) < 6 && !sim.balloon.flying) near = "balloon";
        else if (d(TRAMPOLINE.x, TRAMPOLINE.z) < TRAMPOLINE.r + 1.6) near = "trampoline";
        else if (d(ZIP.tower.x, ZIP.tower.z) < 4) near = "zipline";
      }
      if (near !== state.near) useThrill.setState({ near });
    } else if (state.near) useThrill.setState({ near: null });

    /* ---- treasure ---- */
    for (const c of CHESTS) {
      if (state.found.includes(c.id)) continue;
      const reach = c.raft ? 5.5 : 2.6;
      if (Math.hypot(playerPos.x - c.x, playerPos.z - c.z) < reach) {
        const found = [...state.found, c.id];
        try {
          localStorage.setItem(FOUND_KEY, JSON.stringify(found));
        } catch {}
        useThrill.setState({ found });
        const y = c.raft ? waveHeight(c.x, c.z, t) + 1 : (heightAt(c.x, c.z) ?? 1) + 0.8;
        burst({ x: c.x, y, z: c.z, count: 40, colors: ["#ffd45c", "#ffe9a3", "#f2b632"], speed: 5, up: 6, size: 0.14, life: 1.6 });
        playSound("send");
        const fact = FACTS[CHESTS.indexOf(c) % FACTS.length];
        if (found.length === CHESTS.length) {
          toast(`All ${CHESTS.length} chests found! ${fact} Look up!`);
          sim.fireworks = t + 14;
        } else toast(`Treasure ${found.length}/${CHESTS.length} · ${fact}`);
        break;
      }
    }
    if (sim.fireworks > t && Math.random() < dt * 3.2) {
      const colors = [["#ff5d73", "#ffd1d8"], ["#7ad7ff", "#e1f6ff"], ["#ffd45c", "#fff3c4"], ["#9cff8a", "#e6ffe0"], ["#d6a2ff", "#f3e4ff"]][Math.floor(Math.random() * 5)];
      // Burst in the sky in front of the camera, where you are looking.
      camera.getWorldDirection(ahead);
      ahead.y = 0;
      ahead.normalize().multiplyScalar(38 + Math.random() * 18);
      burst({
        x: camera.position.x + ahead.x + (Math.random() - 0.5) * 50,
        y: playerPos.y + 11 + Math.random() * 10,
        z: camera.position.z + ahead.z + (Math.random() - 0.5) * 50,
        count: 90, colors, speed: 16, gravity: -3, size: 0.5, life: 2.4,
      });
      playSound("blast");
    }

    /* ---- the active ride ---- */
    if (phase === "countdown") {
      const left = 3 - (t - sim.bounce.t);
      ride.pitch = 0.5 + Math.sin(t * 30) * 0.03; // nervous wobble
      if (Math.ceil(left) !== state.count && left > 0) {
        useThrill.setState({ count: Math.ceil(left) });
        playSound("tick");
      }
      if (left <= 0) {
        // FIRE.
        const speed = 40;
        const h = CANNON.heading,
          e = CANNON.elevation;
        sim.vx = Math.sin(h) * Math.cos(e) * speed;
        sim.vz = Math.cos(h) * Math.cos(e) * speed;
        sim.vy = Math.sin(e) * speed;
        sim.landing = "cannon";
        const mx = CANNON.x + Math.sin(h) * 2.4,
          mz = CANNON.z + Math.cos(h) * 2.4,
          my = CANNON.y + 2.4;
        burst({ x: mx, y: my, z: mz, count: 26, colors: ["#ffb347", "#ff6a2b", "#fff1a8"], speed: 9, up: 4, size: 0.4, life: 0.5, gravity: 0 });
        burst({ x: mx, y: my, z: mz, count: 30, colors: ["#d8d4cc", "#b9b4ab", "#efebe3"], speed: 4, up: 3, size: 0.6, grow: 2.6, life: 2.6, gravity: 0.6 });
        playSound("boom");
        ride.cam = [14, 5];
        useThrill.setState({ phase: "fly", count: 0 });
      }
    } else if (phase === "fly") {
      ride.camYaw *= Math.exp(-dt * 2.5); // swing round behind for the chase
      sim.vy -= 9.8 * dt;
      const x = ride.x + sim.vx * dt,
        z = ride.z + sim.vz * dt,
        y = ride.y + sim.vy * dt;
      const flight = Math.atan2(sim.vy, Math.hypot(sim.vx, sim.vz));
      const heading = Math.atan2(sim.vx, sim.vz);
      const spin = sim.landing === "cannon" ? t * 7 : Math.sin(t * 3) * 0.2;
      ride.x = x;
      ride.y = y;
      ride.z = z;
      ride.heading = heading;
      ride.pitch = Math.PI / 2 - flight - (sim.landing === "zip" ? 1.2 : 0);
      ride.roll = spin;
      const g = ground(x, z, t);
      if (y <= g.y) {
        if (g.water) {
          burst({ x, y: g.y + 0.2, z, count: 70, colors: ["#ffffff", "#d7f1ef", "#bfe6e2"], speed: 5, up: 7, size: 0.11, life: 1.2 });
          playSound("splash");
        } else playSound("hit");
        if (sim.landing === "cannon") {
          const dist = Math.round(Math.hypot(x - sim.from.x, z - sim.from.z));
          const best = Math.max(state.best, dist);
          useThrill.setState({ best });
          toast(dist >= best && dist > 0 ? `${dist} m! A new personal best.` : `You flew ${dist} m. Best so far: ${best} m.`);
        } else toast("Splashdown! Swim back to shore, or press E for the boat.");
        ride.pitch = 0;
        ride.roll = 0;
        finish(x, z, heading, g.water);
      }
    } else if (phase === "balloon") {
      const p = BALLOON_PATH.getPoint(sim.balloon.u, v);
      const tangent = BALLOON_PATH.getTangent(sim.balloon.u);
      place(p.x, p.y + 0.35, p.z, Math.atan2(tangent.x, tangent.z) + Math.sin(t * 0.3) * 0.2);
    } else if (phase === "freefall" || phase === "chute") {
      const chute = phase === "chute";
      if (chute) sim.chute = Math.min(1, sim.chute + dt * 1.6);
      ride.heading += input.turn * (chute ? 1.1 : 1.8) * dt;
      const forward = chute ? 7 + input.forward * 4 : 5 + Math.max(input.forward, 0) * 12;
      // Ease the drift toward where you are steering.
      const k = 1 - Math.exp(-dt * (chute ? 1.5 : 0.8));
      sim.vx += (Math.sin(ride.heading) * forward - sim.vx) * k;
      sim.vz += (Math.cos(ride.heading) * forward - sim.vz) * k;
      if (chute) sim.vy += (-4.2 - sim.vy) * (1 - Math.exp(-dt * 2.5));
      else sim.vy = Math.max(sim.vy - 9.8 * dt, -42);
      const x = ride.x + sim.vx * dt,
        z = ride.z + sim.vz * dt,
        y = ride.y + sim.vy * dt;
      ride.x = x;
      ride.y = y;
      ride.z = z;
      ride.pitch = chute ? 0.05 + Math.sin(t * 1.4) * 0.05 : 1.45;
      ride.roll = -input.turn * (chute ? 0.25 : 0.45);
      const g = ground(x, z, t);
      if (!chute && y - g.y < 55) openChute();
      if (t - lastAlt.current > 0.2) {
        lastAlt.current = t;
        useThrill.setState({ alt: Math.max(0, Math.round(y - g.y)) });
      }
      if (y <= g.y) {
        ride.pitch = 0;
        ride.roll = 0;
        const off = Math.round(Math.hypot(x - TARGET.x, z - TARGET.z));
        if (g.water) {
          burst({ x, y: g.y + 0.2, z, count: 50, colors: ["#ffffff", "#d7f1ef"], speed: 4, up: 5, size: 0.1 });
          playSound("splash");
          toast("A soft landing... in the sea.");
        } else if (off <= TARGET.r) {
          burst({ x, y: g.y + 1, z, count: 60, colors: ["#ffd45c", "#ff5d73", "#7ad7ff"], speed: 7, up: 8, size: 0.16, life: 1.8 });
          playSound("send");
          toast("BULLSEYE! A perfect landing on the target.");
        } else {
          playSound("step");
          toast(`Landed ${off} m from the target on the Skills island.`);
        }
        finish(x, z, ride.heading, g.water);
      }
    } else if (phase === "bounce") {
      const b = sim.bounce;
      b.t += dt;
      ride.heading += input.turn * 1.5 * dt;
      if (b.t >= b.air) {
        // Touch the mat: hop off if asked, otherwise go higher.
        if (sim.stop || b.n >= 14) {
          const out = TRAMPOLINE.r + 1.4;
          playSound("step");
          toast(`${b.n} bounces, ${Math.round(b.highest)} m high at the top.`);
          ride.pitch = 0;
          finish(TRAMPOLINE.x + Math.sin(ride.heading) * out, TRAMPOLINE.z + Math.cos(ride.heading) * out, ride.heading, false);
          return;
        }
        b.n += 1;
        b.h = Math.min(2.5 + b.n * 2.4, 24);
        b.highest = Math.max(b.highest, b.h);
        b.air = 2 * Math.sqrt((2 * b.h) / 9.8);
        b.t = 0;
        b.dir = b.n % 2 ? 1 : -1;
        useThrill.setState({ bounces: b.n });
        playSound(b.n > 6 ? "whoosh" : "tap");
      }
      const u = b.t / b.air;
      const y = b.top + 4 * b.h * u * (1 - u);
      const flips = b.n >= 9 ? 2 : b.n >= 3 ? 1 : 0;
      const turn = THREE.MathUtils.smootherstep(u, 0.15, 0.85);
      place(TRAMPOLINE.x, y, TRAMPOLINE.z, ride.heading, b.dir * Math.PI * 2 * flips * turn);
    } else if (phase === "zip") {
      sim.zipSpeed = Math.min(sim.zipSpeed + 4.5 * dt, 24);
      sim.zip += (sim.zipSpeed / ZIP_LEN) * dt;
      const heading = Math.atan2(ZIP_B.x - ZIP_A.x, ZIP_B.z - ZIP_A.z);
      if (sim.zip >= 1) {
        // Let go over the sea.
        sim.vx = Math.sin(heading) * sim.zipSpeed * 0.6;
        sim.vz = Math.cos(heading) * sim.zipSpeed * 0.6;
        sim.vy = 1.5;
        sim.landing = "zip";
        playSound("whoosh");
        useThrill.setState({ phase: "fly" });
        return;
      }
      zipPoint(sim.zip, v);
      ride.cam = [11, 2.2];
      ride.camYaw = 0.75; // three-quarter view, off the cable
      ride.x = v.x;
      ride.y = v.y - 2.1;
      ride.z = v.z;
      ride.heading = heading;
      ride.pitch = -0.25 + Math.sin(t * 2.2) * 0.06;
      ride.roll = Math.sin(t * 1.7) * 0.08;
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Models                                                            */
/* ------------------------------------------------------------------ */

function M({ color, rough = 0.8, metal = 0, emissive }: { color: string; rough?: number; metal?: number; emissive?: string }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={metal} emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? 1.6 : 0} />;
}

function Cannon() {
  const h = CANNON.heading;
  return (
    <group position={[CANNON.x, CANNON.y, CANNON.z]} rotation-y={h}>
      {/* carriage */}
      <mesh position={[0, 0.55, -0.4]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.7, 2.6]} />
        <M color="#7a4f2e" />
      </mesh>
      {[-1, 1].flatMap((s) =>
        [-1.1, 0.5].map((z) => (
          <mesh key={`${s}${z}`} position={[s * 1, 0.55, z]} rotation-z={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.22, 16]} />
            <M color="#3a2a1d" />
          </mesh>
        )),
      )}
      {/* barrel, raised to the firing angle */}
      <group position={[0, 1.2, -0.3]} rotation-x={-CANNON.elevation}>
        <mesh position={[0, 0, 1.4]} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.62, 0.78, 3.6, 24]} />
          <M color="#2b2f33" metal={0.7} rough={0.35} />
        </mesh>
        <mesh position={[0, 0, 3.2]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.64, 0.12, 10, 24]} />
          <M color="#d9b44a" metal={0.8} rough={0.3} />
        </mesh>
        <mesh position={[0, 0, -0.45]}>
          <sphereGeometry args={[0.72, 18, 12]} />
          <M color="#2b2f33" metal={0.7} rough={0.35} />
        </mesh>
        {/* stars and stripes of a circus cannon */}
        {[0.4, 1.4, 2.4].map((z) => (
          <mesh key={z} position={[0, 0, z]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.7 - z * 0.02, 0.72 - z * 0.02, 0.18, 24]} />
            <M color="#c8323a" rough={0.5} />
          </mesh>
        ))}
      </group>
      <Placard text="HUMAN CANNON · G" y={3.8} />
    </group>
  );
}

/** A floating text label, hidden while any ride is running. */
function Placard({ text, y }: { text: string; y: number }) {
  const busy = useThrill((s) => s.phase !== "idle");
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 96;
    const g = c.getContext("2d")!;
    g.fillStyle = "rgba(24,46,42,0.92)";
    g.beginPath();
    g.roundRect(4, 4, 504, 88, 40);
    g.fill();
    g.fillStyle = "#f3e7c9";
    g.font = "600 40px system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 256, 50);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={[0, y, 0]} scale={[4.2, 0.79, 1]} visible={!busy}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

function Balloon() {
  const group = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Mesh>(null);
  const envelope = useMemo(() => {
    // A teardrop lathe with painted vertical stripes.
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI;
      const r = Math.sin(a) * 6.2 * (i < 12 ? 1 : 1 - (i - 12) / 30);
      pts.push(new THREE.Vector2(Math.max(r, i === 24 ? 0 : 0.9), -Math.cos(a) * 7 + (i > 18 ? (i - 18) * -0.35 : 0)));
    }
    pts.reverse();
    const g = new THREE.LatheGeometry(pts, 32);
    const colors: number[] = [];
    const pal = ["#e8433a", "#f4c84b", "#2f6fb3", "#f2efe6"].map((c) => new THREE.Color(c));
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const a = Math.atan2(pos.getZ(i), pos.getX(i));
      const stripe = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 16) % 4;
      colors.push(pal[stripe].r, pal[stripe].g, pal[stripe].b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return g;
  }, []);
  useEffect(() => () => envelope.dispose(), [envelope]);
  const p = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    BALLOON_PATH.getPoint(sim.balloon.u, p);
    group.current.position.copy(p);
    group.current.rotation.y = Math.sin(t * 0.3) * 0.2;
    if (flame.current) {
      const burning = sim.balloon.flying && sim.balloon.u < 0.85;
      flame.current.visible = burning;
      flame.current.scale.setScalar(0.8 + Math.sin(t * 25) * 0.15 + Math.sin(t * 7) * 0.1);
    }
  });
  return (
    <group ref={group}>
      {/* basket */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.1, 1.8]} />
        <M color="#9a6b3a" rough={1} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <torusGeometry args={[1.25, 0.08, 6, 4, Math.PI * 2]} />
        <M color="#5d3f22" />
      </mesh>
      {/* ropes */}
      {[[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]].map(([x, z], i) => (
        <mesh key={i} position={[x * 1.35, 3.5, z * 1.35]} rotation={[z * 0.18, 0, -x * 0.18]}>
          <cylinderGeometry args={[0.03, 0.03, 4.8, 4]} />
          <M color="#3b3025" />
        </mesh>
      ))}
      {/* burner and flame */}
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.5, 10]} />
        <M color="#4a4f55" metal={0.6} rough={0.4} />
      </mesh>
      <mesh ref={flame} position={[0, 4, 0]}>
        <coneGeometry args={[0.32, 1.3, 10]} />
        <meshBasicMaterial color="#ffb347" toneMapped={false} transparent opacity={0.9} />
      </mesh>
      <mesh geometry={envelope} position={[0, 11.5, 0]} castShadow>
        <meshStandardMaterial vertexColors roughness={0.75} side={THREE.DoubleSide} />
      </mesh>
      <PadPlacard />
    </group>
  );
}

function PadPlacard() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = !sim.balloon.flying;
  });
  return (
    <group ref={ref}>
      <Placard text="HOT-AIR BALLOON · G" y={2.6} />
    </group>
  );
}

function Target() {
  const y = (heightAt(TARGET.x, TARGET.z) ?? 3) + 0.05;
  return (
    <group position={[TARGET.x, y, TARGET.z]} rotation-x={-Math.PI / 2}>
      {[6, 4.5, 3, 1.5].map((r, i) => (
        <mesh key={r} position={[0, 0, i * 0.01]} receiveShadow>
          <circleGeometry args={[r, 40]} />
          <meshStandardMaterial color={i % 2 ? "#f2efe6" : "#d6403a"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Parachute() {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const on = useThrill.getState().phase === "chute";
    g.visible = on;
    if (!on) return;
    const s = THREE.MathUtils.smootherstep(sim.chute, 0, 1);
    g.position.set(ride.x, ride.y + 1.4, ride.z);
    g.rotation.set(0, ride.heading, ride.roll * 0.6);
    g.scale.set(s, 0.3 + s * 0.7, s);
  });
  return (
    <group ref={group} visible={false}>
      <mesh position={[0, 6.2, 0]} scale={[1, 0.42, 0.62]} castShadow>
        <sphereGeometry args={[4.2, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ff7a3d" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {[-1, -0.33, 0.33, 1].map((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} position={[x * 2, 3.3, z * 1.25]} rotation={[z * 0.38, 0, -x * 0.55]}>
            <cylinderGeometry args={[0.012, 0.012, 6.2, 3]} />
            <meshBasicMaterial color="#e8e2d6" />
          </mesh>
        )),
      )}
    </group>
  );
}

function Trampoline() {
  const mat = useRef<THREE.Mesh>(null);
  const y = heightAt(TRAMPOLINE.x, TRAMPOLINE.z) ?? 2;
  useFrame(() => {
    if (!mat.current) return;
    const b = sim.bounce;
    const on = useThrill.getState().phase === "bounce";
    const u = b.air ? b.t / b.air : 1;
    // The mat dips while you are touching it.
    const dip = on ? Math.max(0, 1 - Math.min(u, 1 - u) * 14) * Math.min(b.h / 8, 1) * 0.5 : 0;
    mat.current.position.y = 0.88 - dip;
  });
  return (
    <group position={[TRAMPOLINE.x, y, TRAMPOLINE.z]}>
      <mesh position={[0, 0.9, 0]} rotation-x={Math.PI / 2} castShadow>
        <torusGeometry args={[TRAMPOLINE.r, 0.14, 10, 40]} />
        <M color="#2f6fb3" rough={0.5} />
      </mesh>
      <mesh ref={mat} rotation-x={-Math.PI / 2} position={[0, 0.88, 0]} receiveShadow>
        <circleGeometry args={[TRAMPOLINE.r - 0.15, 40]} />
        <M color="#1d2226" rough={0.9} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * TRAMPOLINE.r, 0.45, Math.sin(a) * TRAMPOLINE.r]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.9, 6]} />
            <M color="#3a3f44" metal={0.5} rough={0.4} />
          </mesh>
        );
      })}
      <Placard text="TRAMPOLINE · G" y={3} />
    </group>
  );
}

function Zipline() {
  const trolley = useRef<THREE.Group>(null);
  const base = heightAt(ZIP.tower.x, ZIP.tower.z) ?? 3;
  const cable = useMemo(() => {
    const pts = Array.from({ length: 40 }, (_, i) => zipPoint(i / 39));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.04, 5, false);
  }, []);
  useEffect(() => () => cable.dispose(), [cable]);
  const p = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!trolley.current) return;
    const s = useThrill.getState().phase === "zip" ? sim.zip : 0;
    zipPoint(s, p);
    trolley.current.position.copy(p);
  });
  const h = ZIP.tower.height;
  return (
    <group>
      <group position={[ZIP.tower.x, base, ZIP.tower.z]}>
        {[[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].map(([x, z], i) => (
          <mesh key={i} position={[x * 0.8, h / 2, z * 0.8]} rotation={[-z * 0.05, 0, x * 0.05]} castShadow>
            <boxGeometry args={[0.3, h + 0.6, 0.3]} />
            <M color="#7a6448" rough={1} />
          </mesh>
        ))}
        <mesh position={[0, h - 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.6, 0.3, 3.6]} />
          <M color="#8b7253" rough={1} />
        </mesh>
        {Array.from({ length: Math.floor(h / 1.6) }, (_, i) => (
          <mesh key={i} position={[0, 0.8 + i * 1.6, -1.15]}>
            <boxGeometry args={[1.6, 0.12, 0.12]} />
            <M color="#6b5640" rough={1} />
          </mesh>
        ))}
        <Placard text="ZIPLINE · G" y={2.8} />
      </group>
      {/* landing buoy at the far end */}
      <mesh position={[ZIP.end.x, 2 + ZIP.end.y / 2, ZIP.end.z]} castShadow>
        <cylinderGeometry args={[0.18, 0.25, ZIP.end.y + 4, 8]} />
        <M color="#d0c9b4" />
      </mesh>
      <mesh geometry={cable}>
        <M color="#2c2f33" metal={0.6} rough={0.4} />
      </mesh>
      <group ref={trolley}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.5]} />
          <M color="#e2a33a" metal={0.4} rough={0.4} />
        </mesh>
        <mesh position={[0, -1.1, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.7, 4]} />
          <M color="#333" />
        </mesh>
      </group>
    </group>
  );
}

function Chest({ chest }: { chest: (typeof CHESTS)[number] }) {
  const group = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const found = useThrill((s) => s.found.includes(chest.id));
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (!group.current) return;
    if (chest.raft) {
      group.current.position.y = waveHeight(chest.x, chest.z, t) * 0.8 + 0.2;
      group.current.rotation.z = Math.sin(t * 1.1) * 0.06;
      group.current.rotation.x = Math.cos(t * 0.9) * 0.05;
    }
    if (lid.current) lid.current.rotation.x += ((found ? -1.9 : 0) - lid.current.rotation.x) * 0.1;
    if (glow.current) {
      glow.current.visible = !found;
      glow.current.scale.setScalar(1 + Math.sin(t * 3 + chest.x) * 0.15);
    }
  });
  const y = chest.raft ? 0 : heightAt(chest.x, chest.z) ?? 1;
  return (
    <group ref={group} position={[chest.x, y, chest.z]} rotation-y={chest.x * 0.7}>
      {chest.raft && (
        <>
          {[-1.2, -0.4, 0.4, 1.2].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation-x={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.38, 0.38, 3.4, 8]} />
              <M color="#8a6a45" rough={1} />
            </mesh>
          ))}
          <mesh position={[1, 1.4, -1]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 2.6, 5]} />
            <M color="#6b5640" />
          </mesh>
          <mesh position={[1.45, 2.3, -1]}>
            <planeGeometry args={[0.9, 0.6]} />
            <meshStandardMaterial color="#1d1d1d" side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
      <group position={[0, chest.raft ? 0.4 : 0, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.7, 0.75]} />
          <M color="#7b4a26" rough={0.9} />
        </mesh>
        {[-0.4, 0.4].map((x) => (
          <mesh key={x} position={[x, 0.36, 0]}>
            <boxGeometry args={[0.1, 0.74, 0.79]} />
            <M color="#d9b44a" metal={0.8} rough={0.3} />
          </mesh>
        ))}
        <group ref={lid} position={[0, 0.7, -0.37]}>
          <mesh position={[0, 0.14, 0.37]} castShadow>
            <boxGeometry args={[1.12, 0.28, 0.77]} />
            <M color="#8a5530" rough={0.9} />
          </mesh>
        </group>
        <mesh position={[0, 0.72, 0]} visible={found}>
          <boxGeometry args={[0.9, 0.08, 0.55]} />
          <M color="#ffd45c" metal={0.9} rough={0.25} emissive="#7a5a10" />
        </mesh>
        <mesh ref={glow} position={[0, 1.6, 0]}>
          <octahedronGeometry args={[0.28, 0]} />
          <meshBasicMaterial color="#ffd45c" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene + HUD                                                       */
/* ------------------------------------------------------------------ */

export function Thrills() {
  useSimulation();
  // Chests found on an earlier visit stay found.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FOUND_KEY) ?? "[]");
      if (Array.isArray(saved)) useThrill.setState({ found: saved.filter((id) => CHESTS.some((c) => c.id === id)) });
    } catch {}
    return () => {
      ride.active = false;
      useThrill.setState({ phase: "idle", near: null });
    };
  }, []);
  return (
    <>
      <Cannon />
      <Balloon />
      <Target />
      <Parachute />
      <Trampoline />
      <Zipline />
      {CHESTS.map((c) => (
        <Chest key={c.id} chest={c} />
      ))}
      <Bursts />
    </>
  );
}

const PROMPTS: Record<ThrillId, string> = {
  cannon: "Climb into the human cannon",
  balloon: "Board the hot-air balloon",
  trampoline: "Bounce on the trampoline",
  zipline: "Ride the zipline",
};

const pill =
  "pointer-events-auto rounded-full border border-white/15 bg-[#172b27]/95 px-5 py-2.5 text-sm font-semibold text-stone-100 shadow-lg backdrop-blur-md transition active:scale-95";

export function ThrillHud() {
  const { near, phase, count, alt, bounces, toast: note, found } = useThrill();
  const intro = useIntro((s) => s.active);
  const [shown, setShown] = useState(0);

  // G anywhere (outside form fields) starts, jumps, opens the chute or hops off.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.repeat || (e.target as HTMLElement)?.closest("input,textarea,select,dialog")) return;
      if (e.key.toLowerCase() === "g") act();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  // Each toast shows for a few seconds.
  useEffect(() => {
    if (!note) return;
    const show = setTimeout(() => setShown(note.id), 0);
    const hide = setTimeout(() => setShown((id) => (id === note.id ? 0 : id)), 5200);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [note]);
  const showToast = note !== null && shown === note.id;

  if (intro) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* treasure counter */}
      <details className="pointer-events-auto absolute right-4 top-32 max-w-[70vw] rounded-2xl border border-white/15 bg-[#182e2a]/90 px-4 py-2.5 text-sm text-[#e7e4d6] shadow-lg backdrop-blur-md">
        <summary className="cursor-pointer list-none font-medium">
          <span aria-hidden>🪙</span> Treasure {found.length}/{CHESTS.length}
        </summary>
        <ul className="mt-2 space-y-1 text-xs text-stone-300">
          {CHESTS.map((c) => (
            <li key={c.id} className={found.includes(c.id) ? "line-through opacity-50" : ""}>
              {c.hint}
            </li>
          ))}
        </ul>
      </details>

      {/* cannon countdown */}
      {phase === "countdown" && count > 0 && (
        <div key={count} className="absolute inset-0 grid place-items-center">
          <span className="font-display text-[9rem] font-bold leading-none text-white animate-in zoom-in-50 fade-in duration-300 [text-shadow:0_6px_30px_rgba(0,0,0,.45)]">
            {count}
          </span>
        </div>
      )}

      {/* toast */}
      {showToast && (
        <div key={note!.id} className="absolute inset-x-0 top-20 flex justify-center px-4">
          <p className="max-w-md rounded-2xl bg-[#172b27]/95 px-5 py-3 text-center text-sm font-medium text-amber-50 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
            {note!.text}
          </p>
        </div>
      )}

      {/* context buttons */}
      <div className="absolute inset-x-0 bottom-56 flex flex-col items-center gap-2 px-4 text-center">
        {phase === "idle" && near && (
          <button type="button" className={pill} onClick={act}>
            {PROMPTS[near]} <kbd className="ml-2 opacity-60">G</kbd>
          </button>
        )}
        {phase === "balloon" && (
          <button type="button" className={`${pill} bg-[#c8323a]/95`} onClick={act}>
            Jump out and skydive <kbd className="ml-2 opacity-70">G</kbd>
          </button>
        )}
        {phase === "freefall" && (
          <>
            <p className="rounded-full bg-black/50 px-3 py-1 text-xs text-white">Free fall · {alt} m · W to dive, A/D to turn</p>
            <button type="button" className={`${pill} bg-[#e8743b]/95`} onClick={act}>
              Open the parachute <kbd className="ml-2 opacity-70">G</kbd>
            </button>
          </>
        )}
        {phase === "chute" && (
          <p className="rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {alt} m · Steer with W A S D · Aim for the target on the Skills island
          </p>
        )}
        {phase === "bounce" && (
          <button type="button" className={pill} onClick={act}>
            Bounce {bounces} · Hop off <kbd className="ml-2 opacity-60">G</kbd>
          </button>
        )}
      </div>
    </div>
  );
}
