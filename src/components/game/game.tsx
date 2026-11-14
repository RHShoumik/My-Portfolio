// SPIKE: throwaway prototype of the island game. Not production code.
"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playSound, setEngine, setSeaLevel } from "@/lib/sound";
import { IslandEffects } from "./island-effects";
import { Hud } from "./hud";
import { MooredBoat } from "./models";
import { Player } from "./player";
import { Clouds, Dockyard } from "./scenery";
import { Archipelago } from "./archipelago";
import { Activities, ActivityPanel, useActivity } from "./activities";
import { TravelGallery, GalleryReader } from "./travel-gallery";
import { Sea } from "./sea";
import { cmd, input, isLandMode, useGame } from "./store";
import { playerPos, SKY } from "./world";

const FOG_NEAR = 180;
const FOG_FAR = 620;

/** Sunlight that follows the player so shadows stay sharp nearby. */
function Sun() {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!light.current) return;
    light.current.position.set(playerPos.x + 35, 60, playerPos.z - 30);
    target.position.set(playerPos.x, 0, playerPos.z);
    target.updateMatrixWorld();
  });

  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={light}
        target={target}
        intensity={2.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-bias={-0.0005}
      />
    </>
  );
}

export default function Game({
  publishedTravelSlugs,
}: {
  publishedTravelSlugs: string[];
}) {
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    setSeaLevel(0.35);

    const keys = new Set<string>();
    const sync = () => {
      const has = (...k: string[]) => k.some((x) => keys.has(x));
      input.forward =
        (has("w", "arrowup") ? 1 : 0) - (has("s", "arrowdown") ? 1 : 0);
      input.turn =
        (has("a", "arrowleft") ? 1 : 0) - (has("d", "arrowright") ? 1 : 0);
    };
    const moveKeys = [
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
    ];

    const down = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement)?.closest(
          "input,textarea,select,button,a,dialog,[contenteditable]",
        ) ||
        useActivity.getState().panel
      )
        return;
      const k = e.key.toLowerCase();
      if (moveKeys.includes(k)) {
        e.preventDefault();
        keys.add(k);
        sync();
        return;
      }
      if (e.repeat) return;
      const { mode, nearShore } = useGame.getState();
      const land = isLandMode(mode);
      if (k === "f") {
        cmd.pending = land
          ? mode === "walk"
            ? "buggy"
            : "walk"
          : mode === "boat"
            ? "swim"
            : "boat";
        playSound("tap");
      } else if (k === "e" && nearShore) {
        cmd.pending = land ? "boat" : "walk";
        playSound("tap");
      } else if (k === "q" && nearShore) {
        cmd.pending = land ? "swim" : "buggy";
        playSound("tap");
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
      sync();
    };
    const blur = () => {
      keys.clear();
      sync();
    };

    const unsubscribe = useActivity.subscribe((state, previous) => {
      if (state.panel !== previous.panel) {
        keys.clear();
        sync();
      }
    });
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      unsubscribe();
      document.documentElement.style.overflow = "";
      setEngine(null, 0);
      setSeaLevel(0);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      blur();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] touch-none select-none overflow-hidden bg-[#bfe3f5]">
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        dpr={[1, 1.5]}
        camera={{ fov: 55, near: 0.1, far: 800, position: [0, 6, 8] }}
      >
        <color attach="background" args={[SKY]} />
        <fog attach="fog" args={[SKY, FOG_NEAR, FOG_FAR]} />
        <hemisphereLight args={["#c8dfe9", "#9b8767", 1.5]} />
        <Sun />

        <Sea fogNear={FOG_NEAR} fogFar={FOG_FAR} />
        <Dockyard />
        <Archipelago />
        <TravelGallery />
        <Activities />
        <Clouds />
        <MooredBoat />
        <Player />
        <IslandEffects />
      </Canvas>

      <Hud />
      <ActivityPanel />
      <GalleryReader publishedSlugs={publishedTravelSlugs} />
    </div>
  );
}
