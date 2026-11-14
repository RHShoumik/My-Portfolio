// SPIKE: throwaway prototype of the island game. Not production code.
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { islands, playerPos, SKY } from "./world";

const SEGMENT = 3; // world units per water facet

const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  varying float vH;

  // Must match waveHeight() in world.ts
  float wave(vec2 p) {
    return 0.28 * sin(p.x * 0.22 + uTime * 1.1)
         + 0.22 * sin(p.y * 0.31 + uTime * 0.9)
         + 0.12 * sin((p.x + p.y) * 0.5 + uTime * 1.6);
  }

  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    float h = wave(wp.xz);
    wp.y += h;
    vWorld = wp.xyz;
    vH = h;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uIslands[4];
  uniform vec2 uShape[4];
  uniform vec3 uFog;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vWorld;
  varying float vH;

  void main() {
    // Analytic swell normals plus finer wind-driven ripples.
    float t = uTime;
    vec2 p = vWorld.xz;
    float dx = .0616*cos(p.x*.22+t*1.1)+.06*cos((p.x+p.y)*.5+t*1.6);
    float dz = .0682*cos(p.y*.31+t*.9)+.06*cos((p.x+p.y)*.5+t*1.6);
    dx += .035*cos(p.x*2.8+p.y*1.9+t*2.4);
    dz += .028*sin(p.y*3.7-p.x*1.3+t*2.1);
    vec3 n = normalize(vec3(-dx, 1., -dz));
    vec3 view = normalize(cameraPosition-vWorld);
    vec3 sun = normalize(vec3(.55,.65,-.35));
    float fresnel = .025+.975*pow(1.-max(dot(n,view),0.),5.);
    float shore = 10000.;
    for(int i=0;i<4;i++) {
      vec2 q=(p-uIslands[i].xy)/uShape[i];
      float a=atan(q.y,q.x);
      shore=min(shore,(length(q)-uIslands[i].z-2.*sin(a*3.)-1.2*cos(a*5.))*min(uShape[i].x,uShape[i].y));
    }
    vec3 deep = vec3(.012,.16,.22);
    vec3 shallow = vec3(.10,.55,.49);
    vec3 col = mix(shallow,deep,smoothstep(0.,35.,shore));
    vec3 reflectedSky = mix(vec3(.65,.78,.80),vec3(.24,.48,.65),max(reflect(-view,n).y,0.));
    col = mix(col,reflectedSky,fresnel*.85);
    float sparkle = pow(max(dot(n,normalize(sun+view)),0.),280.);
    col += vec3(1.,.86,.62)*sparkle*1.8;
    float surf = (1.-smoothstep(0.,5.,abs(shore-1.5))) *
      smoothstep(.45,.9,sin(shore*2.2-t*1.8+sin(p.x*.7)*.4));
    col = mix(col,vec3(.84,.93,.88),surf*.7);

    float dist = length(vWorld - cameraPosition);
    col = mix(col, uFog, smoothstep(uFogNear, uFogFar, dist));
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Display-space RGB for a hex colour (the shader writes straight to the screen). */
function displayRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
  );
}

export function Sea({ fogNear, fogFar }: { fogNear: number; fogFar: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  const shader = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uShape: { value: islands.map((i) => new THREE.Vector2(i.sx, i.sz)) },
        uIslands: {
          value: islands.map((i) => new THREE.Vector3(i.cx, i.cz, i.r)),
        },
        uFog: { value: displayRgb(SKY) },
        uFogNear: { value: fogNear },
        uFogFar: { value: fogFar },
      },
      vertexShader,
      fragmentShader,
    }),
    [fogNear, fogFar],
  );

  useFrame((state) => {
    if (material.current)
      material.current.uniforms.uTime.value = state.clock.elapsedTime;
    // The sheet follows the player, snapped to the facet size so the facets never slide.
    mesh.current?.position.set(
      Math.round(playerPos.x / SEGMENT) * SEGMENT,
      0,
      Math.round(playerPos.z / SEGMENT) * SEGMENT,
    );
  });

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[900, 900, 900 / SEGMENT, 900 / SEGMENT]} />
      <shaderMaterial ref={material} args={[shader]} />
    </mesh>
  );
}
