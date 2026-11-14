// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { fbm, hash } from "./noise";
import { useLevel } from "./store";
import { rocks, rocksPerVariant, ROCK_VARIANTS } from "./world";

export function makeRockGeometry(seed: number) {
  const g = mergeVertices(new THREE.IcosahedronGeometry(1, 4));
  const pos = g.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  const base = new THREE.Color("#7f766c");
  const dark = new THREE.Color("#3e3833");
  const c = new THREE.Color();
  // A random overall stretch so rocks are not all round.
  const stretch = new THREE.Vector3(1 + (hash(seed, 1, 2, 3) - 0.5) * 0.6, 0.75 + hash(seed, 4, 5, 6) * 0.3, 1);

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const big = fbm(v.x * 1.3 + 7, v.y * 1.3, v.z * 1.3, seed);
    const fine = fbm(v.x * 4.5, v.y * 4.5 + 3, v.z * 4.5, seed + 11);
    // A few soft craters
    let crater = 0;
    for (let k = 0; k < 3; k++) {
      const cx = hash(seed, k, 1, 9) * 2 - 1, cy = hash(seed, k, 2, 9) * 2 - 1, cz = hash(seed, k, 3, 9) * 2 - 1;
      const dir = new THREE.Vector3(cx, cy, cz).normalize();
      const d = v.distanceTo(dir);
      crater += Math.max(0, 0.35 - d) * 0.6;
    }
    const r = 0.78 + big * 0.42 + fine * 0.12 - crater;
    v.multiplyScalar(r).multiply(stretch);
    pos.setXYZ(i, v.x, v.y, v.z);

    c.copy(dark).lerp(base, THREE.MathUtils.clamp(fine * 1.2 + big * 0.3 - crater * 2, 0, 1));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

export function Asteroids() {
  const tint = useLevel().rocks.tint;
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const geometries = useMemo(
    () => Array.from({ length: ROCK_VARIANTS }, (_, i) => makeRockGeometry(i * 7 + 3)),
    []
  );
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0.04 }),
    []
  );
  // Rock in the inner system, ice further out.
  useEffect(() => {
    material.color.set(tint);
  }, [material, tint]);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (const r of rocks) {
      r.x = r.x0 + Math.sin(t * r.dw + r.dp) * r.dx;
      r.y = r.y0 + Math.cos(t * r.dw * 0.8 + r.dp) * r.dy;
      q.setFromAxisAngle(r.axis, t * r.spin + r.dp);
      p.set(r.x, r.y, r.z);
      s.setScalar(r.alive ? r.r : 0);
      m.compose(p, q, s);
      meshes.current[r.variant]?.setMatrixAt(r.slot, m);
    }
    for (const mesh of meshes.current) if (mesh) mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {geometries.map((g, i) => (
        <instancedMesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          args={[g, material, rocksPerVariant[i]]}
          frustumCulled={false}
        />
      ))}
    </>
  );
}
