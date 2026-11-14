// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makeRockGeometry } from "./asteroids";
import { fbm } from "./noise";
import { rocketLive } from "./store";

/*
 * The surface of Mars, used for the landing cinematic. It has its own
 * coordinates: the landing pad sits at the origin, and the ship comes in
 * from the north-west along DESCENT.
 */

/** Low afternoon sun, behind the main landing camera. */
export const SURFACE_SUN = new THREE.Vector3(0.55, 0.36, 0.62).normalize();

/** Top of the landing pad. */
export const PAD_TOP = 0.45;

/** Butterscotch haze at the horizon, as a linear colour (shared by sky and fog). */
const HORIZON = new THREE.Color().setRGB(0.86, 0.62, 0.47);

/** The automatic approach, from high above the plains down to a hover over the pad. */
export const DESCENT = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-1150, 560, -950),
    new THREE.Vector3(-760, 360, -620),
    new THREE.Vector3(-420, 190, -330),
    new THREE.Vector3(-170, 78, -120),
    new THREE.Vector3(-52, 26, -32),
    new THREE.Vector3(0, 12, 0),
  ],
  false,
  "centripetal"
);

const CRATERS = [
  { x: -620, z: -260, r: 140, d: 34 },
  { x: 420, z: -720, r: 220, d: 48 },
  { x: -260, z: 520, r: 90, d: 22 },
  { x: 760, z: 340, r: 160, d: 36 },
  { x: -980, z: -1150, r: 260, d: 60 },
  { x: 230, z: 280, r: 48, d: 10 },
];

const smooth = THREE.MathUtils.smoothstep;

export function terrainHeight(x: number, z: number) {
  const d = Math.hypot(x, z);
  // Rolling plains with small bumps
  let h = (fbm(x * 0.004 + 10, 0.5, z * 0.004, 21, 4) - 0.5) * 44;
  h += (fbm(x * 0.03, 1.5, z * 0.03, 22, 2) - 0.5) * 5;
  // Craters: a bowl with a raised rim
  for (const c of CRATERS) {
    const q = Math.hypot(x - c.x, z - c.z) / c.r;
    if (q < 1.6) {
      h -= c.d * Math.max(0, 1 - q * q);
      h += c.d * 0.35 * Math.exp(-((q - 1) * (q - 1)) / 0.03);
    }
  }
  // Far mountains, like the rim of a huge old crater
  const m = smooth(d, 1400, 2600);
  if (m > 0) h += m * (fbm(x * 0.0012, 2.5, z * 0.0012, 23, 5) * 620 - 120);
  // Flat ground around the pad
  return h * smooth(d, 34, 140);
}

/* ------------------------------------------------------------------ */
/*  Canvas textures                                                    */
/* ------------------------------------------------------------------ */

function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, size: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Fine grain for the ground: dust, pebbles and dark specks. */
function makeGroundDetail() {
  const t = canvasTexture(256, (g, n) => {
    const img = g.createImageData(n, n);
    for (let i = 0; i < n * n; i++) {
      let v = 205 + Math.random() * 50;
      if (Math.random() < 0.04) v = 120 + Math.random() * 60;
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v * 0.97;
      img.data[i * 4 + 2] = v * 0.94;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function makePadTexture() {
  return canvasTexture(512, (g, n) => {
    const c = n / 2;
    g.fillStyle = "#6d6863";
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < 4000; i++) {
      const v = 90 + Math.random() * 40;
      g.fillStyle = `rgba(${v},${v - 4},${v - 8},0.35)`;
      g.fillRect(Math.random() * n, Math.random() * n, 2, 2);
    }
    // Scorch mark from earlier landings
    const scorch = g.createRadialGradient(c, c, 10, c, c, 170);
    scorch.addColorStop(0, "rgba(20,16,14,0.55)");
    scorch.addColorStop(1, "rgba(20,16,14,0)");
    g.fillStyle = scorch;
    g.fillRect(0, 0, n, n);
    // Rings
    g.strokeStyle = "#e8b53a";
    g.lineWidth = 16;
    g.beginPath();
    g.arc(c, c, 228, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.85)";
    g.lineWidth = 6;
    g.setLineDash([22, 16]);
    g.beginPath();
    g.arc(c, c, 190, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    // Initials
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.font = "800 170px system-ui, -apple-system, Segoe UI, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("RH", c, c + 6);
    g.font = "700 26px system-ui, -apple-system, Segoe UI, sans-serif";
    g.fillStyle = "#e8b53a";
    g.fillText("PAD 1 · MARS", c, c + 118);
  });
}

function makeCloudTexture() {
  return canvasTexture(256, (g, n) => {
    for (let i = 0; i < 22; i++) {
      const x = n * (0.2 + Math.random() * 0.6);
      const y = n * (0.35 + Math.random() * 0.3);
      const r = n * (0.08 + Math.random() * 0.16);
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, "rgba(255,255,255,0.22)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, n, n);
    }
  });
}

function makeSoftDot() {
  return canvasTexture(64, (g, n) => {
    const grd = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.4, "rgba(255,255,255,0.5)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, n, n);
  });
}

/* ------------------------------------------------------------------ */
/*  Terrain: a polar grid, fine near the pad and coarse far away       */
/* ------------------------------------------------------------------ */

function makeTerrain() {
  const RINGS = 170;
  const SEGS = 200;
  const MAX_R = 4600;
  const positions: number[] = [0, terrainHeight(0, 0), 0];
  const uvs: number[] = [0, 0];
  const colors: number[] = [];
  const rust = new THREE.Color("#9b4a2a");
  const dust = new THREE.Color("#c27a4e");
  const pale = new THREE.Color("#d29a70");
  const basalt = new THREE.Color("#4e2a1d");
  const c = new THREE.Color();

  const colorAt = (x: number, z: number, h: number) => {
    const n = fbm(x * 0.01, 7, z * 0.01, 31, 3);
    c.copy(rust).lerp(dust, smooth(n, 0.35, 0.65));
    const d = Math.hypot(x, z);
    const mountain = smooth(d, 1400, 2600);
    if (h < 0) c.lerp(basalt, Math.min(0.55, -h / 40));
    c.lerp(basalt, mountain * 0.35 * (1 - smooth(h, 150, 360)));
    c.lerp(pale, smooth(h, 200, 420) * 0.6);
    colors.push(c.r, c.g, c.b);
  };
  colorAt(0, 0, positions[1]);

  for (let i = 1; i <= RINGS; i++) {
    const r = 2 + Math.pow(i / RINGS, 2.2) * MAX_R;
    for (let j = 0; j < SEGS; j++) {
      const a = (j / SEGS) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = terrainHeight(x, z);
      positions.push(x, h, z);
      uvs.push(x / 14, z / 14);
      colorAt(x, z, h);
    }
  }
  const index: number[] = [];
  for (let j = 0; j < SEGS; j++) index.push(0, 1 + ((j + 1) % SEGS), 1 + j);
  for (let i = 1; i < RINGS; i++) {
    const a0 = 1 + (i - 1) * SEGS;
    const b0 = 1 + i * SEGS;
    for (let j = 0; j < SEGS; j++) {
      const j1 = (j + 1) % SEGS;
      index.push(a0 + j, a0 + j1, b0 + j);
      index.push(a0 + j1, b0 + j1, b0 + j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ */
/*  Pieces                                                             */
/* ------------------------------------------------------------------ */

function MarsSky() {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uSun: { value: SURFACE_SUN }, uHorizon: { value: HORIZON } },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uSun;
          uniform vec3 uHorizon;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = max(d.y, 0.0);
            vec3 zenith = vec3(0.36, 0.22, 0.17);
            vec3 col = mix(uHorizon, zenith, pow(h, 0.5));
            float s = max(dot(d, uSun), 0.0);
            // Mars has a small sun with a bluish halo around it
            col += vec3(0.5, 0.62, 0.85) * pow(s, 40.0) * 0.55;
            col += vec3(1.0, 0.97, 0.92) * smoothstep(0.9994, 0.9998, s) * 3.0;
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );
  useFrame(() => {
    mesh.current?.position.copy(camera.position);
  });
  return (
    <mesh ref={mesh} material={material} renderOrder={-1}>
      <sphereGeometry args={[7000, 48, 24]} />
    </mesh>
  );
}

function Ground() {
  const geometry = useMemo(() => makeTerrain(), []);
  const detail = useMemo(() => makeGroundDetail(), []);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors map={detail} roughness={0.97} metalness={0} />
    </mesh>
  );
}

function Boulders() {
  const geometry = useMemo(() => makeRockGeometry(41), []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const COUNT = 260;
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const mat = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3();
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < COUNT; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 24 + Math.pow(rnd(), 1.6) * 520;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const size = 0.25 + Math.pow(rnd(), 3) * (r < 60 ? 0.9 : 3.2);
      s.set(size * (0.8 + rnd() * 0.5), size * (0.5 + rnd() * 0.4), size * (0.8 + rnd() * 0.5));
      v.set(x, terrainHeight(x, z) - size * 0.25, z);
      q.setFromEuler(e.set(rnd() * 0.4, rnd() * Math.PI * 2, rnd() * 0.4));
      mat.compose(v, q, s);
      m.setMatrixAt(i, mat);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, COUNT]} castShadow receiveShadow>
      <meshStandardMaterial vertexColors color="#c87048" roughness={1} />
    </instancedMesh>
  );
}

/** Landing pad with chasing edge lights and approach lights pointing back up the path. */
function Pad({ dot }: { dot: THREE.Texture }) {
  const texture = useMemo(() => makePadTexture(), []);
  const lights = useRef<(THREE.Sprite | null)[]>([]);
  const approach = useRef<(THREE.Sprite | null)[]>([]);
  const EDGE = 16;
  const APPROACH = 8;
  const dir = useMemo(() => new THREE.Vector2(-170, -120).normalize(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    lights.current.forEach((sp, i) => {
      if (!sp) return;
      const k = (t * 0.9 - i / EDGE + 10) % 1;
      sp.material.opacity = 0.25 + 0.75 * Math.exp(-k * 9);
    });
    approach.current.forEach((sp, i) => {
      if (!sp) return;
      // A "rabbit" running in towards the pad
      const k = (t * 1.4 - (APPROACH - i) / APPROACH + 10) % 1;
      sp.material.opacity = 0.15 + 0.85 * Math.exp(-k * 14);
    });
  });

  return (
    <group>
      <mesh position={[0, PAD_TOP - 0.25, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[14, 14.8, 0.5, 8]} />
        <meshStandardMaterial color="#4a4542" roughness={0.9} />
      </mesh>
      <mesh position={[0, PAD_TOP + 0.01, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]} receiveShadow>
        <circleGeometry args={[13.6, 64]} />
        <meshStandardMaterial map={texture} roughness={0.85} />
      </mesh>
      {Array.from({ length: EDGE }, (_, i) => {
        const a = (i / EDGE) * Math.PI * 2;
        return (
          <sprite
            key={i}
            ref={(el) => {
              lights.current[i] = el;
            }}
            position={[Math.cos(a) * 13.9, PAD_TOP + 0.25, Math.sin(a) * 13.9]}
            scale={[1.6, 1.6, 1]}
          >
            <spriteMaterial map={dot} color="#ffc061" transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
          </sprite>
        );
      })}
      {Array.from({ length: APPROACH }, (_, i) => {
        const r = 20 + i * 9;
        const x = dir.x * r;
        const z = dir.y * r;
        return (
          <sprite
            key={i}
            ref={(el) => {
              approach.current[i] = el;
            }}
            position={[x, terrainHeight(x, z) + 0.5, z]}
            scale={[2.2, 2.2, 1]}
          >
            <spriteMaterial map={dot} color="#fff1d6" transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
          </sprite>
        );
      })}
    </group>
  );
}

/** A small research base beside the pad: two domes, a tunnel, a mast, a dish and solar panels. */
function Base({ dot }: { dot: THREE.Texture }) {
  const beacon = useRef<THREE.Sprite>(null);
  const B = useMemo(() => new THREE.Vector3(-36, terrainHeight(-36, 30), 30), []);
  useFrame((state) => {
    if (beacon.current) beacon.current.material.opacity = state.clock.elapsedTime % 1.6 < 0.5 ? 1 : 0.1;
  });
  const shell = <meshStandardMaterial color="#dcd5cb" roughness={0.65} metalness={0.05} />;
  const metal = <meshStandardMaterial color="#8d939c" roughness={0.45} metalness={0.7} />;
  return (
    <group position={B}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[7, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {shell}
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[7.2, 7.4, 0.6, 40]} />
        <meshStandardMaterial color="#5b5550" roughness={0.9} />
      </mesh>
      <mesh position={[13, 0, -5]} castShadow receiveShadow>
        <sphereGeometry args={[4.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {shell}
      </mesh>
      <mesh position={[6.6, 1.5, -2.5]} rotation={[0, Math.atan2(5, 13) + Math.PI / 2, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 6.5, 20]} />
        {shell}
      </mesh>
      {/* warm windows */}
      {[0.6, 1.15, 1.7].map((a) => (
        <mesh key={a} position={[Math.cos(a) * 6.75, 2.2, Math.sin(a) * 6.75]} rotation={[0, -a + Math.PI / 2, 0]}>
          <planeGeometry args={[1.4, 0.7]} />
          <meshBasicMaterial color="#ffcf8a" side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* radio mast with a red beacon */}
      <mesh position={[-9, 8, -7]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 16, 8]} />
        {metal}
      </mesh>
      <sprite ref={beacon} position={[-9, 16.3, -7]} scale={[2.4, 2.4, 1]}>
        <spriteMaterial map={dot} color="#ff3030" transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      {/* dish */}
      <group position={[8, 0, 9]}>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 2.8, 8]} />
          {metal}
        </mesh>
        <mesh position={[0, 3.2, 0]} rotation={[-0.9, 0.8, 0]} castShadow>
          <sphereGeometry args={[2.2, 24, 8, 0, Math.PI * 2, 0, 0.7]} />
          <meshStandardMaterial color="#e8e4dd" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* solar panels, tilted to the sun */}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i} position={[-14 + (i % 4) * 3.6, 1.1, 12 + Math.floor(i / 4) * 3.4]}>
          <mesh position={[0, -0.6, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.2, 6]} />
            {metal}
          </mesh>
          <mesh rotation={[0.55, 0.7, 0]} castShadow>
            <boxGeometry args={[3.2, 0.06, 2.2]} />
            <meshStandardMaterial color="#1b2a4d" metalness={0.6} roughness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Thin water-ice clouds the ship descends through. */
function Clouds() {
  const texture = useMemo(() => makeCloudTexture(), []);
  const clouds = useMemo(() => {
    const list: { pos: THREE.Vector3; sx: number; sy: number; o: number }[] = [];
    let seed = 99;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 30; i++) {
      const p = DESCENT.getPointAt(0.04 + rnd() * 0.5);
      const side = new THREE.Vector3(rnd() - 0.5, 0, rnd() - 0.5).multiplyScalar(420);
      list.push({
        pos: p.add(side).setY(p.y + (rnd() - 0.5) * 70),
        sx: 160 + rnd() * 220,
        sy: 50 + rnd() * 60,
        o: 0.35 + rnd() * 0.3,
      });
    }
    return list;
  }, []);
  return (
    <group>
      {clouds.map((c, i) => (
        <sprite key={i} position={c.pos} scale={[c.sx, c.sy, 1]}>
          <spriteMaterial map={texture} color="#f7e4d4" transparent opacity={c.o} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

/** Dust blown out across the ground by the hover thrusters. */
function LandingDust({ dot }: { dot: THREE.Texture }) {
  const N = 320;
  const data = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(N * 4), 4));
    return { geometry: g, vel: new Float32Array(N * 3), age: new Float32Array(N).fill(99), next: { i: 0, carry: 0 } };
  }, []);
  const base = useMemo(() => new THREE.Color("#caa07c"), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const pos = data.geometry.attributes.position as THREE.BufferAttribute;
    const col = data.geometry.attributes.color as THREE.BufferAttribute;
    const ship = rocketLive.pos;
    const ground = Math.hypot(ship.x, ship.z) < 14.5 ? PAD_TOP : terrainHeight(ship.x, ship.z);
    const alt = ship.y - ground;
    const rate = rocketLive.hover > 0.15 && alt < 18 ? rocketLive.hover * (1 - alt / 18) * 260 : 0;

    data.next.carry += rate * dt;
    while (data.next.carry >= 1) {
      data.next.carry -= 1;
      const i = data.next.i;
      data.next.i = (i + 1) % N;
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 2;
      pos.setXYZ(i, ship.x + Math.cos(a) * r, ground + 0.3, ship.z + Math.sin(a) * r);
      const sp = 9 + Math.random() * 16;
      data.vel.set([Math.cos(a) * sp, 1 + Math.random() * 3, Math.sin(a) * sp], i * 3);
      data.age[i] = 0;
    }
    for (let i = 0; i < N; i++) {
      const age = data.age[i];
      if (age > 3) {
        col.setXYZW(i, 0, 0, 0, 0);
        continue;
      }
      data.age[i] = age + dt;
      const k = 1 - Math.exp(-dt * 1.4);
      data.vel[i * 3] -= data.vel[i * 3] * k;
      data.vel[i * 3 + 2] -= data.vel[i * 3 + 2] * k;
      data.vel[i * 3 + 1] -= data.vel[i * 3 + 1] * k * 0.5;
      pos.setXYZ(
        i,
        pos.getX(i) + data.vel[i * 3] * dt,
        pos.getY(i) + data.vel[i * 3 + 1] * dt,
        pos.getZ(i) + data.vel[i * 3 + 2] * dt
      );
      const alpha = Math.min(1, age * 4) * Math.max(0, 1 - age / 3) * 0.5;
      col.setXYZW(i, base.r, base.g, base.b, alpha);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  return (
    <points geometry={data.geometry} frustumCulled={false}>
      <pointsMaterial size={4.5} map={dot} vertexColors transparent depthWrite={false} />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/*  The whole surface                                                  */
/* ------------------------------------------------------------------ */

export function MarsSurface({ visible }: { visible: boolean }) {
  const { scene } = useThree();
  const dot = useMemo(() => makeSoftDot(), []);
  const sun = useRef<THREE.DirectionalLight>(null);

  // Haze over the plains, only while we're on the surface.
  useEffect(() => {
    if (!visible) return;
    scene.fog = new THREE.Fog(HORIZON.clone(), 140, 3300);
    return () => {
      scene.fog = null;
    };
  }, [visible, scene]);

  useEffect(() => {
    const light = sun.current;
    if (!light) return;
    const cam = light.shadow.camera;
    cam.left = -70;
    cam.right = 70;
    cam.top = 70;
    cam.bottom = -70;
    cam.near = 10;
    cam.far = 900;
    cam.updateProjectionMatrix();
  }, []);

  return (
    <group visible={visible}>
      <MarsSky />
      <hemisphereLight args={["#f3cfb0", "#5c3322", 0.85]} />
      <directionalLight
        ref={sun}
        position={SURFACE_SUN.clone().multiplyScalar(400)}
        intensity={2.4}
        color="#ffe3c6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      <Ground />
      <Boulders />
      <Pad dot={dot} />
      <Base dot={dot} />
      <Clouds />
      <LandingDust dot={dot} />
    </group>
  );
}
