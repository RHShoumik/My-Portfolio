// SPIKE: throwaway prototype of the island game. Not production code.
"use client";
/*
 * A late-afternoon sky: warm haze on the horizon (the same colour as the fog,
 * so the sea and islands melt into it), deep blue overhead and a glowing sun
 * low in the west. The dome follows the camera so it never gets closer.
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SKY } from "./world";

/** Direction toward the sun: low (about 25 degrees) and off to one side. */
export const SUN_DIR = new THREE.Vector3(-55, 40, 70).normalize();
export const SUN_COLOR = "#ffe1b5";
const ZENITH = "#5d8cbd";
const GLOW = "#ffc985";

function linear(hex: string) {
  return new THREE.Color(hex);
}

export function SkyDome() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uHorizon: { value: linear(SKY) },
          uZenith: { value: linear(ZENITH) },
          uGlow: { value: linear(GLOW) },
          uSun: { value: SUN_DIR },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww; // always at the far plane
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uHorizon, uZenith, uGlow, uSun;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = max(d.y, 0.0);
            vec3 col = mix(uHorizon, uZenith, pow(h, 0.55));
            float sun = max(dot(d, normalize(uSun)), 0.0);
            // Wide warm glow, a tighter halo, and the disc itself.
            col = mix(col, uGlow, pow(sun, 6.0) * 0.55 * (1.0 - h * 0.6));
            col += uGlow * pow(sun, 60.0) * 0.6;
            col += vec3(1.0, 0.96, 0.88) * smoothstep(0.9993, 0.9997, sun) * 1.6;
            // A faint band of haze right at the horizon.
            col = mix(col, uHorizon * 1.04, smoothstep(0.08, 0.0, h) * 0.6);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useFrame(({ camera }) => {
    mesh.current?.position.copy(camera.position);
  });
  return (
    <mesh ref={mesh} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[700, 32, 16]} />
    </mesh>
  );
}
