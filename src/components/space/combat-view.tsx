// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { makeRockGeometry } from "./asteroids";
import {
  blastQueue,
  bolts,
  CONVERGE,
  enemyBolts,
  fighters,
  mines,
  lock,
  missiles,
  playerMissiles,
  satellites,
  type Bolt,
  type BlastKind,
  type Missile,
} from "./combat";
import { rocketLive, useSpace } from "./store";

const Z_AXIS = new THREE.Vector3(0, 0, 1);
const FIGHTER_SCALE = 1.6;
const MISSILE_SCALE = 1.5;
const NEG_Z = new THREE.Vector3(0, 0, -1);

/** Merge several geometries into one (they must share attributes, so drop indices first). */
function merge(parts: THREE.BufferGeometry[]) {
  const flat = parts.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    n.deleteAttribute("uv");
    return n;
  });
  return mergeGeometries(flat, false)!;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.45)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ */
/*  Laser bolts                                                        */
/* ------------------------------------------------------------------ */
function BoltField({ list, core, glow }: { list: Bolt[]; core: string; glow: string }) {
  const coreMesh = useRef<THREE.InstancedMesh>(null);
  const glowMesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 8, 1);
    g.rotateX(Math.PI / 2); // along Z
    return g;
  }, []);
  const tmp = useMemo(
    () => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), d: new THREE.Vector3() }),
    []
  );

  useFrame(() => {
    const a = coreMesh.current;
    const b = glowMesh.current;
    if (!a || !b) return;
    list.forEach((bolt, i) => {
      if (bolt.alive) {
        tmp.d.copy(bolt.vel).normalize();
        tmp.q.setFromUnitVectors(Z_AXIS, tmp.d);
        tmp.m.compose(bolt.pos, tmp.q, tmp.s.set(0.07, 0.07, 4.2));
        a.setMatrixAt(i, tmp.m);
        tmp.m.compose(bolt.pos, tmp.q, tmp.s.set(0.26, 0.26, 5));
        b.setMatrixAt(i, tmp.m);
      } else {
        tmp.m.makeScale(0, 0, 0);
        a.setMatrixAt(i, tmp.m);
        b.setMatrixAt(i, tmp.m);
      }
    });
    a.instanceMatrix.needsUpdate = true;
    b.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={coreMesh} args={[geometry, undefined, list.length]} frustumCulled={false}>
        <meshBasicMaterial color={core} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={glowMesh} args={[geometry, undefined, list.length]} frustumCulled={false}>
        <meshBasicMaterial
          color={glow}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>
    </>
  );
}

export function Bolts() {
  return (
    <>
      <BoltField list={bolts} core="#e8fdff" glow="#38d4ff" />
      <BoltField list={enemyBolts} core="#ffe2dc" glow="#ff2a1a" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Enemy fighters: dark, angular, red-lit. Built nose towards +Z.     */
/* ------------------------------------------------------------------ */
function makeFighter() {
  const hull: THREE.BufferGeometry[] = [];
  const dark: THREE.BufferGeometry[] = [];
  const glow: THREE.BufferGeometry[] = [];

  const body = new THREE.CylinderGeometry(0.12, 0.75, 5.2, 6);
  body.rotateX(-Math.PI / 2); // nose to -Z (turned around at the end)
  body.scale(1, 0.6, 1);
  hull.push(body);

  const shape = new THREE.Shape();
  shape.moveTo(0.3, -0.5);
  shape.lineTo(3.1, 1.5);
  shape.lineTo(3.0, 2.2);
  shape.lineTo(0.3, 2.0);
  shape.closePath();
  const wing = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false });
  wing.rotateX(Math.PI / 2);
  const right = wing.clone();
  right.rotateZ(-0.14);
  const left = wing.clone();
  left.scale(-1, 1, 1);
  left.rotateZ(0.14);
  hull.push(right, left);

  for (const side of [-1, 1]) {
    const fin = new THREE.BoxGeometry(0.06, 0.9, 1.2);
    fin.rotateZ(side * 0.45);
    fin.translate(side * 0.5, 0.45, 1.9);
    dark.push(fin);
    const tip = new THREE.BoxGeometry(0.12, 0.08, 0.5);
    tip.translate(side * 3.0, side > 0 ? -0.42 : -0.42, 1.9);
    glow.push(tip);
  }

  const engine = new THREE.CylinderGeometry(0.4, 0.45, 0.9, 12);
  engine.rotateX(Math.PI / 2);
  engine.translate(0, 0, 2.7);
  dark.push(engine);

  const exhaust = new THREE.CircleGeometry(0.34, 16);
  exhaust.translate(0, 0, 3.16);
  glow.push(exhaust);

  const canopy = new THREE.SphereGeometry(0.42, 16, 10);
  canopy.scale(0.8, 0.6, 1.7);
  canopy.translate(0, 0.32, -0.9);
  glow.push(canopy);

  const parts = { hull: merge(hull), dark: merge(dark), glow: merge(glow) };

  for (const g of Object.values(parts)) g.rotateY(Math.PI); // nose now faces +Z, towards the player
  return parts;
}

export function Fighters() {
  const geo = useMemo(() => makeFighter(), []);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const lights = useRef<THREE.Points>(null);
  const dot = useMemo(() => glowTexture(), []);
  const lightGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(fighters.length * 3), 3));
    return g;
  }, []);
  const tmp = useMemo(
    () => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), s: new THREE.Vector3() }),
    []
  );

  useFrame(() => {
    const pos = lightGeo.attributes.position as THREE.BufferAttribute;
    fighters.forEach((f, i) => {
      if (f.active) {
        tmp.q.setFromEuler(tmp.e.set(0.12, 0, f.roll));
        tmp.m.compose(f.pos, tmp.q, tmp.s.setScalar(FIGHTER_SCALE));
        pos.setXYZ(i, f.pos.x, f.pos.y + 0.5, f.pos.z + 2);
      } else {
        tmp.m.makeScale(0, 0, 0);
        pos.setXYZ(i, 0, -9999, 0);
      }
      for (const mesh of refs.current) mesh?.setMatrixAt(i, tmp.m);
    });
    for (const mesh of refs.current) if (mesh) mesh.instanceMatrix.needsUpdate = true;
    pos.needsUpdate = true;
  });

  const set = (i: number) => (el: THREE.InstancedMesh | null) => {
    refs.current[i] = el;
  };

  return (
    <>
      <instancedMesh ref={set(0)} args={[geo.hull, undefined, fighters.length]} frustumCulled={false}>
        <meshStandardMaterial color="#7d8491" metalness={0.4} roughness={0.42} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={set(1)} args={[geo.dark, undefined, fighters.length]} frustumCulled={false}>
        <meshStandardMaterial color="#2c3038" metalness={0.35} roughness={0.55} />
      </instancedMesh>
      <instancedMesh ref={set(2)} args={[geo.glow, undefined, fighters.length]} frustumCulled={false}>
        <meshBasicMaterial color="#ff3b2f" toneMapped={false} />
      </instancedMesh>
      {/* A red glow around each cockpit so they read as hostile from far away */}
      <points ref={lights} geometry={lightGeo} frustumCulled={false}>
        <pointsMaterial
          size={7}
          map={dot}
          color="#ff3020"
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Missiles with exhaust and a smoke trail. Built nose towards -Z.    */
/* ------------------------------------------------------------------ */
function makeMissile() {
  const white: THREE.BufferGeometry[] = [];
  const red: THREE.BufferGeometry[] = [];
  const body = new THREE.CylinderGeometry(0.22, 0.22, 2.4, 12);
  body.rotateX(-Math.PI / 2);
  white.push(body);
  const nose = new THREE.ConeGeometry(0.22, 0.75, 12);
  nose.rotateX(-Math.PI / 2);
  nose.translate(0, 0, -1.57);
  white.push(nose);
  const band = new THREE.CylinderGeometry(0.226, 0.226, 0.26, 12);
  band.rotateX(-Math.PI / 2);
  band.translate(0, 0, -0.7);
  red.push(band);
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.BoxGeometry(0.03, 0.55, 0.5);
    fin.translate(0, 0.38, 1.0);
    fin.rotateZ((i * Math.PI) / 2 + Math.PI / 4);
    red.push(fin);
  }
  return { white: merge(white), red: merge(red) };
}

const SMOKE = 520;

interface MissileLook {
  list: Missile[];
  body: string;
  band: string;
  flame: string;
  scale: number;
}

function MissileField({ list, body, band, flame, scale }: MissileLook) {
  const geo = useMemo(() => makeMissile(), []);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const dot = useMemo(() => glowTexture(), []);
  const flames = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(list.length * 3), 3));
    return g;
  }, [list]);
  const smoke = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SMOKE * 3).fill(-9999), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(SMOKE * 4), 4));
    return { geometry: g, age: new Float32Array(SMOKE).fill(99), next: 0 };
  }, []);
  const tmp = useMemo(
    () => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1), d: new THREE.Vector3() }),
    []
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const fpos = flames.attributes.position as THREE.BufferAttribute;
    const spos = smoke.geometry.attributes.position as THREE.BufferAttribute;
    const scol = smoke.geometry.attributes.color as THREE.BufferAttribute;
    list.forEach((m, i) => {
      if (m.active) {
        tmp.d.copy(m.vel).normalize();
        tmp.q.setFromUnitVectors(NEG_Z, tmp.d);
        tmp.m.compose(m.pos, tmp.q, tmp.s.setScalar(scale));
        const tx = m.pos.x - tmp.d.x * 1.5 * scale;
        const ty = m.pos.y - tmp.d.y * 1.5 * scale;
        const tz = m.pos.z - tmp.d.z * 1.5 * scale;
        fpos.setXYZ(i, tx, ty, tz);
        // Two puffs of smoke a frame
        for (let k = 0; k < 2; k++) {
          const j = smoke.next;
          smoke.next = (j + 1) % SMOKE;
          spos.setXYZ(j, tx + (Math.random() - 0.5) * 0.3, ty + (Math.random() - 0.5) * 0.3, tz - tmp.d.z * k * 0.6);
          smoke.age[j] = 0;
        }
      } else {
        tmp.m.makeScale(0, 0, 0);
        fpos.setXYZ(i, 0, -9999, 0);
      }
      for (const mesh of refs.current) mesh?.setMatrixAt(i, tmp.m);
    });
    for (const mesh of refs.current) if (mesh) mesh.instanceMatrix.needsUpdate = true;
    fpos.needsUpdate = true;

    for (let j = 0; j < SMOKE; j++) {
      const a = (smoke.age[j] += dt);
      const alpha = a < 1.8 ? 0.28 * (1 - a / 1.8) : 0;
      const shade = 0.55 + Math.min(a, 1.8) * 0.12;
      scol.setXYZW(j, shade, shade, shade * 1.02, alpha);
      if (a < 1.8) spos.setY(j, spos.getY(j) + dt * 0.4);
    }
    spos.needsUpdate = true;
    scol.needsUpdate = true;
  });

  const set = (i: number) => (el: THREE.InstancedMesh | null) => {
    refs.current[i] = el;
  };

  return (
    <>
      <instancedMesh ref={set(0)} args={[geo.white, undefined, list.length]} frustumCulled={false}>
        <meshStandardMaterial color={body} metalness={0.3} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={set(1)} args={[geo.red, undefined, list.length]} frustumCulled={false}>
        <meshStandardMaterial color={band} metalness={0.3} roughness={0.45} />
      </instancedMesh>
      <points geometry={flames} frustumCulled={false}>
        <pointsMaterial size={4} map={dot} color={flame} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <points geometry={smoke.geometry} frustumCulled={false}>
        <pointsMaterial size={2.4} map={dot} vertexColors transparent depthWrite={false} />
      </points>
    </>
  );
}

/** Enemy missiles (white and red) and yours (white and blue, cyan exhaust). */
export function Missiles() {
  return (
    <>
      <MissileField list={missiles} body="#e9ebee" band="#c8231d" flame="#ffb366" scale={MISSILE_SCALE} />
      <MissileField list={playerMissiles} body="#f4f6f8" band="#2f5bff" flame="#9fe8ff" scale={1.1} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Old satellites and mines                                           */
/* ------------------------------------------------------------------ */
function makeSatellite() {
  const foil: THREE.BufferGeometry[] = [new THREE.BoxGeometry(1.4, 1.4, 2.0)];
  const panel: THREE.BufferGeometry[] = [];
  const white: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const p = new THREE.BoxGeometry(4.2, 0.05, 1.5);
    p.translate(side * 3.0, 0, 0);
    panel.push(p);
    const arm = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6);
    arm.rotateZ(Math.PI / 2);
    arm.translate(side * 0.95, 0, 0);
    white.push(arm);
  }
  const dish = new THREE.SphereGeometry(0.8, 16, 8, 0, Math.PI * 2, 0, 0.9);
  dish.rotateX(Math.PI / 2);
  dish.translate(0, 0, 1.6);
  white.push(dish);
  const mast = new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6);
  mast.translate(0, 1.4, -0.5);
  white.push(mast);
  return { foil: merge(foil), panel: merge(panel), white: merge(white) };
}

function makeMine() {
  const parts: THREE.BufferGeometry[] = [new THREE.SphereGeometry(1, 20, 14)];
  const ico = new THREE.IcosahedronGeometry(1, 0);
  const p = ico.attributes.position as THREE.BufferAttribute;
  const seen = new Set<string>();
  const up = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  const q = new THREE.Quaternion();
  for (let i = 0; i < p.count; i++) {
    dir.fromBufferAttribute(p, i).normalize();
    const key = dir.toArray().map((v) => v.toFixed(2)).join();
    if (seen.has(key)) continue;
    seen.add(key);
    const spike = new THREE.ConeGeometry(0.15, 0.7, 8);
    q.setFromUnitVectors(up, dir);
    spike.applyQuaternion(q);
    spike.translate(dir.x * 1.2, dir.y * 1.2, dir.z * 1.2);
    parts.push(spike);
  }
  return merge(parts);
}

export function Props() {
  const sat = useMemo(() => makeSatellite(), []);
  const mine = useMemo(() => makeMine(), []);
  const satRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const mineMesh = useRef<THREE.InstancedMesh>(null);
  const dot = useMemo(() => glowTexture(), []);
  const lights = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(mines.length * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(mines.length * 3), 3));
    return g;
  }, []);
  const tmp = useMemo(
    () => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3() }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    satellites.forEach((s, i) => {
      if (s.alive) {
        tmp.q.setFromAxisAngle(s.axis, t * s.spin + s.phase);
        tmp.m.compose(s.pos, tmp.q, tmp.s.set(1, 1, 1));
      } else tmp.m.makeScale(0, 0, 0);
      for (const mesh of satRefs.current) mesh?.setMatrixAt(i, tmp.m);
    });
    for (const mesh of satRefs.current) if (mesh) mesh.instanceMatrix.needsUpdate = true;

    const lp = lights.attributes.position as THREE.BufferAttribute;
    const lc = lights.attributes.color as THREE.BufferAttribute;
    mines.forEach((m, i) => {
      if (m.alive) {
        tmp.q.setFromAxisAngle(m.axis, t * m.spin);
        tmp.m.compose(m.pos, tmp.q, tmp.s.set(m.r * 0.75, m.r * 0.75, m.r * 0.75));
        lp.setXYZ(i, m.pos.x, m.pos.y, m.pos.z);
        const on = (t * 1.6 + m.phase) % 1 < 0.35 ? 1 : 0.15;
        lc.setXYZ(i, on, on * 0.15, on * 0.1);
      } else {
        tmp.m.makeScale(0, 0, 0);
        lp.setXYZ(i, 0, -9999, 0);
      }
      mineMesh.current?.setMatrixAt(i, tmp.m);
    });
    if (mineMesh.current) mineMesh.current.instanceMatrix.needsUpdate = true;
    lp.needsUpdate = true;
    lc.needsUpdate = true;
  });

  const set = (i: number) => (el: THREE.InstancedMesh | null) => {
    satRefs.current[i] = el;
  };

  return (
    <>
      <instancedMesh ref={set(0)} args={[sat.foil, undefined, satellites.length]} frustumCulled={false}>
        <meshStandardMaterial color="#d4aa52" metalness={0.55} roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={set(1)} args={[sat.panel, undefined, satellites.length]} frustumCulled={false}>
        <meshStandardMaterial color="#1f3470" metalness={0.55} roughness={0.28} />
      </instancedMesh>
      <instancedMesh ref={set(2)} args={[sat.white, undefined, satellites.length]} frustumCulled={false}>
        <meshStandardMaterial color="#e3e5e8" metalness={0.2} roughness={0.5} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={mineMesh} args={[mine, undefined, mines.length]} frustumCulled={false}>
        <meshStandardMaterial color="#5b616b" metalness={0.4} roughness={0.45} />
      </instancedMesh>
      <points geometry={lights} frustumCulled={false}>
        <pointsMaterial size={4.5} map={dot} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Explosions of things you shot                                      */
/* ------------------------------------------------------------------ */
const POOL = 20;
const SPARKS = 1000;
const DUST = 500;
const CHUNKS = 140;

interface BlastSlot {
  active: boolean;
  age: number;
  life: number;
  size: number;
  kind: BlastKind;
  pos: THREE.Vector3;
}

/** A particle pool: position, velocity, age and life per particle, coloured from hot to cool. */
function makeParticles(n: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3).fill(-9999), 3));
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 4), 4));
  return {
    geometry: g,
    vel: new Float32Array(n * 3),
    age: new Float32Array(n).fill(99),
    life: new Float32Array(n).fill(1),
    hot: new Float32Array(n * 3),
    cold: new Float32Array(n * 3),
    next: 0,
    n,
  };
}
type Particles = ReturnType<typeof makeParticles>;

function emit(p: Particles, at: THREE.Vector3, count: number, speed: number, life: number, hot: THREE.Color, cold: THREE.Color) {
  const pos = p.geometry.attributes.position as THREE.BufferAttribute;
  const d = new THREE.Vector3();
  for (let k = 0; k < count; k++) {
    const i = p.next;
    p.next = (i + 1) % p.n;
    pos.setXYZ(i, at.x, at.y, at.z);
    d.randomDirection().multiplyScalar(speed * (0.3 + Math.random() * 0.7));
    p.vel.set([d.x, d.y, d.z], i * 3);
    p.age[i] = 0;
    p.life[i] = life * (0.6 + Math.random() * 0.6);
    p.hot.set([hot.r, hot.g, hot.b], i * 3);
    p.cold.set([cold.r, cold.g, cold.b], i * 3);
  }
}

function stepParticles(p: Particles, dt: number, drag: number, maxAlpha: number) {
  const pos = p.geometry.attributes.position as THREE.BufferAttribute;
  const col = p.geometry.attributes.color as THREE.BufferAttribute;
  const k = Math.exp(-dt * drag);
  for (let i = 0; i < p.n; i++) {
    const a = p.age[i];
    if (a > p.life[i]) {
      if (a < 90) {
        col.setW(i, 0);
        p.age[i] = 99;
      }
      continue;
    }
    p.age[i] = a + dt;
    p.vel[i * 3] *= k;
    p.vel[i * 3 + 1] *= k;
    p.vel[i * 3 + 2] *= k;
    pos.setXYZ(i, pos.getX(i) + p.vel[i * 3] * dt, pos.getY(i) + p.vel[i * 3 + 1] * dt, pos.getZ(i) + p.vel[i * 3 + 2] * dt);
    const f = a / p.life[i];
    col.setXYZW(
      i,
      p.hot[i * 3] + (p.cold[i * 3] - p.hot[i * 3]) * f,
      p.hot[i * 3 + 1] + (p.cold[i * 3 + 1] - p.hot[i * 3 + 1]) * f,
      p.hot[i * 3 + 2] + (p.cold[i * 3 + 2] - p.hot[i * 3 + 2]) * f,
      maxAlpha * (1 - f)
    );
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
}

const C = (hex: string) => new THREE.Color(hex);
const PALETTE = {
  hot: C("#fff4cf"),
  fire: C("#ff5a14"),
  ember: C("#3a0a00"),
  dustLight: C("#a59a8e"),
  dustDark: C("#4a443e"),
  cyan: C("#c9f6ff"),
};

export function Blasts() {
  const slots = useMemo<BlastSlot[]>(
    () =>
      Array.from({ length: POOL }, () => ({
        active: false,
        age: 0,
        life: 1,
        size: 1,
        kind: "fire" as BlastKind,
        pos: new THREE.Vector3(),
      })),
    []
  );
  const flashes = useRef<(THREE.Sprite | null)[]>([]);
  const balls = useRef<(THREE.Sprite | null)[]>([]);
  const dot = useMemo(() => glowTexture(), []);
  const sparks = useMemo(() => makeParticles(SPARKS), []);
  const dust = useMemo(() => makeParticles(DUST), []);
  const chunkGeo = useMemo(() => makeRockGeometry(77), []);
  const chunkMesh = useRef<THREE.InstancedMesh>(null);
  const chunks = useMemo(
    () =>
      Array.from({ length: CHUNKS }, () => ({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        axis: new THREE.Vector3(1, 0, 0),
        spin: 0,
        size: 0,
        age: 99,
      })),
    []
  );
  const next = useRef(0);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3() }), []);

  // Clear everything when a new run starts.
  useEffect(
    () =>
      useSpace.subscribe((s, prev) => {
        if (s.run === prev.run) return;
        for (const b of slots) b.active = false;
      }),
    [slots]
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);

    // Start new blasts
    while (blastQueue.length) {
      const req = blastQueue.shift()!;
      const slot = slots.find((s) => !s.active) ?? slots[0];
      slot.active = true;
      slot.age = 0;
      slot.kind = req.kind;
      slot.size = req.size;
      slot.pos.copy(req.pos);
      slot.life = req.kind === "hit" ? 0.25 : req.kind === "rock" ? 1.4 : 1.2;
      const s = req.size;
      if (req.kind === "hit") emit(sparks, req.pos, 10, 14, 0.3, PALETTE.cyan, PALETTE.fire);
      if (req.kind === "fire" || req.kind === "mine") {
        emit(sparks, req.pos, req.kind === "mine" ? 140 : 70, 10 + s * 4, 1.1, PALETTE.hot, PALETTE.ember);
        emit(dust, req.pos, 24, 3 + s, 2.2, PALETTE.dustDark, PALETTE.dustDark);
      }
      if (req.kind === "rock") {
        emit(dust, req.pos, Math.min(60, 14 + s * 6), 4 + s * 2, 2.2, PALETTE.dustLight, PALETTE.dustDark);
        emit(sparks, req.pos, 18, 8 + s * 2, 0.5, PALETTE.hot, PALETTE.fire);
        const n = Math.min(14, 4 + Math.round(s * 1.5));
        for (let k = 0; k < n; k++) {
          const c = chunks[next.current];
          next.current = (next.current + 1) % CHUNKS;
          c.pos.copy(req.pos);
          c.vel.randomDirection().multiplyScalar(4 + Math.random() * (6 + s * 2));
          c.axis.randomDirection();
          c.spin = 1 + Math.random() * 5;
          c.size = (0.15 + Math.random() * 0.3) * Math.min(s, 6) * 0.45;
          c.age = 0;
        }
      }
    }

    slots.forEach((b, i) => {
      const flash = flashes.current[i];
      const ball = balls.current[i];
      if (!flash || !ball) return;
      if (!b.active) {
        flash.visible = ball.visible = false;
        return;
      }
      b.age += dt;
      if (b.age > b.life) {
        b.active = false;
        return;
      }
      const k = b.age / b.life;
      flash.visible = ball.visible = true;
      flash.position.copy(b.pos);
      ball.position.copy(b.pos);
      const s = b.size;
      const fs = s * (1.2 + 2.2 * Math.min(1, b.age * 6));
      flash.scale.set(fs, fs, 1);
      flash.material.opacity = Math.max(0, 1 - b.age * (b.kind === "hit" ? 5 : 3));
      const bs = s * (0.8 + 1.4 * Math.sqrt(k));
      ball.scale.set(bs, bs, 1);
      ball.material.color.copy(b.kind === "rock" ? PALETTE.dustLight : PALETTE.fire);
      ball.material.opacity = (b.kind === "hit" ? 0 : b.kind === "rock" ? 0.35 : 0.85) * Math.pow(1 - k, 1.6);
    });

    stepParticles(sparks, dt, 1.2, 1);
    stepParticles(dust, dt, 0.8, 0.4);

    const mesh = chunkMesh.current;
    if (mesh) {
      chunks.forEach((c, i) => {
        if (c.age < 3) {
          c.age += dt;
          c.pos.addScaledVector(c.vel, dt);
          tmp.q.setFromAxisAngle(c.axis, c.age * c.spin);
          const fade = c.age > 2.4 ? 1 - (c.age - 2.4) / 0.6 : 1;
          tmp.m.compose(c.pos, tmp.q, tmp.s.setScalar(c.size * Math.max(0, fade)));
        } else tmp.m.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, tmp.m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {slots.map((_, i) => (
        <group key={i}>
          <sprite
            ref={(el) => {
              flashes.current[i] = el;
            }}
            visible={false}
          >
            <spriteMaterial map={dot} color="#fff3d6" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          <sprite
            ref={(el) => {
              balls.current[i] = el;
            }}
            visible={false}
          >
            <spriteMaterial map={dot} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        </group>
      ))}
      <points geometry={sparks.geometry} frustumCulled={false}>
        <pointsMaterial size={0.5} map={dot} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <points geometry={dust.geometry} frustumCulled={false}>
        <pointsMaterial size={3} map={dot} vertexColors transparent depthWrite={false} />
      </points>
      <instancedMesh ref={chunkMesh} args={[chunkGeo, undefined, CHUNKS]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.95} />
      </instancedMesh>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Aiming reticle where the two cannon streams cross                  */
/* ------------------------------------------------------------------ */
export function Reticle() {
  const sprite = useRef<THREE.Sprite>(null);
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    g.strokeStyle = "rgba(255,255,255,0.9)";
    g.lineWidth = 4;
    g.beginPath();
    g.arc(64, 64, 34, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      g.beginPath();
      g.moveTo(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44);
      g.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58);
      g.stroke();
    }
    g.fillStyle = "rgba(255,255,255,0.95)";
    g.beginPath();
    g.arc(64, 64, 4, 0, Math.PI * 2);
    g.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const want = useMemo(() => new THREE.Vector3(), []);
  const idle = useMemo(() => new THREE.Color("#a8f1ff"), []);
  const locked = useMemo(() => new THREE.Color("#ffb020"), []);

  // Sits ahead of the ship, and jumps onto whatever the guns have locked.
  useFrame((_, rawDt) => {
    const s = sprite.current;
    if (!s) return;
    const dt = Math.min(rawDt, 0.05);
    s.visible = useSpace.getState().phase === "flying";
    if (!s.visible) return;
    const p = rocketLive.pos;
    const target = lock.target;
    if (target) want.copy(lock.pos);
    else want.set(p.x, p.y, p.z - CONVERGE * 0.6);
    s.position.lerp(want, target ? 1 - Math.exp(-dt * 20) : 1);
    const size = target ? Math.max(4, lock.r * 2.6) : 5;
    s.scale.lerp(want.set(size, size, 1), 1 - Math.exp(-dt * 12));
    s.material.color.copy(target ? locked : idle);
    s.material.rotation += dt * (target ? 2.2 : 0);
  });

  return (
    <sprite ref={sprite} scale={[5, 5, 1]} renderOrder={10} visible={false}>
      <spriteMaterial map={texture} color="#a8f1ff" transparent opacity={0.8} depthTest={false} depthWrite={false} />
    </sprite>
  );
}
