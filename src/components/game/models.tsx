// SPIKE: throwaway prototype of the island game. Not production code.
"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { Rounded, Beam } from "./details";
import { Cyl } from "./prims";
import { boatPark, motion } from "./store";
import { Woody } from "./woody";
import { waveHeight } from "./world";

const SKIN = "#e7b98c";
const BLUE = "#577367";
const ORANGE = "#b9793f";
const DARK = "#1c2230";

/* ------------------------------------------------------------------ */
/*  Hiker: walks on land, swims at sea. Feet at the origin, faces +Z. */
/* ------------------------------------------------------------------ */
function Head() {
  return (
    <group>
      <mesh scale={[0.84, 1.08, 0.9]} castShadow>
        <sphereGeometry args={[0.19, 24, 20]} />
        <meshStandardMaterial color={SKIN} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.065, -0.015]} scale={[0.88, 0.8, 0.92]} castShadow>
        <sphereGeometry
          args={[0.195, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]}
        />
        <meshStandardMaterial color="#332e28" roughness={1} />
      </mesh>
      <mesh position={[0, -0.025, 0.17]} scale={[0.7, 1, 1]}>
        <sphereGeometry args={[0.04, 12, 10]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.065, 0.025, 0.163]} scale={[1, 0.55, 0.6]}>
            <sphereGeometry args={[0.018, 12, 8]} />
            <meshStandardMaterial color="#292f2c" />
          </mesh>
          <mesh position={[side * 0.165, -0.005, 0]} scale={[0.5, 1, 0.7]}>
            <sphereGeometry args={[0.045, 12, 10]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>
        </group>
      ))}
      <Rounded
        size={[0.065, 0.008, 0.008]}
        color="#8a5a46"
        position={[0, -0.09, 0.166]}
      />
    </group>
  );
}
function Limb({
  length,
  radius,
  color,
}: {
  length: number;
  radius: number;
  color: string;
}) {
  return (
    <mesh position={[0, -length / 2, 0]} castShadow>
      <capsuleGeometry args={[radius, length - radius * 2, 8, 12]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}
export function Hiker() {
  const body = useRef<THREE.Group>(null);
  const arms = useRef<(THREE.Group | null)[]>([]),
    elbows = useRef<(THREE.Group | null)[]>([]);
  const legs = useRef<(THREE.Group | null)[]>([]),
    knees = useRef<(THREE.Group | null)[]>([]);
  const phase = useRef(0);
  useFrame(({ clock }, dt) => {
    const swim = motion.mode === "swim",
      speed = Math.min(Math.abs(motion.speed) / (swim ? 3.6 : 6), 1);
    phase.current += Math.min(dt, 0.05) * (2 + speed * 8);
    const t = phase.current;
    for (let i = 0; i < 2; i++) {
      const cycle = t + i * Math.PI,
        swing = Math.sin(cycle) * speed;
      if (legs.current[i])
        legs.current[i]!.rotation.x = swing * (swim ? 0.3 : 0.65);
      if (knees.current[i])
        knees.current[i]!.rotation.x =
          Math.max(0, -Math.sin(cycle)) * 0.95 * speed;
      if (arms.current[i])
        arms.current[i]!.rotation.x = swim
          ? -2.5 + Math.sin(cycle) * 0.9
          : -swing * 0.5;
      if (elbows.current[i])
        elbows.current[i]!.rotation.x = -0.18 - Math.max(0, swing) * 0.4;
    }
    if (body.current) {
      body.current.rotation.set(
        swim ? 1.3 : speed * 0.045,
        0,
        swim ? 0 : Math.sin(t) * speed * 0.025,
      );
      body.current.position.y = swim
        ? 0
        : Math.abs(Math.cos(t)) * 0.025 * speed +
          Math.sin(clock.elapsedTime * 2) * 0.006;
    }
  });
  return (
    <group ref={body}>
      <Rounded size={[0.43, 0.52, 0.26]} color={BLUE} position={[0, 1.18, 0]} />
      <Rounded
        size={[0.38, 0.18, 0.25]}
        color="#6f715f"
        position={[0, 0.86, 0]}
      />
      <Rounded
        size={[0.42, 0.045, 0.28]}
        color="#4b4337"
        position={[0, 0.94, 0]}
      />
      <Cyl
        args={[0.075, 0.085, 0.13, 16]}
        color={SKIN}
        position={[0, 1.48, 0]}
      />
      <group position={[0, 1.67, 0]}>
        <Head />
      </group>
      <Rounded
        size={[0.32, 0.43, 0.19]}
        color="#9b7750"
        position={[0, 1.2, -0.21]}
      />
      <Rounded
        size={[0.26, 0.18, 0.07]}
        color="#806142"
        position={[0, 1.12, -0.33]}
      />
      {[-1, 1].map((side, i) => (
        <group key={side}>
          <Rounded
            size={[0.042, 0.46, 0.035]}
            color="#424e43"
            position={[side * 0.14, 1.2, 0.15]}
          />
          <group
            position={[side * 0.27, 1.39, 0]}
            ref={(el) => {
              arms.current[i] = el;
            }}
          >
            <Limb length={0.28} radius={0.075} color={BLUE} />
            <group
              position={[0, -0.28, 0]}
              ref={(el) => {
                elbows.current[i] = el;
              }}
            >
              <Limb length={0.26} radius={0.055} color={SKIN} />
              <Rounded
                size={[0.09, 0.12, 0.07]}
                color={SKIN}
                position={[0, -0.29, 0]}
              />
            </group>
          </group>
          <group
            position={[side * 0.115, 0.85, 0]}
            ref={(el) => {
              legs.current[i] = el;
            }}
          >
            <Limb length={0.37} radius={0.105} color="#686c5d" />
            <group
              position={[0, -0.37, 0]}
              ref={(el) => {
                knees.current[i] = el;
              }}
            >
              <Limb length={0.34} radius={0.08} color="#686c5d" />
              <Rounded
                size={[0.18, 0.15, 0.32]}
                color="#574d3e"
                position={[0, -0.36, 0.055]}
              />
              <Rounded
                size={[0.19, 0.035, 0.33]}
                color="#303b35"
                position={[0, -0.43, 0.055]}
              />
              {[0, 1, 2].map((j) => (
                <Rounded
                  key={j}
                  size={[0.11, 0.012, 0.015]}
                  color="#b3a58b"
                  position={[0, -0.29, 0.05 + j * 0.035]}
                />
              ))}
            </group>
          </group>
        </group>
      ))}
    </group>
  );
}

/** A seated driver for the boat and the buggy. */
function Driver(props: { position: [number, number, number] }) {
  return (
    <group position={props.position}>
      <Rounded size={[0.42, 0.46, 0.25]} color={BLUE} position={[0, 0.3, 0]} />
      <group position={[0, 0.76, 0]}>
        <Head />
      </group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <group position={[side * 0.26, 0.5, 0]} rotation-x={-1}>
            <Limb length={0.45} radius={0.065} color={SKIN} />
          </group>
          <group position={[side * 0.12, 0.05, 0]} rotation-x={-1.4}>
            <Limb length={0.4} radius={0.09} color="#686c5d" />
          </group>
        </group>
      ))}
    </group>
  );
}

/** A continuous lofted hull with a pointed bow and a rounded bilge. */
function useHull() {
  const geometry = useMemo(() => {
    const sections = [
      [-2.6, 0.88],
      [-2.3, 1.05],
      [-1.3, 1.14],
      [0, 1.17],
      [1.3, 1.05],
      [2.3, 0.75],
      [3.15, 0.3],
      [3.55, 0.015],
    ];
    const vertices: number[] = [],
      indices: number[] = [];
    sections.forEach(([z, w]) => {
      for (let j = 0; j <= 16; j++) {
        const a = (j / 16) * Math.PI;
        vertices.push(Math.cos(a) * w, 0.65 - Math.sin(a) * 0.95, z);
      }
    });
    for (let i = 0; i < sections.length - 1; i++)
      for (let j = 0; j < 16; j++) {
        const a = i * 17 + j,
          b = a + 17;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}
export function SpeedBoat({ withDriver = true }: { withDriver?: boolean }) {
  const hull = useHull();
  const deck = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.88, 2.6);
    shape.lineTo(0.88, 2.6);
    shape.bezierCurveTo(1.35, 1.8, 1.3, -1.9, 0, -3.55);
    shape.bezierCurveTo(-1.3, -1.9, -1.35, 1.8, -0.88, 2.6);
    const hole = new THREE.Path();
    hole.moveTo(-0.86, 2.05);
    hole.lineTo(-0.86, -0.55);
    hole.lineTo(0.86, -0.55);
    hole.lineTo(0.86, 2.05);
    hole.closePath();
    shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.09,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 2,
      steps: 1,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  useEffect(() => () => deck.dispose(), [deck]);
  return (
    <group>
      <mesh geometry={deck} position-y={0.65} castShadow receiveShadow>
        <meshStandardMaterial color="#d8dfd4" roughness={0.4} />
      </mesh>
      <Rounded
        size={[1.7, 0.7, 0.1]}
        color="#d8dfd4"
        position={[0, 0.28, -2.6]}
      />
      <mesh geometry={hull} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#e6e6d9"
          roughness={0.25}
          metalness={0.12}
          clearcoat={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Rounded
        size={[1.9, 0.12, 3.8]}
        color="#a38c67"
        position={[0, 0.58, -0.5]}
      />
      <Rounded
        size={[1.74, 0.25, 1.6]}
        color="#e1e2d7"
        position={[0, 0.65, 1.25]}
      />
      <Rounded
        size={[1.7, 0.5, 0.55]}
        color="#45605c"
        position={[0, 0.91, 0.5]}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Beam
            a={[side * 1.08, 0.7, -2.3]}
            b={[side * 1.08, 0.7, 1.3]}
            r={0.075}
            color="#557a76"
          />
          <Beam
            a={[side * 1.08, 0.7, 1.3]}
            b={[side * 0.1, 0.7, 3.4]}
            r={0.06}
            color="#557a76"
          />
          <Beam
            a={[side * 0.94, 1, 1.1]}
            b={[side * 0.1, 1, 3.15]}
            r={0.025}
            color="#b6c4c2"
          />
          <Rounded
            size={[0.7, 0.18, 0.7]}
            color="#b39a78"
            position={[side * 0.5, 0.83, -0.5]}
          />
          <Rounded
            size={[0.7, 0.65, 0.16]}
            color="#b39a78"
            position={[side * 0.5, 1.05, -0.88]}
            rotation-x={-0.12}
          />
          <mesh position={[side * 1.03, 0.73, 1.3]}>
            <sphereGeometry args={[0.055, 12, 8]} />
            <meshStandardMaterial
              color={side === 1 ? "#b85643" : "#81a97c"}
              emissive={side === 1 ? "#b85643" : "#81a97c"}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.35, 0.8]} rotation-x={-0.4}>
        <boxGeometry args={[1.8, 0.65, 0.035]} />
        <meshPhysicalMaterial
          color="#a4c5c7"
          transparent
          opacity={0.35}
          roughness={0.1}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0.5, 1.15, 0.17]} rotation-x={0.7}>
        <torusGeometry args={[0.2, 0.022, 8, 24]} />
        <meshStandardMaterial color="#2a3e3b" metalness={0.4} />
      </mesh>
      <Rounded
        size={[0.65, 0.8, 0.55]}
        color="#344c49"
        position={[0, 0.55, -2.8]}
        metal={0.35}
      />
      <Beam a={[0, 0.3, -2.8]} b={[0, -0.6, -2.8]} r={0.09} />
      <Rounded
        size={[0.65, 0.06, 0.13]}
        color="#8d9e9c"
        position={[0, -0.55, -2.9]}
        metal={0.7}
      />
      {withDriver && (
        <Suspense fallback={<Driver position={[0.5, 0.05, -0.45]} />}>
          <group position={[0.5, 0.05, -0.45]}>
            <Woody seated />
          </group>
        </Suspense>
      )}
    </group>
  );
}

/** The boat tied up at the shore while the player is on land or swimming. */
export function MooredBoat() {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.visible = motion.mode !== "boat";
    group.current.position.set(
      boatPark.x,
      waveHeight(boatPark.x, boatPark.z, t) * 0.7 + 0.1,
      boatPark.z,
    );
    group.current.rotation.set(
      Math.sin(t * 1.3) * 0.03,
      boatPark.heading,
      Math.sin(t * 1.1) * 0.04,
    );
  });
  return (
    <group ref={group}>
      <SpeedBoat withDriver={false} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Buggy. Wheels on the ground at the origin, faces +Z.              */
/* ------------------------------------------------------------------ */
function ProceduralBuggy() {
  const wheels = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, dt) => {
    wheels.current.forEach((wheel, i) => {
      if (!wheel) return;
      wheel.rotation.x += (motion.speed * Math.min(dt, 0.05)) / 0.42;
      if (i < 2) wheel.rotation.y = motion.turn * 0.32;
    });
  });

  const wheelAt: [number, number, number][] = [
    [0.86, 0.42, 0.95],
    [-0.86, 0.42, 0.95],
    [0.86, 0.42, -0.95],
    [-0.86, 0.42, -0.95],
  ];

  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Beam
            a={[side * 0.6, 0.6, -1.2]}
            b={[side * 0.6, 1.9, -0.6]}
            r={0.055}
          />
          <Beam
            a={[side * 0.6, 1.9, -0.6]}
            b={[side * 0.6, 1.8, 0.5]}
            r={0.055}
          />
          <Beam
            a={[side * 0.6, 1.8, 0.5]}
            b={[side * 0.6, 0.7, 1.2]}
            r={0.055}
          />
          <Beam
            a={[side * 0.55, 0.6, 0.9]}
            b={[side * 0.86, 0.42, 0.95]}
            r={0.06}
          />
          <Beam
            a={[side * 0.55, 0.6, -0.9]}
            b={[side * 0.86, 0.42, -0.95]}
            r={0.06}
          />
        </group>
      ))}
      <Rounded
        size={[1.5, 0.12, 1.5]}
        color="#56695e"
        position={[0, 1.95, -0.05]}
      />
      <Beam a={[-0.9, 0.5, 1.5]} b={[0.9, 0.5, 1.5]} r={0.08} />
      <Beam a={[-0.9, 0.5, -1.5]} b={[0.9, 0.5, -1.5]} r={0.08} />
      <mesh position={[0, 1.25, 0.25]} rotation-x={0.7}>
        <torusGeometry args={[0.23, 0.025, 8, 24]} />
        <meshStandardMaterial color="#273831" />
      </mesh>
      <Rounded size={[1.5, 0.34, 2.7]} color={ORANGE} position={[0, 0.58, 0]} />
      <Rounded
        size={[1.3, 0.3, 0.8]}
        color={ORANGE}
        position={[0, 0.86, 0.85]}
      />
      <Rounded
        size={[1.2, 0.5, 0.5]}
        color={DARK}
        position={[0, 0.98, -0.45]}
      />
      {/* headlights */}
      <Rounded
        size={[0.26, 0.16, 0.06]}
        color="#fff7c2"
        position={[0.42, 0.88, 1.27]}
      />
      <Rounded
        size={[0.26, 0.16, 0.06]}
        color="#fff7c2"
        position={[-0.42, 0.88, 1.27]}
      />
      {wheelAt.map((p, i) => (
        <group
          key={i}
          position={p}
          ref={(el) => {
            wheels.current[i] = el;
          }}
        >
          <mesh rotation-y={Math.PI / 2} castShadow>
            <torusGeometry args={[0.29, 0.13, 12, 32]} />
            <meshStandardMaterial color="#303532" roughness={0.95} />
          </mesh>
          <Cyl
            args={[0.2, 0.2, 0.28, 24]}
            color="#a6aaa0"
            rotation={[0, 0, Math.PI / 2]}
          />
          {Array.from({ length: 16 }, (_, j) => (
            <Rounded
              key={j}
              size={[0.3, 0.055, 0.1]}
              color="#343b36"
              position={[
                0,
                Math.sin((j * Math.PI) / 8) * 0.41,
                Math.cos((j * Math.PI) / 8) * 0.41,
              ]}
              rotation-x={(-j * Math.PI) / 8}
            />
          ))}
          <Cyl
            args={[0.065, 0.065, 0.32, 16]}
            color="#45534e"
            rotation={[0, 0, Math.PI / 2]}
          />
        </group>
      ))}

      <Suspense fallback={<Driver position={[0, 0.83, -0.2]} />}>
        <group position={[0, 0.83, -0.2]} scale={0.52}>
          <Woody seated />
        </group>
      </Suspense>
    </group>
  );
}

/** Driver size in the buggy model's units (the model itself is drawn at 0.75). */
const BUGGY_DRIVER = 0.95;
/** Height of the driver's hips: just above the seat cushion (top at about 0.6). */
const BUGGY_HIP_Y = 0.7;
/** Legs stretched towards the pedals, arms forward to the wheel. */
const BUGGY_SEAT = { thigh: -1.45, knee: 0.6, shoulder: -1.15, elbow: 0.35 };

function BuggyModel() {
  const gltf = useLoader(GLTFLoader, "/images/island/hcr2_buggy.glb");
  const buggy = useMemo(() => {
    const model = cloneSkeleton(gltf.scene);
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return model;
  }, [gltf.scene]);
  const wheels = useMemo(
    () =>
      [
        "HCR2_Buggy_FL_Wheel_8",
        "HCR2_Buggy_FR_Wheel_9",
        "HCR2_Buggy_RL_Wheel_10",
        "HCR2_Buggy_RR_Wheel_11",
      ].map((name) => buggy.getObjectByName(name)),
    [buggy],
  );

  useFrame((_, dt) => {
    wheels.forEach((wheel, index) => {
      if (!wheel) return;
      wheel.rotation.x += (motion.speed * Math.min(dt, 0.05)) / 0.34;
      if (index < 2) wheel.rotation.y = motion.turn * 0.14;
    });
  });

  return (
    <group scale={0.75}>
      <primitive object={buggy} />
      {/* Driver: hips on the seat cushion, legs out to the pedals, hands on the wheel.
          Woody's hips are 1.05 above his feet, so lift the group to put them at the seat. */}
      <Suspense fallback={<Driver position={[0, 0.62, -0.4]} />}>
        <group position={[0, BUGGY_HIP_Y - 1.051 * BUGGY_DRIVER, -0.33]} scale={BUGGY_DRIVER}>
          <Woody seated seat={BUGGY_SEAT} />
        </group>
      </Suspense>
    </group>
  );
}

export function Buggy() {
  return (
    <Suspense fallback={<ProceduralBuggy />}>
      <BuggyModel />
    </Suspense>
  );
}
