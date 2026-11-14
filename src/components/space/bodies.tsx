// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Body } from "./levels";
import { useLevel } from "./store";
import { departurePos, EARTH, landingPos, MOON, SUN_DIR, targetPos } from "./world";

/* ------------------------------------------------------------------ */
/*  3D simplex noise (Ashima Arts / Ian McEwan, MIT licence)           */
/* ------------------------------------------------------------------ */
const SIMPLEX = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

/* ------------------------------------------------------------------ */
/*  Atmosphere: a soft glow around the rim, brighter on the day side   */
/* ------------------------------------------------------------------ */
function Atmosphere({ radius, color, strength = 1 }: { radius: number; color: string; strength?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uSun: { value: SUN_DIR.clone() },
          uStrength: { value: strength },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormalView;
          varying vec3 vNormalWorld;
          void main() {
            vNormalView = normalize(normalMatrix * normal);
            vNormalWorld = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform vec3 uSun;
          uniform float uStrength;
          varying vec3 vNormalView;
          varying vec3 vNormalWorld;
          void main() {
            float rim = pow(clamp(0.66 - dot(vNormalView, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 4.5);
            float day = smoothstep(-0.35, 0.45, dot(vNormalWorld, uSun));
            gl_FragColor = vec4(uColor * rim * (0.15 + 1.6 * day) * uStrength, 1.0);
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    [color, strength]
  );
  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 96, 64]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Clouds: drawn in code (NASA's cloud map server was unreachable)    */
/* ------------------------------------------------------------------ */
function Clouds({ radius }: { radius: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uSun: { value: SUN_DIR.clone() } },
        vertexShader: /* glsl */ `
          varying vec3 vPos;
          varying vec3 vNormalWorld;
          void main() {
            vPos = normalize(position);
            vNormalWorld = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader:
          SIMPLEX +
          /* glsl */ `
          uniform float uTime;
          uniform vec3 uSun;
          varying vec3 vPos;
          varying vec3 vNormalWorld;
          void main() {
            vec3 p = vPos * 2.6 + vec3(uTime * 0.004, 0.0, 0.0);
            // Stretch along latitude, like real weather bands
            p.y *= 1.6;
            float n = 0.0, amp = 0.55, f = 1.0;
            for (int i = 0; i < 5; i++) { n += amp * snoise(p * f); f *= 2.1; amp *= 0.5; }
            float cover = smoothstep(0.05, 0.55, n);
            float light = smoothstep(-0.2, 0.35, dot(vNormalWorld, uSun));
            vec3 col = mix(vec3(0.08, 0.09, 0.12), vec3(1.0), light);
            gl_FragColor = vec4(col, cover * 0.85 * (0.25 + 0.75 * light));
          }
        `,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt;
  });

  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 96, 64]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Planets                                                            */
/* ------------------------------------------------------------------ */
function useMap(url: string) {
  const texture = useLoader(THREE.TextureLoader, url);
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);
  return texture;
}

export function Earth() {
  const map = useMap("/space/earth.jpg");
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.006;
  });
  return (
    <group position={EARTH.pos} rotation={[0.41, 2.2, 0]}>
      <group ref={spin}>
        <mesh>
          <sphereGeometry args={[EARTH.r, 128, 96]} />
          <meshStandardMaterial map={map} roughness={0.85} metalness={0} />
        </mesh>
        <Clouds radius={EARTH.r * 1.012} />
      </group>
      <Atmosphere radius={EARTH.r * 1.03} color="#5aa8ff" strength={2.2} />
    </group>
  );
}

export function Moon() {
  const map = useMap("/space/moon.jpg");
  return (
    <mesh position={MOON.pos} rotation={[0, -1.2, 0]}>
      <sphereGeometry args={[MOON.r, 96, 64]} />
      <meshStandardMaterial map={map} roughness={1} metalness={0} />
    </mesh>
  );
}

/** Saturn's rings: bands of ice drawn into a strip, mapped from the inner to the outer edge. */
function makeRingTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 4;
  const g = c.getContext("2d")!;
  for (let x = 0; x < 512; x++) {
    const u = x / 512;
    // The Cassini division, a dark gap two thirds of the way out
    const gap = Math.abs(u - 0.66) < 0.025 ? 0.08 : 1;
    const band = 0.55 + 0.45 * Math.sin(u * 90) * Math.sin(u * 23 + 1.3);
    const a = Math.max(0, Math.min(1, (0.3 + band * 0.6) * gap * (u < 0.04 ? u / 0.04 : 1)));
    const l = 200 + band * 40;
    g.fillStyle = `rgba(${l},${l * 0.93},${l * 0.8},${a})`;
    g.fillRect(x, 0, 1, 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function Ring({ radius }: { radius: number }) {
  const texture = useMemo(() => makeRingTexture(), []);
  const geometry = useMemo(() => {
    const inner = radius * 1.25;
    const outer = radius * 2.3;
    const g = new THREE.RingGeometry(inner, outer, 160, 1);
    // Map u from the inner edge (0) to the outer edge (1).
    const pos = g.attributes.position as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    return g;
  }, [radius]);
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} depthWrite={false} roughness={1} />
    </mesh>
  );
}

/** Any planet or moon: a NASA map (optionally tinted), an atmosphere and rings. */
export function Planet({ body, position, spin = 0.01 }: { body: Body; position: THREE.Vector3; spin?: number }) {
  const map = useMap(body.map);
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (mesh.current) mesh.current.rotation.y += dt * spin;
  });
  return (
    <group position={position} rotation={[body.tilt ?? 0, 0, (body.tilt ?? 0) * 0.4]}>
      <mesh ref={mesh}>
        <sphereGeometry args={[body.r, 128, 96]} />
        <meshStandardMaterial map={map} color={body.tint ?? "#ffffff"} roughness={0.95} metalness={0} />
      </mesh>
      {body.atmosphere && (
        <Atmosphere radius={body.r * 1.02} color={body.atmosphere} strength={body.atmosphereStrength ?? 1} />
      )}
      {body.ring && <Ring radius={body.r} />}
      {body.clouds && <Clouds radius={body.r * 1.012} />}
    </group>
  );
}

// Fetch every planet map up front, so switching level never waits on a download.
for (const url of ["/space/mars.jpg", "/space/jupiter.jpg", "/space/saturn.jpg", "/space/earth.jpg", "/space/moon.jpg"]) {
  useLoader.preload(THREE.TextureLoader, url);
}

/** The planets of the current level: where you left, where you are going, and where you land. */
export function Planets() {
  const level = useLevel();
  const from = useMemo(() => departurePos(level), [level]);
  const to = useMemo(() => targetPos(level), [level]);
  const land = useMemo(() => landingPos(level), [level]);
  return (
    <>
      {level.number === 1 ? (
        <>
          <Earth />
          <Moon />
        </>
      ) : (
        <Planet body={level.departure} position={from} spin={0.006} />
      )}
      <Planet body={level.target} position={to} spin={0.004} />
      {level.landing && <Planet body={level.landing} position={land} spin={0.008} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Sky: NASA's star map for the Milky Way, plus crisp point stars     */
/* ------------------------------------------------------------------ */
export function Sky() {
  const map = useMap("/space/stars.jpg");
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // NASA's star map, mostly desaturated and with the faint JPEG noise pushed down,
  // so the Milky Way glows without coloured speckle.
  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uMap: { value: map } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          varying vec2 vUv;
          void main() {
            vec3 c = texture2D(uMap, vUv).rgb;
            float l = dot(c, vec3(0.299, 0.587, 0.114));
            c = mix(vec3(l), c, 0.25);
            c = pow(c, vec3(1.35)) * 1.9;
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [map]
  );

  const stars = useMemo(() => {
    const count = 2600;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(8500);
      pos.set([v.x, v.y, v.z], i * 3);
      // Mostly white with a faint warm or blue tint; most are dim, a few bright.
      const t = Math.random();
      const bright = 0.25 + Math.pow(Math.random(), 3.2) * 0.75;
      c.setHSL(t < 0.12 ? 0.09 : t < 0.24 ? 0.6 : 0, t < 0.24 ? 0.12 : 0, bright);
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);

  // The sky is "infinitely" far away: it travels with the camera.
  useFrame(() => {
    group.current?.position.copy(camera.position);
  });

  return (
    <group ref={group}>
      <mesh material={skyMaterial}>
        <sphereGeometry args={[9000, 64, 32]} />
      </mesh>
      <points geometry={stars}>
        <pointsMaterial size={1.05} sizeAttenuation={false} vertexColors depthWrite={false} />
      </points>
    </group>
  );
}
