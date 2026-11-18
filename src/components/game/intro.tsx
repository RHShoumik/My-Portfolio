// SPIKE: throwaway prototype of the island game. Not production code.
"use client";
/*
 * The opening shot: a long camera flight past the Skills island, across to
 * the Travel island in the low sun, and down over the dockyard until it
 * settles behind the player. It runs after the player's follow camera each
 * frame and blends into it at the end, so there is no jump.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { INTRO_LENGTH, useIntro } from "./store";

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const POSITIONS = [v(-150, 70, 700), v(-40, 32, 560), v(150, 40, 380), v(170, 30, 120), v(50, 16, -40), v(8, 9, -12)];
const TARGETS = [v(0, 4, 490), v(0, 5, 492), v(360, 6, 170), v(40, 4, 20), v(0, 3, 10), v(0, 2, 18)];
/** How long the final blend into the follow camera takes. */
const BLEND = 2.6;

export function IntroCamera() {
  const active = useIntro((s) => s.active);
  const canvas = useThree((s) => s.gl.domElement);
  const clock = useRef(0);
  const path = useMemo(
    () => ({
      pos: new THREE.CatmullRomCurve3(POSITIONS, false, "centripetal"),
      look: new THREE.CatmullRomCurve3(TARGETS, false, "centripetal"),
    }),
    [],
  );
  const tmp = useMemo(
    () => ({ p: new THREE.Vector3(), l: new THREE.Vector3(), follow: new THREE.Vector3(), q: new THREE.Quaternion(), m: new THREE.Matrix4() }),
    [],
  );

  // Play once per session, unless the visitor prefers reduced motion.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("island-intro-seen") === "1";
    } catch {}
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!seen && !calm) useIntro.getState().start();
  }, []);

  // Any key, click or tap skips the flight.
  useEffect(() => {
    if (!active) return;
    clock.current = 0;
    const skip = () => useIntro.getState().skip();
    window.addEventListener("keydown", skip);
    canvas.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      canvas.removeEventListener("pointerdown", skip);
    };
  }, [active, canvas]);

  useFrame(({ camera }, delta) => {
    if (!useIntro.getState().active) return;
    clock.current += Math.min(delta, 0.05);
    const t = clock.current;
    if (t >= INTRO_LENGTH) {
      useIntro.getState().skip();
      return;
    }
    const { p, l, follow, q, m } = tmp;
    // Ease in and out along the whole flight.
    const u = THREE.MathUtils.smootherstep(t, 0, INTRO_LENGTH - BLEND * 0.4);
    path.pos.getPoint(u, p);
    path.look.getPoint(u, l);
    // The player's camera already wrote this frame's follow pose.
    follow.copy(camera.position);
    q.copy(camera.quaternion);
    const k = THREE.MathUtils.smootherstep(t, INTRO_LENGTH - BLEND, INTRO_LENGTH);
    m.lookAt(p, l, camera.up);
    camera.quaternion.setFromRotationMatrix(m).slerp(q, k);
    camera.position.copy(p).lerp(follow, k);
  });

  return null;
}
