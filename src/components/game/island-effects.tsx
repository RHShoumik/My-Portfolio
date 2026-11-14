"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "./store";
import { playerPos, waveHeight } from "./world";

/** A fixed pool of surface ripples: no allocations or React updates per frame. */
export function IslandEffects() {
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const pool = useRef(Array.from({ length: 36 }, () => ({ x: 0, z: 0, born: -100, speed: 0 })));
  const cursor = useRef(0);
  const last = useRef(0);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const water = motion.mode === "boat" || motion.mode === "swim";
    if (water && Math.abs(motion.speed) > .4 && t - last.current > .09) {
      const item = pool.current[cursor.current];
      item.x = playerPos.x; item.z = playerPos.z; item.born = t;
      item.speed = motion.mode === "boat" ? 1.8 : .65;
      cursor.current = (cursor.current + 1) % pool.current.length;
      last.current = t;
    }
    pool.current.forEach((item, i) => {
      const mesh = rings.current[i];
      if (!mesh) return;
      const age = t - item.born;
      mesh.visible = age < 2.8;
      if (!mesh.visible) return;
      mesh.position.set(item.x, waveHeight(item.x,item.z,t)+.06,item.z);
      mesh.scale.setScalar(.25 + age * item.speed);
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1-age/2.8)*.32;
    });
  });
  return <group>{Array.from({length:36},(_,i) => <mesh key={i} ref={el => {rings.current[i]=el;}} rotation-x={-Math.PI/2} visible={false}>
    <ringGeometry args={[.8,1,40]} />
    <meshBasicMaterial color="#d6eee8" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
  </mesh>)}</group>;
}
