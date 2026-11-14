// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { setRocket } from "@/lib/sound";
import { Asteroids } from "./asteroids";
import { Blasts, Bolts, Fighters, Missiles, Props, Reticle } from "./combat-view";
import { Earth, Mars, Moon, Sky } from "./bodies";
import { Explosion, SpaceDust } from "./effects";
import { Flight } from "./flight";
import { Hud } from "./hud";
import { MarsSurface } from "./mars-surface";
import { fadeEl, input, useSpace } from "./store";
import { SUN_DIR } from "./world";

const SUN_POS = SUN_DIR.clone().multiplyScalar(1000).toArray();

export default function Space() {
  const scene = useSpace((s) => s.scene);
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";

    const keys = new Set<string>();
    const sync = () => {
      const has = (...k: string[]) => k.some((x) => keys.has(x));
      input.x = (has("d", "arrowright") ? 1 : 0) - (has("a", "arrowleft") ? 1 : 0);
      input.y = (has("w", "arrowup") ? 1 : 0) - (has("s", "arrowdown") ? 1 : 0);
      input.boost = has("shift");
      input.fire = has("f");
    };
    const gameKeys = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " ", "shift", "f", "m"];

    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const { phase, launch, open } = useSpace.getState();
      // Typing in the contact form, or pressing a focused button, is not flying.
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable]")) return;
      const onControl = !!el?.closest("button, a");
      if (phase === "ready" && !open && !onControl && (k === "enter" || (k === " " && !e.repeat))) {
        e.preventDefault();
        launch(false);
        return;
      }
      // Space or M: launch a missile (one per press)
      if (phase === "flying" && (k === " " || k === "m")) {
        e.preventDefault();
        if (!e.repeat) input.missile = true;
        return;
      }
      if (phase === "flying" && gameKeys.includes(k)) {
        e.preventDefault();
        keys.add(k);
        sync();
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

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      document.documentElement.style.overflow = "";
      setRocket(0);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      blur();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] touch-none select-none overflow-hidden bg-black">
      <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 56, near: 0.1, far: 20000, position: [0, 4, 14] }}>
        <color attach="background" args={["#000000"]} />

        {/* Open space: Earth, the Moon, the asteroid field and Mars */}
        <group visible={scene === "space"}>
          <ambientLight intensity={0.07} />
          <directionalLight position={SUN_POS} intensity={2.8} color="#fff4e6" />
          <Suspense fallback={null}>
            <Sky />
            <Earth />
            <Moon />
            <Mars />
          </Suspense>
          <Asteroids />
          <SpaceDust />
          <Props />
          <Fighters />
          <Missiles />
          <Bolts />
          <Blasts />
          <Reticle />
        </group>

        {/* The surface of Mars, for the landing */}
        <MarsSurface visible={scene === "surface"} />

        <Explosion />
        <Suspense fallback={null}>
          <Flight />
        </Suspense>
      </Canvas>

      {/* Haze that covers the cut from space to the Martian sky */}
      <div
        ref={(el) => {
          fadeEl.current = el;
        }}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#e3a882] opacity-0"
      />

      <Hud />
    </div>
  );
}
