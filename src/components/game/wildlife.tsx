// SPIKE: throwaway prototype of the island game. Not production code.
"use client";
/*
 * Life on and around the islands:
 *  - seagulls circling every island and the dockyard, and a V of birds
 *    crossing the whole archipelago (all birds share three instanced meshes);
 *  - deer, rabbits, sheep, chickens and a dog that wander, graze and run
 *    from the player (the dog comes to say hello instead);
 *  - dolphins leaping along the sailing routes.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { blockedByProp, heightAt, islandDistance, islands, playerPos, waveHeight } from "./world";
import { isClear, rng } from "./placement";

/* ------------------------------------------------------------------ */
/*  Birds                                                             */
/* ------------------------------------------------------------------ */

type Flight = {
  cx: number;
  cz: number;
  radius: number;
  height: number;
  speed: number;
  phase: number;
  /** Offset in the leader's frame for formation birds. */
  slot?: [number, number];
  size: number;
  dark?: boolean;
};

function buildFlights(): Flight[] {
  const random = rng(7);
  const out: Flight[] = [];
  const circle = (cx: number, cz: number, n: number, rMin: number, rMax: number, hMin: number) => {
    for (let i = 0; i < n; i++)
      out.push({
        cx: cx + (random() - 0.5) * 20,
        cz: cz + (random() - 0.5) * 20,
        radius: rMin + random() * (rMax - rMin),
        height: hMin + random() * 16,
        speed: (0.12 + random() * 0.1) * (random() < 0.5 ? -1 : 1),
        phase: random() * Math.PI * 2,
        size: 1.5 + random() * 0.5,
      });
  };
  for (const island of islands) circle(island.cx, island.cz, 9, 25, 75, 16);
  circle(0, 4, 7, 18, 40, 12); // over the dockyard
  // A V of larger, darker birds crossing the whole archipelago.
  for (let i = 0; i < 11; i++) {
    const rank = Math.ceil(i / 2);
    const side = i === 0 ? 0 : i % 2 ? 1 : -1;
    out.push({
      cx: 0, cz: 520, radius: 430, height: 52, speed: 0.022, phase: 0,
      slot: [side * rank * 3.2, -rank * 3.6], size: 2.4, dark: true,
    });
  }
  return out;
}

function makeWing() {
  // A swept, tapered wing reaching out along +X from the shoulder.
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.18);
  shape.lineTo(0.55, 0.22);
  shape.lineTo(1.25, -0.05);
  shape.lineTo(0.95, -0.2);
  shape.lineTo(0, -0.16);
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(Math.PI / 2); // lie flat; the leading edge faces forward (+Z)
  return g;
}

export function Birds() {
  const flights = useMemo(() => buildFlights(), []);
  const body = useRef<THREE.InstancedMesh>(null);
  const left = useRef<THREE.InstancedMesh>(null);
  const right = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const b = new THREE.SphereGeometry(0.16, 8, 6);
    b.scale(1, 0.85, 3.1);
    const head = new THREE.SphereGeometry(0.11, 8, 6);
    head.translate(0, 0.06, 0.45);
    return { body: b, head, wing: makeWing() };
  }, []);
  const mats = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({ roughness: 0.8 }),
      wing: new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide }),
    }),
    [],
  );
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
      Object.values(mats).forEach((m) => m.dispose());
    },
    [geo, mats],
  );

  useLayoutEffect(() => {
    const c = new THREE.Color();
    flights.forEach((f, i) => {
      c.set(f.dark ? "#4b4640" : "#f4f2ec");
      body.current?.setColorAt(i, c);
      c.set(f.dark ? "#3d3934" : "#dfe2e2");
      left.current?.setColorAt(i, c);
      right.current?.setColorAt(i, c);
    });
    for (const m of [body.current, left.current, right.current]) if (m?.instanceColor) m.instanceColor.needsUpdate = true;
  }, [flights]);

  const tmp = useMemo(
    () => ({
      m: new THREE.Matrix4(),
      w: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
      e: new THREE.Euler(0, 0, 0, "YXZ"),
      p: new THREE.Vector3(),
      s: new THREE.Vector3(),
      leftHinge: new THREE.Matrix4().makeTranslation(0.1, 0.04, 0.05),
      rightHinge: new THREE.Matrix4().makeTranslation(-0.1, 0.04, 0.05),
      mirror: new THREE.Matrix4().makeScale(-1, 1, 1),
    }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const { m, w, q, e, p, s } = tmp;
    flights.forEach((f, i) => {
      const a = f.phase + t * f.speed;
      const dir = Math.sign(f.speed);
      // Heading along the tangent of the circle.
      const yaw = Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir);
      let x = f.cx + Math.cos(a) * f.radius;
      let z = f.cz + Math.sin(a) * f.radius;
      if (f.slot) {
        const [sx, sz] = f.slot;
        x += Math.cos(yaw) * sx + Math.sin(yaw) * sz;
        z += -Math.sin(yaw) * sx + Math.cos(yaw) * sz;
      }
      const y = f.height + Math.sin(t * 0.5 + f.phase * 3) * 2.5;
      // Flap in bursts, glide in between (formations flap steadily).
      const gliding = !f.slot && Math.sin(t * 0.45 + f.phase * 5) > 0.15;
      const flap = gliding ? 0.18 + Math.sin(t * 1.3 + f.phase) * 0.05 : Math.sin(t * (f.slot ? 6 : 8.5) + f.phase * 7) * 0.62;

      e.set(Math.sin(t * 0.5 + f.phase) * 0.06, yaw, -dir * 0.28);
      q.setFromEuler(e);
      m.compose(p.set(x, y, z), q, s.setScalar(f.size));
      body.current?.setMatrixAt(i, m);
      // Wings hinge at the shoulders; the right one is a mirror image.
      w.makeRotationZ(flap).premultiply(tmp.leftHinge).premultiply(m);
      left.current?.setMatrixAt(i, w);
      w.makeRotationZ(flap).premultiply(tmp.mirror).premultiply(tmp.rightHinge).premultiply(m);
      right.current?.setMatrixAt(i, w);
    });
    for (const mesh of [body.current, left.current, right.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  const n = flights.length;
  return (
    <group>
      <instancedMesh ref={body} args={[geo.body, mats.body, n]} frustumCulled={false} castShadow />
      <instancedMesh ref={left} args={[geo.wing, mats.wing, n]} frustumCulled={false} castShadow />
      <instancedMesh ref={right} args={[geo.wing, mats.wing, n]} frustumCulled={false} castShadow />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Land animals                                                      */
/* ------------------------------------------------------------------ */

type Kind = "deer" | "rabbit" | "sheep" | "chicken" | "dog";

const KIND: Record<
  Kind,
  { walk: number; run: number; flee: number; legs: number; stride: number; grazes: boolean }
> = {
  deer: { walk: 1.3, run: 7.5, flee: 14, legs: 4, stride: 1.4, grazes: true },
  rabbit: { walk: 0.9, run: 5.5, flee: 7, legs: 0, stride: 0.9, grazes: true },
  sheep: { walk: 0.7, run: 2.6, flee: 6, legs: 4, stride: 0.9, grazes: true },
  chicken: { walk: 0.8, run: 3.2, flee: 4.5, legs: 2, stride: 0.5, grazes: true },
  dog: { walk: 1.6, run: 5.5, flee: 0, legs: 4, stride: 1, grazes: false },
};

/** Shared materials so every animal of a kind reuses them. */
const mat = (() => {
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  return (color: string, roughness = 0.9) => {
    const key = color + roughness;
    if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({ color, roughness }));
    return cache.get(key)!;
  };
})();

function Part({
  geo,
  color,
  position,
  rotation,
  scale,
}: {
  geo: "box" | "ball" | "cone" | "cyl";
  color: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} material={mat(color)} castShadow>
      {geo === "box" && <boxGeometry args={[1, 1, 1]} />}
      {geo === "ball" && <icosahedronGeometry args={[0.5, 1]} />}
      {geo === "cone" && <coneGeometry args={[0.5, 1, 6]} />}
      {geo === "cyl" && <cylinderGeometry args={[0.5, 0.5, 1, 6]} />}
    </mesh>
  );
}

/** The animal's body, built from a few primitives. Faces +Z. */
function Body({
  kind,
  legs,
  head,
  tail,
  variant,
}: {
  kind: Kind;
  legs: React.RefObject<(THREE.Group | null)[]>;
  head: React.RefObject<THREE.Group | null>;
  tail: React.RefObject<THREE.Group | null>;
  variant: number;
}) {
  const leg = (i: number, x: number, z: number, h: number, w: number, color: string) => (
    <group key={i} position={[x, h, z]} ref={(el) => { legs.current[i] = el; }}>
      <Part geo="box" color={color} position={[0, -h / 2, 0]} scale={[w, h, w]} />
    </group>
  );
  if (kind === "deer") {
    const coat = variant > 0.5 ? "#9a6a42" : "#8a5d3a";
    return (
      <group>
        <Part geo="ball" color={coat} position={[0, 1.15, 0]} scale={[0.62, 0.62, 1.35]} />
        <Part geo="ball" color="#e9dcc6" position={[0, 1.02, 0]} scale={[0.45, 0.4, 1.05]} />
        {[[-0.18, 0.45], [0.18, 0.45], [-0.18, -0.45], [0.18, -0.45]].map(([x, z], i) => leg(i, x, z, 1, 0.09, "#6b4a30"))}
        <group ref={head} position={[0, 1.4, 0.55]}>
          <Part geo="box" color={coat} position={[0, 0.3, 0.08]} rotation={[0.45, 0, 0]} scale={[0.2, 0.62, 0.22]} />
          <Part geo="ball" color={coat} position={[0, 0.62, 0.26]} scale={[0.26, 0.26, 0.42]} />
          <Part geo="ball" color="#2b211b" position={[0, 0.58, 0.48]} scale={[0.08, 0.07, 0.07]} />
          {[-1, 1].map((s) => (
            <Part key={s} geo="cone" color={coat} position={[s * 0.15, 0.82, 0.18]} rotation={[0, 0, -s * 0.9]} scale={[0.09, 0.2, 0.05]} />
          ))}
          {variant > 0.45 &&
            [-1, 1].map((s) => (
              <group key={`a${s}`} position={[s * 0.08, 0.82, 0.2]} rotation={[0, 0, -s * 0.35]}>
                <Part geo="cyl" color="#d9c7a6" position={[0, 0.25, 0]} scale={[0.035, 0.5, 0.035]} />
                <Part geo="cyl" color="#d9c7a6" position={[s * 0.1, 0.32, 0.08]} rotation={[0.6, 0, -s * 0.6]} scale={[0.03, 0.26, 0.03]} />
                <Part geo="cyl" color="#d9c7a6" position={[s * 0.02, 0.5, -0.06]} rotation={[-0.5, 0, -s * 0.3]} scale={[0.03, 0.22, 0.03]} />
              </group>
            ))}
        </group>
        <group ref={tail} position={[0, 1.3, -0.62]}>
          <Part geo="ball" color="#f2ebe0" position={[0, 0, -0.06]} scale={[0.14, 0.2, 0.12]} />
        </group>
      </group>
    );
  }
  if (kind === "sheep") {
    return (
      <group>
        {[[0, 0], [0.18, 0.25], [-0.18, 0.2], [0.15, -0.3], [-0.16, -0.28], [0, 0.05]].map(([x, z], i) => (
          <Part key={i} geo="ball" color={i % 2 ? "#f1ece0" : "#e8e1d2"} position={[x, 0.78 + (i === 5 ? 0.18 : 0), z]} scale={[0.62, 0.55, 0.62]} />
        ))}
        {[[-0.17, 0.3], [0.17, 0.3], [-0.17, -0.3], [0.17, -0.3]].map(([x, z], i) => leg(i, x, z, 0.55, 0.08, "#2e2a27"))}
        <group ref={head} position={[0, 0.9, 0.55]}>
          <Part geo="ball" color="#2e2a27" position={[0, 0, 0.14]} scale={[0.26, 0.3, 0.4]} />
          <Part geo="ball" color="#ece6d8" position={[0, 0.14, 0.05]} scale={[0.3, 0.2, 0.26]} />
          {[-1, 1].map((s) => (
            <Part key={s} geo="ball" color="#2e2a27" position={[s * 0.18, 0.04, 0.06]} scale={[0.18, 0.07, 0.1]} />
          ))}
        </group>
        <group ref={tail} position={[0, 0.85, -0.6]}>
          <Part geo="ball" color="#ece6d8" scale={[0.14, 0.14, 0.14]} />
        </group>
      </group>
    );
  }
  if (kind === "rabbit") {
    const fur = variant > 0.6 ? "#cbb79a" : variant > 0.3 ? "#9c8a74" : "#ece6dc";
    return (
      <group>
        <Part geo="ball" color={fur} position={[0, 0.24, -0.04]} scale={[0.3, 0.3, 0.42]} />
        <group ref={head} position={[0, 0.36, 0.16]}>
          <Part geo="ball" color={fur} position={[0, 0.04, 0.06]} scale={[0.2, 0.2, 0.22]} />
          {[-1, 1].map((s) => (
            <Part key={s} geo="ball" color={fur} position={[s * 0.05, 0.24, 0.02]} rotation={[-0.2, 0, -s * 0.15]} scale={[0.06, 0.3, 0.04]} />
          ))}
          <Part geo="ball" color="#3a2a26" position={[0, 0.03, 0.17]} scale={[0.04, 0.035, 0.03]} />
        </group>
        <group ref={tail} position={[0, 0.26, -0.26]}>
          <Part geo="ball" color="#f7f3ec" scale={[0.12, 0.12, 0.12]} />
        </group>
      </group>
    );
  }
  if (kind === "chicken") {
    const feather = variant > 0.5 ? "#f2eee6" : "#b86b3a";
    return (
      <group>
        <Part geo="ball" color={feather} position={[0, 0.36, 0]} scale={[0.3, 0.3, 0.42]} />
        {[[-0.07, 0], [0.07, 0]].map(([x, z], i) => leg(i, x, z, 0.22, 0.03, "#e0a43a"))}
        <group ref={head} position={[0, 0.5, 0.15]}>
          <Part geo="ball" color={feather} position={[0, 0.08, 0.04]} scale={[0.16, 0.18, 0.16]} />
          <Part geo="cone" color="#e9a53a" position={[0, 0.07, 0.14]} rotation={[Math.PI / 2, 0, 0]} scale={[0.05, 0.08, 0.05]} />
          <Part geo="box" color="#d23a2e" position={[0, 0.2, 0.04]} scale={[0.03, 0.08, 0.12]} />
        </group>
        <group ref={tail} position={[0, 0.48, -0.2]}>
          <Part geo="ball" color={variant > 0.5 ? "#e8e2d6" : "#2f3b33"} position={[0, 0.06, -0.04]} rotation={[-0.6, 0, 0]} scale={[0.08, 0.26, 0.14]} />
        </group>
      </group>
    );
  }
  // dog
  const coat = variant > 0.5 ? "#b9854f" : "#3a3330";
  return (
    <group>
      <Part geo="ball" color={coat} position={[0, 0.55, 0]} scale={[0.36, 0.36, 0.85]} />
      {[[-0.12, 0.28], [0.12, 0.28], [-0.12, -0.28], [0.12, -0.28]].map(([x, z], i) => leg(i, x, z, 0.42, 0.08, coat))}
      <group ref={head} position={[0, 0.72, 0.4]}>
        <Part geo="ball" color={coat} position={[0, 0.06, 0.06]} scale={[0.26, 0.26, 0.28]} />
        <Part geo="ball" color={coat} position={[0, 0.0, 0.22]} scale={[0.14, 0.13, 0.22]} />
        <Part geo="ball" color="#1d1817" position={[0, 0.03, 0.33]} scale={[0.06, 0.05, 0.05]} />
        {[-1, 1].map((s) => (
          <Part key={s} geo="ball" color="#2a2321" position={[s * 0.12, 0.12, 0.0]} rotation={[0, 0, s * 0.5]} scale={[0.07, 0.18, 0.09]} />
        ))}
      </group>
      <group ref={tail} position={[0, 0.66, -0.42]}>
        <Part geo="cyl" color={coat} position={[0, 0.12, -0.08]} rotation={[-0.7, 0, 0]} scale={[0.05, 0.32, 0.05]} />
      </group>
    </group>
  );
}

type Herd = { kind: Kind; island: string; x: number; z: number; r: number; n: number };

const HERDS: Herd[] = [
  { kind: "deer", island: "travel", x: 395, z: 205, r: 18, n: 3 },
  { kind: "deer", island: "travel", x: 320, z: 140, r: 14, n: 2 },
  { kind: "rabbit", island: "travel", x: 380, z: 150, r: 22, n: 4 },
  { kind: "rabbit", island: "skills", x: -30, z: 480, r: 18, n: 3 },
  { kind: "chicken", island: "skills", x: 30, z: 505, r: 9, n: 6 },
  { kind: "sheep", island: "contact", x: -18, z: 1000, r: 14, n: 7 },
  { kind: "sheep", island: "experience", x: -395, z: 150, r: 12, n: 4 },
  { kind: "dog", island: "experience", x: -340, z: 150, r: 14, n: 1 },
  { kind: "dog", island: "travel", x: 345, z: 160, r: 12, n: 1 },
];

function landOk(islandId: string, x: number, z: number) {
  const island = islands.find((i) => i.id === islandId)!;
  return islandDistance(island, x, z) < -3 && isClear(island, x, z) && !blockedByProp(x, z, 1);
}

function Animal({ herd, index }: { herd: Herd; index: number }) {
  const cfg = KIND[herd.kind];
  const random = useMemo(() => rng(herd.x * 13 + herd.z * 7 + index * 101), [herd, index]);
  const variant = useMemo(() => random(), [random]);
  const root = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const s = useRef({
    x: herd.x,
    z: herd.z,
    heading: random() * Math.PI * 2,
    tx: herd.x,
    tz: herd.z,
    speed: 0,
    wait: random() * 4,
    graze: 0,
    phase: random() * 10,
    hop: 0,
  });

  // Handy while testing: where every animal is (development only).
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __animals?: Record<string, unknown> };
    w.__animals ??= {};
    w.__animals[`${herd.kind}-${herd.island}-${herd.x}-${index}`] = s.current;
  }, [herd, index]);

  // Start somewhere valid inside the herd's range.
  useMemo(() => {
    for (let k = 0; k < 40; k++) {
      const x = herd.x + (random() * 2 - 1) * herd.r;
      const z = herd.z + (random() * 2 - 1) * herd.r;
      if (landOk(herd.island, x, z)) {
        s.current.x = s.current.tx = x;
        s.current.z = s.current.tz = z;
        break;
      }
    }
  }, [herd, random]);

  const pick = () => {
    const a = s.current;
    for (let k = 0; k < 12; k++) {
      const x = herd.x + (random() * 2 - 1) * herd.r;
      const z = herd.z + (random() * 2 - 1) * herd.r;
      if (landOk(herd.island, x, z)) {
        a.tx = x;
        a.tz = z;
        return;
      }
    }
  };

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const a = s.current;
    const g = root.current;
    if (!g) return;
    // Skip the work for animals far from the player.
    const far = Math.hypot(playerPos.x - a.x, playerPos.z - a.z);
    g.visible = far < 260;
    if (!g.visible) return;

    let want = 0;
    if (cfg.flee && far < cfg.flee) {
      // Run directly away from the player, if the ground allows it.
      const dx = a.x - playerPos.x,
        dz = a.z - playerPos.z,
        len = Math.hypot(dx, dz) || 1;
      const tx = a.x + (dx / len) * 6,
        tz = a.z + (dz / len) * 6;
      if (landOk(herd.island, tx, tz)) {
        a.tx = tx;
        a.tz = tz;
      }
      a.wait = 0;
      a.graze = 0;
      want = cfg.run;
    } else if (herd.kind === "dog" && far < 24 && far > 3.2) {
      // Come and greet the player, then sit nearby.
      if (landOk(herd.island, playerPos.x, playerPos.z)) {
        a.tx = playerPos.x;
        a.tz = playerPos.z;
        a.wait = 0;
        want = far > 9 ? cfg.run : cfg.walk * 1.4;
      }
    } else if (a.wait > 0) {
      a.wait -= dt;
      if (a.wait <= 0) pick();
    } else {
      const d = Math.hypot(a.tx - a.x, a.tz - a.z);
      if (d < 0.6) {
        a.wait = 2 + random() * 6;
        a.graze = cfg.grazes && random() < 0.7 ? a.wait : 0;
      } else want = cfg.walk;
    }

    // Ease speed and turn toward the target.
    a.speed += (want - a.speed) * (1 - Math.exp(-dt * 4));
    const target = Math.atan2(a.tx - a.x, a.tz - a.z);
    if (a.speed > 0.05) {
      const diff = Math.atan2(Math.sin(target - a.heading), Math.cos(target - a.heading));
      a.heading += diff * (1 - Math.exp(-dt * 5));
    }
    const nx = a.x + Math.sin(a.heading) * a.speed * dt;
    const nz = a.z + Math.cos(a.heading) * a.speed * dt;
    if (landOk(herd.island, nx, nz)) {
      a.x = nx;
      a.z = nz;
    } else {
      a.wait = 0.5;
      pick();
    }
    a.graze = Math.max(0, a.graze - dt);

    // Gait: legs swing with the distance covered; rabbits hop instead.
    a.phase += (a.speed * dt) / cfg.stride * Math.PI * 2;
    const swing = Math.min(a.speed / cfg.walk, 1.6) * 0.5;
    legs.current.forEach((leg, i) => {
      if (leg) leg.rotation.x = Math.sin(a.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * swing;
    });
    let lift = 0;
    if (herd.kind === "rabbit") lift = a.speed > 0.1 ? Math.abs(Math.sin(a.phase * 0.5)) * Math.min(a.speed, 2) * 0.18 : 0;
    else lift = Math.abs(Math.sin(a.phase)) * Math.min(a.speed, 3) * 0.02;
    const t = clock.elapsedTime;
    if (head.current) {
      const grazing = a.graze > 0 && a.speed < 0.1;
      const peck = herd.kind === "chicken" && grazing ? Math.max(0, Math.sin(t * 9 + a.phase)) * 0.9 : 0;
      const down = grazing ? (herd.kind === "deer" ? 1.05 : herd.kind === "sheep" ? 0.6 : 0.35) : 0;
      head.current.rotation.x += (down + peck - head.current.rotation.x) * (1 - Math.exp(-dt * 6));
      head.current.rotation.y = grazing ? 0 : Math.sin(t * 0.7 + a.phase) * 0.25;
    }
    if (tail.current) {
      const wag = herd.kind === "dog" ? (far < 10 ? 14 : 5) : 3;
      tail.current.rotation.y = Math.sin(t * wag + a.phase) * (herd.kind === "dog" ? 0.6 : 0.2);
    }
    g.position.set(a.x, (heightAt(a.x, a.z) ?? 0.6) + lift, a.z);
    g.rotation.y = a.heading;
  });

  return (
    <group ref={root}>
      <Body kind={herd.kind} legs={legs} head={head} tail={tail} variant={variant} />
    </group>
  );
}

export function Animals() {
  return (
    <>
      {HERDS.flatMap((herd, h) =>
        Array.from({ length: herd.n }, (_, i) => <Animal key={`${h}-${i}`} herd={herd} index={i} />),
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Dolphins                                                          */
/* ------------------------------------------------------------------ */

const PODS = [
  { cx: 70, cz: 250, r: 70, speed: 0.05 },
  { cx: 170, cz: 95, r: 55, speed: -0.06 },
  { cx: -170, cz: 90, r: 60, speed: 0.055 },
  { cx: -50, cz: 760, r: 80, speed: -0.045 },
];
const LEAP = 1.5;
const CYCLE = 5.5;

function Dolphin({ pod, k }: { pod: (typeof PODS)[number]; k: number }) {
  const g = useRef<THREE.Group>(null);
  const splash = useRef<THREE.Mesh>(null);
  const offset = useMemo(() => ({ side: (k - 1) * 3.2, lag: k * 0.45, delay: k * 0.35 }), [k]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (!g.current) return;
    const a = pod.speed * t + offset.lag * 0.06;
    const dir = Math.sign(pod.speed);
    const yaw = Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir);
    const r = pod.r + offset.side;
    const x = pod.cx + Math.cos(a) * r,
      z = pod.cz + Math.sin(a) * r;
    const u = ((t + offset.delay) % CYCLE) / LEAP; // 0..1 while airborne
    const sea = waveHeight(x, z, t);
    const visible = Math.hypot(playerPos.x - x, playerPos.z - z) < 300;
    g.current.visible = visible && u < 1.15;
    if (u < 1) {
      g.current.position.set(x, sea - 0.5 + Math.sin(u * Math.PI) * 2.6, z);
      g.current.rotation.set(-Math.cos(u * Math.PI) * 0.9, yaw, 0);
    } else {
      g.current.position.set(x, sea - 1.6, z);
    }
    if (splash.current) {
      const age = u < 1 ? u : u - 1; // entry splash after the leap
      const show = visible && (u < 0.25 || (u > 1 && u < 1.6));
      splash.current.visible = show;
      if (show) {
        splash.current.position.set(x, sea + 0.08, z);
        splash.current.scale.setScalar(0.6 + age * 3.2);
        (splash.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.55 - age * 0.9);
      }
    }
  });
  return (
    <>
      <group ref={g} rotation-order="YXZ">
        {/* Body faces +Z like everything else. */}
        <mesh scale={[0.42, 0.42, 1.25]} castShadow material={mat("#5f6f7a", 0.45)}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        <mesh position={[0, -0.18, 0.15]} scale={[0.34, 0.26, 1.0]} material={mat("#d9dfe2", 0.5)}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
        <mesh position={[0, -0.04, 1.3]} rotation={[Math.PI / 2, 0, 0]} scale={[0.1, 0.42, 0.1]} material={mat("#5f6f7a", 0.45)}>
          <coneGeometry args={[1, 1, 8]} />
        </mesh>
        <mesh position={[0, 0.48, -0.1]} rotation={[-0.5, 0, 0]} scale={[0.05, 0.45, 0.3]} material={mat("#566570", 0.45)}>
          <coneGeometry args={[1, 1, 4]} />
        </mesh>
        <mesh position={[0, 0, -1.35]} scale={[0.75, 0.05, 0.28]} material={mat("#566570", 0.45)}>
          <sphereGeometry args={[1, 10, 6]} />
        </mesh>
      </group>
      <mesh ref={splash} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.55, 1, 28]} />
        <meshBasicMaterial color="#f2fbfa" transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}

export function Dolphins() {
  return (
    <>
      {PODS.flatMap((pod, p) => [0, 1, 2].map((k) => <Dolphin key={`${p}-${k}`} pod={pod} k={k} />))}
    </>
  );
}
