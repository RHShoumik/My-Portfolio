// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { rocketLive } from "./store";
import { AIRCRAFT_SCALE } from "./ship-config";

/* F-14 model and flight effects, aligned to -Z forward and +Y up. */

/* ------------------------------------------------------------------ */
/*  Engine flame                                                       */
/* ------------------------------------------------------------------ */

const flameVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const flameFragment = /* glsl */ `
  uniform float uTime;
  uniform float uPower;
  uniform vec3 uCore;
  uniform vec3 uEdge;
  varying vec2 vUv;
  void main() {
    float along = vUv.y; // 1 at the nozzle, 0 at the tip
    float flicker = 0.85 + 0.15 * sin(uTime * 45.0 + vUv.x * 30.0) * sin(uTime * 23.0);
    float fade = pow(along, 1.6) * flicker;
    vec3 col = mix(uEdge, uCore, smoothstep(0.55, 1.0, along));
    gl_FragColor = vec4(col * (1.2 + uPower), fade * (0.55 + 0.45 * uPower));
  }
`;

function useGlowTexture(inner: string, mid: string, outer: string) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, inner);
    grd.addColorStop(0.3, mid);
    grd.addColorStop(1, outer);
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [inner, mid, outer]);
}

/** Exhaust from one nozzle, pointing back along +Z. */
function Flame({ x, z = 4.62 }: { x: number; z?: number }) {
  const outer = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Sprite>(null);
  const materials = useMemo(() => {
    const make = (core: string, edge: string) =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPower: { value: 0 },
          uCore: { value: new THREE.Color(core) },
          uEdge: { value: new THREE.Color(edge) },
        },
        vertexShader: flameVertex,
        fragmentShader: flameFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
    return { outer: make("#ffe0a0", "#ff6a2a"), inner: make("#ffffff", "#9fd0ff") };
  }, []);
  const glowTexture = useGlowTexture("rgba(255,235,200,1)", "rgba(255,160,80,0.5)", "rgba(255,90,20,0)");

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = rocketLive.throttle;
    for (const m of [materials.outer, materials.inner]) {
      m.uniforms.uTime.value = t;
      m.uniforms.uPower.value = p;
    }
    const len = 0.4 + p * 3.2 + Math.sin(t * 40 + x) * 0.1 * p;
    outer.current?.scale.set(1, len, 1);
    inner.current?.scale.set(1, len * 0.6, 1);
    const on = p > 0.02;
    if (outer.current) outer.current.visible = on;
    if (inner.current) inner.current.visible = on;
    if (glow.current) {
      const s = 0.5 + p * 1.4;
      glow.current.scale.set(s, s, 1);
      glow.current.material.opacity = Math.min(0.8, p * 1.2);
    }
  });

  // The cones are built pointing down -Y; turning the group maps -Y to +Z (backwards).
  return (
    <group position={[x, -0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={outer} material={materials.outer} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.3, 1, 20, 1, true]} />
      </mesh>
      <mesh ref={inner} material={materials.inner} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.16, 1, 16, 1, true]} />
      </mesh>
      <sprite ref={glow}>
        <spriteMaterial map={glowTexture} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Atmospheric entry plasma                                           */
/* ------------------------------------------------------------------ */

const SPARKS = 380;

/** A random point on the nose or a wing's leading edge, in ship space. */
function leadingEdge(out: THREE.Vector3) {
  const r = Math.random();
  if (r < 0.3) return out.set((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.6, -3.9 + Math.random() * 0.8);
  const k = Math.random();
  const side = r < 0.65 ? 1 : -1;
  return out.set(side * (0.45 + k * 2.8), -0.2 + (Math.random() - 0.5) * 0.15, -1.1 + k * 3.15);
}

function EntryPlasma() {
  const group = useRef<THREE.Group>(null);
  const noseGlow = useRef<THREE.Sprite>(null);
  const bellyGlow = useRef<THREE.Sprite>(null);
  const glowTexture = useGlowTexture("rgba(255,240,210,1)", "rgba(255,150,70,0.45)", "rgba(255,80,20,0)");

  // Sparks of glowing gas peeling off the nose and wing edges.
  const sparks = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
    const start = Array.from({ length: SPARKS }, () => new THREE.Vector3());
    const life = new Float32Array(SPARKS).map(() => Math.random() * 0.6);
    const speed = new Float32Array(SPARKS);
    return { geometry: g, start, life, speed };
  }, []);
  const sparkTexture = useGlowTexture("rgba(255,255,255,1)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0)");
  const hot = useMemo(() => new THREE.Color("#fff1c9"), []);
  const fire = useMemo(() => new THREE.Color("#ff6a24"), []);
  const c = useMemo(() => new THREE.Color(), []);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = state.clock.elapsedTime;
    const heat = rocketLive.heat;
    if (group.current) group.current.visible = heat > 0.01;
    const flicker = 1 + Math.sin(t * 31) * 0.05 + Math.sin(t * 17) * 0.05;
    if (noseGlow.current) {
      noseGlow.current.scale.setScalar(5.5 * flicker);
      noseGlow.current.material.opacity = heat * 0.95;
    }
    if (bellyGlow.current) {
      bellyGlow.current.scale.setScalar(9 * flicker);
      bellyGlow.current.material.opacity = heat * 0.45;
    }
    if (heat <= 0.01) return;

    const pos = sparks.geometry.attributes.position as THREE.BufferAttribute;
    const col = sparks.geometry.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < SPARKS; i++) {
      let l = sparks.life[i] - dt;
      if (l <= 0) {
        leadingEdge(sparks.start[i]);
        sparks.speed[i] = 18 + Math.random() * 30;
        l = 0.3 + Math.random() * 0.3;
      }
      sparks.life[i] = l;
      const age = 0.6 - l;
      const p = sparks.start[i];
      // Flow back along the hull and spread out a little.
      const spread = 1 + age * 0.7;
      pos.setXYZ(i, p.x * spread, p.y * spread + age * 0.6, p.z + age * sparks.speed[i]);
      const a = Math.min(1, l * 4) * heat;
      c.copy(hot).lerp(fire, Math.min(1, age * 2.4)).multiplyScalar(a);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  return (
    <group ref={group} visible={false}>
      <sprite ref={noseGlow} position={[0, -0.1, -4.4]}>
        <spriteMaterial map={glowTexture} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite ref={bellyGlow} position={[0, -0.6, -0.5]}>
        <spriteMaterial map={glowTexture} color="#ff8a4a" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <points geometry={sparks.geometry} frustumCulled={false}>
        <pointsMaterial
          size={0.3}
          map={sparkTexture}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/**
 * Height from the ship's origin down to the bottom of the F-14's own wheels.
 * The model is centred on its bounding box, and its wheels are its lowest
 * point: half its fitted height (0.926) below the centre.
 */
export const GEAR_HEIGHT = 0.926 * AIRCRAFT_SCALE;

/** Load the supplied F-14 model, center it, and fit it to the existing flight scale. */
function PlaneModel() {
  const { scene } = useLoader(GLTFLoader, "/space/objects/plane.glb");
  const { model, offset, scale } = useMemo(() => {
    const model = scene.clone(true);
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 7.2 / Math.max(size.x, size.z);

    model.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        (object as THREE.Mesh).castShadow = true;
        (object as THREE.Mesh).receiveShadow = true;
      }
    });

    return {
      model,
      offset: center.multiplyScalar(-scale).toArray() as [number, number, number],
      scale,
    };
  }, [scene]);

  // Turn the source heading from screen-left (-X) into the flight direction (-Z).
  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={model} position={offset} scale={scale} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  The ship                                                           */
/* ------------------------------------------------------------------ */

export function Ship() {
  const root = useRef<THREE.Group>(null);
  const strobe = useRef<THREE.Sprite>(null);
  const navLeft = useRef<THREE.Sprite>(null);
  const navRight = useRef<THREE.Sprite>(null);
  const hoverGlow = useRef<THREE.Sprite>(null);
  const hoverLight = useRef<THREE.PointLight>(null);
  const engineLight = useRef<THREE.PointLight>(null);
  const muzzles = useRef<(THREE.Sprite | null)[]>([]);

  const glow = useGlowTexture("rgba(255,255,255,1)", "rgba(255,255,255,0.35)", "rgba(255,255,255,0)");
  const hoverTexture = useGlowTexture("rgba(200,225,255,1)", "rgba(120,170,255,0.45)", "rgba(60,120,255,0)");

  useEffect(() => {
    root.current?.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, []);

  useFrame((state, frameDt) => {
    const t = state.clock.elapsedTime;
    if (engineLight.current) engineLight.current.intensity = rocketLive.throttle * 30;

    const blink = (t % 1.4) < 0.08 ? 1 : 0;
    if (strobe.current) strobe.current.material.opacity = blink;
    const navigation = 0.7 + Math.sin(t * 2) * 0.1;
    if (navLeft.current) navLeft.current.material.opacity = navigation;
    if (navRight.current) navRight.current.material.opacity = navigation;

    const hover = rocketLive.hover;
    if (hoverGlow.current) {
      const size = 1.2 + hover * 2.2 + Math.sin(t * 50) * 0.08 * hover;
      hoverGlow.current.scale.set(size, size, 1);
      hoverGlow.current.material.opacity = hover * 0.85;
      hoverGlow.current.visible = hover > 0.01;
    }
    if (hoverLight.current) hoverLight.current.intensity = hover * 60;

    muzzles.current.forEach((muzzle, index) => {
      if (!muzzle) return;
      const remaining = rocketLive.muzzle[index];
      muzzle.visible = remaining > 0;
      if (remaining > 0) {
        const intensity = remaining / 0.06;
        muzzle.scale.setScalar(0.8 + intensity * 1.2);
        muzzle.material.opacity = intensity;
      }
      rocketLive.muzzle[index] = Math.max(0, remaining - Math.min(frameDt, 0.05));
    });
  });

  return (
    <group ref={root}>
      <group scale={AIRCRAFT_SCALE}>
        <PlaneModel />

        {/* F-14 twin-engine exhaust and responsive navigation lights. */}
        <Flame x={-0.46} z={3.55} />
        <Flame x={0.46} z={3.55} />
        <pointLight
          ref={engineLight}
          position={[0, 0, 3.8]}
          color="#ff9a4d"
          distance={30}
          decay={1.6}
          intensity={0}
        />
        <sprite ref={navLeft} position={[-3.35, 0.05, 0.2]} scale={[0.42, 0.42, 1]}>
          <spriteMaterial
            map={glow}
            color="#ff3a3a"
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
        <sprite ref={navRight} position={[3.35, 0.05, 0.2]} scale={[0.42, 0.42, 1]}>
          <spriteMaterial
            map={glow}
            color="#38ff7a"
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
        <sprite ref={strobe} position={[0, 0.4, 3.35]} scale={[0.7, 0.7, 1]}>
          <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>

        {/* Keep the game's firing feedback attached to the forward wing roots. */}
        {[-1.35, 1.35].map((x, index) => (
          <sprite
            key={x}
            ref={(element) => {
              muzzles.current[index] = element;
            }}
            position={[x, -0.12, -2.3]}
            visible={false}
          >
            <spriteMaterial
              map={hoverTexture}
              color="#bff6ff"
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        ))}

        <sprite ref={hoverGlow} position={[0, -0.75, 0.4]} visible={false}>
          <spriteMaterial map={hoverTexture} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        <pointLight
          ref={hoverLight}
          position={[0, -2.2, 0.4]}
          color="#9cc4ff"
          distance={26}
          decay={1.5}
          intensity={0}
        />
        <EntryPlasma />
      </group>
    </group>
  );
}
