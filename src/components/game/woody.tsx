"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { motion } from "./store";

const MODEL_URL = "/images/island/woody.glb";
const IDLE = "wdy_bm_idle_passive";
const WALK = "wdy_bm_walkf";
const RUN = "wdy_bm_runf";

/** Joint angles (radians) for a seated pose. The defaults suit the boat. */
export interface SeatPose {
  thigh: number;
  knee: number;
  shoulder: number;
  elbow?: number;
}
const BOAT_SEAT: SeatPose = { thigh: -1.05, knee: 1.35, shoulder: -0.45 };

export function Woody({ seated = false, seat = BOAT_SEAT }: { seated?: boolean; seat?: SeatPose }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL);
  const character = useMemo(() => clone(gltf.scene), [gltf.scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(character), [character]);
  const pose = useRef<THREE.Group>(null);
  const modelRoot = useRef<THREE.Group>(null);
  const activeAction = useRef<THREE.AnimationAction | null>(null);
  const activeClip = useRef("");
  const swimPhase = useRef(0);
  const seatBones = useMemo(
    () => ({
      shoulders: [
        character.getObjectByName("Shoulder_Left"),
        character.getObjectByName("Shoulder_Right"),
      ],
      thighs: [
        character.getObjectByName("Thigh_Left"),
        character.getObjectByName("Thigh_Right"),
      ],
      knees: [
        character.getObjectByName("Knee_Left"),
        character.getObjectByName("Knee_Right"),
      ],
      elbows: [
        character.getObjectByName("Elbow_Left"),
        character.getObjectByName("Elbow_Right"),
      ],
    }),
    [character],
  );
  const swimBones = useMemo(
    () => ({
      shoulders: [
        character.getObjectByName("Shoulder_Left"),
        character.getObjectByName("Shoulder_Right"),
      ],
      elbows: [
        character.getObjectByName("Elbow_Left"),
        character.getObjectByName("Elbow_Right"),
      ],
      thighs: [
        character.getObjectByName("Thigh_Left"),
        character.getObjectByName("Thigh_Right"),
      ],
      knees: [
        character.getObjectByName("Knee_Left"),
        character.getObjectByName("Knee_Right"),
      ],
    }),
    [character],
  );

  useEffect(() => {
    const idle = gltf.animations.find((clip) => clip.name === IDLE);
    if (idle) {
      const action = mixer.clipAction(idle);
      action.play();
      activeAction.current = action;
      activeClip.current = IDLE;
    }

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(character);
      activeAction.current = null;
      activeClip.current = "";
    };
  }, [character, gltf.animations, mixer]);

  useFrame((_, delta) => {
    const swimming = !seated && motion.mode === "swim";
    const speed = Math.abs(motion.speed);
    const targetName = seated || swimming ? IDLE : speed > 4.1 ? RUN : speed > 0.2 ? WALK : IDLE;

    if (targetName !== activeClip.current) {
      const clip = gltf.animations.find((candidate) => candidate.name === targetName);
      if (clip) {
        const next = mixer.clipAction(clip);
        next.reset().setLoop(THREE.LoopRepeat, Infinity).play();
        if (activeAction.current) next.crossFadeFrom(activeAction.current, 0.24, false);
        else next.fadeIn(0.24);
        activeAction.current = next;
        activeClip.current = targetName;
      }
    }

    const dt = Math.min(delta, 0.05);
    if (pose.current) {
      // Swimming: tip forward onto the front, head leading and back up out of
      // the water (tipping backwards would leave him floating face up).
      pose.current.rotation.order = "YXZ";
      pose.current.rotation.x = THREE.MathUtils.damp(
        pose.current.rotation.x,
        swimming ? Math.PI / 2 : 0,
        5,
        dt,
      );
      pose.current.rotation.y = THREE.MathUtils.damp(pose.current.rotation.y, 0, 5, dt);
    }
    if (modelRoot.current) {
      modelRoot.current.position.y = THREE.MathUtils.damp(
        modelRoot.current.position.y,
        swimming ? -1.05 : 0,
        5,
        dt,
      );
    }
    mixer.update(Math.min(delta, 0.05));

    if (seated) {
      seatBones.thighs.forEach((bone) => {
        if (bone) bone.rotation.x = seat.thigh;
      });
      seatBones.knees.forEach((bone) => {
        if (bone) bone.rotation.x = seat.knee;
      });
      seatBones.shoulders.forEach((bone) => {
        if (bone) bone.rotation.x = seat.shoulder;
      });
      if (seat.elbow !== undefined) {
        seatBones.elbows.forEach((bone) => {
          if (bone) bone.rotation.x = seat.elbow!;
        });
      }
    } else if (swimming) {
      const effort = 0.25 + Math.min(speed / 3.6, 1) * 0.75;
      swimPhase.current += dt * (2.4 + Math.min(speed, 3.6) * 1.5);
      swimBones.shoulders.forEach((bone, side) => {
        if (!bone) return;
        const cycle = swimPhase.current + side * Math.PI;
        bone.rotation.set(Math.sin(cycle) * 0.62 * effort, 0, (side === 0 ? -1 : 1) * 0.72);
      });
      swimBones.elbows.forEach((bone, side) => {
        if (!bone) return;
        bone.rotation.x = 0.45 + Math.max(0, Math.sin(swimPhase.current + side * Math.PI)) * 0.75 * effort;
      });
      swimBones.thighs.forEach((bone, side) => {
        if (!bone) return;
        bone.rotation.x = Math.sin(swimPhase.current * 1.2 + side * Math.PI) * 0.36 * effort;
      });
      swimBones.knees.forEach((bone, side) => {
        if (!bone) return;
        bone.rotation.x = 0.25 + Math.max(0, Math.sin(swimPhase.current * 1.2 + side * Math.PI)) * 0.5 * effort;
      });
    }
  });

  return (
    <group ref={pose}>
      <group ref={modelRoot}>
        <primitive object={character} />
      </group>
    </group>
  );
}
