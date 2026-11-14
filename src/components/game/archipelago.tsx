"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { islands, islandDistance, islandGround, heightAt } from "./world";
import { Palm } from "./scenery";
import { Box, Cyl, makeTextTexture } from "./prims";
import { Beam, Rounded, useGrain } from "./details";

type Island = (typeof islands)[number];
export function Sign({
  text,
  position,
  scale = 1,
}: {
  text: string;
  position: [number, number, number];
  scale?: number;
}) {
  const { texture, aspect } = useMemo(
    () => makeTextTexture(text, { size: 64, color: "#eee8d7", bg: "#263c37" }),
    [text],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group position={position} scale={scale} rotation-y={Math.PI}>
      <Cyl
        args={[0.07, 0.09, 2.4, 10]}
        color="#6f614c"
        position={[0, 1.2, 0]}
      />
      <mesh position={[0, 2.1, 0.03]}>
        <planeGeometry args={[aspect * 0.65, 0.65]} />
        <meshBasicMaterial map={texture} transparent />
      </mesh>
    </group>
  );
}
function Terrain({ island }: { island: Island }) {
  const grain = useGrain("#c9c4af");
  const geometry = useMemo(() => {
    const width = (island.r + 10) * island.sx * 2,
      depth = (island.r + 10) * island.sz * 2;
    const g = new THREE.PlaneGeometry(
      width,
      depth,
      Math.ceil(width / 1.5),
      Math.ceil(depth / 1.5),
    );
    g.rotateX(-Math.PI / 2);
    const a = g.attributes.position,
      colors = [];
    const sand = new THREE.Color(
      island.id === "contact" ? "#9d9b92" : "#e2cda4",
    );
    const inland = new THREE.Color(
      island.id === "experience"
        ? "#9d9b88"
        : island.id === "contact"
          ? "#6a7771"
          : island.id === "travel"
            ? "#607047"
            : "#94a065",
    );
    for (let k = 0; k < a.count; k++) {
      const x = a.getX(k),
        z = a.getZ(k),
        wx = x + island.cx,
        wz = z + island.cz;
      a.setY(k, islandGround(island, wx, wz));
      const d = islandDistance(island, wx, wz);
      const c = sand
        .clone()
        .lerp(
          inland,
          THREE.MathUtils.smoothstep(-d + Math.sin(x * 0.2) * 2, 5, 18),
        );
      if (Math.abs(x) < 4 && z < 10) c.lerp(sand, 0.65);
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [island]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      position={[island.cx, 0, island.cz]}
      receiveShadow
    >
      <meshStandardMaterial map={grain} vertexColors roughness={1} />
    </mesh>
  );
}
/** Branching coastal canopy assembled as one leaf mesh per tree. */
function CoastalTree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  const crown = useRef<THREE.Group>(null);
  const leaves = useMemo(() => {
    const positions: number[] = [],
      colors: number[] = [];
    const hash = (n: number) => {
      const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < 850; i++) {
      const a = hash(i + 1) * Math.PI * 2,
        v = hash(i + 1001) * 2 - 1,
        radius = Math.pow(hash(i + 2001), 0.33);
      const spread = Math.sqrt(1 - v * v),
        cx = Math.cos(a) * spread * radius * 3.4,
        cy = 6.7 + v * radius * 2.4,
        cz = Math.sin(a) * spread * radius * 3.1;
      const angle = hash(i + 3001) * Math.PI * 2,
        length = 0.25 + hash(i + 4001) * 0.25;
      const u = new THREE.Vector3(
          Math.cos(angle) * length,
          0.1,
          Math.sin(angle) * length,
        ),
        w = new THREE.Vector3(
          -Math.sin(angle) * 0.12,
          0.04,
          Math.cos(angle) * 0.12,
        ),
        c = new THREE.Vector3(cx, cy, cz);
      const tips = [
        c.clone().sub(u),
        c.clone().add(w),
        c.clone().add(u),
        c.clone().sub(w),
      ];
      const col = new THREE.Color().setHSL(
        0.23 + hash(i + 5001) * 0.06,
        0.24 + hash(i + 6001) * 0.12,
        0.2 + hash(i + 7001) * 0.15,
      );
      for (const k of [0, 1, 2, 0, 2, 3]) {
        positions.push(...tips[k].toArray());
        colors.push(col.r, col.g, col.b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => leaves.dispose(), [leaves]);
  useFrame(({ clock }) => {
    if (crown.current)
      crown.current.rotation.z = Math.sin(clock.elapsedTime * 0.7 + x) * 0.016;
  });
  return (
    <group position={[x, heightAt(x, z) ?? 3, z]} scale={s}>
      <Cyl args={[0.2, 0.45, 6, 16]} color="#6b6250" position={[0, 3, 0]} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Beam
          key={i}
          a={[0, 3 + i * 0.35, 0]}
          b={[Math.sin(i * 2.4) * 2, 6.4, Math.cos(i * 2.4) * 2]}
          r={0.13}
          color="#6b6250"
        />
      ))}
      <group ref={crown}>
        <mesh geometry={leaves} castShadow receiveShadow>
          <meshStandardMaterial
            vertexColors
            roughness={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
function Meadow({ island }: { island: Island }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    let count = 0;
    for (let i = 0; i < 450; i++) {
      const a = i * 2.399,
        rad = 15 + ((i * 17) % (island.r - 22)),
        x = island.cx + Math.sin(a) * rad * island.sx,
        z = island.cz + Math.cos(a) * rad * island.sz;
      if (islandDistance(island, x, z) > -8 || Math.abs(x - island.cx) < 6)
        continue;
      dummy.position.set(x, (heightAt(x, z) ?? 3) + 0.22, z);
      dummy.rotation.set(0, a, 0.1);
      dummy.scale.set(0.6 + (i % 3) * 0.15, 0.6 + (i % 4) * 0.2, 1);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(count++, dummy.matrix);
    }
    mesh.current.count = count;
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [island]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 450]}>
      <coneGeometry args={[0.12, 0.65, 3]} />
      <meshStandardMaterial color="#7f8959" roughness={1} />
    </instancedMesh>
  );
}
function Rocks({ island }: { island: Island }) {
  return (
    <>
      {Array.from({ length: island.id === "contact" ? 25 : 7 }, (_, i) => {
        const a = i * 2.399,
          r = island.r - 4 + (i % 3),
          x = island.cx + Math.sin(a) * r * island.sx,
          z = island.cz + Math.cos(a) * r * island.sz;
        return (
          <mesh
            key={i}
            position={[x, (heightAt(x, z) ?? 0) + 0.2, z]}
            scale={[1.6 + (i % 3), 1 + (i % 2), 1.2]}
            rotation={[i * 0.2, i, 0]}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={island.id === "contact" ? "#737c7b" : "#999485"}
              roughness={1}
            />
          </mesh>
        );
      })}
    </>
  );
}
function Workshop() {
  return (
    <group position={[0, 3, 497]}>
      {[-4, 4].flatMap((x) =>
        [-3, 3].map((z) => (
          <Cyl
            key={`${x}-${z}`}
            args={[0.15, 0.19, 5, 12]}
            color="#8a7150"
            position={[x, 2.5, z]}
          />
        )),
      )}
      <Rounded size={[9, 0.35, 7]} color="#658b7a" position={[0, 5, 0]} />
      <Rounded size={[5, 0.3, 2]} color="#967b56" position={[0, 1.4, 0]} />
      {[-2, 2].map((x) => (
        <Rounded
          key={x}
          size={[0.18, 1.4, 1.6]}
          color="#33463d"
          position={[x, 0.7, 0]}
        />
      ))}
      <Rounded size={[2, 1.1, 0.16]} color="#192e2c" position={[0, 2.2, 0]} />
      {["#83c4b5", "#ecbd75", "#8daed7", "#d69e9d"].map((c, i) => (
        <mesh key={c} position={[-0.65 + i * 0.43, 2.2, 0.1]}>
          <boxGeometry args={[0.28, 0.35, 0.02]} />
          <meshStandardMaterial
            color={c}
            emissive={c}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
      <Sign
        text="THE WORKSHOP · R TO EXPLORE"
        position={[0, 0, -6]}
        scale={1.3}
      />
      <Sign text="Frontend  /  Backend" position={[-5, 0, -2]} />
    </group>
  );
}
function Harbor() {
  return (
    <group position={[-360, 3, 179]}>
      <Rounded size={[10, 6, 7]} color="#a5aaa0" position={[0, 3, 0]} />
      <mesh position={[0, 6.3, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[5.8, 5.8, 8, 3]} />
        <meshStandardMaterial color="#546568" roughness={0.8} />
      </mesh>
      <Rounded size={[4, 3, 0.15]} color="#2c4647" position={[0, 1.5, -3.55]} />
      {[-3, 3].map((x) => (
        <Rounded
          key={x}
          size={[1.5, 1.2, 0.16]}
          color="#91b4bc"
          position={[x, 3.8, -3.55]}
        />
      ))}
      <Sign
        text="THE SHIPYARD · CAREER ARCHIVE"
        position={[0, 0, -10]}
        scale={1.3}
      />
      {[0, 1, 2].map((i) => (
        <group key={i} position={[15, i === 2 ? 3 : 0, (i % 2) * 5]}>
          <Rounded
            size={[8, 3, 3.5]}
            color={["#667f7d", "#b4946b", "#7b8d98"][i]}
            position={[0, 1.5, 0]}
          />
          {Array.from({ length: 12 }, (_, j) => (
            <Box
              key={j}
              size={[0.08, 2.7, 0.06]}
              color="#495f60"
              position={[-3.7 + j * 0.65, 1.5, -1.78]}
            />
          ))}
        </group>
      ))}
      <Beam a={[-18, 0, 5]} b={[-18, 18, 5]} r={0.3} color="#b59862" />
      <Beam a={[-18, 18, 5]} b={[-5, 18, 5]} r={0.25} color="#b59862" />
      <Beam a={[-5, 18, 5]} b={[-5, 9, 5]} r={0.025} />
      <mesh position={[-5, 8.7, 5]} rotation-z={0.4}>
        <torusGeometry args={[0.45, 0.09, 10, 24, Math.PI * 1.5]} />
        <meshStandardMaterial color="#344744" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}
function Camp() {
  return (
    <group position={[342, heightAt(342, 179) ?? 3, 179]}>
      <mesh position={[0, 1.6, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[3.2, 3.2, 4.5, 3]} />
        <meshStandardMaterial color="#c69b62" roughness={1} />
      </mesh>
      <Rounded size={[1.6, 2, 0.1]} color="#344840" position={[0, 1, -2.3]} />
      <Beam a={[-4, 0, -4]} b={[0, 3.3, -2]} r={0.018} color="#d8c9a4" />
      <Beam a={[4, 0, -4]} b={[0, 3.3, -2]} r={0.018} color="#d8c9a4" />
      <Sign text="BASECAMP · TRAVEL JOURNAL" position={[3, 0, -7]} />
      {[-1, 1].map((k) => (
        <Cyl
          key={k}
          args={[0.4, 0.4, 3, 12]}
          color="#74634a"
          rotation-z={Math.PI / 2}
          position={[k * 4, 0.4, 3]}
        />
      ))}
      <mesh position={[0, 0.12, 3]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1, 1.5, 16]} />
        <meshStandardMaterial color="#76776b" roughness={1} />
      </mesh>
    </group>
  );
}
function Lighthouse() {
  const beam = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (beam.current) beam.current.rotation.y = clock.elapsedTime * 0.35;
  });
  return (
    <group position={[10, heightAt(10, 1030) ?? 3, 1030]}>
      <Cyl args={[2.1, 3.5, 18, 32]} color="#d8d9ce" position={[0, 9, 0]} />
      {[5, 11].map((y) => (
        <Cyl
          key={y}
          args={[3.5 - y * 0.078, 3.5 - (y - 2) * 0.078, 2, 32]}
          color="#566f70"
          position={[0, y, 0]}
        />
      ))}
      <Cyl args={[3, 3, 0.3, 32]} color="#3a4b4a" position={[0, 18, 0]} />
      <Cyl args={[2, 2, 2.5, 24]} color="#8ca9a4" position={[0, 19.4, 0]} />
      <Cyl args={[0, 3, 2, 32]} color="#3a4b4a" position={[0, 21.5, 0]} />
      <group ref={beam} position={[0, 19.5, 0]}>
        <mesh rotation-x={Math.PI / 2} position={[0, 0, 12]}>
          <coneGeometry args={[4, 24, 24, 1, true]} />
          <meshBasicMaterial
            color="#ffe5ad"
            transparent
            opacity={0.035}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0, 2]}>
          <sphereGeometry args={[0.5, 16, 12]} />
          <meshStandardMaterial
            color="#ffe5ad"
            emissive="#ffe5ad"
            emissiveIntensity={3}
          />
        </mesh>
      </group>
      <Sign text="RADIO HOUSE · SAY HELLO" position={[-10, 0, -12]} />
      <Rounded size={[2, 1.4, 1]} color="#59756d" position={[-10, 0.7, -5]} />
      <Beam a={[-10, 1, -5]} b={[-10, 5, -5]} r={0.025} />
    </group>
  );
}
export function Archipelago() {
  return (
    <>
      {islands.map((island) => (
        <group key={island.id}>
          <Terrain island={island} />
          <Rocks island={island} />
          {(island.id === "travel" || island.id === "skills") && (
            <Meadow island={island} />
          )}
          <Sign
            text={`${island.label.toUpperCase()} ISLAND`}
            position={[island.cx, 0.6, island.cz - island.r * island.sz + 6]}
            scale={1.3}
          />
          {island.id === "skills" && (
            <>
              {Array.from({ length: 16 }, (_, i) => {
                const a = i * 2.4,
                  x = island.cx + Math.sin(a) * 58,
                  z = island.cz + Math.cos(a) * 40;
                return (
                  <Palm
                    key={i}
                    position={[x, heightAt(x, z) ?? 3, z]}
                    s={1.1 + (i % 3) * 0.2}
                  />
                );
              })}
              <Workshop />
            </>
          )}
          {island.id === "experience" && <Harbor />}
          {island.id === "travel" && (
            <>
              {Array.from({ length: 24 }, (_, i) => {
                const a = i * 2.4,
                  x = island.cx + Math.sin(a) * (45 + (i % 3) * 5),
                  z = island.cz + 20 + Math.cos(a) * (42 + (i % 3) * 5);
                return (
                  <CoastalTree key={i} x={x} z={z} s={0.8 + (i % 4) * 0.18} />
                );
              })}
              <Camp />
            </>
          )}
          {island.id === "contact" && <Lighthouse />}
        </group>
      ))}
    </>
  );
}
