// SPIKE: throwaway prototype of the island game. Not production code.
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Ball, Box, Cyl, makeTextTexture } from "./prims";
import { DOCK_Y } from "./world";

const BLUE = "#2f5bff";
const YELLOW = "#f5c518";
const WOOD = "#87745c";

/** A flat sign with text. Faces +Z unless rotated. */
function TextBoard({
  text,
  height,
  color = "#0b0d14",
  bg = "#ffffff",
  ...props
}: {
  text: string;
  height: number;
  color?: string;
  bg?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const { texture, aspect } = useMemo(
    () => makeTextTexture(text, { color, bg, size: 96 }),
    [text, color, bg],
  );
  return (
    <mesh {...props}>
      <planeGeometry args={[height * aspect, height]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Dockyard: where the game starts                                   */
/* ------------------------------------------------------------------ */
export function Dockyard() {
  const containers: { p: [number, number, number]; c: string }[] = [
    { p: [16, 2.3, -22], c: "#e5484d" },
    { p: [16, 2.3, -18.6], c: BLUE },
    { p: [23, 2.3, -22], c: "#f5a524" },
    { p: [23, 2.3, -18.6], c: "#12a594" },
    { p: [16, 4.9, -22], c: "#12a594" },
    { p: [19.5, 4.9, -18.6], c: "#e5484d" },
    { p: [29.5, 2.3, -22], c: BLUE },
    { p: [-8, 2.3, -9], c: "#f5a524" },
  ];

  return (
    <group>
      {/* quay */}
      <Box
        size={[68, 3, 26]}
        color="#c9ced6"
        position={[0, -0.5, -17]}
        castShadow={false}
      />
      <Box
        size={[68, 0.06, 0.8]}
        color={YELLOW}
        position={[0, DOCK_Y + 0.03, -4.6]}
        castShadow={false}
      />

      {/* pier */}
      <Box size={[6, 0.5, 30]} color={WOOD} position={[0, 0.75, 11]} />
      {[0, 6, 12, 18, 24].flatMap((z) =>
        [-2.7, 2.7].map((x) => (
          <Cyl
            key={`${x}-${z}`}
            args={[0.28, 0.28, 3.4, 8]}
            color="#7a5637"
            position={[x, -0.4, z]}
          />
        )),
      )}
      {[-2.4, 2.4].map((x) => (
        <Cyl
          key={x}
          args={[0.2, 0.26, 0.6, 8]}
          color="#1c2230"
          position={[x, 1.3, 25]}
        />
      ))}

      {Array.from({ length: 50 }, (_, i) => (
        <Box
          key={`plank-${i}`}
          size={[5.96, 0.035, 0.55]}
          color={i % 3 === 0 ? "#9b886d" : "#82715a"}
          position={[0, 1.017, -3.7 + i * 0.6]}
        />
      ))}
      {/* warehouse */}
      <Box size={[18, 7, 10]} color="#eef2f7" position={[-20, 4.5, -22]} />
      <Box size={[19, 0.6, 11]} color="#1c2230" position={[-20, 8.3, -22]} />
      <Box size={[5.5, 4.6, 0.2]} color={BLUE} position={[-20, 3.3, -16.95]} />
      <TextBoard
        text="DOCKYARD"
        height={1.5}
        position={[-20, 6.7, -16.9]}
        bg="#1c2230"
        color="#ffffff"
      />

      {/* containers */}
      {containers.map((b, i) => (
        <Box key={i} size={[6, 2.6, 2.6]} color={b.c} position={b.p} />
      ))}

      {/* gantry crane */}
      {[
        [17, -11],
        [23, -11],
        [17, -6],
        [23, -6],
      ].map(([x, z]) => (
        <Box
          key={`${x}${z}`}
          size={[0.6, 12, 0.6]}
          color={YELLOW}
          position={[x, 7, z]}
        />
      ))}
      <Box size={[7.2, 0.8, 6]} color={YELLOW} position={[20, 13.2, -8.5]} />
      <Box size={[1, 0.8, 22]} color={YELLOW} position={[20, 13.9, 1]} />
      <Box size={[2.2, 2, 2.2]} color="#eef2f7" position={[20, 12, -6.5]} />
      <Box size={[0.12, 5, 0.12]} color="#1c2230" position={[20, 11, 9]} />
      <Box size={[0.9, 0.5, 0.9]} color="#1c2230" position={[20, 8.4, 9]} />

      {/* lamp posts */}
      {[-30, -10, 10, 30].map((x) => (
        <group key={x} position={[x, DOCK_Y, -6]}>
          <Cyl
            args={[0.1, 0.12, 5, 6]}
            color="#1c2230"
            position={[0, 2.5, 0]}
          />
          <Box size={[0.9, 0.16, 0.3]} color="#fff7c2" position={[0.3, 5, 0]} />
        </group>
      ))}

      {/* signpost at the end of the pier */}
      <Cyl
        args={[0.09, 0.09, 3, 6]}
        color="#1c2230"
        position={[-2.6, 2.5, 25.5]}
      />
      <TextBoard
        text="EXPLORE THE ISLANDS  ↑"
        height={0.75}
        position={[-2.6, 3.6, 25.5]}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Skills island                                                     */
/* ------------------------------------------------------------------ */
/** Curved trunks and continuous feathered fronds, rather than stacked leaf blobs. */
export function Palm({
  position,
  s = 1,
}: {
  position: [number, number, number];
  s?: number;
}) {
  const crown = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const trunk = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.15, 2, 0),
        new THREE.Vector3(0.55, 4.5, 0.1),
        new THREE.Vector3(0.95, 7, 0.25),
      ]),
      20,
      0.19,
      10,
      false,
    );
    const vertices: number[] = [];
    // Each tapered leaflet is a curved ribbon sharing one mesh per canopy.
    const point = (t: number, a: number) =>
      new THREE.Vector3(
        Math.sin(a) * t * 4.2,
        Math.sin(t * Math.PI) * 0.9 - t * t * 1.8,
        Math.cos(a) * t * 4.2,
      );
    for (let f = 0; f < 11; f++) {
      const a = (f * Math.PI * 2) / 11;
      for (let j = 1; j < 23; j++) {
        const t = j / 24,
          mid = point(t, a),
          next = point(t + 0.035, a);
        for (const side of [-1, 1]) {
          const width = Math.sin(t * Math.PI) * 0.72;
          const tip = mid
            .clone()
            .add(
              new THREE.Vector3(
                Math.cos(a) * width * side,
                -0.18,
                -Math.sin(a) * width * side,
              ),
            )
            .add(new THREE.Vector3(Math.sin(a) * 0.24, 0, Math.cos(a) * 0.24));
          vertices.push(...mid.toArray(), ...tip.toArray(), ...next.toArray());
        }
      }
    }
    const leaves = new THREE.BufferGeometry();
    leaves.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    leaves.computeVertexNormals();
    return { trunk, leaves };
  }, []);
  useEffect(
    () => () => {
      geometry.trunk.dispose();
      geometry.leaves.dispose();
    },
    [geometry],
  );
  useFrame(({ clock }) => {
    if (crown.current) {
      crown.current.rotation.z =
        Math.sin(clock.elapsedTime * 0.85 + position[0]) * 0.045;
      crown.current.rotation.x =
        Math.cos(clock.elapsedTime * 0.65 + position[2]) * 0.025;
    }
  });
  return (
    <group position={position} scale={s} rotation-y={position[0] * 1.7}>
      <mesh geometry={geometry.trunk} castShadow receiveShadow>
        <meshStandardMaterial color="#89755a" roughness={1} />
      </mesh>
      {Array.from({ length: 15 }, (_, i) => (
        <mesh
          key={i}
          position={[
            0.95 * Math.pow(i / 15, 1.5),
            (i * 7) / 15,
            (0.25 * i) / 15,
          ]}
          rotation-x={Math.PI / 2}
        >
          <torusGeometry args={[0.195, 0.013, 4, 10]} />
          <meshStandardMaterial color="#625642" roughness={1} />
        </mesh>
      ))}
      <group ref={crown} position={[0.95, 7, 0.25]}>
        <mesh geometry={geometry.leaves} castShadow>
          <meshStandardMaterial
            color="#42683c"
            roughness={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
        <Ball
          r={0.24}
          color="#695335"
          detail={2}
          position={[0.18, -0.22, 0.1]}
        />
        <Ball
          r={0.22}
          color="#786140"
          detail={2}
          position={[-0.15, -0.28, -0.12]}
        />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  A few drifting clouds                                             */
/* ------------------------------------------------------------------ */
export function Clouds() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!group.current) return;
    for (const c of group.current.children) {
      c.position.x += dt * 1.2;
      if (c.position.x > 320) c.position.x = -320;
    }
  });
  const clouds: [number, number, number, number][] = [
    [-180, 62, 120, 1.3],
    [-60, 74, 300, 1.7],
    [90, 58, 60, 1.1],
    [200, 70, 260, 1.5],
    [-260, 66, 380, 1.2],
    [30, 80, 420, 1.9],
  ];
  return (
    <group ref={group}>
      {clouds.map(([x, y, z, s], i) => (
        <group key={i} position={[x, y, z]} scale={[s * 9, s * 3.4, s * 6]}>
          {[
            [0, 0, 0, 1],
            [0.9, -0.1, 0.2, 0.75],
            [-0.9, -0.15, -0.1, 0.7],
          ].map(([cx, cy, cz, cs], j) => (
            <mesh key={j} position={[cx, cy, cz]} scale={cs}>
              <icosahedronGeometry args={[1, 3]} />
              <meshStandardMaterial
                color="#f0ece1"
                roughness={1}
                transparent
                opacity={0.82}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
