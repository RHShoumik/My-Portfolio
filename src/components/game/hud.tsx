// SPIKE: throwaway prototype of the island game. Not production code.
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  Car,
  Footprints,
  Rocket,
  Sailboat,
  Volume2,
  VolumeX,
  Waves,
} from "lucide-react";
import {
  playSound,
  setSoundEnabled,
  unlockAudio,
  useSoundEnabled,
} from "@/lib/sound";
import { islands } from "./world";
import {
  resetCamera,
  cmd,
  input,
  isLandMode,
  useGame,
  type Mode,
} from "./store";

const chip =
  "pointer-events-auto rounded-2xl border border-white/15 bg-[#182e2a]/90 px-4 py-2.5 text-sm font-medium text-[#e7e4d6] shadow-lg backdrop-blur-md";

const modeInfo: Record<Mode, { label: string; icon: typeof Car }> = {
  walk: { label: "Walk", icon: Footprints },
  buggy: { label: "Buggy", icon: Car },
  boat: { label: "Speed boat", icon: Sailboat },
  swim: { label: "Swim", icon: Waves },
};

function ActionButton({
  mode,
  hint,
  primary,
}: {
  mode: Mode;
  hint: string;
  primary?: boolean;
}) {
  const { label, icon: Icon } = modeInfo[mode];
  return (
    <button
      type="button"
      onClick={() => {
        cmd.pending = mode;
      }}
      className={`pointer-events-auto flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition-transform active:scale-95 ${
        primary
          ? "bg-[#d9c49b] text-[#243c34]"
          : "border border-white/15 bg-[#29443d]/95 text-[#e7e4d6] backdrop-blur-md"
      }`}
    >
      <Icon className="size-4" />
      {label}
      <kbd className="hidden rounded bg-white/20 px-1.5 py-0.5 text-[11px] font-medium opacity-70 md:inline">
        {hint}
      </kbd>
    </button>
  );
}

/** Thumb stick for touch screens: up/down drives, left/right steers. */
function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const move = (e: React.PointerEvent) => {
    const r = base.current?.getBoundingClientRect();
    if (!r) return;
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    setKnob({ x: dx, y: dy });
    input.forward = -dy;
    input.turn = -dx;
  };
  const release = () => {
    setKnob({ x: 0, y: 0 });
    input.forward = 0;
    input.turn = 0;
  };

  return (
    <div
      ref={base}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons || e.pointerType === "touch") move(e);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      className="pointer-events-auto absolute bottom-6 left-6 hidden size-32 touch-none rounded-full border border-black/10 bg-white/50 shadow-lg backdrop-blur-md [@media(pointer:coarse)]:block"
    >
      <div
        className="absolute left-1/2 top-1/2 size-14 rounded-full bg-[#0b0d14]/85"
        style={{
          transform: `translate(calc(-50% + ${knob.x * 36}px), calc(-50% + ${knob.y * 36}px))`,
        }}
      />
    </div>
  );
}

export function Hud() {
  const soundOn = useSoundEnabled();
  const toggleSound = () => {
    unlockAudio();
    if (soundOn) {
      playSound("off", { force: true });
      setSoundEnabled(false);
    } else {
      setSoundEnabled(true);
      playSound("on");
    }
  };
  const destination = useGame((s) => s.destination);
  const setDestination = useGame((s) => s.setDestination);
  const target = islands.find((i) => i.id === destination) ?? islands[0];
  const x = useGame((s) => s.x),
    z = useGame((s) => s.z),
    heading = useGame((s) => s.heading);
  const mode = useGame((s) => s.mode);
  const nearShore = useGame((s) => s.nearShore);
  const distance = useGame((s) => s.distance);
  const bearing = useGame((s) => s.bearing);
  const land = isLandMode(mode);
  const onIsland = distance === 0 && land;
  const ModeIcon = modeInfo[mode].icon;

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* top bar */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
        <div className={`${chip} flex items-center gap-2`}>
          <ModeIcon className="size-4" />
          {modeInfo[mode].label}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className={`${chip} flex items-center gap-2.5`}>
            {onIsland || distance === 0 ? (
              <>{target.label} Island</>
            ) : (
              <>
                <ArrowUp
                  className="size-4 text-amber-200 transition-transform duration-150"
                  style={{ transform: `rotate(${-bearing}rad)` }}
                />
                {target.label} Island
                <span className="font-bold tabular-nums">{distance} m</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-sound="off"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={
              soundOn ? "Mute sound and music" : "Turn on sound and music"
            }
            className={`${chip} grid place-items-center px-3`}
          >
            {soundOn ? (
              <Volume2 className="size-4" />
            ) : (
              <VolumeX className="size-4 opacity-60" />
            )}
          </button>
          <Link href="/space" className={`${chip} inline-flex items-center gap-1.5`}>
            <Rocket className="size-4" />
            <span className="hidden sm:inline">Space</span>
          </Link>
          <Link href="/" className={chip}>
            Plain view
          </Link>
        </div>
      </div>

      <div className="pointer-events-auto absolute left-4 top-20 flex max-w-[55vw] flex-col gap-2 rounded-2xl border border-white/15 bg-[#182e2a]/95 p-3 shadow-lg backdrop-blur-md">
        <label
          htmlFor="island-destination"
          className="text-xs font-semibold text-stone-300"
        >
          Sail to an island
        </label>
        <select
          id="island-destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="rounded-lg border border-white/15 bg-[#29443d] p-2 text-sm text-stone-100"
        >
          {islands.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label} Island
            </option>
          ))}
        </select>
        <Link
          href={target.href}
          className="text-sm font-semibold text-amber-200"
        >
          Read {target.label.toLowerCase()} →
        </Link>
      </div>
      <div className="pointer-events-none absolute left-4 top-64 hidden w-40 rounded-2xl border border-white/15 bg-[#182e2a]/90 p-3 text-stone-200 lg:block">
        <p className="text-[10px] uppercase tracking-[.15em] text-stone-400">
          The archipelago · N ↑
        </p>
        <svg
          viewBox="-470 -1090 940 1120"
          className="mt-2 w-full"
          role="img"
          aria-label="Island map with your current position"
        >
          {islands.map((i) => (
            <g key={i.id}>
              <ellipse
                cx={i.cx}
                cy={-i.cz}
                rx={i.r * i.sx}
                ry={i.r * i.sz}
                fill={destination === i.id ? "#acb782" : "#526d5d"}
              />
              <text
                x={i.cx}
                y={-i.cz + 7}
                textAnchor="middle"
                fill="#142b25"
                fontSize="30"
                fontWeight="bold"
              >
                {i.label[0]}
              </text>
            </g>
          ))}
          <rect x="-34" y="-26" width="68" height="25" rx="4" fill="#8a8875" />
          {islands.map((i) => (
            <g key={`${i.id}-route`}>
              <path
                d={`M0 -12 L${i.approach[0]} ${-i.approach[1]}`}
                stroke="#d9ceb1"
                strokeOpacity=".65"
                strokeWidth="3"
                strokeDasharray="8 8"
              />
              <circle
                cx={i.approach[0]}
                cy={-i.approach[1]}
                r="7"
                fill="#e4d2a7"
              />
            </g>
          ))}
          <path
            d="M0 -13 L9 10 L0 6 L-9 10 Z"
            transform={`translate(${x},${-z}) rotate(${(heading * 180) / Math.PI})`}
            fill="#f1cf8c"
            stroke="#172b27"
            strokeWidth="2"
          />
        </svg>
        <p className="mt-2 text-[10px] text-stone-400">
          S Skills · E Experience
          <br />T Travel · C Contact
        </p>
      </div>
      {/* context actions */}
      <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 px-4">
        {nearShore && (
          <div className="flex flex-wrap justify-center gap-2.5">
            {land ? (
              <>
                <ActionButton mode="boat" hint="E" primary />
                <ActionButton mode="swim" hint="Q" />
              </>
            ) : (
              <>
                <ActionButton mode="walk" hint="E" primary />
                <ActionButton mode="buggy" hint="Q" />
              </>
            )}
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-2.5">
          {land ? (
            <ActionButton mode={mode === "walk" ? "buggy" : "walk"} hint="F" />
          ) : (
            <ActionButton mode={mode === "boat" ? "swim" : "boat"} hint="F" />
          )}
        </div>
        <p className="hidden rounded-full bg-black/45 px-3.5 py-1.5 text-xs text-white backdrop-blur-sm md:block">
          W A S D / arrows to move · Drag to look · Scroll to zoom ·
          Double-click to reset
        </p>
      </div>

      <button
        type="button"
        onClick={resetCamera}
        className={`${chip} absolute right-4 top-20`}
      >
        Reset camera
      </button>
      <Joystick />
    </div>
  );
}
