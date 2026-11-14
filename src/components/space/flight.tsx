// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playSound, setRocket } from "@/lib/sound";
import * as combatState from "./combat";
import { resetCombat, updateCombat } from "./combat";
import { DESCENT, PAD_TOP } from "./mars-surface";
import { GEAR_HEIGHT, Ship } from "./ship";
import { fadeEl, input, rocketLive, useSpace } from "./store";
import { CORRIDOR, MARS, rocks, TRACK } from "./world";

const CRUISE = 72;
const BOOST = 118;
const CRASH_PAUSE = 2.4;

/* Landing timeline, in seconds from the end of the asteroid field. */
const T_CUT_ENTRY = 2.3; // cut to the close entry shot
const T_FADE_IN = 3.7; // haze starts to cover the screen
const T_SWITCH = 4.6; // fully hazed: swap space for the Martian sky
const T_FADE_OUT = 6.2;
const GLIDE = 7.0; // seconds along the descent path
const HOVER = 2.4; // seconds of vertical hover down onto the pad
const SETTLE = 2.2; // seconds on the pad before the panel opens
const TOUCHDOWN = GLIDE + HOVER;

const PARKED = new THREE.Vector3(0, PAD_TOP + GEAR_HEIGHT, 0);
const PARK_DIR = DESCENT.getTangentAt(1).setY(0).normalize();
const UP = new THREE.Vector3(0, 1, 0);
const ZERO = new THREE.Vector3();
const ROLL_AXIS = new THREE.Vector3(0, 0, 1);
/** Camera shots that start with a hard cut instead of a smooth move. */
const CUT_SHOTS = new Set(["approach", "entry", "descent", "final", "touchdown", "parked"]);

const clamp = THREE.MathUtils.clamp;
const smooth = THREE.MathUtils.smoothstep;

/** Autopilot: steer away from rocks ahead, and drift back to the middle. */
function autopilot(x: number, y: number, z: number): [number, number] {
  let tx = -x / CORRIDOR.x;
  let ty = -y / CORRIDOR.y;
  for (const r of rocks) {
    if (!r.alive) continue;
    const ahead = z - r.z;
    if (ahead < -4 || ahead > 150) continue;
    const dx = x - r.x;
    const dy = y - r.y;
    const room = r.r + 4.2;
    if (Math.abs(dx) < room && Math.abs(dy) < room) {
      const w = 1 - ahead / 150;
      tx += (dx >= 0 ? 1 : -1) * w * 2.4;
      ty += (dy >= 0 ? 1 : -1) * w * 1.6;
    }
  }
  return [clamp(tx, -1, 1), clamp(ty, -1, 1)];
}

/** Orientation that points the ship's nose (-Z) along `dir`, rolled by `roll`. */
function aim(out: THREE.Quaternion, dir: THREE.Vector3, roll: number, m: THREE.Matrix4, q: THREE.Quaternion) {
  m.lookAt(ZERO, dir, UP);
  out.setFromRotationMatrix(m);
  q.setFromAxisAngle(ROLL_AXIS, roll);
  return out.multiply(q);
}

export function Flight() {
  const ship = useRef<THREE.Group>(null);
  const s = useRef({
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    crashAt: -1,
    lastProgress: -1,
    lastSound: -1,
    camReady: false,
    /** Seconds since the landing began. */
    landT: 0,
    shot: "",
    caption: -1,
    roll: 0,
    fade: 0,
    orbit: 0,
    /** Dev only: freeze the landing clock to inspect a moment of the cinematic. */
    hold: false,
  });
  const v = useMemo(
    () => ({
      cam: { pos: new THREE.Vector3(), look: new THREE.Vector3(), wantPos: new THREE.Vector3(), wantLook: new THREE.Vector3() },
      start: new THREE.Vector3(),
      ctrl: new THREE.Vector3(),
      entry: new THREE.Vector3(),
      dir: new THREE.Vector3(0, 0, -1),
      prevDir: new THREE.Vector3(0, 0, -1),
      tmp: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      q2: new THREE.Quaternion(),
      m: new THREE.Matrix4(),
      park: new THREE.Quaternion(),
    }),
    []
  );

  // React to the game's phase changes.
  useEffect(
    () =>
      useSpace.subscribe((st, prev) => {
        if (st.phase === prev.phase) return;
        const p = s.current;
        if (st.phase === "ready") {
          resetCombat();
          Object.assign(p, { x: 0, y: 0, z: 0, vx: 0, vy: 0, speed: 0, lastProgress: -1, roll: 0 });
          Object.assign(rocketLive, { throttle: 0, heat: 0, gear: 0, hover: 0 });
          ship.current?.quaternion.identity();
        }
        if (st.phase === "flying") {
          resetCombat();
          playSound("whoosh");
        }
        if (st.phase === "crashed") {
          playSound("boom");
          rocketLive.shake = 0.9;
        }
        if (st.phase === "landing") {
          // Plan the approach: a gentle curve from here down onto Mars's upper atmosphere.
          p.landT = 0;
          p.caption = -1;
          v.start.set(p.x, p.y, p.z);
          v.ctrl.copy(v.start).add(v.tmp.set(0, 0, -110));
          v.entry
            .copy(v.start)
            .sub(MARS.pos)
            .add(v.tmp.set(0, 150, 0))
            .normalize()
            .multiplyScalar(MARS.r * 1.005)
            .add(MARS.pos);
        }
        if (st.phase === "arrived") {
          playSound("send");
          Object.assign(rocketLive, { throttle: 0, heat: 0, gear: 1, hover: 0 });
          p.fade = 0;
          if (fadeEl.current) fadeEl.current.style.opacity = "0";
          // Skipped the cinematic? Put the ship straight on the pad.
          if (p.landT < T_SWITCH + TOUCHDOWN) {
            p.landT = T_SWITCH + TOUCHDOWN + SETTLE;
            ship.current?.quaternion.copy(v.park);
          }
        }
      }),
    [v]
  );

  useEffect(() => {
    aim(v.park, PARK_DIR, 0, v.m, v.q2);
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__space = {
        input,
        state: s.current,
        store: useSpace,
        live: rocketLive,
        combat: combatState,
      };
    }
  }, [v]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = state.clock.elapsedTime;
    const p = s.current;
    const game = useSpace.getState();
    const phase = game.phase;
    const obj = ship.current;
    const camera = state.camera as THREE.PerspectiveCamera;
    const aspect = camera.aspect;
    // On tall, narrow screens (phones held upright) pull the camera back.
    const far = aspect < 1 ? THREE.MathUtils.lerp(1.7, 1, aspect) : 1;
    const cam = v.cam;
    let follow = 4;
    let shot = phase as string;
    let fov = 56;
    let fade = 0;

    /* ================= Free flight ================= */
    if (phase === "flying" && p.hold) {
      // Dev only: frozen mid-flight for inspection.
      if (obj) obj.position.set(p.x, p.y, p.z);
      rocketLive.pos.set(p.x, p.y, p.z);
      cam.wantPos.set(p.x * 0.85, p.y * 0.85 + 2.6 * far, p.z + 12.5 * far);
      cam.wantLook.set(p.x, p.y + 0.8, p.z - 16);
    } else if (phase === "flying") {
      let ix = input.x;
      let iy = input.y;
      if (game.autopilot) [ix, iy] = autopilot(p.x, p.y, p.z);

      p.vx += (ix * 26 - p.vx) * Math.min(1, dt * 6);
      p.vy += (iy * 20 - p.vy) * Math.min(1, dt * 6);
      const boosting = input.boost;
      p.speed += ((boosting ? BOOST : CRUISE) - p.speed) * Math.min(1, dt * 1.5);
      p.x = clamp(p.x + p.vx * dt, -CORRIDOR.x, CORRIDOR.x);
      p.y = clamp(p.y + p.vy * dt, -CORRIDOR.y, CORRIDOR.y);
      p.z -= p.speed * dt;
      rocketLive.throttle += ((boosting ? 1 : 0.45) - rocketLive.throttle) * Math.min(1, dt * 4);

      // Guns (they fire on their own at whatever is locked), missiles, enemies and collisions.
      // Autopilot can't be hit.
      const launchMissile = input.missile;
      input.missile = false;
      const hit = updateCombat(
        dt,
        t,
        { x: p.x, y: p.y, z: p.z, speed: p.speed, roll: -p.vx * 0.032 },
        { fire: input.fire, missile: launchMissile, weapons: true },
        game.autopilot
      );
      if (hit) {
        game.crash();
        p.crashAt = t;
      }

      const progress = clamp(-p.z / TRACK, 0, 1);
      if (Math.abs(progress - p.lastProgress) > 0.002) {
        p.lastProgress = progress;
        game.setProgress(progress);
      }
      if (-p.z >= TRACK) game.arrive();

      if (obj) {
        obj.position.set(p.x, p.y, p.z);
        obj.rotation.set(p.vy * 0.02, -p.vx * 0.006, -p.vx * 0.032);
      }
      rocketLive.pos.set(p.x, p.y, p.z);
      cam.wantPos.set(p.x * 0.85, p.y * 0.85 + 2.6 * far, p.z + 12.5 * far);
      cam.wantLook.set(p.x, p.y + 0.8, p.z - 16);
      fov += Math.max(0, rocketLive.throttle - 0.45) * 16;

    /* ================= Landing cinematic ================= */
    } else if (phase === "landing") {
      if (!p.hold) p.landT += dt;
      const L = p.landT;
      const r = rocketLive.pos;

      if (L < T_SWITCH) {
        // --- Space: approach and atmospheric entry ---
        const k = 1 - Math.pow(1 - L / T_SWITCH, 1.25);
        const a = 1 - k;
        r.set(0, 0, 0)
          .addScaledVector(v.start, a * a)
          .addScaledVector(v.ctrl, 2 * a * k)
          .addScaledVector(v.entry, k * k);
        v.dir
          .copy(v.ctrl)
          .sub(v.start)
          .multiplyScalar(2 * a)
          .addScaledVector(v.tmp.copy(v.entry).sub(v.ctrl), 2 * k)
          .normalize();
        rocketLive.heat = smooth(L, 2.0, 4.0);
        rocketLive.throttle += (0.3 - rocketLive.throttle) * Math.min(1, dt * 2);
        rocketLive.shake = Math.max(rocketLive.shake, rocketLive.heat * 0.12);
        fade = smooth(L, T_FADE_IN, T_SWITCH);

        if (L < T_CUT_ENTRY) {
          shot = "approach";
          cam.wantPos.copy(r).add(v.tmp.set(-34 * far, 12 * far, 40 * far));
          cam.wantLook.lerpVectors(r, MARS.pos, 0.3);
          follow = 2;
        } else {
          shot = "entry";
          cam.wantPos.copy(r).addScaledVector(v.dir, -14 * far).add(v.tmp.set(0, 4 * far, 0));
          cam.wantLook.copy(r).addScaledVector(v.dir, 30);
          follow = 6;
        }
      } else {
        // --- Mars: descent through the clouds onto the pad ---
        if (game.scene !== "surface") game.setScene("surface");
        const u = L - T_SWITCH;
        if (u < GLIDE) {
          const sPath = 1 - Math.pow(1 - u / GLIDE, 2.2);
          DESCENT.getPointAt(sPath, r);
          DESCENT.getTangentAt(Math.min(sPath, 0.995), v.dir);
        } else {
          const k = smooth(u, GLIDE, TOUCHDOWN);
          r.set(0, THREE.MathUtils.lerp(12, PARKED.y, k), 0);
          v.dir.copy(PARK_DIR).setY(0.06).normalize(); // level, nose a touch up
        }
        rocketLive.heat = 1 - smooth(u, 0, 1.6);
        rocketLive.gear = smooth(u, 4.2, 5.6);
        rocketLive.hover = u < TOUCHDOWN ? smooth(u, 5.4, 6.6) : Math.max(0, 1 - (u - TOUCHDOWN) * 1.2);
        const wantThrottle = u < 5.4 ? 0.32 : u < TOUCHDOWN ? 0.06 : 0;
        rocketLive.throttle += (wantThrottle - rocketLive.throttle) * Math.min(1, dt * 2);
        fade = 1 - smooth(L, T_SWITCH + 0.15, T_FADE_OUT);
        if (u > TOUCHDOWN + SETTLE) game.land();

        if (u < 3.4) {
          shot = "descent";
          cam.wantPos.copy(r).addScaledVector(v.dir, -24).add(v.tmp.set(0, 7, 0));
          cam.wantLook.copy(r).addScaledVector(v.dir, 25);
          follow = 6;
        } else if (u < GLIDE + 0.6) {
          // Static camera beside the pad, watching the ship come in.
          shot = "final";
          cam.wantPos.set(34 * far, 4.5, 26 * far);
          cam.wantLook.copy(r);
          follow = 50;
          // A long lens that keeps the ship a steady size as it comes closer.
          const dist = Math.max(1, cam.wantPos.distanceTo(r));
          fov = clamp(THREE.MathUtils.radToDeg(2 * Math.atan(18 / dist)), 14, 48);
        } else {
          shot = "touchdown";
          if (p.shot !== shot) p.orbit = 0.95;
          p.orbit += dt * 0.12;
          cam.wantPos.set(Math.cos(p.orbit) * 30 * far, 7, Math.sin(p.orbit) * 30 * far);
          cam.wantLook.copy(r).add(v.tmp.set(0, 0.5, 0));
          follow = 3;
        }
      }

      // Point along the path, banking into turns.
      if (obj) {
        const turn = v.prevDir.x * v.dir.z - v.prevDir.z * v.dir.x;
        const wantRoll = clamp((-turn / Math.max(dt, 1e-3)) * 1.6, -0.7, 0.7);
        p.roll += (wantRoll - p.roll) * Math.min(1, dt * 3);
        aim(v.q, v.dir, p.roll * (1 - rocketLive.hover), v.m, v.q2);
        obj.quaternion.slerp(v.q, 1 - Math.exp(-dt * 5));
        obj.position.copy(r);
      }
      v.prevDir.copy(v.dir);

      // Subtitles
      const captions: [number, string][] = [
        [0, "Autopilot engaged · approaching Mars"],
        [T_CUT_ENTRY, "Atmospheric entry · 5.4 km/s"],
        [T_SWITCH + 0.5, "Descending through the clouds"],
        [T_SWITCH + 3.4, "Final approach · Pad 1"],
        [T_SWITCH + GLIDE, "Hover · landing gear down"],
        [T_SWITCH + TOUCHDOWN, "Touchdown. Welcome to Mars."],
      ];
      let c = -1;
      for (let i = 0; i < captions.length; i++) if (L >= captions[i][0]) c = i;
      if (c !== p.caption) {
        p.caption = c;
        game.setCaption(c >= 0 ? captions[c][1] : null);
        if (c === 1) playSound("whoosh");
      }

    /* ================= Parked on Mars ================= */
    } else if (phase === "arrived") {
      rocketLive.pos.copy(PARKED);
      rocketLive.throttle = 0;
      rocketLive.hover = Math.max(0, rocketLive.hover - dt);
      if (obj) {
        obj.position.copy(PARKED);
        obj.quaternion.slerp(v.park, 1 - Math.exp(-dt * 3));
      }
      shot = "parked";
      if (p.shot !== "touchdown" && p.shot !== "parked") p.orbit = 0.95;
      p.orbit += dt * 0.05;
      cam.wantPos.set(Math.cos(p.orbit) * 26 * far, 6.5, Math.sin(p.orbit) * 26 * far);
      cam.wantLook.copy(PARKED);
      // Leave room for the panel on the right of wide screens.
      if (game.open && aspect > 1.1) {
        v.tmp.subVectors(cam.wantLook, cam.wantPos).cross(UP).normalize();
        cam.wantLook.addScaledVector(v.tmp, 7);
      }
      follow = 1.5;

    /* ================= Crashed / out of lives ================= */
    } else if (phase === "crashed" || phase === "gameover") {
      // The fight carries on around the wreck.
      if (phase === "crashed") {
        input.missile = false;
        updateCombat(dt, t, { x: p.x, y: p.y, z: p.z, speed: 0, roll: 0 }, { fire: false, missile: false, weapons: false }, true);
      }
      rocketLive.throttle = 0;
      p.speed *= 0.9;
      if (phase === "crashed" && p.crashAt > 0 && t - p.crashAt > CRASH_PAUSE) {
        p.crashAt = -1;
        game.afterCrash();
      }
      cam.wantPos.copy(cam.pos);
      cam.wantLook.copy(rocketLive.pos);
      shot = p.shot; // keep watching the explosion, no cut

    /* ================= Waiting on the launch line ================= */
    } else {
      p.speed = 0;
      rocketLive.throttle += (0 - rocketLive.throttle) * Math.min(1, dt * 3);
      const bob = Math.sin(t * 1.3) * 0.15;
      if (obj) {
        obj.position.set(p.x, p.y + bob, p.z);
        obj.rotation.set(0, 0, Math.sin(t * 0.7) * 0.03);
      }
      rocketLive.pos.set(p.x, p.y, p.z);
      // A slow swing beside the ship, looking down past it at Earth.
      const a = 0.75 + Math.sin(t * 0.15) * 0.4;
      const r = rocketLive.pos;
      cam.wantPos.set(r.x + Math.sin(a) * 12 * far, r.y + 3.6 * far, r.z + Math.cos(a) * 12 * far);
      // The profile card sits on the left (wide screens) or the bottom (phones),
      // so frame the ship to the right, or higher up.
      if (aspect < 1) cam.wantLook.set(r.x - 3, r.y - 7.5, r.z - 6);
      else cam.wantLook.set(r.x - 10, r.y - 1.4, r.z - 4);
      follow = 2;
    }

    if (obj) obj.visible = phase !== "crashed" && phase !== "gameover";
    rocketLive.speed = phase === "flying" ? p.speed : 0;

    /* ---------- Haze between space and Mars ---------- */
    if (Math.abs(fade - p.fade) > 0.004 || (fade === 0 && p.fade !== 0)) {
      p.fade = fade;
      if (fadeEl.current) fadeEl.current.style.opacity = fade.toFixed(3);
    }

    /* ---------- Engine sound ---------- */
    if (t - p.lastSound > 0.08) {
      p.lastSound = t;
      const roar = Math.max(rocketLive.throttle, rocketLive.heat * 0.8, rocketLive.hover * 0.55);
      setRocket(phase === "flying" || phase === "landing" ? roar : 0);
    }

    /* ---------- Camera ---------- */
    if (shot !== p.shot) {
      // Cinematic shots start with a hard cut, like in a film.
      const settling = p.shot === "touchdown" && shot === "parked";
      if (p.shot !== "" && !settling && (CUT_SHOTS.has(shot) || CUT_SHOTS.has(p.shot))) p.camReady = false;
      p.shot = shot;
    }
    if (!p.camReady) {
      cam.pos.copy(cam.wantPos);
      cam.look.copy(cam.wantLook);
      camera.fov = fov;
      camera.updateProjectionMatrix();
      p.camReady = true;
    }
    cam.pos.lerp(cam.wantPos, 1 - Math.exp(-dt * follow));
    cam.look.lerp(cam.wantLook, 1 - Math.exp(-dt * Math.min(follow * 1.6, 12)));

    camera.position.copy(cam.pos);
    if (rocketLive.shake > 0) {
      const k = rocketLive.shake;
      camera.position.x += (Math.random() - 0.5) * k * 1.4;
      camera.position.y += (Math.random() - 0.5) * k * 1.4;
      rocketLive.shake = Math.max(0, k - dt);
    }
    camera.lookAt(cam.look);

    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov += (fov - camera.fov) * Math.min(1, dt * (shot === "final" ? 8 : 3));
      camera.updateProjectionMatrix();
    }
  });

  return (
    <group ref={ship}>
      <Ship />
    </group>
  );
}
