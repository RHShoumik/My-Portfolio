// SPIKE: throwaway prototype of the island game. Not production code.
"use client";

import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";

type MeshProps = ThreeElements["mesh"];

/** Flat-shaded box. */
export function Box({
  size,
  color,
  opacity,
  ...props
}: MeshProps & { size: [number, number, number]; color: string; opacity?: number }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        flatShading
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
    </mesh>
  );
}

/** Flat-shaded cylinder / cone: [radiusTop, radiusBottom, height, sides]. */
export function Cyl({
  args,
  color,
  ...props
}: Omit<MeshProps, "args"> & { args: [number, number, number, number?]; color: string }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <cylinderGeometry args={[args[0], args[1], args[2], args[3] ?? 10]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

/** Flat-shaded ball (low-poly). */
export function Ball({
  r,
  color,
  detail = 1,
  ...props
}: MeshProps & { r: number; color: string; detail?: number }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <icosahedronGeometry args={[r, detail]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

/** Rounded text label drawn to a canvas, for signs and floating name tags. */
export function makeTextTexture(
  text: string,
  o: { color?: string; bg?: string; size?: number } = {}
) {
  const size = o.size ?? 64;
  const font = `700 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const canvas = document.createElement("canvas");
  const measure = canvas.getContext("2d")!;
  measure.font = font;
  const padX = size * 0.6;
  const padY = size * 0.35;
  canvas.width = Math.ceil(measure.measureText(text).width + padX * 2);
  canvas.height = Math.ceil(size + padY * 2);

  const g = canvas.getContext("2d")!;
  if (o.bg) {
    const r = size * 0.4;
    const w = canvas.width;
    const h = canvas.height;
    g.fillStyle = o.bg;
    g.beginPath();
    g.moveTo(r, 0);
    g.arcTo(w, 0, w, h, r);
    g.arcTo(w, h, 0, h, r);
    g.arcTo(0, h, 0, 0, r);
    g.arcTo(0, 0, w, 0, r);
    g.closePath();
    g.fill();
  }
  g.font = font;
  g.fillStyle = o.color ?? "#0b0d14";
  g.textBaseline = "middle";
  g.textAlign = "center";
  g.fillText(text, canvas.width / 2, canvas.height / 2 + size * 0.04);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, aspect: canvas.width / canvas.height };
}
