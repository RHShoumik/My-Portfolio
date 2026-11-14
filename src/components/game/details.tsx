"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { ThreeElements } from "@react-three/fiber";

export function Rounded({
  size,
  color,
  metal = 0,
  ...props
}: ThreeElements["mesh"] & {
  size: [number, number, number];
  color: string;
  metal?: number;
}) {
  const [x, y, z] = size;
  const geometry = useMemo(
    () => new RoundedBoxGeometry(x, y, z, 3, Math.min(x, y, z) * 0.17),
    [x, y, z],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow {...props}>
      <meshStandardMaterial
        color={color}
        roughness={metal ? 0.32 : 0.72}
        metalness={metal}
      />
    </mesh>
  );
}
export function Beam({
  a,
  b,
  r = 0.06,
  color = "#48545a",
}: {
  a: [number, number, number];
  b: [number, number, number];
  r?: number;
  color?: string;
}) {
  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.LineCurve3(new THREE.Vector3(...a), new THREE.Vector3(...b)),
        1,
        r,
        10,
        false,
      ),
    [a, b, r],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.45} />
    </mesh>
  );
}

/** Deterministic surface grain: generated once, no external asset requests. */
export function useGrain(base: string) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const g = canvas.getContext("2d")!;
    g.fillStyle = base;
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 5000; i++) {
      const x = (i * 73) % 128,
        y = (i * 31 + Math.floor(i / 128) * 17) % 128;
      g.fillStyle = i % 2 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.08)";
      g.fillRect(x, y, 1 + (i % 3), 1);
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(18, 18);
    t.anisotropy = 4;
    return t;
  }, [base]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
