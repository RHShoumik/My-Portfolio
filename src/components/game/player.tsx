// SPIKE: throwaway prototype of the island game. Not production code.
"use client";

import { Suspense, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { playSound, setEngine, setSeaLevel } from "@/lib/sound";
import { useActivity } from "./activities";
import { Buggy, Hiker, SpeedBoat } from "./models";
import { Woody } from "./woody";
import {
  boatPark,
  cameraOrbit,
  resetCamera,
  cmd,
  input,
  isLandMode,
  motion,
  ride,
  useGame,
  type Mode,
} from "./store";
import {
  DOCK_Y,
  blockedByProp,
  islandDistance,
  heightAt,
  landSDF,
  playerPos,
  shoreNormal,
  islands,
  waveHeight,
} from "./world";

interface ModeConfig {
  /** Top speed on foot / swimming (non-vehicles). */
  max: number;
  /** Vehicles accelerate and coast instead of stopping dead. */
  vehicle: boolean;
  accel: number;
  drag: number;
  reverse: number;
  /** Turn rate in radians per second. */
  turn: number;
  /** Speed at which a vehicle steers at full rate. */
  steerAt: number;
  /** Camera distance behind and height above. */
  cam: [number, number];
  /** How far a water mode must stay from the shoreline. */
  clear: number;
}

const MODES: Record<Mode, ModeConfig> = {
  walk: {
    max: 6,
    vehicle: false,
    accel: 0,
    drag: 0,
    reverse: 0,
    turn: 2.6,
    steerAt: 1,
    cam: [7.5, 4.2],
    clear: 0,
  },
  swim: {
    max: 3.6,
    vehicle: false,
    accel: 0,
    drag: 0,
    reverse: 0,
    turn: 2.1,
    steerAt: 1,
    cam: [7.5, 3.4],
    clear: 0.9,
  },
  buggy: {
    max: 0,
    vehicle: true,
    accel: 24,
    drag: 1.5,
    reverse: 5,
    turn: 2.2,
    steerAt: 5,
    cam: [10, 5],
    clear: 0,
  },
  boat: {
    max: 0,
    vehicle: true,
    accel: 26,
    drag: 0.95,
    reverse: 5,
    turn: 1.5,
    steerAt: 7,
    cam: [15, 7],
    clear: 2.4,
  },
};

/** How close to the water's edge you must be to set off. */
const LAND_SHORE = 3.2;
/** How close to land you must be to come ashore. */
const WATER_SHORE = 7;

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export function Player() {
  const canvas = useThree((state) => state.gl.domElement);
  useEffect(() => {
    resetCamera();
    let pointer: number | null = null;
    let x = 0,
      y = 0;
    const previousCursor = canvas.style.cursor;
    canvas.style.setProperty("cursor", "grab");
    const down = (event: PointerEvent) => {
      if (pointer !== null || event.button !== 0) return;
      pointer = event.pointerId;
      x = event.clientX;
      y = event.clientY;
      canvas.setPointerCapture(pointer);
      canvas.style.setProperty("cursor", "grabbing");
    };
    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      cameraOrbit.yaw = wrapAngle(
        cameraOrbit.yaw - (event.clientX - x) * 0.005,
      );
      cameraOrbit.pitch = THREE.MathUtils.clamp(
        cameraOrbit.pitch + (event.clientY - y) * 0.004,
        -0.2,
        0.85,
      );
      x = event.clientX;
      y = event.clientY;
    };
    const release = () => {
      const id = pointer;
      pointer = null;
      if (id !== null && canvas.hasPointerCapture(id))
        canvas.releasePointerCapture(id);
      canvas.style.setProperty("cursor", "grab");
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta =
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? canvas.clientHeight
            : 1);
      cameraOrbit.zoom = THREE.MathUtils.clamp(
        cameraOrbit.zoom *
          Math.exp(THREE.MathUtils.clamp(delta, -200, 200) * 0.0015),
        0.6,
        2.5,
      );
    };
    const reset = () => resetCamera();
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("lostpointercapture", release);
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("dblclick", reset);
    window.addEventListener("blur", release);
    return () => {
      release();
      canvas.style.setProperty("cursor", previousCursor);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", release);
      canvas.removeEventListener("pointercancel", release);
      canvas.removeEventListener("lostpointercapture", release);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("dblclick", reset);
      window.removeEventListener("blur", release);
    };
  }, [canvas]);
  const group = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const hiker = useRef<THREE.Group>(null);
  const boat = useRef<THREE.Group>(null);
  const buggy = useRef<THREE.Group>(null);

  const s = useRef({
    x: 0,
    y: DOCK_Y,
    z: 18,
    heading: 0,
    speed: 0,
    mode: "walk" as Mode,
    lastHud: -1,
    lastEngine: -1,
    stride: 0,
    camReady: false,
  });
  const camPos = useRef(new THREE.Vector3());
  const camLook = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());

  // Handy while testing the prototype from the browser console.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__game = {
        input,
        cmd,
        state: s.current,
      };
    }
  }, []);

  useFrame((state, rawDt) => {
    if (
      !group.current ||
      !tilt.current ||
      !hiker.current ||
      !boat.current ||
      !buggy.current
    )
      return;
    const dt = Math.min(rawDt, 0.05);
    const t = state.clock.elapsedTime;
    const p = s.current;

    /* ---------- 0. Thrill rides own the player while active ---------- */
    if (ride.release) {
      const r = ride.release;
      ride.release = null;
      Object.assign(p, { x: r.x, z: r.z, heading: r.heading, mode: r.mode, speed: 0 });
    }
    const riding = ride.active;

    /* ---------- 1. Requested changes of mode ---------- */
    const want = riding ? null : cmd.pending;
    cmd.pending = null;
    if (want && want !== p.mode) {
      const sd = landSDF(p.x, p.z);
      const fromLand = isLandMode(p.mode);
      const toLand = isLandMode(want);

      if (fromLand === toLand) {
        // Same terrain: just swap what you are riding.
        if (p.mode === "boat")
          Object.assign(boatPark, { x: p.x, z: p.z, heading: p.heading });
        if (want === "swim") playSound("splash");
        p.mode = want;
        p.speed = 0;
      } else if (fromLand && sd > -LAND_SHORE) {
        // Set off from the shore.
        let [nx, nz] = shoreNormal(p.x, p.z);
        if (nx === 0 && nz === 0) {
          nx = Math.sin(p.heading);
          nz = Math.cos(p.heading);
        }
        const need = want === "boat" ? 3.4 : 1.6;
        let dist = -sd + need;
        for (let i = 0; i < 14; i++) {
          const tx = p.x + nx * dist;
          const tz = p.z + nz * dist;
          if (landSDF(tx, tz) >= need - 0.2) {
            p.x = tx;
            p.z = tz;
            p.heading = Math.atan2(nx, nz);
            p.speed = 0;
            p.mode = want;
            playSound("splash");
            break;
          }
          dist += 1.5;
        }
      } else if (!fromLand && sd < WATER_SHORE) {
        // Come ashore.
        const [nx, nz] = shoreNormal(p.x, p.z);
        let dist = sd + 1.8;
        for (let i = 0; i < 12; i++) {
          const tx = p.x - nx * dist;
          const tz = p.z - nz * dist;
          if (heightAt(tx, tz) !== null) {
            if (p.mode === "boat")
              Object.assign(boatPark, { x: p.x, z: p.z, heading: p.heading });
            p.x = tx;
            p.z = tz;
            p.heading = Math.atan2(-nx, -nz);
            p.speed = 0;
            p.mode = want;
            break;
          }
          dist += 1;
        }
      }
    }

    if (useActivity.getState().panel || riding) {
      input.forward = 0;
      input.turn = 0;
      p.speed = 0;
    }
    /* ---------- 2. Movement ---------- */
    const cfg = MODES[p.mode];
    const land = isLandMode(p.mode);

    if (cfg.vehicle) {
      p.speed += input.forward * cfg.accel * dt;
      p.speed -= p.speed * cfg.drag * dt;
      if (p.speed < -cfg.reverse) p.speed = -cfg.reverse;
      const steer =
        Math.min(Math.abs(p.speed) / cfg.steerAt, 1) * (p.speed < 0 ? -1 : 1);
      p.heading += input.turn * cfg.turn * steer * dt;
    } else {
      const target =
        input.forward * (input.forward > 0 ? cfg.max : cfg.max * 0.5);
      p.speed += (target - p.speed) * Math.min(1, dt * 10);
      p.heading += input.turn * cfg.turn * dt;
    }

    const ok = (x: number, z: number) =>
      land
        ? heightAt(x, z) !== null &&
          !blockedByProp(x, z, p.mode === "buggy" ? 1.3 : 0.35)
        : landSDF(x, z) > cfg.clear;
    const nx = p.x + Math.sin(p.heading) * p.speed * dt;
    const nz = p.z + Math.cos(p.heading) * p.speed * dt;
    if (ok(nx, nz)) {
      p.x = nx;
      p.z = nz;
    } else if (ok(nx, p.z)) {
      p.x = nx;
      p.speed *= 0.9;
    } else if (ok(p.x, nz)) {
      p.z = nz;
      p.speed *= 0.9;
    } else {
      p.speed *= 0.5;
    }
    // Keep everyone inside the playable sea.
    p.x = THREE.MathUtils.clamp(p.x, -540, 540);
    p.z = THREE.MathUtils.clamp(p.z, -180, 1180);
    if (riding) {
      p.x = ride.x;
      p.z = ride.z;
      p.heading = ride.heading;
      p.speed = 0;
    }

    /* ---------- 3. Place and pose ---------- */
    let y: number;
    if (riding) y = ride.y;
    else if (land) y = heightAt(p.x, p.z) ?? p.y;
    else if (p.mode === "boat") y = waveHeight(p.x, p.z, t) * 0.7 + 0.1;
    else
      y =
        waveHeight(p.x, p.z, t) * 0.8 +
        (p.mode === "swim" ? 0.12 : -0.3);
    if (riding) p.y = y;
    else p.y += (y - p.y) * Math.min(1, dt * (land ? 12 : 18));

    group.current.position.set(p.x, p.y, p.z);
    group.current.rotation.y = p.heading;

    hiker.current.visible = riding || p.mode === "walk" || p.mode === "swim";
    boat.current.visible = !riding && p.mode === "boat";
    buggy.current.visible = !riding && p.mode === "buggy";

    const lean = cfg.vehicle
      ? -input.turn * Math.min(Math.abs(p.speed) / 12, 1)
      : 0;
    const roll =
      p.mode === "boat" ? lean * 0.26 + Math.sin(t * 1.2) * 0.03 : lean * 0.05;
    const pitch =
      p.mode === "boat" ? -(p.speed / 27) * 0.12 + Math.sin(t * 1.5) * 0.02 : 0;
    if (riding) {
      // Rides set the pose directly (flips need to be exact).
      tilt.current.rotation.set(ride.pitch, 0, ride.roll);
    } else {
      tilt.current.rotation.z +=
        (roll - tilt.current.rotation.z) * Math.min(1, dt * 6);
      tilt.current.rotation.x +=
        (pitch - tilt.current.rotation.x) * Math.min(1, dt * 6);
    }

    motion.speed = p.speed;
    motion.turn = input.turn;
    motion.mode = p.mode;
    playerPos.set(p.x, p.y, p.z);

    // Footsteps and swim strokes, one per stride.
    if (!cfg.vehicle && !riding) {
      p.stride += Math.abs(p.speed) * dt;
      const strideLength = p.mode === "walk" ? 1.7 : 1.5;
      if (p.stride > strideLength) {
        p.stride = 0;
        playSound(p.mode === "walk" ? "step" : "stroke");
      }
    }
    // Engine note follows the speed; the sea is louder out on the water.
    if (t - p.lastEngine > 0.08) {
      p.lastEngine = t;
      const top = p.mode === "boat" ? 27 : 16;
      setEngine(
        p.mode === "boat" ? "boat" : p.mode === "buggy" ? "buggy" : null,
        Math.min(Math.abs(p.speed) / top, 1),
      );
      setSeaLevel(land ? 0.35 : 1);
    }

    /* ---------- 4. Follow camera ---------- */
    const [back, up] = riding ? ride.cam : cfg.cam;
    const focusHeight = p.mode === "swim" ? 0.45 : 1.6;
    const elevation = THREE.MathUtils.clamp(
      Math.atan2(up - focusHeight, back) + cameraOrbit.pitch,
      0.1,
      1.3,
    );
    const radius = Math.hypot(back, up - focusHeight) * cameraOrbit.zoom;
    const azimuth = p.heading + cameraOrbit.yaw + (riding ? ride.camYaw : 0);
    desired.current.set(
      p.x - Math.sin(azimuth) * Math.cos(elevation) * radius,
      p.y + focusHeight + Math.sin(elevation) * radius,
      p.z - Math.cos(azimuth) * Math.cos(elevation) * radius,
    );
    desired.current.y = Math.max(
      desired.current.y,
      (heightAt(desired.current.x, desired.current.z) ?? 0) + 1,
    );
    if (!p.camReady) {
      camPos.current.copy(desired.current);
      camLook.current.set(p.x, p.y + focusHeight, p.z);
      p.camReady = true;
    }
    camPos.current.lerp(desired.current, 1 - Math.exp(-dt * 3.5));
    camLook.current.lerp(
      desired.current.set(p.x, p.y + focusHeight, p.z),
      1 - Math.exp(-dt * 8),
    );
    camPos.current.y = Math.max(
      camPos.current.y,
      (heightAt(camPos.current.x, camPos.current.z) ?? 0) + 1,
    );
    state.camera.position.copy(camPos.current);
    state.camera.lookAt(camLook.current);

    /* ---------- 5. Heads-up display (a few times a second) ---------- */
    if (t - p.lastHud > 0.12) {
      p.lastHud = t;
      const sd = landSDF(p.x, p.z);
      const target =
        islands.find((i) => i.id === useGame.getState().destination) ??
        islands[0];
      const dx = target.cx - p.x;
      const dz = target.cz - p.z;
      const next = {
        x: Math.round(p.x),
        z: Math.round(p.z),
        heading: Math.round(p.heading * 20) / 20,
        mode: p.mode,
        nearShore: land ? sd > -LAND_SHORE : sd < WATER_SHORE,
        distance: Math.max(0, Math.round(islandDistance(target, p.x, p.z))),
        bearing:
          Math.round(wrapAngle(Math.atan2(dx, dz) - p.heading) * 20) / 20,
      };
      const cur = useGame.getState();
      if (
        cur.mode !== next.mode ||
        cur.nearShore !== next.nearShore ||
        cur.distance !== next.distance ||
        cur.x !== next.x ||
        cur.z !== next.z ||
        cur.heading !== next.heading ||
        cur.bearing !== next.bearing
      ) {
        cur.setHud(next);
      }
    }
  });

  return (
    <group ref={group}>
      <group ref={tilt}>
        <group ref={hiker}>
          <Suspense fallback={<Hiker />}>
            <Woody />
          </Suspense>
        </group>
        <group ref={boat} visible={false}>
          <SpeedBoat />
        </group>
        <group ref={buggy} visible={false}>
          <Buggy />
        </group>
      </group>
    </group>
  );
}
