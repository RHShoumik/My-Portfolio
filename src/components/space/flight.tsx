// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playSound, setRocket } from "@/lib/sound";
import * as combatState from "./combat";
import { resetCombat, updateCombat } from "./combat";
import { DESCENT, PAD_RADIUS, PAD_TOP, ROLL_DIST, RUNWAY_DIR, RUNWAY_SIDE } from "./mars-surface";
import { GEAR_HEIGHT, Ship } from "./ship";
import { landingBody, LEVELS } from "./levels";
import { currentLevel, fadeEl, input, rocketLive, shadowFocus, useSpace } from "./store";
import { CORRIDOR, landingPos, rocks, TRACK } from "./world";

const CRUISE = 72;
const BOOST = 118;
const CRASH_PAUSE = 2.4;

/* Landing timeline, in seconds from the end of the asteroid field. */
const T_CUT_ENTRY = 2.3; // cut to the close entry shot
const T_FADE_IN = 3.7; // haze starts to cover the screen
const T_SWITCH = 4.6; // fully hazed: swap space for the Martian sky
const T_FADE_OUT = 6.2;
const GLIDE = 9.0; // seconds along the approach, down to the wheels touching
const ROLL = 5.5; // seconds braking down the runway to a stop
const SETTLE = 1.6; // seconds stopped before the pilot climbs out
const TOUCHDOWN = GLIDE + ROLL; // (stopped)
/** Touchdown speed, m/s: fast enough to look like a jet, slow enough to stop in ROLL_DIST. */
const TOUCHDOWN_SPEED = (2 * ROLL_DIST) / ROLL;
/**
 * Progress along the approach for a time fraction x: fast at first, easing to
 * exactly the touchdown speed at the end (a blend of linear and ease-out).
 */
const GLIDE_LINEAR = Math.min(0.9, (TOUCHDOWN_SPEED * GLIDE) / DESCENT.getLength());
const glideAt = (x: number) => GLIDE_LINEAR * x + (1 - GLIDE_LINEAR) * (1 - (1 - x) * (1 - x));

/* Take-off timeline, in seconds from climbing aboard. */
const TO_SPOOL = 1.6; // engines winding up on the pad
const TO_ACCEL = 15; // m/s² down the sand
const TO_ROTATE = 62; // m/s: lift the nose
const TO_LIFTOFF = 74; // m/s: start climbing
const TO_END = 11.5; // fully hazed: on to the next planet

const PARKED = new THREE.Vector3(0, PAD_TOP + GEAR_HEIGHT, 0);
const PARK_DIR = RUNWAY_DIR.clone();
const UP = new THREE.Vector3(0, 1, 0);
const ZERO = new THREE.Vector3();
const ROLL_AXIS = new THREE.Vector3(0, 0, 1);
/** Camera shots that start with a hard cut instead of a smooth move. */
const CUT_SHOTS = new Set(["approach", "entry", "descent", "final", "rollout", "touchdown", "parked"]);

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
    /** Take-off: seconds since boarding, distance along the strip, height, speed, climb angle, nose-up, liftoff time. */
    toT: 0,
    ta: 0,
    ty: 0,
    tv: 0,
    tg: 0,
    tpitch: 0,
    liftAt: -1,
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
      /** Centre of the world you land on, for this level. */
      body: new THREE.Vector3(),
    }),
    []
  );

  // React to the game's phase changes.
  useEffect(
    () =>
      useSpace.subscribe((st, prev) => {
        // A new level: lay out its rocks, mines and enemies straight away.
        if (st.level !== prev.level) resetCombat();
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
          const level = currentLevel();
          v.body.copy(landingPos(level));
          v.entry
            .copy(v.start)
            .sub(v.body)
            .add(v.tmp.set(0, 150, 0))
            .normalize()
            .multiplyScalar(landingBody(level).r * 1.005)
            .add(v.body);
        }
        if (st.phase === "takeoff") {
          Object.assign(p, { toT: 0, ta: 0, ty: 0, tv: 0, tg: 0, tpitch: 0, liftAt: -1, caption: -1 });
          ship.current?.quaternion.copy(v.park);
          playSound("whoosh");
        }
        if (st.phase === "arrived" || st.phase === "eva") {
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

    /* ================= On foot: the ship waits on the pad, the astronaut has the camera ================= */
    if (phase === "eva") {
      Object.assign(rocketLive, { throttle: 0, heat: 0, gear: 1, speed: 0, skid: 0 });
      rocketLive.hover = Math.max(0, rocketLive.hover - dt);
      rocketLive.pos.copy(PARKED);
      if (obj) {
        obj.visible = true;
        obj.position.copy(PARKED);
        obj.quaternion.slerp(v.park, 1 - Math.exp(-dt * 3));
      }
      if (p.fade !== 0) {
        p.fade = 0;
        if (fadeEl.current) fadeEl.current.style.opacity = "0";
      }
      if (t - p.lastSound > 0.08) {
        p.lastSound = t;
        setRocket(0);
      }
      // Cut back to a flight shot when you take off again.
      p.shot = "eva";
      p.camReady = false;
      return;
    }

    /* ================= Take-off: spool up, run across the sand, rotate, climb away ================= */
    if (phase === "takeoff") {
      if (!p.hold) p.toT += dt;
      const u = p.toT;
      const level = currentLevel();
      const next = LEVELS[level.number];
      const r = rocketLive.pos;

      if (u > TO_SPOOL && !p.hold) {
        p.tv += (p.tv < 95 ? TO_ACCEL : 9) * dt;
        if (p.tv > TO_ROTATE) p.tpitch = Math.min(0.13, p.tpitch + dt * 0.16);
        if (p.tv > TO_LIFTOFF) p.tg = Math.min(0.36, p.tg + dt * 0.2);
        p.ta += p.tv * Math.cos(p.tg) * dt;
        p.ty += p.tv * Math.sin(p.tg) * dt;
        if (p.liftAt < 0 && p.ty > 0.3) {
          p.liftAt = u;
          playSound("whoosh");
        }
      }
      const onPad = 1 - smooth(Math.abs(p.ta), PAD_RADIUS - 1, PAD_RADIUS + 3);
      const ground = GEAR_HEIGHT + PAD_TOP * onPad;
      r.copy(RUNWAY_DIR).multiplyScalar(p.ta);
      r.y = ground + p.ty;
      const pitch = p.tpitch + p.tg;
      v.dir.copy(RUNWAY_DIR).multiplyScalar(Math.cos(pitch)).setY(Math.sin(pitch));
      if (obj) {
        aim(v.q, v.dir, 0, v.m, v.q2);
        obj.quaternion.slerp(v.q, 1 - Math.exp(-dt * 6));
        obj.position.copy(r);
        obj.visible = true;
      }

      // Engines to full power; the blast throws sand off the pad until you're airborne.
      rocketLive.throttle += (Math.min(1, u / TO_SPOOL) - rocketLive.throttle) * Math.min(1, dt * 3);
      rocketLive.skid = p.ty < 2 ? 0.45 + 0.4 * Math.min(1, p.tv / 60) : 0;
      rocketLive.gear = p.liftAt < 0 ? 1 : 1 - smooth(u, p.liftAt + 0.8, p.liftAt + 2.2);
      rocketLive.hover = 0;
      if (p.ty < 1) rocketLive.shake = Math.max(rocketLive.shake, 0.05 + 0.08 * Math.min(1, p.tv / 70));
      const fadeNow = smooth(u, TO_END - 1.4, TO_END);
      if (Math.abs(fadeNow - p.fade) > 0.004) {
        p.fade = fadeNow;
        if (fadeEl.current) fadeEl.current.style.opacity = fadeNow.toFixed(3);
      }
      if (u >= TO_END) game.depart();

      // Shots
      let toShot = "spool";
      let toFov = 52;
      let toFollow = 50;
      if (u < TO_SPOOL + 1.4) {
        cam.wantPos.copy(PARKED).addScaledVector(RUNWAY_DIR, -16 * far).addScaledVector(RUNWAY_SIDE, 9 * far).setY(PAD_TOP + 2.4);
        cam.wantLook.copy(r).add(v.tmp.set(0, 0.6, 0));
      } else if (u < TO_SPOOL + 4.1) {
        toShot = "roll";
        cam.wantPos.copy(r).addScaledVector(RUNWAY_DIR, -20 * far).addScaledVector(RUNWAY_SIDE, 6.5 * far).setY(ground + 2.4);
        cam.wantLook.copy(r).addScaledVector(RUNWAY_DIR, 14);
        toFollow = 7;
      } else if (u < TO_SPOOL + 7.2) {
        // Beside the strip ahead of the liftoff point: the jet thunders past and climbs away.
        toShot = "liftoff";
        cam.wantPos.copy(RUNWAY_DIR).multiplyScalar(250).addScaledVector(RUNWAY_SIDE, -28 * far).setY(2.6);
        cam.wantLook.copy(r);
        const dist = Math.max(1, cam.wantPos.distanceTo(r));
        toFov = clamp(THREE.MathUtils.radToDeg(2 * Math.atan(15 / dist)), 12, 52);
      } else {
        toShot = "climb";
        cam.wantPos.copy(r).addScaledVector(v.dir, -30).add(v.tmp.set(0, 5, 0));
        cam.wantLook.copy(r).addScaledVector(v.dir, 40);
        toFollow = 4;
      }

      const captions: [number, string][] = [
        [0, "Canopy closed · engines to full power"],
        [TO_SPOOL + 0.3, "Brakes off"],
        [TO_SPOOL + 3.6, "Rotate"],
        [TO_SPOOL + 5.0, "Liftoff · gear up"],
        [TO_SPOOL + 7.2, next ? `Climbing out · next stop ${next.to}` : "Climbing out · back to the launch line"],
      ];
      let c = -1;
      for (let i = 0; i < captions.length; i++) if (u >= captions[i][0]) c = i;
      if (c !== p.caption) {
        p.caption = c;
        game.setCaption(c >= 0 ? captions[c][1] : null);
      }

      // Engine sound
      if (t - p.lastSound > 0.08) {
        p.lastSound = t;
        setRocket(rocketLive.throttle);
      }
      shadowFocus.copy(r);

      // Camera (cuts between shots, like the landing)
      if (toShot !== p.shot) {
        p.camReady = false;
        p.shot = toShot;
      }
      if (!p.camReady) {
        cam.pos.copy(cam.wantPos);
        cam.look.copy(cam.wantLook);
        camera.fov = toFov;
        camera.updateProjectionMatrix();
        p.camReady = true;
      }
      cam.pos.lerp(cam.wantPos, 1 - Math.exp(-dt * toFollow));
      cam.look.lerp(cam.wantLook, 1 - Math.exp(-dt * Math.min(toFollow * 1.6, 12)));
      camera.position.copy(cam.pos);
      if (rocketLive.shake > 0) {
        const k = rocketLive.shake;
        camera.position.x += (Math.random() - 0.5) * k * 1.4;
        camera.position.y += (Math.random() - 0.5) * k * 1.4;
        rocketLive.shake = Math.max(0, k - dt);
      }
      camera.lookAt(cam.look);
      if (Math.abs(camera.fov - toFov) > 0.05) {
        camera.fov += (toFov - camera.fov) * Math.min(1, dt * 8);
        camera.updateProjectionMatrix();
      }
      return;
    }

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
          cam.wantLook.lerpVectors(r, v.body, 0.3);
          follow = 2;
        } else {
          shot = "entry";
          cam.wantPos.copy(r).addScaledVector(v.dir, -14 * far).add(v.tmp.set(0, 4 * far, 0));
          cam.wantLook.copy(r).addScaledVector(v.dir, 30);
          follow = 6;
        }
      } else {
        // --- On the surface: approach, flare, touchdown on the sand, roll-out onto the pad ---
        if (game.scene !== "surface") game.setScene("surface");
        const u = L - T_SWITCH;
        rocketLive.hover = 0;
        if (u < GLIDE) {
          const sPath = Math.min(1, glideAt(u / GLIDE));
          DESCENT.getPointAt(sPath, r);
          DESCENT.getTangentAt(Math.min(sPath, 0.999), v.dir);
          // Flare: raise the nose over the last moments so the main wheels touch first.
          const flare = smooth(u, GLIDE - 1.6, GLIDE);
          v.dir.y += flare * 0.14;
          v.dir.normalize();
          rocketLive.skid = 0;
        } else {
          // Braking evenly from touchdown speed to a stop in the middle of the pad.
          const k = Math.min(1, (u - GLIDE) / ROLL);
          const along = -ROLL_DIST * (1 - k) * (1 - k);
          r.copy(RUNWAY_DIR).multiplyScalar(along);
          // On the sand, then up the pad's low edge for the last few metres.
          const onPad = 1 - smooth(-along, PAD_RADIUS - 1, PAD_RADIUS + 3);
          const settle = u - GLIDE;
          // A small bounce as the gear takes the weight, and the nose settling down.
          r.y = GEAR_HEIGHT + PAD_TOP * onPad + Math.max(0, Math.sin(Math.min(1, settle / 0.45) * Math.PI)) * 0.12;
          v.dir.copy(RUNWAY_DIR).setY(0.1 * Math.max(0, 1 - settle / 0.9)).normalize();
          // A burst of sand on contact, then a dust trail behind the wheels until the pad.
          rocketLive.skid = (Math.max(0, 1 - settle / 0.6) + 0.6 * (1 - k)) * (1 - onPad);
          if (settle < dt * 1.5) rocketLive.shake = Math.max(rocketLive.shake, 0.25);
        }
        rocketLive.heat = 1 - smooth(u, 0, 1.6);
        rocketLive.gear = smooth(u, 3.0, 4.6);
        // Engines back to idle on short final; a burst of reverse thrust after touchdown.
        const wantThrottle = u < GLIDE - 2 ? 0.32 : u < GLIDE ? 0.1 : u < GLIDE + 2.2 ? 0.45 : 0;
        rocketLive.throttle += (wantThrottle - rocketLive.throttle) * Math.min(1, dt * 2.5);
        fade = 1 - smooth(L, T_SWITCH + 0.15, T_FADE_OUT);
        if (u > TOUCHDOWN + SETTLE) game.land();

        if (u < 3.6) {
          shot = "descent";
          cam.wantPos.copy(r).addScaledVector(v.dir, -24).add(v.tmp.set(0, 7, 0));
          cam.wantLook.copy(r).addScaledVector(v.dir, 25);
          follow = 6;
        } else if (u < GLIDE + 0.7) {
          // A camera beside the touchdown zone on a long lens, watching the ship come in.
          shot = "final";
          cam.wantPos
            .copy(RUNWAY_DIR)
            .multiplyScalar(-ROLL_DIST + 30)
            .addScaledVector(RUNWAY_SIDE, -34 * far)
            .setY(PAD_TOP + 3.5);
          cam.wantLook.copy(r);
          follow = 50;
          const dist = Math.max(1, cam.wantPos.distanceTo(r));
          fov = clamp(THREE.MathUtils.radToDeg(2 * Math.atan(16 / dist)), 10, 48);
        } else if (u < GLIDE + ROLL * 0.75) {
          // Low and close, chasing the roll-out down the runway.
          shot = "rollout";
          cam.wantPos
            .copy(r)
            .addScaledVector(RUNWAY_DIR, -20 * far)
            .addScaledVector(RUNWAY_SIDE, 6.5 * far)
            .setY(PAD_TOP + 3);
          cam.wantLook.copy(r).addScaledVector(RUNWAY_DIR, 12);
          follow = 7;
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
      const level = currentLevel();
      const site = level.site;
      const captions: [number, string][] = [
        [0, `Autopilot engaged · approaching ${site.name}`],
        [T_CUT_ENTRY, site.clouds ? "Atmospheric entry · 5.4 km/s" : "Orbit insertion · retro burn"],
        [T_SWITCH + 0.5, site.clouds ? "Descending through the clouds" : `Descending over the ice of ${site.name}`],
        [T_SWITCH + 3.6, "Gear down · final approach"],
        [T_SWITCH + GLIDE - 1.6, "Flare"],
        [T_SWITCH + GLIDE, "Touchdown on the sand · braking"],
        [T_SWITCH + GLIDE + ROLL * 0.7, `Rolling onto Pad ${level.number}`],
        [T_SWITCH + TOUCHDOWN, `Welcome to ${site.name}.`],
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
    if (game.scene === "surface") shadowFocus.copy(rocketLive.pos);

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
