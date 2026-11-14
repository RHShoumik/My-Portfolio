// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bot,
  Gauge,
  Heart,
  Lock,
  Palmtree,
  Plane,
  Rocket,
  RotateCcw,
  SkipForward,
  TriangleAlert,
  Volume2,
  VolumeX,
} from "lucide-react";
import { playSound, setSoundEnabled, unlockAudio, useSoundEnabled } from "@/lib/sound";
import { contactLinks, Dossier, glass, PlanetBadge, primaryBtn, secondaryBtn } from "./dossier";
import { DESTINATIONS } from "./destinations";
import { MAX_MISSILES } from "./combat";
import { EvaHud } from "./eva-hud";
import { LEVELS } from "./levels";
import { AUTOPILOT_AFTER, input, MAX_LIVES, useLevel, useSpace } from "./store";


const chip = `pointer-events-auto ${glass} px-3.5 py-2 text-sm font-medium`;

function Lives({ lives }: { lives: number }) {
  return (
    <div className={`${glass} flex items-center gap-1.5 px-3.5 py-2`} aria-label={`${lives} lives left`}>
      {Array.from({ length: MAX_LIVES }, (_, i) => (
        <Heart
          key={i}
          className={`size-4 ${i < lives ? "fill-[#ff5a6a] text-[#ff5a6a]" : "text-white/25"}`}
        />
      ))}
    </div>
  );
}

function Progress({ progress }: { progress: number }) {
  const LEVEL = useLevel();
  const left = Math.max(0, (1 - progress) * LEVEL.distance);
  return (
    <div className={`${glass} w-[min(92vw,26rem)] px-4 py-2.5`}>
      <div className="flex items-center justify-between text-xs font-medium text-white/70">
        <span>{LEVEL.from}</span>
        <span className="tabular-nums text-white">{left.toFixed(left < 100 ? 1 : 0)} million km to go</span>
        <span>{LEVEL.to}</span>
      </div>
      <div className="relative mt-2 h-1.5 rounded-full bg-white/15">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#6c8cff] to-[#ff8a5c]"
          style={{ width: `${progress * 100}%` }}
        />
        <Plane
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rotate-45 text-white"
          style={{ left: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

/** The planet menu: every section of the portfolio, one tap away. */
function PlanetMenu() {
  const open = useSpace((s) => s.open);
  const setOpen = useSpace((s) => s.setOpen);
  return (
    <nav
      aria-label="Portfolio sections"
      className={`${glass} pointer-events-auto flex max-w-full gap-0.5 overflow-x-auto p-1 [scrollbar-width:none]`}
    >
      {DESTINATIONS.map((d) => {
        const active = open === d.id;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              if (!active) playSound("paper");
              setOpen(active ? null : d.id);
            }}
            aria-pressed={active}
            title={`${d.place} · ${d.label}`}
            className={`flex min-w-[3.5rem] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors ${
              active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <PlanetBadge d={d} className="size-7" />
            {d.label}
          </button>
        );
      })}
    </nav>
  );
}

/** Short warnings during the flight ("Missile warning"), gone after a few seconds. */
function AlertBanner() {
  const alert = useSpace((s) => s.alert);
  const alertId = useSpace((s) => s.alertId);
  useEffect(() => {
    if (!alert) return;
    const id = setTimeout(() => {
      if (useSpace.getState().alertId === alertId) useSpace.setState({ alert: null });
    }, 2800);
    return () => clearTimeout(id);
  }, [alert, alertId]);
  if (!alert) return null;
  const danger = /missile|enemy|squadron|wave/i.test(alert);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[7.5rem] flex justify-center px-4 lg:top-[5.5rem]">
      <p
        key={alertId}
        role="status"
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 md:text-sm ${
          danger
            ? "border-[#ff5a4a]/40 bg-[#3a0d0a]/70 text-[#ff8a7a]"
            : "border-white/15 bg-[#0b0e18]/60 text-white/85"
        }`}
      >
        {danger && <TriangleAlert className="size-4" />}
        {alert}
      </p>
    </div>
  );
}

function Score() {
  const score = useSpace((s) => s.score);
  return (
    <span className={`${glass} px-3.5 py-2 text-sm font-semibold tabular-nums text-white`} aria-label={`Score ${score}`}>
      {score.toLocaleString()} <span className="font-normal text-white/55">pts</span>
    </span>
  );
}

/** Missiles ready to launch, as little pips. */
function Ammo() {
  const ammo = useSpace((s) => s.ammo);
  return (
    <span className={`${glass} hidden items-center gap-1.5 px-3 py-2 sm:inline-flex`} aria-label={`${ammo} missiles ready`}>
      <Rocket className="size-3.5 rotate-45 text-[#9fe8ff]" />
      {Array.from({ length: MAX_MISSILES }, (_, i) => (
        <span key={i} className={`h-3 w-1.5 rounded-full ${i < ammo ? "bg-[#9fe8ff]" : "bg-white/15"}`} />
      ))}
    </span>
  );
}

/** A button you hold down (fire or boost) on touch screens. */
function HoldButton({
  onChange,
  className,
  children,
}: {
  onChange: (down: boolean) => void;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-sound="off"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onChange(true);
      }}
      onPointerUp={() => onChange(false)}
      onPointerCancel={() => onChange(false)}
      onLostPointerCapture={() => onChange(false)}
      className={`pointer-events-auto absolute grid touch-none place-items-center rounded-full border text-xs font-semibold text-white backdrop-blur-md [@media(pointer:fine)]:hidden ${className}`}
    >
      {children}
    </button>
  );
}

/** Launch a missile (touch screens). Shows how many are ready. */
function MissileButton() {
  const ammo = useSpace((s) => s.ammo);
  return (
    <button
      type="button"
      data-sound="off"
      onPointerDown={() => {
        input.missile = true;
      }}
      aria-label={`Launch missile, ${ammo} ready`}
      className={`pointer-events-auto absolute bottom-6 right-5 grid size-24 touch-none place-items-center rounded-full border text-xs font-semibold text-white backdrop-blur-md active:scale-95 [@media(pointer:fine)]:hidden ${
        ammo > 0 ? "border-[#9fe8ff]/50 bg-[#2f5bff]/30 active:bg-[#2f5bff]/50" : "border-white/15 bg-white/5 text-white/40"
      }`}
    >
      <span className="grid place-items-center">
        <Rocket className="mb-0.5 size-6 -rotate-45" />
        MISSILE
        <span className="mt-0.5 text-[10px] font-medium opacity-75">{ammo} ready</span>
      </span>
    </button>
  );
}

/** Drag anywhere to steer (touch or mouse). Up/down/left/right like a joystick. */
function DragSteer() {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState<{ ox: number; oy: number; dx: number; dy: number } | null>(null);
  const RANGE = 70;

  const release = () => {
    origin.current = null;
    setKnob(null);
    input.x = 0;
    input.y = 0;
  };

  return (
    <div
      className="pointer-events-auto absolute inset-0 touch-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        origin.current = { x: e.clientX, y: e.clientY };
        setKnob({ ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 });
      }}
      onPointerMove={(e) => {
        if (!origin.current) return;
        let dx = (e.clientX - origin.current.x) / RANGE;
        let dy = (e.clientY - origin.current.y) / RANGE;
        const len = Math.hypot(dx, dy);
        if (len > 1) {
          dx /= len;
          dy /= len;
        }
        input.x = dx;
        input.y = -dy;
        setKnob({ ox: origin.current.x, oy: origin.current.y, dx, dy });
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      {knob && (
        <div
          className="pointer-events-none absolute size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white/5"
          style={{ left: knob.ox, top: knob.oy }}
        >
          <div
            className="absolute left-1/2 top-1/2 size-11 rounded-full bg-white/70"
            style={{ transform: `translate(calc(-50% + ${knob.dx * 34}px), calc(-50% + ${knob.dy * 34}px))` }}
          />
        </div>
      )}
    </div>
  );
}

function Card({ children, hideBelowLg = false }: { children: React.ReactNode; hideBelowLg?: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 items-end justify-center p-3 pb-4 md:items-center md:justify-start md:p-8 md:pt-32 lg:p-10 lg:pt-24 ${
        hideBelowLg ? "hidden lg:flex" : "flex"
      }`}
    >
      <div className={`pointer-events-auto ${glass} w-full max-w-md p-5 md:p-7 animate-in fade-in zoom-in-95 duration-300`}>
        {children}
      </div>
    </div>
  );
}

/** Who I am, shown on the launch screen so visitors meet me before (or instead of) playing. */
function PilotProfile() {
  const setOpen = useSpace((s) => s.setOpen);
  return (
    <>
      <div className="flex items-center gap-4">
        <Image
          src="/images/hero-photo.jpg"
          alt="Ragib Hassan Shoumik"
          width={128}
          height={128}
          priority
          className="size-14 shrink-0 rounded-2xl border border-white/15 object-cover md:size-16"
        />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8fa7ff]">Pilot</p>
          <h1 className="font-display text-[1.45rem] font-bold leading-tight md:text-[1.7rem]">
            Ragib Hassan Shoumik
          </h1>
          <p className="text-sm text-white/65">Frontend engineer · Dhaka, Bangladesh</p>
        </div>
      </div>

      <p className="mt-4 hidden text-[15px] leading-relaxed text-white/75 sm:block">
        I build websites and web apps with React and Next.js, mostly online shops and membership
        platforms. 4+ years of experience, currently at JustGo Technologies.
      </p>

      <p className="mt-3 flex items-center gap-2 text-sm text-white/75">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
        </span>
        Open to new opportunities
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {contactLinks.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target={l.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            aria-label={l.label}
            className="grid size-9 place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <l.icon className="size-4" />
          </a>
        ))}
        <button type="button" onClick={() => setOpen("about")} className={`${secondaryBtn} py-1.5 max-sm:hidden`}>
          About me
        </button>
        <button type="button" onClick={() => setOpen("contact")} className={`${secondaryBtn} py-1.5`}>
          Hire me
        </button>
      </div>
    </>
  );
}

/** Pick any level you have reached. Locked ones show a padlock. */
function LevelPicker() {
  const level = useSpace((s) => s.level);
  const unlocked = useSpace((s) => s.unlocked);
  const selectLevel = useSpace((s) => s.selectLevel);
  return (
    <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Choose a level">
      {LEVELS.map((l, i) => {
        const locked = i > unlocked;
        const current = i === level;
        return (
          <button
            key={l.number}
            type="button"
            disabled={locked}
            aria-pressed={current}
            onClick={() => selectLevel(i)}
            title={locked ? `Land on ${LEVELS[i - 1].site.name} to unlock` : `${l.from} → ${l.to}`}
            className={`pointer-events-auto inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-semibold transition-colors ${
              current
                ? "border-[#ff9a73]/70 bg-[#ff9a73]/20 text-white"
                : locked
                  ? "cursor-not-allowed border-white/10 text-white/30"
                  : "border-white/20 text-white/75 hover:bg-white/10"
            }`}
          >
            {locked && <Lock className="size-3" />}
            {l.number} · {l.to}
          </button>
        );
      })}
    </div>
  );
}

export function Hud() {
  const LEVEL = useLevel();
  const nextLevel = useSpace((s) => s.nextLevel);
  const phase = useSpace((s) => s.phase);
  const lives = useSpace((s) => s.lives);
  const crashes = useSpace((s) => s.crashes);
  const progress = useSpace((s) => s.progress);
  const open = useSpace((s) => s.open);
  const launch = useSpace((s) => s.launch);
  const retry = useSpace((s) => s.retry);
  const setOpen = useSpace((s) => s.setOpen);
  const caption = useSpace((s) => s.caption);
  const land = useSpace((s) => s.land);
  const depart = useSpace((s) => s.depart);
  const soundOn = useSoundEnabled();
  const inFlight = phase === "flying" || phase === "crashed";

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

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {(phase === "flying" || (phase === "eva" && !open)) && <DragSteer />}

      {/* Top bar (hidden during the landing cinematic) */}
      <div
        className={`absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-x-3 gap-y-2 p-2.5 transition-opacity duration-500 md:p-4 ${
          phase === "landing" || phase === "takeoff" ? "invisible opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <Lives lives={lives} />
          {inFlight ? (
            <>
              <Score />
              <Ammo />
            </>
          ) : (
            <span className={`${glass} hidden px-3.5 py-2 text-sm text-white/80 sm:inline`}>
              Level {LEVEL.number} of {LEVELS.length}
            </span>
          )}
        </div>

        <div className="order-3 flex w-full justify-center lg:order-none lg:w-auto">
          {inFlight ? <Progress progress={progress} /> : phase === "eva" ? null : <PlanetMenu />}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-sound="off"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Mute sound and music" : "Turn on sound and music"}
            className={`${chip} grid place-items-center px-2.5`}
          >
            {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4 opacity-60" />}
          </button>
          {/* Out of the way while flying */}
          {!inFlight && (
            <>
              <Link href="/island" className={`${chip} inline-flex items-center gap-1.5`}>
                <Palmtree className="size-4" />
                <span className="hidden sm:inline">Island</span>
              </Link>
              <Link href="/" className={chip}>
                Plain view
              </Link>
            </>
          )}
        </div>
      </div>

      {(inFlight || phase === "eva") && <AlertBanner />}
      {phase === "eva" && <EvaHud />}

      {/* Fire and boost (touch screens) */}
      {phase === "flying" && (
        <>
          <MissileButton />
          <HoldButton
            onChange={(down) => {
              input.boost = down;
            }}
            className="bottom-[8.5rem] right-9 size-16 border-white/25 bg-white/10 active:bg-white/25"
          >
            <span className="grid place-items-center text-[10px]">
              <Gauge className="mb-0.5 size-4" />
              BOOST
            </span>
          </HoldButton>
        </>
      )}

      {phase === "flying" && (
        <p className="absolute inset-x-0 bottom-5 hidden text-center text-xs text-white/55 [@media(pointer:fine)]:block">
          Guns fire on their own · Steer W A S D · Space missile · Shift boost
        </p>
      )}

      {phase === "ready" && (
        <Card hideBelowLg={open !== null}>
          <PilotProfile />
          <div className="my-5 h-px bg-white/10" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff9a73]">
            Mission · Level {LEVEL.number} of {LEVELS.length}
          </p>
          <p className="mt-1 font-display text-xl font-bold">
            {LEVEL.from} → {LEVEL.to}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-white/65">
            {LEVEL.intro}, then land to unlock my {LEVEL.unlocks}.
            <span className="hidden sm:inline"> Or pick any planet at the top to read without flying.</span>
          </p>
          <LevelPicker />
          <p className="mt-3 text-xs text-white/50">
            <span className="[@media(pointer:coarse)]:hidden">
              Guns fire on their own · Steer W A S D · Space launches a missile · Shift boosts
            </span>
            <span className="hidden [@media(pointer:coarse)]:inline">
              Guns fire on their own · Drag to steer · tap MISSILE · hold BOOST
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button type="button" onClick={() => launch(false)} className={primaryBtn}>
              <Plane className="size-4" />
              Launch
            </button>
            {crashes >= AUTOPILOT_AFTER && (
              <button type="button" onClick={() => launch(true)} className={secondaryBtn}>
                <Bot className="size-4" />
                Autopilot
              </button>
            )}
            <span className="hidden items-center text-xs text-white/45 [@media(pointer:fine)]:inline-flex">
              or press Enter
            </span>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-white/40">
            Aircraft model: {" "}
            <a
              className="pointer-events-auto underline decoration-white/25 underline-offset-2 hover:text-white/70"
              href="https://sketchfab.com/3d-models/grumman-f-14-tomcat-fighter-jet-ea556e61aebf4153b9b34cdb3a64b559"
              target="_blank"
              rel="noreferrer"
            >
              Grumman F-14 Tomcat
            </a>{" "}
            by Muhamad Mirza Arrafi ·{" "}
            <a
              className="pointer-events-auto underline decoration-white/25 underline-offset-2 hover:text-white/70"
              href="https://sketchfab.com/3d-models/astronaut-by-jungle-jim-c775a977606a4e4e990afe783c6bc845"
              target="_blank"
              rel="noreferrer"
            >
              Astronaut
            </a>{" "}
            by Jungle Jim ·{" "}
            <a
              className="pointer-events-auto underline decoration-white/25 underline-offset-2 hover:text-white/70"
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY 4.0
            </a>
          </p>
        </Card>
      )}

      {phase === "crashed" && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center animate-in fade-in zoom-in-90 duration-300">
            <p className="font-display text-4xl font-bold text-white drop-shadow-lg md:text-5xl">
              Ship destroyed
            </p>
            <p className="mt-2 text-white/85 drop-shadow-lg">
              {lives > 0 ? `${lives} ${lives === 1 ? "life" : "lives"} left` : "No lives left"}
            </p>
          </div>
        </div>
      )}

      {phase === "gameover" && (
        <Card hideBelowLg={open !== null}>
          <h2 className="font-display text-3xl font-bold">Out of lives</h2>
          <p className="mt-3 text-[15px] text-white/75">
            You were shot down this time. Try again, or open any planet at the top to read about me
            without flying.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={retry} className={primaryBtn}>
              Try again
            </button>
            <button type="button" onClick={() => setOpen("about")} className={secondaryBtn}>
              About me
            </button>
          </div>
        </Card>
      )}

      {(phase === "landing" || phase === "takeoff") && (
        <>
          <div className="absolute inset-x-0 top-0 h-[9vh] bg-black animate-in slide-in-from-top duration-700" />
          <div className="absolute inset-x-0 bottom-0 h-[9vh] bg-black animate-in slide-in-from-bottom duration-700" />
          {caption && (
            <p
              key={caption}
              aria-live="polite"
              className="absolute inset-x-4 bottom-[11vh] text-center font-mono text-xs uppercase tracking-[0.22em] text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] animate-in fade-in duration-500 md:text-sm"
            >
              {caption}
            </p>
          )}
          <button
            type="button"
            onClick={phase === "takeoff" ? depart : land}
            className="pointer-events-auto absolute bottom-[calc(4.5vh-1rem)] right-4 inline-flex h-8 items-center gap-1.5 rounded-full border border-white/25 px-3.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10"
          >
            Skip
            <SkipForward className="size-3.5" />
          </button>
        </>
      )}

      {phase === "arrived" && open === null && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-6 flex flex-wrap justify-center gap-2.5 px-4">
          <button type="button" onClick={() => setOpen(LEVEL.section)} className={primaryBtn}>
            Open my {LEVEL.unlocks}
          </button>
          {LEVEL.number < LEVELS.length && (
            <button type="button" onClick={nextLevel} className={`${secondaryBtn} bg-[#0b0e18]/60 backdrop-blur-md`}>
              <Rocket className="size-4" />
              Fly to {LEVELS[LEVEL.number].to}
            </button>
          )}
          <button type="button" onClick={retry} className={`${secondaryBtn} bg-[#0b0e18]/60 backdrop-blur-md`}>
            <RotateCcw className="size-4" />
            Fly again
          </button>
        </div>
      )}

      <Dossier />
    </div>
  );
}
