// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";
import { playSound } from "@/lib/sound";
import { travelLocations } from "@/data/travel-data";
import { experiences, projects } from "@/lib/constants";
import type { Level } from "./levels";
import { PAD_TOP, RUNWAY_DIR, surfaceHeight } from "./mars-surface";
import { GEAR_HEIGHT } from "./ship";
import { REACH, stationsFor, type Station } from "./stations";
import { input, shadowFocus, useSpace } from "./store";

/*
 * On foot. After touchdown the pilot hops down from the cockpit and you walk
 * around the landing site: every station holds part of the portfolio.
 * Coordinates are the surface's own (the pad at the origin).
 */

const SHIP = new THREE.Vector3(0, PAD_TOP + GEAR_HEIGHT, 0);
const SHIP_DIR = RUNWAY_DIR.clone();
const SIDE = new THREE.Vector3(SHIP_DIR.z, 0, -SHIP_DIR.x);
const WALK = 4.2;
const RUN = 7.5;
const BOUNDS = 110;
/** How close to the ship's centre you must be to climb in, and how long the climb takes. */
const BOARD_REACH = 8.5;
const BOARD_TIME = 1.3;
/** Roughly where the cockpit is: forward of the ship's centre, up on top. */
const COCKPIT = SHIP.clone().addScaledVector(SHIP_DIR, 2.6).add(new THREE.Vector3(0, 1.1, 0));

/** Ground under a point: the runway top on the runway, terrain elsewhere. */
export function groundAt(x: number, z: number) {
  return surfaceHeight(x, z);
}

/** Things you can't walk through, as [x, z, radius]. */
function colliders(stations: Station[]): [number, number, number][] {
  return [
    // The parked ship: a circle at the nose and one at the tail
    [SHIP_DIR.x * 3.6, SHIP_DIR.z * 3.6, 3.2],
    [0, 0, 3.4],
    [-SHIP_DIR.x * 3.6, -SHIP_DIR.z * 3.6, 3.6],
    // The base: two domes, the tunnel between them and the dish
    [-36, 30, 7.6],
    [-23, 25, 5.1],
    [-29.5, 27.5, 2.2],
    [-28, 39, 2.4],
    ...stations.map((s): [number, number, number] => [s.x, s.z, s.kind === "radio" ? 0.5 : 1.3]),
  ];
}

/* ------------------------------------------------------------------ */
/*  The astronaut                                                      */
/* ------------------------------------------------------------------ */

export const astro = {
  pos: new THREE.Vector3(),
  vy: 0,
  heading: 0,
  speed: 0,
  grounded: false,
  walk: 0,
  /** Seconds since stepping out. */
  t: 0,
  /** Ground velocity, how fast it is changing, and how fast you are turning. */
  vx: 0,
  vz: 0,
  accel: 0,
  turn: 0,
  /** Footsteps taken (for dust puffs). */
  steps: 0,
  /** Seconds into climbing back aboard (-1 when not boarding), and where it started. */
  boarding: -1,
  boardFrom: new THREE.Vector3(),
  /** Sideways speed of the hop off the wing, and how long the hop shot lasts. */
  hop: 2.4,
  intro: 2.4,
};

const ASTRONAUT_URL = "/space/objects/astronaut_by_jungle_jim.glb";
/** How tall the astronaut stands, in metres (the model is 1 unit tall). */
const ASTRONAUT_HEIGHT = 1.85;
useLoader.preload(GLTFLoader, ASTRONAUT_URL);

/*
 * "Astronaut" by Jungle Jim (CC BY 4.0) is a single static mesh, split by
 * material rather than by body part. To make it walk we rig it when it loads:
 * a small skeleton (pelvis, spine, hips, knees, shoulders) and skin weights
 * given to every vertex by where it sits on the body, blended across each
 * joint so the suit bends instead of tearing.
 *
 * Measured from the model (1 unit tall, facing +Z):
 *   legs from the ground to y 0.42, split at x = 0; arms hang from the
 *   shoulders (x ±0.2, y 0.66) down to the gloves (x ±0.32, y 0.44).
 */
const JOINT = {
  pelvis: [0, 0.44, 0.03],
  spine: [0, 0.5, 0.03],
  hip: [0.085, 0.43, 0.03],
  knee: [0.1, 0.22, 0.04],
  shoulder: [0.2, 0.66, 0.04],
} as const;

const smooth = THREE.MathUtils.smoothstep;

interface Rig {
  root: THREE.Group;
  pelvis: THREE.Bone;
  spine: THREE.Bone;
  hips: THREE.Bone[];
  knees: THREE.Bone[];
  shoulders: THREE.Bone[];
}

/** The flag of Bangladesh: bottle green with a red disc set toward the hoist (10:6). */
function makeBangladeshFlag() {
  const c = document.createElement("canvas");
  c.width = 250;
  c.height = 150;
  const g = c.getContext("2d")!;
  g.fillStyle = "#006a4e";
  g.fillRect(0, 0, 250, 150);
  g.fillStyle = "#f42a41";
  g.beginPath();
  // Centre at 9/20 of the length, radius 1/5 of the length.
  g.arc(250 * 0.45, 75, 50, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/**
 * The model's shoulder flag patch (on its left shoulder, +X), measured from the
 * mesh: centre, outward normal, and size. Our flag is laid just over it.
 */
const FLAG_PATCH = {
  center: new THREE.Vector3(0.183, 0.771, 0.04),
  normal: new THREE.Vector3(0.73, 0.49, 0.07).normalize(),
  width: 0.082,
};

function makeShoulderFlag() {
  const n = FLAG_PATCH.normal;
  // Across the patch, front to back (so the hoist faces forward), and up the patch.
  const across = new THREE.Vector3(0, 0, -1).addScaledVector(n, n.z).normalize();
  const up = new THREE.Vector3().crossVectors(n, across).normalize();
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(FLAG_PATCH.width, FLAG_PATCH.width * 0.6),
    new THREE.MeshStandardMaterial({
      map: makeBangladeshFlag(),
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    })
  );
  flag.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(across, up, n));
  flag.position.copy(FLAG_PATCH.center).addScaledVector(n, 0.008);
  flag.castShadow = false;
  return flag;
}

function rigAstronaut(source: THREE.Object3D): Rig {
  const v = (a: readonly number[], side = 1) => new THREE.Vector3(a[0] * side, a[1], a[2]);
  const bone = (name: string, at: THREE.Vector3, parentAt: THREE.Vector3, parent?: THREE.Bone) => {
    const b = new THREE.Bone();
    b.name = name;
    b.position.copy(at).sub(parentAt);
    parent?.add(b);
    return b;
  };
  const origin = new THREE.Vector3();
  const pelvisAt = v(JOINT.pelvis);
  const spineAt = v(JOINT.spine);
  const pelvis = bone("pelvis", pelvisAt, origin);
  const spine = bone("spine", spineAt, pelvisAt, pelvis);
  // Index 0 is the model's +X side, 1 its -X side.
  const hips = [1, -1].map((side) => bone(`hip${side}`, v(JOINT.hip, side), pelvisAt, pelvis));
  const knees = [1, -1].map((side, i) => bone(`knee${side}`, v(JOINT.knee, side), v(JOINT.hip, side), hips[i]));
  const shoulders = [1, -1].map((side) => bone(`shoulder${side}`, v(JOINT.shoulder, side), spineAt, spine));
  const bones = [pelvis, spine, ...hips, ...knees, ...shoulders];
  const index = (b: THREE.Bone) => bones.indexOf(b);

  const root = new THREE.Group();
  root.add(pelvis);
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);

  /** Up to two bones per vertex, by where the vertex sits. */
  const weigh = (x: number, y: number): [number, number, number, number] => {
    const side = x >= 0 ? 0 : 1;
    const ax = Math.abs(x);
    // Arms: out to the side, between the gloves and the shoulder.
    const arm = smooth(ax, 0.17, 0.215) * (1 - smooth(y, 0.6, 0.7)) * smooth(y, 0.36, 0.42);
    if (arm > 0.001) return [index(shoulders[side]), index(spine), arm, 1 - arm];
    // Legs: below the pelvis; the shin below the knee.
    const leg = 1 - smooth(y, 0.38, 0.48);
    if (leg > 0.001) {
      const shin = 1 - smooth(y, 0.18, 0.27);
      if (shin > 0.001) return [index(knees[side]), index(hips[side]), shin, 1 - shin];
      return [index(hips[side]), index(pelvis), leg, 1 - leg];
    }
    // The torso bends a little at the waist.
    const torso = smooth(y, 0.46, 0.56);
    return [index(spine), index(pelvis), torso, 1 - torso];
  };

  source.updateMatrixWorld(true);
  const p = new THREE.Vector3();
  source.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    // The old flag's blue canton shares a mesh with the badge on the other
    // shoulder: tuck just its left-shoulder part inside the suit.
    if (/Badge_blue/.test((mesh.material as THREE.Material).name)) {
      for (let i = 0; i < pos.count; i++) if (pos.getX(i) > 0.15 && pos.getY(i) > 0.7) pos.setX(i, 0.1);
    }
    const skinIndex = new Uint16Array(pos.count * 4);
    const skinWeight = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i);
      const [a, b, wa, wb] = weigh(p.x, p.y);
      skinIndex[i * 4] = a;
      skinIndex[i * 4 + 1] = b;
      skinWeight[i * 4] = wa;
      skinWeight[i * 4 + 1] = wb;
    }
    geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndex, 4));
    geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeight, 4));
    const skinned = new THREE.SkinnedMesh(geometry, mesh.material);
    skinned.castShadow = true;
    skinned.frustumCulled = false;
    root.add(skinned);
    skinned.bind(skeleton);
  });

  // Swap the shoulder flag for Bangladesh's: hide the old stripes, cover the patch.
  root.traverse((o) => {
    const mesh = o as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    const name = (mesh.material as THREE.Material).name;
    if (/Insignia_white|Insignia_red/.test(name) && mesh.geometry.boundingBox === null) {
      mesh.geometry.computeBoundingBox();
    }
    const box = mesh.geometry.boundingBox;
    // Only the flag's stripes: the red/white pieces on the +X shoulder.
    if (/Insignia_white|Insignia_red/.test(name) && box && box.min.x > 0.15 && box.min.y > 0.7) mesh.visible = false;
  });
  const flag = makeShoulderFlag();
  // The patch is high on the shoulder, which is skinned to the spine: ride on that.
  flag.position.sub(spineAt);
  spine.add(flag);

  return { root, pelvis, spine, hips, knees, shoulders };
}

function Astronaut({ body, gravity }: { body: React.RefObject<THREE.Group | null>; gravity: number }) {
  const gltf = useLoader(GLTFLoader, ASTRONAUT_URL);
  const rig = useMemo(() => rigAstronaut(gltf.scene), [gltf.scene]);
  const motion = useMemo(() => ({ blend: 0, air: 0, t: 0, lean: 0, roll: 0, rise: 0 }), []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") (window as unknown as Record<string, unknown>).__astroRig = rig;
  }, [rig]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const ease = (rate: number) => 1 - Math.exp(-dt * rate);
    motion.t += dt;
    const walking = astro.grounded ? Math.min(1, astro.speed / WALK) : 0;
    motion.blend += (walking - motion.blend) * ease(6);
    motion.air += ((astro.grounded ? 0 : 1) - motion.air) * ease(astro.grounded ? 10 : 4);
    // Lean forward with speed and acceleration (back when braking), and into turns.
    const wantLean = Math.min(0.14, astro.speed * 0.022) + THREE.MathUtils.clamp(astro.accel * 0.025, -0.12, 0.1);
    motion.lean += (wantLean - motion.lean) * ease(5);
    const wantRoll = THREE.MathUtils.clamp(-astro.turn * astro.speed * 0.035, -0.22, 0.22);
    motion.roll += (wantRoll - motion.roll) * ease(5);

    const k = motion.blend;
    const air = motion.air;
    // A bulky suit takes short steps; low gravity turns the walk into a loping bound.
    const loping = gravity < 2 ? 1 : 0;
    const stride = Math.min(1.2, astro.speed / WALK) * k;
    const breathe = Math.sin(motion.t * 1.5);
    const walk = astro.walk;

    // The model faces +Z: a negative turn about X swings a limb forward.
    for (let i = 0; i < 2; i++) {
      const phase = walk + (i === 0 ? 0 : Math.PI);
      const swing = Math.sin(phase);
      // The foot travels forward while cos(phase) > 0 (the swing), back while planted.
      const swingPhase = Math.max(0, Math.cos(phase));
      const stance = Math.max(0, -Math.cos(phase));
      const hip = -(swing * 0.5 + 0.05) * stride - air * (i === 0 ? 0.5 : 0.12);
      const knee = swingPhase * swingPhase * 1.0 * stride + stance * 0.12 * stride + 0.04 * k + air * (i === 0 ? 0.85 : 0.45);
      rig.hips[i].rotation.x += (hip - rig.hips[i].rotation.x) * ease(18);
      rig.knees[i].rotation.x += (knee - rig.knees[i].rotation.x) * ease(18);
      // Arms swing against the legs (stiff in the suit), and float out in the air.
      const arm = swing * 0.32 * stride + breathe * 0.015 * (1 - k) - motion.lean * 0.6;
      rig.shoulders[i].rotation.x += (arm - rig.shoulders[i].rotation.x) * ease(12);
      const out = (i === 0 ? 1 : -1) * (0.05 + air * 0.4 + loping * 0.04 * k);
      rig.shoulders[i].rotation.z += (out - rig.shoulders[i].rotation.z) * ease(8);
    }
    // Torso: lean, counter-twist against the hips, breathe when standing.
    rig.spine.rotation.set(
      motion.lean + breathe * 0.012 * (1 - k) - air * 0.06,
      Math.sin(walk) * 0.07 * k,
      -motion.roll * 0.4
    );
    rig.pelvis.rotation.set(motion.lean * 0.4, -Math.sin(walk) * 0.05 * k, Math.sin(walk) * 0.025 * k + motion.roll);
    // Bob: dip as the weight lands on each foot; in low gravity, rise into a float between steps.
    const dip = -Math.abs(Math.cos(walk)) * 0.02 * k;
    const float = loping * Math.pow(Math.abs(Math.sin(walk)), 2) * 0.05 * k;
    motion.rise += (dip + float - motion.rise) * ease(14);
    rig.pelvis.position.y = JOINT.pelvis[1] + motion.rise;
  });

  return (
    <group ref={body}>
      <group scale={ASTRONAUT_HEIGHT}>
        <primitive object={rig.root} />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Stations                                                           */
/* ------------------------------------------------------------------ */

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function makeLabel(title: string, subtitle: string, done: boolean) {
  return canvasTexture(512, 150, (g) => {
    g.fillStyle = "rgba(8,11,20,0.78)";
    g.beginPath();
    g.roundRect(4, 4, 504, 142, 28);
    g.fill();
    g.strokeStyle = done ? "rgba(110,240,160,0.9)" : "rgba(255,255,255,0.35)";
    g.lineWidth = 4;
    g.stroke();
    g.textAlign = "center";
    g.fillStyle = "#ffffff";
    g.font = "700 50px system-ui, -apple-system, Segoe UI, sans-serif";
    g.fillText(`${done ? "✓ " : ""}${title}`.slice(0, 26), 256, 70);
    g.fillStyle = "rgba(255,255,255,0.65)";
    g.font = "500 30px system-ui, -apple-system, Segoe UI, sans-serif";
    g.fillText(subtitle.slice(0, 34), 256, 116);
  });
}

function makeScreen(lines: string[], accent: string) {
  return canvasTexture(256, 512, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0, "#0d1530");
    grd.addColorStop(1, "#050812");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 512);
    g.strokeStyle = accent;
    g.lineWidth = 6;
    g.strokeRect(10, 10, 236, 492);
    g.fillStyle = accent;
    g.font = "700 22px system-ui, sans-serif";
    g.textAlign = "center";
    g.fillText(lines[0], 128, 70);
    g.fillStyle = "#ffffff";
    g.font = "800 34px system-ui, sans-serif";
    // Wrap the title
    const words = lines[1].split(" ");
    let line = "";
    let y = 250;
    for (const w of words) {
      if (g.measureText(`${line} ${w}`).width > 210 && line) {
        g.fillText(line, 128, y);
        line = w;
        y += 42;
      } else line = line ? `${line} ${w}` : w;
    }
    g.fillText(line, 128, y);
    g.fillStyle = "rgba(255,255,255,0.6)";
    g.font = "500 20px system-ui, sans-serif";
    g.fillText(lines[2] ?? "", 128, 460);
  });
}

function makeFlag(text: string, accent: string) {
  return canvasTexture(512, 300, (g) => {
    g.fillStyle = "#f4f1ea";
    g.fillRect(0, 0, 512, 300);
    g.fillStyle = accent;
    g.fillRect(0, 0, 512, 46);
    g.fillRect(0, 254, 512, 46);
    g.fillStyle = "#151a2b";
    g.textAlign = "center";
    g.font = "800 46px system-ui, sans-serif";
    const words = text.split(" ");
    const mid = Math.ceil(words.length / 2);
    const two = text.length > 16;
    g.fillText(two ? words.slice(0, mid).join(" ") : text, 256, two ? 140 : 168);
    if (two) g.fillText(words.slice(mid).join(" "), 256, 196);
  });
}

const ACCENT = { skill: "#6fe3ff", job: "#ff9a73", project: "#9b8cff", trip: "#ffd36a", radio: "#ff5a6a" };

function StationModel({ s, done, active }: { s: Station; done: boolean; active: boolean }) {
  const y = groundAt(s.x, s.z);
  const ring = useRef<THREE.Mesh>(null);
  const accent = ACCENT[s.kind];
  const label = useMemo(() => makeLabel(s.title, s.subtitle, done), [s, done]);
  // Face the pad.
  const face = Math.atan2(-s.x, -s.z);

  const art = useMemo(() => {
    if (s.kind === "project") {
      const p = projects[s.index];
      return makeScreen([`PROJECT 0${s.index + 1}`, p.title, p.tech.slice(0, 2).join(" · ")], accent);
    }
    if (s.kind === "job") return makeFlag(experiences[s.index].company.replace(/ Limited$/, ""), accent);
    return null;
  }, [s, accent]);

  const photo = useMemo(() => {
    if (s.kind !== "trip") return null;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const t = loader.load(travelLocations[s.index]?.coverImage ?? "");
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [s]);

  useFrame((state) => {
    const m = ring.current;
    if (!m) return;
    const k = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.4 + s.x);
    (m.material as THREE.MeshBasicMaterial).opacity = done ? 0.45 : 0.35 + k * 0.5;
    m.scale.setScalar(done ? 1 : 1 + k * 0.08);
  });

  return (
    <group position={[s.x, y, s.z]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[1.9, 2.3, 48]} />
        <meshBasicMaterial color={done ? "#6ef0a0" : accent} transparent depthWrite={false} fog={false} />
      </mesh>

      {s.kind === "skill" &&
        [0, 1, 2, 3, 4].map((i) => {
          const a = i * 1.3;
          const r = i === 0 ? 0 : 0.6;
          const h = i === 0 ? 2.6 : 1.2 + (i % 2) * 0.6;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * r, h * 0.42, Math.sin(a) * r]}
              rotation={[Math.cos(a) * 0.35 * (i ? 1 : 0), a, Math.sin(a) * 0.35 * (i ? 1 : 0)]}
              scale={[0.42, h * 0.5, 0.42]}
              castShadow
            >
              <octahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color={accent}
                emissive={accent}
                emissiveIntensity={0.55}
                roughness={0.15}
                metalness={0.1}
                transparent
                opacity={0.9}
              />
            </mesh>
          );
        })}

      {s.kind === "job" && art && (
        <group rotation={[0, face, 0]}>
          <mesh position={[-0.9, 2.3, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 4.6, 8]} />
            <meshStandardMaterial color="#c9ccd2" metalness={0.7} roughness={0.35} />
          </mesh>
          {/* Printed on both sides, so it reads right from either */}
          <mesh position={[0.35, 3.85, 0.005]} castShadow>
            <planeGeometry args={[2.5, 1.45]} />
            <meshStandardMaterial map={art} roughness={0.8} />
          </mesh>
          <mesh position={[0.35, 3.85, -0.005]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[2.5, 1.45]} />
            <meshStandardMaterial map={art} roughness={0.8} />
          </mesh>
          <mesh position={[0.6, 0.35, 0.3]} castShadow>
            <boxGeometry args={[1.1, 0.7, 0.8]} />
            <meshStandardMaterial color="#d8d3c8" roughness={0.8} />
          </mesh>
        </group>
      )}

      {s.kind === "project" && art && (
        <group rotation={[0, face, 0]}>
          <mesh position={[0, 1.7, 0]} castShadow>
            <boxGeometry args={[1.5, 3.4, 0.3]} />
            <meshStandardMaterial color="#10121a" roughness={0.25} metalness={0.6} />
          </mesh>
          <mesh position={[0, 1.7, 0.16]}>
            <planeGeometry args={[1.3, 3.1]} />
            <meshBasicMaterial map={art} toneMapped={false} />
          </mesh>
        </group>
      )}

      {s.kind === "trip" && photo && (
        <group rotation={[0, face, 0]}>
          {[-1.35, 1.35].map((x) => (
            <mesh key={x} position={[x, 1.3, 0]} castShadow>
              <boxGeometry args={[0.12, 2.6, 0.12]} />
              <meshStandardMaterial color="#d4c9b4" roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[0, 2.0, -0.04]} castShadow>
            <boxGeometry args={[2.85, 2.0, 0.08]} />
            <meshStandardMaterial color="#2a2a30" roughness={0.6} />
          </mesh>
          <mesh position={[0, 2.0, 0.01]}>
            <planeGeometry args={[2.6, 1.8]} />
            <meshBasicMaterial map={photo} toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* The name floats above it, until its card is open on screen */}
      <sprite
        visible={!active}
        position={[0, s.kind === "job" ? 5.6 : s.kind === "radio" ? 3.4 : 4.4, 0]}
        scale={[3.9, 1.14, 1]}
      >
        <spriteMaterial map={label} transparent depthWrite={false} fog={false} />
      </sprite>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Dust kicked up by boots and landings                               */
/* ------------------------------------------------------------------ */

const DUST = 160;
const dust = {
  pos: new Float32Array(DUST * 3),
  vel: new Float32Array(DUST * 3),
  age: new Float32Array(DUST).fill(99),
  life: new Float32Array(DUST).fill(1),
  next: 0,
};

/** A puff of `n` grains at a point on the ground; `power` scales how far they fly. */
function kickDust(x: number, y: number, z: number, n: number, power: number) {
  for (let k = 0; k < n; k++) {
    const i = dust.next;
    dust.next = (i + 1) % DUST;
    const a = Math.random() * Math.PI * 2;
    const sp = (0.3 + Math.random() * 0.9) * power;
    dust.pos.set([x + Math.cos(a) * 0.1, y + 0.04, z + Math.sin(a) * 0.1], i * 3);
    dust.vel.set([Math.cos(a) * sp, (0.4 + Math.random() * 0.8) * power, Math.sin(a) * sp], i * 3);
    dust.age[i] = 0;
    dust.life[i] = 0.9 + Math.random() * 0.9 * power;
  }
}

function Dust({ color, gravity }: { color: string; gravity: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(DUST * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(DUST * 4), 4));
    return g;
  }, []);
  const dot = useMemo(
    () =>
      canvasTexture(64, 64, (g) => {
        const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grd.addColorStop(0, "rgba(255,255,255,1)");
        grd.addColorStop(0.5, "rgba(255,255,255,0.4)");
        grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd;
        g.fillRect(0, 0, 64, 64);
      }),
    []
  );
  const tint = useMemo(() => new THREE.Color(color), [color]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const col = geometry.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < DUST; i++) {
      const age = dust.age[i];
      if (age > dust.life[i]) {
        col.setXYZW(i, 0, 0, 0, 0);
        continue;
      }
      dust.age[i] = age + dt;
      // Thin air: grains slow slowly and fall at the world's own gravity.
      const drag = 1 - Math.min(1, dt * 1.5);
      dust.vel[i * 3] *= drag;
      dust.vel[i * 3 + 2] *= drag;
      dust.vel[i * 3 + 1] -= gravity * dt * 0.6;
      for (let a = 0; a < 3; a++) dust.pos[i * 3 + a] += dust.vel[i * 3 + a] * dt;
      const ground = groundAt(dust.pos[i * 3], dust.pos[i * 3 + 2]);
      if (dust.pos[i * 3 + 1] < ground) {
        dust.pos[i * 3 + 1] = ground;
        dust.vel[i * 3 + 1] = 0;
      }
      pos.setXYZ(i, dust.pos[i * 3], dust.pos[i * 3 + 1], dust.pos[i * 3 + 2]);
      const k = age / dust.life[i];
      col.setXYZW(i, tint.r, tint.g, tint.b, Math.min(1, age * 8) * (1 - k) * 0.55);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial size={0.35} map={dot} vertexColors transparent depthWrite={false} />
    </points>
  );
}

/** A chevron on the ground pointing to the nearest station you haven't opened. */
function Guide({ stations }: { stations: Station[] }) {
  const mesh = useRef<THREE.Mesh>(null);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.55);
    s.lineTo(0.42, -0.25);
    s.lineTo(0, -0.05);
    s.lineTo(-0.42, -0.25);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const { visited } = useSpace.getState();
    let best: Station | null = null;
    let bestD = Infinity;
    for (const s of stations) {
      if (visited.includes(s.id)) continue;
      const d = Math.hypot(s.x - astro.pos.x, s.z - astro.pos.z);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    m.visible = !!best && bestD > 7 && astro.t > astro.intro;
    if (!best) return;
    const a = Math.atan2(best.x - astro.pos.x, best.z - astro.pos.z);
    const r = 1.5 + Math.sin(state.clock.elapsedTime * 4) * 0.12;
    const x = astro.pos.x + Math.sin(a) * r;
    const z = astro.pos.z + Math.cos(a) * r;
    m.position.set(x, groundAt(x, z) + 0.08, z);
    m.rotation.set(-Math.PI / 2, 0, a + Math.PI);
  });

  return (
    <mesh ref={mesh} geometry={shape}>
      <meshBasicMaterial color="#ffc061" transparent opacity={0.85} depthWrite={false} side={THREE.DoubleSide} fog={false} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  The whole on-foot mode                                             */
/* ------------------------------------------------------------------ */

export function Explorer({ level, visible }: { level: Level; visible: boolean }) {
  const camera = useThree((s) => s.camera);
  const stations = useMemo(() => stationsFor(level), [level]);
  const walls = useMemo(() => colliders(stations), [stations]);
  const visited = useSpace((s) => s.visited);
  const activity = useSpace((s) => s.activity);
  const phase = useSpace((s) => s.phase);
  const body = useRef<THREE.Group>(null);
  const cam = useMemo(
    () => ({
      yaw: 0,
      height: 0,
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      look2: new THREE.Vector3(),
      ready: false,
      tmp: new THREE.Vector3(),
      tmp2: new THREE.Vector3(),
    }),
    []
  );
  const gravity = level.site.gravity;
  const jumpSpeed = Math.min(3.6, Math.sqrt(2 * gravity * 2.6));

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __astro: astro, __cam: camera });
  }, [camera]);

  // Step out of the cockpit and hop down beside the ship.
  useEffect(
    () =>
      useSpace.subscribe((st, prev) => {
        if (st.phase !== "eva" || prev.phase === "eva") return;
        astro.pos.copy(SHIP).addScaledVector(SHIP_DIR, 2.6).addScaledVector(SIDE, 1.0);
        astro.pos.y += 1.4;
        // A small hop whatever the gravity: about a metre up, three metres out.
        astro.vy = Math.min(2.4, Math.sqrt(2 * gravity * 0.9));
        const fall = 1.4;
        const flight = (astro.vy + Math.sqrt(astro.vy * astro.vy + 2 * gravity * fall)) / gravity;
        astro.hop = 3.2 / flight;
        astro.intro = flight + 0.5;
        astro.heading = Math.atan2(SIDE.x, SIDE.z);
        astro.speed = 0;
        astro.vx = 0;
        astro.vz = 0;
        astro.accel = 0;
        astro.turn = 0;
        astro.boarding = -1;
        astro.grounded = false;
        astro.t = 0;
        cam.ready = false;
        cam.yaw = astro.heading + Math.PI;
        input.jump = false;
        input.act = false;
      }),
    [cam, gravity]
  );

  useFrame((state, rawDt) => {
    const game = useSpace.getState();
    if (game.phase !== "eva") return;
    const dt = Math.min(rawDt, 0.05);
    const p = astro.pos;
    astro.t += dt;
    const intro = astro.t < astro.intro;
    const boarding = astro.boarding >= 0;
    const busy = game.open !== null || boarding;

    /* ---------- Walking: momentum, not instant velocity ---------- */
    let wantX = 0;
    let wantZ = 0;
    if (intro) {
      // The hop: drift sideways off the wing.
      if (!astro.grounded) {
        wantX = SIDE.x * astro.hop;
        wantZ = SIDE.z * astro.hop;
      }
    } else if (!busy) {
      const fx = -Math.sin(cam.yaw);
      const fz = -Math.cos(cam.yaw);
      const rx = Math.cos(cam.yaw);
      const rz = -Math.sin(cam.yaw);
      const sp = input.boost ? RUN : WALK;
      wantX = (fx * input.y + rx * input.x) * sp;
      wantZ = (fz * input.y + rz * input.x) * sp;
      const len = Math.hypot(wantX, wantZ);
      if (len > sp) {
        wantX = (wantX / len) * sp;
        wantZ = (wantZ / len) * sp;
      }
    }
    const wantLen = Math.hypot(wantX, wantZ);
    if (intro) {
      astro.vx = wantX;
      astro.vz = wantZ;
    } else {
      // Speeding up takes a moment, stopping a little longer (less grip in low
      // gravity), and in the air you mostly keep the speed you jumped with.
      const grip = Math.min(1, 0.45 + gravity / 6);
      const speeding = wantLen > astro.speed;
      const rate = (astro.grounded ? (speeding ? 8 : 6.5) * grip : 1.2) * dt;
      const dvx = wantX - astro.vx;
      const dvz = wantZ - astro.vz;
      const dl = Math.hypot(dvx, dvz);
      if (dl <= rate) {
        astro.vx = wantX;
        astro.vz = wantZ;
      } else {
        astro.vx += (dvx / dl) * rate;
        astro.vz += (dvz / dl) * rate;
      }
    }
    const lastSpeed = astro.speed;
    astro.speed = Math.hypot(astro.vx, astro.vz);
    astro.accel += ((astro.speed - lastSpeed) / Math.max(dt, 1e-3) - astro.accel) * Math.min(1, dt * 6);
    p.x += astro.vx * dt;
    p.z += astro.vz * dt;

    // Turn to face where you're heading, at a human rate (no snapping round).
    if (!intro && (wantLen > 0.3 || astro.speed > 0.5)) {
      const want = wantLen > 0.3 ? Math.atan2(wantX, wantZ) : Math.atan2(astro.vx, astro.vz);
      let d = want - astro.heading;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      const maxTurn = (astro.grounded ? 5.5 : 1.5) * dt;
      const step = THREE.MathUtils.clamp(d * Math.min(1, dt * 7), -maxTurn, maxTurn);
      astro.heading += step;
      astro.turn += (step / Math.max(dt, 1e-3) - astro.turn) * Math.min(1, dt * 8);
    } else astro.turn *= 1 - Math.min(1, dt * 6);

    // Bump into things, sliding along them instead of stopping dead.
    for (const [cx, cz, r] of walls) {
      const dx = p.x - cx;
      const dz = p.z - cz;
      const d = Math.hypot(dx, dz);
      const min = r + 0.45;
      if (d < min && d > 1e-4) {
        const nx = dx / d;
        const nz = dz / d;
        p.x = cx + nx * min;
        p.z = cz + nz * min;
        const vn = astro.vx * nx + astro.vz * nz;
        if (vn < 0) {
          astro.vx -= vn * nx;
          astro.vz -= vn * nz;
        }
      }
    }
    const fromPad = Math.hypot(p.x, p.z);
    if (fromPad > BOUNDS) {
      p.x *= BOUNDS / fromPad;
      p.z *= BOUNDS / fromPad;
    }

    // Low gravity jumps
    const ground = groundAt(p.x, p.z);
    if (input.jump) {
      input.jump = false;
      if (astro.grounded && !busy && !intro) {
        astro.vy = jumpSpeed;
        astro.grounded = false;
        playSound("whoosh");
      }
    }
    astro.vy -= gravity * dt;
    p.y += astro.vy * dt;
    if (p.y <= ground) {
      if (!astro.grounded && astro.vy < -1.5) {
        playSound("hit");
        kickDust(p.x, ground, p.z, 14, 1.6);
      }
      p.y = ground;
      astro.vy = 0;
      astro.grounded = true;
    } else if (p.y > ground + 0.05) astro.grounded = false;

    // Climbing aboard: one low-gravity bound from beside the wing up into the
    // cockpit, then hand over to the take-off.
    if (boarding) {
      astro.boarding += dt;
      const k = Math.min(1, astro.boarding / BOARD_TIME);
      const e = k * k * (3 - 2 * k);
      p.lerpVectors(astro.boardFrom, COCKPIT, e);
      p.y += Math.sin(k * Math.PI) * 1.6;
      astro.vx = astro.vz = astro.vy = 0;
      astro.speed = 0;
      astro.grounded = false;
      const face = Math.atan2(COCKPIT.x - astro.boardFrom.x, COCKPIT.z - astro.boardFrom.z);
      let d = face - astro.heading;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      astro.heading += d * Math.min(1, dt * 8);
      if (k >= 1) {
        astro.boarding = -1;
        game.takeoff();
      }
    }

    // The stride follows the ground covered: one step per half cycle, longer
    // and floatier strides in low gravity, a puff of dust at each footfall.
    if (astro.grounded) {
      const strideLen = (0.7 + astro.speed * 0.13) * (gravity < 2 ? 1.3 : 1);
      astro.walk += ((astro.speed * dt) / strideLen) * Math.PI;
      const steps = Math.floor(astro.walk / Math.PI);
      if (steps !== astro.steps) {
        astro.steps = steps;
        if (astro.speed > 1) {
          const side = steps % 2 === 0 ? 1 : -1;
          const fx = Math.cos(astro.heading) * 0.13 * side;
          const fz = -Math.sin(astro.heading) * 0.13 * side;
          kickDust(p.x + fx, ground, p.z + fz, astro.speed > WALK ? 6 : 4, 0.6);
        }
      }
    }

    shadowFocus.copy(p);
    if (body.current) {
      body.current.position.copy(p);
      body.current.rotation.y = astro.heading;
    }

    /* ---------- Stations: open on arrival, close on leaving ---------- */
    let near: Station | null = null;
    let nearD = REACH;
    for (const s of stations) {
      const d = Math.hypot(s.x - p.x, s.z - p.z);
      if (d < nearD) {
        nearD = d;
        near = s;
      }
    }
    const nearId = intro ? null : (near?.id ?? null);
    if (nearId !== game.near) game.setNear(nearId);
    // Beside the ship: offer to climb back in.
    const byShip = !intro && !boarding && Math.hypot(p.x - SHIP.x, p.z - SHIP.z) < BOARD_REACH;
    if (byShip !== game.nearShip) game.setNearShip(byShip);
    // Walk away and the card goes (a little further out than it opens, so it doesn't flicker).
    if (game.activity) {
      const open = stations.find((s) => s.id === game.activity);
      if (!open || Math.hypot(open.x - p.x, open.z - p.z) > REACH + 2) game.openActivity(null);
    }
    if (game.dismissed && game.dismissed !== nearId) game.setDismissed(null);
    const reopen = input.act;
    input.act = false;
    if (input.board) {
      input.board = false;
      if (byShip && !game.open) {
        astro.boarding = 0;
        astro.boardFrom.copy(p);
        game.openActivity(null);
        playSound("send");
      }
    }
    if (reopen && byShip && !nearId && !game.open && !boarding) {
      astro.boarding = 0;
      astro.boardFrom.copy(p);
      playSound("send");
    }
    if (nearId && nearId !== game.activity && !game.open && (nearId !== game.dismissed || reopen)) {
      playSound("send");
      game.openActivity(nearId);
      if (reopen) game.setDismissed(null);
    }

    /* ---------- Camera: over the shoulder, swinging round behind you ---------- */
    const camera = state.camera as THREE.PerspectiveCamera;
    const aspect = camera.aspect;
    const far = aspect < 1 ? THREE.MathUtils.lerp(1.6, 1, aspect) : 1;
    if (intro) {
      // Watch the hop from in front of the wing.
      cam.tmp.copy(SHIP).addScaledVector(SIDE, 9 * far).addScaledVector(SHIP_DIR, 6 * far);
      cam.tmp.y = groundAt(cam.tmp.x, cam.tmp.z) + 2.4;
      cam.yaw = Math.atan2(cam.tmp.x - p.x, cam.tmp.z - p.z);
    } else {
      // Swing round behind you while you walk forward, gently, faster the faster you go.
      if (!busy && input.y > 0.2 && astro.speed > 1) {
        let d = astro.heading + Math.PI - cam.yaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        cam.yaw += d * Math.min(1, dt * 0.5 * Math.min(2.4, astro.speed / 2));
      }
      // Follow height smoothly, so jumps and bumps don't jerk the view.
      cam.height += (p.y - cam.height) * Math.min(1, dt * (astro.grounded ? 3 : 1.2));
      const dist = (7 + Math.min(1.5, astro.speed * 0.2)) * far;
      cam.tmp.set(p.x + Math.sin(cam.yaw) * dist, cam.height + 3 * far, p.z + Math.cos(cam.yaw) * dist);
      cam.tmp.y = Math.max(cam.tmp.y, groundAt(cam.tmp.x, cam.tmp.z) + 1);
    }
    // Look a little ahead of where you're going; with a card open on a wide
    // screen, frame the astronaut to the left of it.
    const look = cam.look2.set(p.x + astro.vx * 0.2, (intro ? p.y : cam.height) + 1.35, p.z + astro.vz * 0.2);
    if (game.activity && aspect > 1.1) look.add(cam.tmp2.set(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)).multiplyScalar(2.6));
    if (!cam.ready) {
      cam.pos.copy(cam.tmp);
      cam.look.copy(look);
      cam.height = p.y;
      camera.fov = 55;
      camera.updateProjectionMatrix();
      cam.ready = true;
    }
    cam.pos.lerp(cam.tmp, 1 - Math.exp(-dt * (intro ? 2 : 3.5)));
    cam.look.lerp(look, 1 - Math.exp(-dt * 6));
    camera.position.copy(cam.pos);
    camera.lookAt(cam.look);
  });

  return (
    <group visible={visible}>
      {stations.map((s) => (
        <StationModel key={s.id} s={s} done={visited.includes(s.id)} active={activity === s.id} />
      ))}
      <group visible={phase === "eva"}>
        <Suspense fallback={null}>
          <Astronaut body={body} gravity={gravity} />
        </Suspense>
        <Guide stations={stations} />
        <Dust color={level.site.dust} gravity={gravity} />
      </group>
    </group>
  );
}
