// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { rocketLive, useSpace } from "./store";

/* ------------------------------------------------------------------ */
/*  Space dust: faint streaks rushing past, so you can feel the speed  */
/* ------------------------------------------------------------------ */
const DUST = 700;
const BOX = { x: 70, y: 45, ahead: 260, behind: 30 };

export function SpaceDust() {
  const lines = useRef<THREE.LineSegments>(null);
  const seeds = useMemo(() => {
    const a = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      a[i * 3] = (Math.random() * 2 - 1) * BOX.x;
      a[i * 3 + 1] = (Math.random() * 2 - 1) * BOX.y;
      a[i * 3 + 2] = -Math.random() * BOX.ahead;
    }
    return a;
  }, []);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(DUST * 6), 3));
    return g;
  }, []);

  useFrame(() => {
    const rz = rocketLive.pos.z;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const len = 0.2 + rocketLive.speed * 0.045;
    for (let i = 0; i < DUST; i++) {
      // Keep each speck inside a box that travels with the rocket.
      let z = seeds[i * 3 + 2];
      while (z > rz + BOX.behind) z -= BOX.ahead + BOX.behind;
      while (z < rz - BOX.ahead) z += BOX.ahead + BOX.behind;
      seeds[i * 3 + 2] = z;
      const x = seeds[i * 3] + rocketLive.pos.x * 0.2;
      const y = seeds[i * 3 + 1] + rocketLive.pos.y * 0.2;
      pos.setXYZ(i * 2, x, y, z);
      pos.setXYZ(i * 2 + 1, x, y, z + len);
    }
    pos.needsUpdate = true;
  });

  return (
    <lineSegments ref={lines} geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial color="#a9b6d6" transparent opacity={0.35} depthWrite={false} />
    </lineSegments>
  );
}

/* ------------------------------------------------------------------ */
/*  Explosion                                                          */
/* ------------------------------------------------------------------ */
const SPARKS = 320;
const DEBRIS = 14;
const LIFE = 2.6;

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,240,1)");
  grd.addColorStop(0.25, "rgba(255,190,90,0.8)");
  grd.addColorStop(0.6, "rgba(255,80,20,0.25)");
  grd.addColorStop(1, "rgba(120,20,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function Explosion() {
  const group = useRef<THREE.Group>(null);
  const flash = useRef<THREE.Sprite>(null);
  const fireball = useRef<THREE.Sprite>(null);
  const ring = useRef<THREE.Mesh>(null);
  const sparks = useRef<THREE.Points>(null);
  const debris = useRef<(THREE.Mesh | null)[]>([]);
  const state = useRef({ age: LIFE + 1 });

  const texture = useMemo(glowTexture, []);
  const sparkData = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
    return { geometry: g, vel: new Float32Array(SPARKS * 3) };
  }, []);
  const debrisVel = useMemo(
    () => Array.from({ length: DEBRIS }, () => ({ v: new THREE.Vector3(), spin: new THREE.Vector3() })),
    []
  );

  // Trigger when the rocket crashes.
  useEffect(
    () =>
      useSpace.subscribe((s, prev) => {
        if (s.phase !== "crashed" || prev.phase === "crashed") return;
        state.current.age = 0;
        group.current?.position.copy(rocketLive.pos);
        const pos = sparkData.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < SPARKS; i++) {
          pos.setXYZ(i, 0, 0, 0);
          const d = new THREE.Vector3().randomDirection().multiplyScalar(6 + Math.random() * 28);
          sparkData.vel.set([d.x, d.y, d.z - rocketLive.speed * 0.25], i * 3);
        }
        pos.needsUpdate = true;
        debris.current.forEach((m, i) => {
          if (!m) return;
          m.position.set(0, 0, 0);
          m.visible = true;
          debrisVel[i].v.randomDirection().multiplyScalar(5 + Math.random() * 10);
          debrisVel[i].spin.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        });
      }),
    [sparkData, debrisVel]
  );

  useFrame((frame, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = state.current;
    const active = s.age < LIFE;
    if (group.current) group.current.visible = active;
    if (!active) return;
    s.age += dt;
    const k = s.age / LIFE;

    if (flash.current) {
      const size = 5 + 16 * Math.min(1, s.age * 3);
      flash.current.scale.set(size, size, 1);
      flash.current.material.opacity = Math.max(0, 1 - s.age * 1.6);
    }
    if (fireball.current) {
      const size = 3 + 8 * Math.sqrt(k);
      fireball.current.scale.set(size, size, 1);
      fireball.current.material.opacity = Math.pow(1 - k, 2) * 0.8;
    }
    if (ring.current) {
      ring.current.quaternion.copy(frame.camera.quaternion);
      const size = 1 + 24 * Math.sqrt(k);
      ring.current.scale.set(size, size, size);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.35 * Math.pow(Math.max(0, 1 - k * 1.6), 2);
    }

    const pos = sparkData.geometry.attributes.position as THREE.BufferAttribute;
    const col = sparkData.geometry.attributes.color as THREE.BufferAttribute;
    const hot = new THREE.Color("#fff3c4");
    const fire = new THREE.Color("#ff6a1a");
    const ember = new THREE.Color("#3a0d02");
    const c = new THREE.Color();
    for (let i = 0; i < SPARKS; i++) {
      const vx = sparkData.vel[i * 3], vy = sparkData.vel[i * 3 + 1], vz = sparkData.vel[i * 3 + 2];
      pos.setXYZ(i, pos.getX(i) + vx * dt, pos.getY(i) + vy * dt, pos.getZ(i) + vz * dt);
      sparkData.vel[i * 3] *= 0.985;
      sparkData.vel[i * 3 + 1] *= 0.985;
      sparkData.vel[i * 3 + 2] *= 0.985;
      if (k < 0.25) c.copy(hot).lerp(fire, k * 4);
      else c.copy(fire).lerp(ember, (k - 0.25) / 0.75);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    if (sparks.current) (sparks.current.material as THREE.PointsMaterial).opacity = 1 - k;

    debris.current.forEach((m, i) => {
      if (!m) return;
      m.position.addScaledVector(debrisVel[i].v, dt);
      m.rotation.x += debrisVel[i].spin.x * dt;
      m.rotation.y += debrisVel[i].spin.y * dt;
      m.rotation.z += debrisVel[i].spin.z * dt;
    });
  });

  return (
    <group ref={group} visible={false}>
      <sprite ref={flash}>
        <spriteMaterial map={texture} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite ref={fireball}>
        <spriteMaterial
          map={texture}
          color="#ff7a2e"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <mesh ref={ring}>
        <ringGeometry args={[0.975, 1, 96]} />
        <meshBasicMaterial
          color="#ffd2a1"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <points ref={sparks} geometry={sparkData.geometry} frustumCulled={false}>
        <pointsMaterial
          size={0.7}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          map={texture}
        />
      </points>
      {Array.from({ length: DEBRIS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            debris.current[i] = el;
          }}
        >
          <boxGeometry args={[0.15 + (i % 3) * 0.12, 0.08, 0.3 + (i % 4) * 0.15]} />
          <meshStandardMaterial color={i % 3 === 0 ? "#1c2230" : "#d9dde3"} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
