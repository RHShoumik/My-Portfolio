"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { create } from "zustand";
import * as THREE from "three";
import { experiences, skillGroups, siteConfig } from "@/lib/constants";
import { travelLocations } from "@/data/travel-data";
import { playerPos, heightAt, waveHeight } from "./world";
import { input, motion } from "./store";
import { Sign } from "./archipelago";
import {
  circuitSequence,
  circuitStep,
  crabPosition,
  raceGates,
  signalScore,
} from "./activity-rules";

const sites = [
  { id: "skills", x: 0, z: 491, label: "Explore the workshop" },
  { id: "experience", x: -360, z: 165, label: "Open the career archive" },
  { id: "travel", x: 342, z: 172, label: "Open the travel journal" },
  { id: "contact", x: 0, z: 1018, label: "Use the radio" },
] as const;
type Site = (typeof sites)[number]["id"] | "gallery";
interface ActivityState {
  near: Site | null;
  panel: Site | null;
  clock: number;
  crabNear: boolean;
  photo: boolean;
  photoUrl: string | null;
  capture: boolean;
  race: "idle" | "armed" | "running" | "finished";
  gate: number;
  elapsed: number;
  best: number | null;
  open: (id: Site | null) => void;
  startRace: () => void;
  cancelRace: () => void;
}
export const useActivity = create<ActivityState>((set) => ({
  near: null,
  panel: null,
  clock: 0,
  crabNear: false,
  photo: false,
  photoUrl: null,
  capture: false,
  race: "idle",
  gate: 0,
  elapsed: 0,
  best: null,
  open: (panel) => {
    input.forward = 0;
    input.turn = 0;
    set({ panel });
  },
  startRace: () => set({ race: "armed", gate: 0, elapsed: 0, panel: null }),
  cancelRace: () => set({ race: "idle", gate: 0, elapsed: 0 }),
}));

function Crab() {
  const body = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime,
      p = crabPosition(t);
    if (body.current) {
      body.current.position.set(p.x, (heightAt(p.x, p.z) ?? 0.6) + 0.2, p.z);
      body.current.rotation.y = Math.cos(t * 0.65) * 0.5;
    }
    legs.current.forEach((leg, i) => {
      if (leg) leg.rotation.z = Math.sin(t * 9 + i) * 0.22;
    });
  });
  return (
    <group ref={body}>
      <mesh scale={[0.65, 0.25, 0.45]} castShadow>
        <sphereGeometry args={[1, 20, 12]} />
        <meshStandardMaterial color="#b86540" roughness={0.6} />
      </mesh>
      {[-1, 1].flatMap((side) =>
        [0, 1, 2].map((i) => (
          <group
            key={`${side}-${i}`}
            position={[side * 0.5, 0, (i - 1) * 0.3]}
            ref={(el) => {
              legs.current[(side === 1 ? 3 : 0) + i] = el;
            }}
          >
            <mesh rotation-z={side * 0.9} position={[side * 0.24, -0.1, 0]}>
              <capsuleGeometry args={[0.045, 0.55, 4, 8]} />
              <meshStandardMaterial color="#bd7952" />
            </mesh>
          </group>
        )),
      )}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.35, 0.22, 0.32]}>
          <mesh position={[0, 0.16, 0]}>
            <capsuleGeometry args={[0.025, 0.3, 4, 8]} />
            <meshStandardMaterial color="#ac6042" />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.06, 12, 8]} />
            <meshStandardMaterial color="#17282a" />
          </mesh>
          <mesh position={[side * 0.45, -0.05, 0.2]} scale={[1.2, 0.7, 1]}>
            <sphereGeometry args={[0.17, 12, 8]} />
            <meshStandardMaterial color="#c98456" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
export function Activities() {
  const race = useActivity((s) => s.race),
    gate = useActivity((s) => s.gate);
  const projectedCrab = useRef(new THREE.Vector3());
  const last = useRef(0),
    elapsed = useRef(0);
  const buoys = useRef<(THREE.Group | null)[]>([]);
  useEffect(() => {
    if (race === "running") elapsed.current = 0;
  }, [race]);
  useFrame(({ clock, gl, scene, camera }, dt) => {
    const t = clock.elapsedTime;
    buoys.current.forEach((g, i) => {
      if (g) g.position.y = waveHeight(raceGates[i].x, raceGates[i].z, t);
    });
    const state = useActivity.getState();
    if (state.capture) {
      gl.render(scene, camera);
      useActivity.setState({
        capture: false,
        photo: true,
        photoUrl: gl.domElement.toDataURL("image/png"),
      });
    }
    if (state.race === "armed" || state.race === "running") {
      if (state.race === "running") elapsed.current += Math.min(dt, 0.1);
      const target = raceGates[state.gate];
      if (
        motion.mode === "boat" &&
        Math.hypot(playerPos.x - target.x, playerPos.z - target.z) < 5
      ) {
        if (state.race === "armed") {
          elapsed.current = 0;
          useActivity.setState({ race: "running", gate: 1 });
        } else if (state.gate === raceGates.length - 1)
          useActivity.setState({
            race: "finished",
            elapsed: elapsed.current,
            best: Math.min(state.best ?? Infinity, elapsed.current),
          });
        else useActivity.setState({ gate: state.gate + 1 });
      }
    }
    if (t - last.current < 0.1) return;
    last.current = t;
    const near =
      sites.find((s) => Math.hypot(playerPos.x - s.x, playerPos.z - s.z) < 14)
        ?.id ?? null;
    const crab = crabPosition(t);
    projectedCrab.current
      .set(crab.x, (heightAt(crab.x, crab.z) ?? 0.6) + 0.4, crab.z)
      .project(camera);
    useActivity.setState({
      near,
      clock: t,
      crabNear:
        Math.hypot(playerPos.x - crab.x, playerPos.z - crab.z) < 7 &&
        Math.abs(projectedCrab.current.x) < 0.9 &&
        Math.abs(projectedCrab.current.y) < 0.9 &&
        projectedCrab.current.z > -1 &&
        projectedCrab.current.z < 1,
      ...(state.race === "running" ? { elapsed: elapsed.current } : {}),
    });
  });
  return (
    <>
      <Crab />
      <Sign
        text="CRAB PAPARAZZI · GET CLOSE & SNAP"
        position={[364, heightAt(364, 240) ?? 0.6, 240]}
      />
      {raceGates.map((p, i) => (
        <group
          key={i}
          position={[p.x, 0, p.z]}
          ref={(el) => {
            buoys.current[i] = el;
          }}
        >
          {[-5, 5].map((x) => (
            <group key={x} position={[x, 0.3, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.8, 16, 12]} />
                <meshStandardMaterial
                  color={
                    (race === "running" || race === "armed") && gate === i
                      ? "#efc77b"
                      : "#688e8a"
                  }
                  roughness={0.5}
                />
              </mesh>
              <mesh position={[0, 1, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
                <meshStandardMaterial color="#e0dfca" />
              </mesh>
            </group>
          ))}
          {(race === "running" || race === "armed") && gate === i && (
            <mesh position={[0, 2.8, 0]}>
              <torusGeometry args={[3.5, 0.075, 8, 48]} />
              <meshBasicMaterial color="#f8cf82" />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

const button =
  "rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-stone-100 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-amber-200 disabled:opacity-40";
function Circuit() {
  const [show, setShow] = useState(-1),
    [step, setStep] = useState(0),
    [phase, setPhase] = useState<"idle" | "show" | "play" | "won" | "lost">(
      "idle",
    );
  useEffect(() => {
    if (phase !== "show") return;
    let n = 0;
    const id = setInterval(() => {
      if (n >= circuitSequence.length * 2) {
        clearInterval(id);
        setShow(-1);
        setPhase("play");
        return;
      }
      setShow(n % 2 === 0 ? circuitSequence[Math.floor(n / 2)] : -1);
      n++;
    }, 450);
    return () => clearInterval(id);
  }, [phase]);
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Ship it without a short circuit</h3>
      <p className="text-sm text-stone-300">
        Watch six lights, then repeat the sequence. No production servers will
        be harmed.
      </p>
      <div className="grid grid-cols-4 gap-3">
        {["Mint", "Amber", "Blue", "Rose"].map((name, i) => (
          <button
            key={name}
            disabled={phase !== "play"}
            aria-label={`${name} circuit button${show === i ? ", lit" : ""}`}
            onClick={() => {
              const next = circuitStep(step, i);
              if (next < 0) setPhase("lost");
              else {
                setStep(next);
                if (next === circuitSequence.length) setPhase("won");
              }
            }}
            className={`${button} h-24 ${show === i ? "ring-4 ring-white brightness-150" : ""}`}
            style={{
              background: ["#436e63", "#937443", "#4c6588", "#875e66"][i],
            }}
          >
            {name}
            <span className="block text-xs opacity-60">{i + 1}</span>
          </button>
        ))}
      </div>
      <p role="status">
        {phase === "won"
          ? "Deployed. Even the seagulls approve."
          : phase === "lost"
            ? "A tiny puff of smoke. Try again?"
            : phase === "show"
              ? "Watch the lights…"
              : phase === "play"
                ? `${step} / 6 connected`
                : "Ready at the workbench."}
      </p>
      <button
        className={button}
        disabled={phase === "show"}
        onClick={() => {
          setStep(0);
          setShow(-1);
          setPhase("show");
        }}
      >
        {" "}
        {phase === "idle" ? "Start circuit" : "Replay sequence"}
      </button>
    </div>
  );
}
function Radio() {
  const [playing, setPlaying] = useState(false),
    [position, setPosition] = useState(0),
    [score, setScore] = useState<number | null>(null);
  const start = useRef(0),
    live = useRef(0);
  useEffect(() => {
    if (!playing) return;
    start.current = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      live.current = (Math.sin((now - start.current) * 0.0025) + 1) / 2;
      setPosition(live.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Tune the lighthouse radio</h3>
      <p className="text-sm text-stone-300">
        Lock the needle in the center to find a signal. Somewhere, a seagull is
        trying to order pizza.
      </p>
      <div className="relative h-12 overflow-hidden rounded-xl bg-black/30">
        <div className="absolute inset-y-0 left-[42%] w-[16%] bg-emerald-400/30" />
        <div
          className="absolute inset-y-1 w-1 bg-amber-200"
          style={{ left: `${position * 98}%` }}
        />
      </div>
      <button
        className={button}
        onClick={() => {
          if (playing) {
            setScore(signalScore(live.current));
            setPlaying(false);
          } else {
            setScore(null);
            setPlaying(true);
          }
        }}
      >
        {playing ? "Lock signal" : "Start tuning"}
      </button>
      {score !== null && (
        <p role="status">
          {score >= 84
            ? "Signal acquired. Hello from Dhaka!"
            : score >= 50
              ? "Mostly static. And one very loud seagull."
              : "You found the weather station on Mars. Try again."}{" "}
          · {score}%
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-3">
        <a className={button} href={siteConfig.links.email}>
          Write an email ↗
        </a>
        <a
          className={button}
          href={siteConfig.links.linkedin}
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn ↗
        </a>
        <a
          className={button}
          href={siteConfig.links.github}
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </div>
    </div>
  );
}
function snapshot() {
  useActivity.setState({ capture: true });
}

export function ActivityPanel() {
  const { near, panel, race, gate, elapsed, best, photo, photoUrl, crabNear } =
    useActivity();
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState("activity");
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (panel && panel !== "gallery") {
      el.showModal();
    } else el.close();
    return () => {
      if (el.open) el.close();
    };
  }, [panel]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.repeat ||
        (e.target as HTMLElement)?.closest(
          "input,textarea,select,button,a,dialog",
        )
      )
        return;
      if (e.key.toLowerCase() === "r") {
        const s = useActivity.getState();
        if (s.near) {
          setTab("activity");
          s.open(s.near);
        }
      }
      if (e.key.toLowerCase() === "p") {
        const s = useActivity.getState();
        if (s.crabNear && !s.panel) snapshot();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const label = sites.find((s) => s.id === near)?.label;
  return (
    <>
      <div className="pointer-events-none absolute bottom-44 left-1/2 z-10 flex w-[min(92vw,420px)] -translate-x-1/2 flex-col items-center gap-2">
        {near && !panel && (
          <button
            className={`${button} pointer-events-auto bg-[#172b27]/95 shadow-lg`}
            onClick={() => {
              setTab("activity");
              useActivity.getState().open(near);
            }}
          >
            {label} <kbd className="ml-2 opacity-60">R</kbd>
          </button>
        )}
        {crabNear && !panel && (
          <button
            className={`${button} pointer-events-auto bg-[#172b27]/95`}
            onClick={snapshot}
          >
            {photo
              ? "Crab portrait captured! Snap again 📷"
              : "Photograph the crab · P"}
          </button>
        )}
        {race !== "idle" && (
          <div
            className="pointer-events-auto rounded-2xl bg-[#172b27]/95 p-4 text-sm text-stone-100 shadow-xl"
            role="status"
          >
            {race === "armed"
              ? "Harbor sprint · Find the first golden gate"
              : race === "running"
                ? `Harbor sprint · Gate ${gate + 1}/${raceGates.length} · ${elapsed.toFixed(1)}s`
                : `Finished in ${elapsed.toFixed(1)}s · Best ${best?.toFixed(1)}s`}
            <button
              className="ml-3 underline"
              onClick={() => useActivity.getState().cancelRace()}
            >
              {race !== "finished" ? "Cancel" : "Close"}
            </button>
          </div>
        )}
      </div>
      <dialog
        ref={dialog}
        onCancel={() => useActivity.getState().open(null)}
        className="fixed inset-0 m-auto max-h-[85dvh] w-[min(92vw,640px)] overflow-y-auto rounded-3xl border border-white/15 bg-[#172b27] p-6 text-stone-100 shadow-2xl backdrop:bg-black/55 sm:p-8"
        aria-labelledby="activity-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-amber-200/70">
              Island field notes
            </p>
            <h2 id="activity-title" className="mt-2 text-3xl font-semibold">
              {panel === "skills"
                ? "The workshop"
                : panel === "experience"
                  ? "The shipyard"
                  : panel === "travel"
                    ? "Basecamp"
                    : "Radio house"}
            </h2>
          </div>
          <button
            className={button}
            onClick={() => useActivity.getState().open(null)}
            aria-label="Close activity"
          >
            ✕
          </button>
        </div>
        <div className="mb-6 flex gap-2">
          <button
            className={button}
            aria-pressed={tab === "activity"}
            onClick={() => setTab("activity")}
          >
            Explore & play
          </button>
          <button
            className={button}
            aria-pressed={tab === "notes"}
            onClick={() => setTab("notes")}
          >
            Portfolio notes
          </button>
        </div>
        {panel &&
          tab === "activity" &&
          (panel === "skills" ? (
            <Circuit key={panel} />
          ) : panel === "contact" ? (
            <Radio key={panel} />
          ) : panel === "experience" ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Harbor sprint</h3>
              <p className="text-stone-300">
                Take the boat through five glowing gates in order. The first is
                southeast of the shipyard, at the pair of buoys. The timer
                starts when your boat enters the first gate. No speed limit,
                just questionable navigation.
              </p>
              <button
                className={button}
                onClick={() => useActivity.getState().startRace()}
              >
                Start time trial
              </button>
              <p className="text-xs text-stone-400">
                Times are kept for this visit. Cancel anytime.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Crab paparazzi</h3>
              <p className="text-stone-300">
                A tiny resident patrols the southeastern beach. Walk within
                seven meters and press P or the camera button to capture a
                portrait. Please respect its very busy sideways schedule.
              </p>
              <p>
                {photo
                  ? "✓ Portrait added to your field notes."
                  : "Look for the small rust-colored crab by the beach sign. Six framed travel photos line the southern shore."}
              </p>
              <button
                className={button}
                onClick={() => useActivity.getState().open(null)}
              >
                Go exploring
              </button>
            </div>
          ))}
        {panel && tab === "notes" && (
          <div className="space-y-5">
            {panel === "skills" &&
              skillGroups.map((g) => (
                <section key={g.category}>
                  <h3 className="font-semibold text-amber-100">{g.category}</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-300">
                    {g.skills.join(" · ")}
                  </p>
                </section>
              ))}
            {panel === "experience" &&
              experiences.map((job) => (
                <section
                  key={job.company}
                  className="border-l border-amber-200/30 pl-4"
                >
                  <p className="text-xs text-amber-200/70">{job.period}</p>
                  <h3 className="mt-1 font-semibold">{job.company}</h3>
                  <p className="text-sm text-amber-100">{job.role}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    {job.description}
                  </p>
                </section>
              ))}
            {panel === "travel" && (
              <>
                {photo && (
                  <div className="rounded-xl bg-white/5 p-4">
                    {photoUrl && (
                      <>
                        <div
                          role="img"
                          aria-label="Your island photograph"
                          className="aspect-video rounded-lg bg-cover bg-center"
                          style={{ backgroundImage: `url(${photoUrl})` }}
                        />
                        <a
                          href={photoUrl}
                          download="island-postcard.png"
                          className="mt-2 inline-block text-sm underline"
                        >
                          Download postcard
                        </a>
                      </>
                    )}
                    <p className="mt-2 text-sm">
                      Resident crab · portrait recorded
                    </p>
                  </div>
                )}
                {travelLocations.map((place) => (
                  <section key={place.slug}>
                    <h3 className="font-semibold">{place.city}</h3>
                    <p className="text-xs text-amber-200/70">
                      {place.country} · {place.date}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-300">
                      {place.description}
                    </p>
                  </section>
                ))}
                <Link href="/travel" className={button}>
                  Open the travel journal ↗
                </Link>
              </>
            )}
            {panel === "contact" && <Radio />}
          </div>
        )}
      </dialog>
    </>
  );
}
