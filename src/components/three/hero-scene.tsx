"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTheme } from "next-themes";
import * as THREE from "three";

const COLS = 72;
const ROWS = 44;
const SPACING = 0.32;

function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 0, 0.6);
  }, [camera]);
  return null;
}

function ParticleGrid() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const { resolvedTheme } = useTheme();

  const { positions, base, count } = useMemo(() => {
    const count = COLS * ROWS;
    const positions = new Float32Array(count * 3);
    const base = new Float32Array(count * 2);
    let i = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = (c - (COLS - 1) / 2) * SPACING;
        const z = (r - (ROWS - 1) / 2) * SPACING;
        positions[i * 3] = x;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = z;
        base[i * 2] = x;
        base[i * 2 + 1] = z;
        i++;
      }
    }
    return { positions, base, count };
  }, []);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.color.set(resolvedTheme === "light" ? "#241d14" : "#f4efe4");
  }, [resolvedTheme]);

  useFrame((state) => {
    const geom = pointsRef.current?.geometry;
    if (!geom) return;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    const halfW = (COLS * SPACING) / 2;
    const halfD = (ROWS * SPACING) / 2;
    const mouseX = THREE.MathUtils.clamp(state.pointer.x, -1, 1) * halfW * 0.9;
    const mouseZ = THREE.MathUtils.clamp(-state.pointer.y, -1, 1) * halfD * 0.9;

    for (let i = 0; i < count; i++) {
      const x = base[i * 2];
      const z = base[i * 2 + 1];
      const wave =
        Math.sin(x * 0.45 + t * 0.55) * 0.1 + Math.cos(z * 0.45 + t * 0.45) * 0.1;
      const dx = x - mouseX;
      const dz = z - mouseZ;
      const distSq = dx * dx + dz * dz;
      const ripple = Math.exp(-distSq / 2.2) * 0.85;
      pos.setY(i, wave + ripple);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color={resolvedTheme === "light" ? "#241d14" : "#f4efe4"}
        size={0.032}
        sizeAttenuation
        transparent
        opacity={0.55}
      />
    </points>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 6, 7.5], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <CameraRig />
      <ParticleGrid />
    </Canvas>
  );
}
