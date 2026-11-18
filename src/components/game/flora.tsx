// SPIKE: throwaway prototype of the island game. Not production code.
"use client";
/*
 * Extra trees, pines, bushes, flowers and grass on every island. Each kind of
 * plant on each island is one instanced mesh, and one shared wind uniform
 * sways every canopy in the vertex shader, so hundreds of plants cost only a
 * few draw calls.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { heightAt, islands } from "./world";
import { Palm } from "./scenery";
import { scatter, type Island, type Spot } from "./placement";

/** Shared wind clock for every swaying material. */
const wind = { value: 0 };

/** Make a material bend in the wind: more at the top, phase by position. */
function swaying(material: THREE.MeshStandardMaterial, strength: number, from = 0) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = wind;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uWind;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec2 root = instanceMatrix[3].xz;
        #else
          vec2 root = vec2(0.0);
        #endif
        float bend = max(position.y - ${from.toFixed(2)}, 0.0);
        bend *= bend;
        float gust = sin(uWind * 1.4 + root.x * 0.21 + root.y * 0.17)
                   + 0.45 * sin(uWind * 3.1 + root.x * 0.9);
        transformed.x += gust * ${strength.toFixed(4)} * bend;
        transformed.z += cos(uWind * 1.1 + root.y * 0.23) * ${(strength * 0.6).toFixed(4)} * bend;`,
      );
  };
  material.customProgramCacheKey = () => `sway-${strength}-${from}`;
  return material;
}

/* ------------------------------------------------------------------ */
/*  Geometry for each plant (built once, shared by every island)      */
/* ------------------------------------------------------------------ */

/** Merge parts into one geometry (mixing indexed and non-indexed parts). */
function merge(parts: THREE.BufferGeometry[]) {
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g));
  const out = mergeGeometries(flat);
  parts.forEach((g) => g.dispose());
  flat.forEach((g) => g.dispose());
  if (!out) throw new Error("Could not merge plant geometry");
  return out;
}

function blob(r: number, x: number, y: number, z: number, sy = 1) {
  const g = new THREE.IcosahedronGeometry(r, 1);
  g.scale(1, sy, 1);
  g.translate(x, y, z);
  return g;
}
function cone(r: number, h: number, y: number) {
  const g = new THREE.ConeGeometry(r, h, 9, 1);
  g.translate(0, y, 0);
  return g;
}
function trunk(r0: number, r1: number, h: number) {
  const g = new THREE.CylinderGeometry(r0, r1, h, 7);
  g.translate(0, h / 2, 0);
  return g;
}

function usePlantGeometry() {
  const geo = useMemo(
    () => ({
      broadTrunk: trunk(0.16, 0.32, 3.4),
      broadCrown: merge([
        blob(1.9, 0, 4.3, 0, 0.82),
        blob(1.4, 1.1, 3.7, 0.5, 0.8),
        blob(1.3, -1, 3.8, -0.4, 0.8),
        blob(1.2, 0.2, 5.3, -0.3, 0.85),
      ]),
      pineTrunk: trunk(0.12, 0.26, 2.4),
      pineCrown: merge([cone(1.9, 2.9, 2.6), cone(1.5, 2.5, 3.9), cone(1.05, 2.2, 5.1), cone(0.6, 1.6, 6.2)]),
      bush: merge([blob(0.85, 0, 0.45, 0, 0.7), blob(0.6, 0.6, 0.35, 0.2, 0.7), blob(0.55, -0.55, 0.35, -0.15, 0.7)]),
      flower: (() => {
        const g = new THREE.IcosahedronGeometry(0.16, 0);
        g.translate(0, 0.42, 0);
        const stem = new THREE.CylinderGeometry(0.018, 0.018, 0.42, 3);
        stem.translate(0, 0.21, 0);
        // Stems share the bloom colour, darkened by the instance colour.
        return merge([g, stem]);
      })(),
      grass: (() => {
        const g = new THREE.ConeGeometry(0.1, 0.7, 3);
        g.translate(0, 0.35, 0);
        return g;
      })(),
      log: (() => {
        const g = new THREE.CylinderGeometry(0.32, 0.36, 4, 8);
        g.rotateZ(Math.PI / 2);
        g.translate(0, 0.3, 0);
        return g;
      })(),
    }),
    [],
  );
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);
  return geo;
}

function usePlantMaterials() {
  const mats = useMemo(
    () => ({
      bark: new THREE.MeshStandardMaterial({ color: "#6d5b45", roughness: 1 }),
      crown: swaying(new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), 0.012, 2.5),
      pine: swaying(new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), 0.01, 1.5),
      bush: swaying(new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), 0.05),
      flower: swaying(new THREE.MeshStandardMaterial({ roughness: 0.7 }), 0.35),
      grass: swaying(new THREE.MeshStandardMaterial({ roughness: 1 }), 0.4),
      log: new THREE.MeshStandardMaterial({ color: "#7a6448", roughness: 1 }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  return mats;
}

/* ------------------------------------------------------------------ */
/*  One instanced mesh per plant kind per island                       */
/* ------------------------------------------------------------------ */

function Instances({
  spots,
  geometry,
  material,
  size,
  palette,
  shadow = true,
  sink = 0.1,
}: {
  spots: Spot[];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  size: [number, number];
  palette?: string[];
  shadow?: boolean;
  sink?: number;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    spots.forEach((p, i) => {
      const s = size[0] + (size[1] - size[0]) * p.s;
      dummy.position.set(p.x, (heightAt(p.x, p.z) ?? 0) - sink, p.z);
      dummy.rotation.set(0, p.a, 0);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      if (palette) {
        color.set(palette[Math.floor(p.r * palette.length) % palette.length]);
        // A little brightness noise so neighbours never match exactly.
        color.offsetHSL(0, 0, (p.s - 0.5) * 0.06);
        m.setColorAt(i, color);
      }
    });
    m.count = spots.length;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [spots, size, palette, sink]);
  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, Math.max(spots.length, 1)]}
      castShadow={shadow}
      receiveShadow
      frustumCulled
    />
  );
}

/** Where the existing hand-placed trees stand, so new ones keep their distance. */
function existingTrees(island: Island) {
  if (island.id === "skills")
    return Array.from({ length: 16 }, (_, i) => ({
      x: island.cx + Math.sin(i * 2.4) * 58,
      z: island.cz + Math.cos(i * 2.4) * 40,
    }));
  if (island.id === "travel")
    return Array.from({ length: 24 }, (_, i) => ({
      x: island.cx + Math.sin(i * 2.4) * (45 + (i % 3) * 5),
      z: island.cz + 20 + Math.cos(i * 2.4) * (42 + (i % 3) * 5),
    }));
  return [];
}

type Plan = {
  broad: number;
  pine: number;
  bush: number;
  flower: number;
  grass: number;
  logs: number;
  palms: number;
  leaf: string[];
  needle: string[];
  shrub: string[];
  bloom: string[];
  blade: string;
};

const PLANS: Record<string, Plan> = {
  skills: {
    broad: 10, pine: 0, bush: 46, flower: 140, grass: 0, logs: 0, palms: 12,
    leaf: ["#4f7a3c", "#5f8a42", "#6b9447"],
    needle: [],
    shrub: ["#3f6e3a", "#4d8040", "#5b8d3f", "#3c6234"],
    bloom: ["#e2554a", "#f08aa1", "#f4c84b", "#ffffff", "#e8743b"],
    blade: "#7f8959",
  },
  experience: {
    broad: 18, pine: 6, bush: 28, flower: 40, grass: 260, logs: 0, palms: 0,
    leaf: ["#5c7a45", "#6d8650", "#7a8a4e"],
    needle: ["#3e5a3e", "#46634a"],
    shrub: ["#566f45", "#647a4a", "#4c6340"],
    bloom: ["#f2d35b", "#ffffff", "#d9a3d6"],
    blade: "#8a9061",
  },
  travel: {
    broad: 22, pine: 46, bush: 46, flower: 100, grass: 0, logs: 6, palms: 0,
    leaf: ["#4e6b37", "#5d7a3c", "#6e7f3b", "#8a8a3f"],
    needle: ["#2f4d34", "#365a3b", "#3e6243", "#2b4430"],
    shrub: ["#3d5a35", "#4b693b", "#57733d"],
    bloom: ["#f4c84b", "#ffffff", "#c98bd8", "#e2554a"],
    blade: "#738150",
  },
  contact: {
    broad: 0, pine: 22, bush: 22, flower: 34, grass: 150, logs: 0, palms: 0,
    leaf: [],
    needle: ["#34503d", "#3c5944", "#2f4637"],
    shrub: ["#56664e", "#61705a", "#4b5a46"],
    bloom: ["#ffffff", "#f2d35b", "#b9c4e6"],
    blade: "#8c8f72",
  },
};

function IslandFlora({
  island,
  geo,
  mats,
}: {
  island: Island;
  geo: ReturnType<typeof usePlantGeometry>;
  mats: ReturnType<typeof usePlantMaterials>;
}) {
  const plan = PLANS[island.id];
  const spots = useMemo(() => {
    const seed = island.id.length * 97 + Math.round(island.cx);
    const avoid = existingTrees(island);
    const broad = scatter(island, plan.broad, seed + 1, { edge: 10, gap: 6, avoid });
    const pine = scatter(island, plan.pine, seed + 2, { edge: 9, gap: 4.5, avoid: [...avoid, ...broad] });
    const trees = [...avoid, ...broad, ...pine];
    const palms = scatter(island, plan.palms, seed + 3, { edge: 4, inner: 16, gap: 8, avoid: trees });
    const bush = scatter(island, plan.bush, seed + 4, { edge: 5, gap: 2.2, avoid: [...trees, ...palms] });
    // Flowers grow in little patches around a few centres.
    const centres = scatter(island, Math.ceil(plan.flower / 14), seed + 5, { edge: 8, gap: 8 });
    const flower = centres.flatMap((c, k) =>
      scatter(island, 14, seed + 50 + k, { edge: 6, gap: 0.6, near: { x: c.x, z: c.z, r: 3.2 } }),
    );
    const grass = scatter(island, plan.grass, seed + 6, { edge: 6, gap: 0.9 });
    const logs = scatter(island, plan.logs, seed + 7, { edge: 10, gap: 8, avoid: trees });
    return { broad, pine, palms, bush, flower, grass, logs };
  }, [island, plan]);

  return (
    <group>
      {spots.broad.length > 0 && (
        <>
          <Instances spots={spots.broad} geometry={geo.broadTrunk} material={mats.bark} size={[0.85, 1.35]} />
          <Instances spots={spots.broad} geometry={geo.broadCrown} material={mats.crown} size={[0.85, 1.35]} palette={plan.leaf} />
        </>
      )}
      {spots.pine.length > 0 && (
        <>
          <Instances spots={spots.pine} geometry={geo.pineTrunk} material={mats.bark} size={[0.9, 1.6]} />
          <Instances spots={spots.pine} geometry={geo.pineCrown} material={mats.pine} size={[0.9, 1.6]} palette={plan.needle} />
        </>
      )}
      <Instances spots={spots.bush} geometry={geo.bush} material={mats.bush} size={[0.7, 1.5]} palette={plan.shrub} />
      <Instances spots={spots.flower} geometry={geo.flower} material={mats.flower} size={[0.7, 1.2]} palette={plan.bloom} shadow={false} sink={0} />
      {spots.grass.length > 0 && (
        <Instances spots={spots.grass} geometry={geo.grass} material={mats.grass} size={[0.6, 1.3]} palette={[plan.blade]} shadow={false} sink={0} />
      )}
      {spots.logs.length > 0 && <Instances spots={spots.logs} geometry={geo.log} material={mats.log} size={[0.8, 1.2]} sink={0.05} />}
      {spots.palms.map((p, i) => (
        <Palm key={i} position={[p.x, heightAt(p.x, p.z) ?? 3, p.z]} s={1 + p.s * 0.45} />
      ))}
    </group>
  );
}

export function Flora() {
  const geo = usePlantGeometry();
  const mats = usePlantMaterials();
  useFrame(({ clock }) => {
    wind.value = clock.elapsedTime;
  });
  return (
    <>
      {islands.map((island) => (
        <IslandFlora key={island.id} island={island} geo={geo} mats={mats} />
      ))}
    </>
  );
}
