import { useSyncExternalStore } from "react";

/**
 * Site sound engine. Everything is synthesised with the Web Audio API,
 * so there are no audio files to download or license.
 *
 * - One-shot sounds: clicks, hovers, splashes, footsteps…
 * - Continuous sounds: soft background music, sea ambience, engines.
 *
 * Browsers only allow audio after a user gesture, so nothing plays until the
 * visitor has clicked, tapped or pressed a key at least once.
 */

export type SoundName =
  | "tick"
  | "tap"
  | "paper"
  | "key"
  | "day"
  | "night"
  | "on"
  | "off"
  | "send"
  | "error"
  | "whoosh"
  | "splash"
  | "step"
  | "stroke"
  | "boom"
  | "laser"
  | "zap"
  | "blast"
  | "hit"
  | "alarm";

/* ------------------------------------------------------------------ */
/*  On / off preference (persisted, safe for SSR via useSyncExternalStore) */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = "rhs_sound";
const listeners = new Set<() => void>();
let enabled: boolean | null = null;

function readEnabled(): boolean {
  if (enabled === null) {
    try {
      enabled = window.localStorage.getItem(STORAGE_KEY) !== "off";
    } catch {
      enabled = true;
    }
  }
  return enabled;
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
  } catch {
    /* private mode: preference just won't persist */
  }
  listeners.forEach((l) => l());
  syncContinuous();
}

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readEnabled,
    () => true
  );
}

/* ------------------------------------------------------------------ */
/*  Audio plumbing                                                     */
/* ------------------------------------------------------------------ */
type AudioCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let interacted = false;

function userHasInteracted(): boolean {
  const activation = (
    navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }
  ).userActivation;
  return activation ? activation.hasBeenActive : interacted;
}

/** Sound is switched on and the browser will let us play. */
function audible(): boolean {
  return typeof window !== "undefined" && readEnabled() && userHasInteracted();
}

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.85;
    // A gentle compressor keeps layered sounds from clipping.
    const compressor = ctx.createDynamicsCompressor();
    master.connect(compressor);
    compressor.connect(ctx.destination);
  }
  return ctx;
}

/** Call from a real user gesture (pointerdown / keydown / touchstart). */
export function unlockAudio() {
  interacted = true;
  const c = ensureContext();
  if (c && c.state === "suspended" && !document.hidden) void c.resume();
  syncContinuous();
}

/** Pause everything while the tab is in the background. */
export function setAudioHidden(hidden: boolean) {
  if (!ctx) return;
  if (hidden) void ctx.suspend();
  else if (audible()) void ctx.resume();
}

function getNoise(c: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function noiseSource(c: AudioContext) {
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  src.loop = true;
  return src;
}

function envelope(g: GainNode, at: number, peak: number, attack: number, dur: number) {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
}

interface ToneOpts {
  freq: number;
  endFreq?: number;
  type?: OscillatorType;
  peak?: number;
  attack?: number;
  dur?: number;
}

function tone(c: AudioContext, at: number, o: ToneOpts, out: AudioNode = master!) {
  const { freq, endFreq, type = "sine", peak = 0.1, attack = 0.005, dur = 0.12 } = o;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, at + dur);
  envelope(gain, at, peak, attack, dur);
  osc.connect(gain);
  gain.connect(out);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

interface NoiseOpts {
  freq: number;
  endFreq?: number;
  type?: BiquadFilterType;
  q?: number;
  peak?: number;
  attack?: number;
  dur?: number;
}

function noise(c: AudioContext, at: number, o: NoiseOpts) {
  const { freq, endFreq, type = "bandpass", q = 1, peak = 0.06, attack = 0.004, dur = 0.06 } = o;
  const src = noiseSource(c);
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freq, at);
  if (endFreq) filter.frequency.exponentialRampToValueAtTime(endFreq, at + dur);
  const gain = c.createGain();
  envelope(gain, at, peak, attack, dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master!);
  src.start(at, Math.random() * 1.5);
  src.stop(at + dur + 0.05);
}

/* ------------------------------------------------------------------ */
/*  One-shot sounds                                                    */
/* ------------------------------------------------------------------ */
const voices: Record<SoundName, (c: AudioContext, t: number) => void> = {
  // Soft hover tick
  tick: (c, t) => tone(c, t, { freq: 1900, endFreq: 1500, type: "triangle", peak: 0.03, dur: 0.035 }),

  // Button / link press: a small wooden "tok"
  tap: (c, t) => {
    tone(c, t, { freq: 190, endFreq: 90, peak: 0.2, dur: 0.09 });
    noise(c, t, { freq: 2400, q: 1.1, peak: 0.07, dur: 0.035 });
  },

  // Paper rustle (hovering cards)
  paper: (c, t) => {
    noise(c, t, { freq: 2600, endFreq: 6500, type: "highpass", peak: 0.05, dur: 0.1 });
    noise(c, t + 0.05, { freq: 3200, endFreq: 7000, type: "highpass", peak: 0.035, dur: 0.07 });
  },

  // Typing in the contact form
  key: (c, t) => {
    const f = 850 + Math.random() * 350;
    tone(c, t, { freq: f, endFreq: f * 0.75, type: "triangle", peak: 0.045, dur: 0.03 });
    noise(c, t, { freq: 3400, q: 1.5, peak: 0.025, dur: 0.02 });
  },

  // Day: bright rising chime
  day: (c, t) => {
    tone(c, t, { freq: 660, peak: 0.08, dur: 0.4 });
    tone(c, t + 0.08, { freq: 880, peak: 0.08, dur: 0.4 });
    tone(c, t + 0.16, { freq: 1320, peak: 0.07, dur: 0.55 });
  },

  // Night: soft falling notes
  night: (c, t) => {
    tone(c, t, { freq: 440, peak: 0.09, dur: 0.45 });
    tone(c, t + 0.11, { freq: 330, peak: 0.09, dur: 0.5 });
    tone(c, t + 0.22, { freq: 220, peak: 0.08, dur: 0.6 });
  },

  // Sound toggled on / off, also "found a skill" in the game
  on: (c, t) => {
    tone(c, t, { freq: 520, peak: 0.09, dur: 0.18 });
    tone(c, t + 0.07, { freq: 780, peak: 0.09, dur: 0.26 });
  },
  off: (c, t) => {
    tone(c, t, { freq: 620, peak: 0.09, dur: 0.18 });
    tone(c, t + 0.07, { freq: 400, peak: 0.09, dur: 0.26 });
  },

  // Message sent: a happy little arpeggio
  send: (c, t) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      tone(c, t + i * 0.075, { freq: f, peak: 0.1, dur: 0.38 });
      tone(c, t + i * 0.075, { freq: f * 2, type: "triangle", peak: 0.025, dur: 0.25 });
    });
  },

  // Something went wrong
  error: (c, t) => tone(c, t, { freq: 170, endFreq: 105, type: "triangle", peak: 0.13, dur: 0.24 }),

  // Loader curtains opening
  whoosh: (c, t) =>
    noise(c, t, { freq: 250, endFreq: 2600, q: 0.9, peak: 0.15, attack: 0.28, dur: 0.95 }),

  // Jumping or launching into the water
  splash: (c, t) => {
    noise(c, t, { freq: 2400, endFreq: 320, type: "lowpass", peak: 0.22, attack: 0.012, dur: 0.6 });
    noise(c, t + 0.03, { freq: 3600, type: "highpass", peak: 0.07, dur: 0.32 });
  },

  // A footstep
  step: (c, t) => {
    const f = 105 + Math.random() * 40;
    tone(c, t, { freq: f, endFreq: f * 0.6, peak: 0.1, dur: 0.07 });
    noise(c, t, { freq: 700 + Math.random() * 500, type: "lowpass", peak: 0.09, dur: 0.06 });
  },

  // A swimming stroke
  stroke: (c, t) =>
    noise(c, t, { freq: 1100, endFreq: 450, q: 0.8, peak: 0.09, attack: 0.07, dur: 0.42 }),

  // Rocket explosion: a deep thump, a rolling blast, and a little crackle
  boom: (c, t) => {
    tone(c, t, { freq: 90, endFreq: 28, peak: 0.45, attack: 0.008, dur: 1.3 });
    noise(c, t, { freq: 3200, endFreq: 70, type: "lowpass", peak: 0.5, attack: 0.01, dur: 1.9 });
    noise(c, t + 0.05, { freq: 4200, endFreq: 900, type: "highpass", peak: 0.08, attack: 0.005, dur: 0.6 });
  },

  // Player's cannon: a short, soft "pew", slightly different every shot
  laser: (c, t) => {
    const f = 1500 + Math.random() * 250;
    tone(c, t, { freq: f, endFreq: 240, type: "square", peak: 0.022, attack: 0.002, dur: 0.09 });
    tone(c, t, { freq: f * 0.5, endFreq: 160, type: "triangle", peak: 0.03, attack: 0.002, dur: 0.1 });
  },

  // Enemy fire: lower and buzzier
  zap: (c, t) => tone(c, t, { freq: 620, endFreq: 140, type: "sawtooth", peak: 0.025, attack: 0.003, dur: 0.16 }),

  // Something you shot blew up: smaller than the ship explosion
  blast: (c, t) => {
    tone(c, t, { freq: 120, endFreq: 40, peak: 0.22, attack: 0.006, dur: 0.55 });
    noise(c, t, { freq: 2600, endFreq: 120, type: "lowpass", peak: 0.26, attack: 0.006, dur: 0.75 });
  },

  // A shot that hit but did not destroy
  hit: (c, t) => noise(c, t, { freq: 3000, endFreq: 900, q: 1.4, peak: 0.07, attack: 0.002, dur: 0.06 }),

  // Missile warning: two quick beeps
  alarm: (c, t) => {
    tone(c, t, { freq: 980, type: "square", peak: 0.035, dur: 0.09 });
    tone(c, t + 0.16, { freq: 980, type: "square", peak: 0.035, dur: 0.09 });
  },
};

// Minimum gap between repeats of the same sound (ms), so nothing chatters.
const minGap: Partial<Record<SoundName, number>> = {
  tick: 80,
  paper: 160,
  key: 35,
  tap: 45,
  step: 110,
  stroke: 250,
  splash: 300,
  laser: 60,
  zap: 90,
  blast: 70,
  hit: 50,
  alarm: 400,
};
const lastPlayed: Partial<Record<SoundName, number>> = {};

export function playSound(name: SoundName, opts?: { force?: boolean }) {
  if (typeof window === "undefined") return;
  if (!opts?.force && !readEnabled()) return;
  if (!userHasInteracted()) return;

  const now = performance.now();
  const gap = minGap[name];
  if (gap && now - (lastPlayed[name] ?? 0) < gap) return;
  lastPlayed[name] = now;

  const c = ensureContext();
  if (!c) return;
  if (c.state === "suspended" && !document.hidden) void c.resume();

  voices[name](c, c.currentTime + 0.005);
}

/* ------------------------------------------------------------------ */
/*  Background music: a slow, generative ambient loop                  */
/* ------------------------------------------------------------------ */
const MUSIC_VOLUME = 0.5;
const CHORD_SECONDS = 8;
// Cmaj7, Am7, Fmaj7, G6 (as MIDI notes, lowest note is the bass)
const CHORDS = [
  [48, 55, 64, 71],
  [45, 52, 60, 67],
  [41, 48, 57, 64],
  [43, 50, 59, 64],
];
// C major pentatonic, for the sparse melody on top
const MELODY = [72, 74, 76, 79, 81, 84];
const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

let musicBus: GainNode | null = null;
let melodyIn: GainNode | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let nextChord = 0;
let nextNote = 0;
let chordIndex = 0;
let lastNote = -1;

function buildMusic(c: AudioContext) {
  musicBus = c.createGain();
  musicBus.gain.value = 0;
  musicBus.connect(master!);

  // The melody goes through an echo for a sense of space.
  melodyIn = c.createGain();
  const delay = c.createDelay(1);
  delay.delayTime.value = 0.42;
  const feedback = c.createGain();
  feedback.gain.value = 0.38;
  const wet = c.createGain();
  wet.gain.value = 0.5;
  melodyIn.connect(musicBus);
  melodyIn.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(musicBus);
}

function playChord(c: AudioContext, at: number, notes: number[]) {
  const warm = c.createBiquadFilter();
  warm.type = "lowpass";
  warm.frequency.value = 1100;
  warm.connect(musicBus!);

  notes.forEach((m, i) => {
    const bass = i === 0;
    for (const detune of bass ? [0] : [-4, 4]) {
      const osc = c.createOscillator();
      osc.type = bass ? "sine" : "triangle";
      osc.frequency.value = midi(m);
      osc.detune.value = detune;
      const g = c.createGain();
      const peak = bass ? 0.05 : 0.02;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(peak, at + 3);
      g.gain.setValueAtTime(peak, at + CHORD_SECONDS - 1);
      g.gain.linearRampToValueAtTime(0, at + CHORD_SECONDS + 2.5);
      osc.connect(g);
      g.connect(warm);
      osc.start(at);
      osc.stop(at + CHORD_SECONDS + 2.6);
    }
  });
}

function playMelodyNote(c: AudioContext, at: number) {
  let i = Math.floor(Math.random() * MELODY.length);
  if (i === lastNote) i = (i + 1) % MELODY.length;
  lastNote = i;
  tone(c, at, { freq: midi(MELODY[i]), type: "triangle", peak: 0.045, attack: 0.012, dur: 2.2 }, melodyIn!);
}

function scheduleMusic(c: AudioContext) {
  const now = c.currentTime;
  // If the tab was asleep, skip ahead instead of playing a pile-up.
  if (nextChord < now - 0.5) nextChord = now + 0.1;
  if (nextNote < now - 0.5) nextNote = now + 0.6;

  const horizon = now + 1.2;
  while (nextChord < horizon) {
    playChord(c, nextChord, CHORDS[chordIndex % CHORDS.length]);
    chordIndex++;
    nextChord += CHORD_SECONDS;
  }
  while (nextNote < horizon) {
    if (Math.random() < 0.75) playMelodyNote(c, nextNote);
    nextNote += 0.8 * (1 + Math.floor(Math.random() * 3));
  }
}

function startMusic(c: AudioContext) {
  if (!musicBus) buildMusic(c);
  musicBus!.gain.cancelScheduledValues(c.currentTime);
  musicBus!.gain.setTargetAtTime(MUSIC_VOLUME, c.currentTime, 0.8);
  if (musicTimer) return;
  nextChord = c.currentTime + 0.15;
  nextNote = c.currentTime + 3;
  musicTimer = setInterval(() => scheduleMusic(c), 250);
  scheduleMusic(c);
}

function stopMusic(c: AudioContext) {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicBus) {
    musicBus.gain.cancelScheduledValues(c.currentTime);
    musicBus.gain.setTargetAtTime(0, c.currentTime, 0.25);
  }
}

/* ------------------------------------------------------------------ */
/*  Sea ambience (used by the island game)                             */
/* ------------------------------------------------------------------ */
const SEA_VOLUME = 0.16;
let seaOut: GainNode | null = null;
let seaLevel = 0;
let brownBuffer: AudioBuffer | null = null;

/**
 * Eight seconds of brown noise (deep and soft, unlike white noise's hiss).
 * The end is cross-faded into the start so the loop has no click.
 */
function getBrownNoise(c: AudioContext): AudioBuffer {
  if (!brownBuffer) {
    const len = c.sampleRate * 8;
    const fade = c.sampleRate;
    const raw = new Float32Array(len + fade);
    let last = 0;
    for (let i = 0; i < raw.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      raw[i] = last * 3.5;
    }
    brownBuffer = c.createBuffer(1, len, c.sampleRate);
    const data = brownBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      if (i < fade) {
        const k = (i / fade) * (Math.PI / 2);
        data[i] = raw[i] * Math.sin(k) + raw[len + i] * Math.cos(k);
      } else {
        data[i] = raw[i];
      }
    }
  }
  return brownBuffer;
}

function buildSea(c: AudioContext) {
  seaOut = c.createGain();
  seaOut.gain.value = 0;
  seaOut.connect(master!);

  const src = c.createBufferSource();
  src.buffer = getBrownNoise(c);
  src.loop = true;

  // Trim the deepest boom, then two gentle low-passes for a rounded rumble with no hiss.
  const trim = c.createBiquadFilter();
  trim.type = "highpass";
  trim.frequency.value = 60;
  trim.Q.value = 0.5;
  const soft = c.createBiquadFilter();
  soft.type = "lowpass";
  soft.frequency.value = 420;
  soft.Q.value = 0.5;
  const softer = c.createBiquadFilter();
  softer.type = "lowpass";
  softer.frequency.value = 520;
  softer.Q.value = 0.5;

  // One slow swell, roughly a wave every 11 seconds. As each wave rolls in it
  // also opens the filter a touch, so it "breathes" rather than pulses.
  const swell = c.createGain();
  swell.gain.value = 0.7;
  const wave = c.createOscillator();
  wave.frequency.value = 0.09;
  const depth = c.createGain();
  depth.gain.value = 0.22;
  const surge = c.createGain();
  surge.gain.value = 90;
  wave.connect(depth);
  depth.connect(swell.gain);
  wave.connect(surge);
  surge.connect(soft.frequency);

  src.connect(trim);
  trim.connect(soft);
  soft.connect(softer);
  softer.connect(swell);
  swell.connect(seaOut);

  wave.start();
  src.start();
}

function applySea(c: AudioContext) {
  const target = audible() ? seaLevel * SEA_VOLUME : 0;
  if (!seaOut) {
    if (target === 0) return;
    buildSea(c);
  }
  seaOut!.gain.cancelScheduledValues(c.currentTime);
  seaOut!.gain.setTargetAtTime(target, c.currentTime, 0.5);
}

/** How loud the sea is: 0 off (2D pages), about 0.5 on land, 1 out at sea. */
export function setSeaLevel(level: number) {
  if (level === seaLevel) return;
  seaLevel = level;
  syncContinuous();
}

/* ------------------------------------------------------------------ */
/*  Engines (speed boat and buggy)                                     */
/* ------------------------------------------------------------------ */
export type EngineKind = "boat" | "buggy" | null;

let engine: {
  a: OscillatorNode;
  b: OscillatorNode;
  lfo: OscillatorNode;
  filter: BiquadFilterNode;
  out: GainNode;
  spray: GainNode;
} | null = null;
let engineKind: EngineKind = null;
let engineSpeed = 0;

function buildEngine(c: AudioContext) {
  const a = c.createOscillator();
  a.type = "sawtooth";
  const b = c.createOscillator();
  b.type = "square";
  const bGain = c.createGain();
  bGain.gain.value = 0.5;

  // The putter: a fast wobble in loudness.
  const putter = c.createGain();
  putter.gain.value = 0.7;
  const lfo = c.createOscillator();
  lfo.frequency.value = 10;
  const lfoAmount = c.createGain();
  lfoAmount.gain.value = 0.3;
  lfo.connect(lfoAmount);
  lfoAmount.connect(putter.gain);

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 300;
  const out = c.createGain();
  out.gain.value = 0;

  a.connect(putter);
  b.connect(bGain);
  bGain.connect(putter);
  putter.connect(filter);
  filter.connect(out);
  out.connect(master!);

  // Water spray thrown up by the boat at speed.
  const sprayNoise = noiseSource(c);
  const sprayBand = c.createBiquadFilter();
  sprayBand.type = "lowpass";
  sprayBand.frequency.value = 1100;
  sprayBand.Q.value = 0.5;
  const spray = c.createGain();
  spray.gain.value = 0;
  sprayNoise.connect(sprayBand);
  sprayBand.connect(spray);
  spray.connect(master!);

  a.start();
  b.start();
  lfo.start();
  sprayNoise.start();
  engine = { a, b, lfo, filter, out, spray };
}

function applyEngine(c: AudioContext) {
  const kind = audible() ? engineKind : null;
  if (!engine) {
    if (!kind) return;
    buildEngine(c);
  }
  const e = engine!;
  const t = c.currentTime;
  const s = engineSpeed;
  const buggy = kind === "buggy";
  const pitch = (buggy ? 62 : 44) + (buggy ? 95 : 62) * s;

  e.a.frequency.setTargetAtTime(pitch, t, 0.12);
  e.b.frequency.setTargetAtTime(pitch * 0.5, t, 0.12);
  e.lfo.frequency.setTargetAtTime(9 + 22 * s, t, 0.12);
  e.filter.frequency.setTargetAtTime(buggy ? 500 + 1300 * s : 260 + 700 * s, t, 0.12);
  e.out.gain.setTargetAtTime(kind ? (buggy ? 0.035 + 0.05 * s : 0.04 + 0.07 * s) : 0, t, 0.15);
  e.spray.gain.setTargetAtTime(kind === "boat" ? 0.03 * s * s : 0, t, 0.3);
}

/** Which engine is running, and how fast it is going (0 to 1). */
export function setEngine(kind: EngineKind, speed: number) {
  if (kind === engineKind && Math.abs(speed - engineSpeed) < 0.02) return;
  engineKind = kind;
  engineSpeed = speed;
  if (ctx) applyEngine(ctx);
}

/* ------------------------------------------------------------------ */
/*  Rocket engine (used by the space game)                             */
/* ------------------------------------------------------------------ */
let rocket: { roar: BiquadFilterNode; out: GainNode; rumble: GainNode } | null = null;
let rocketThrottle = 0;

function buildRocket(c: AudioContext) {
  // A deep roar from soft noise, plus a low rumble you feel more than hear.
  const src = c.createBufferSource();
  src.buffer = getBrownNoise(c);
  src.loop = true;
  const roar = c.createBiquadFilter();
  roar.type = "lowpass";
  roar.frequency.value = 400;
  roar.Q.value = 0.6;
  const out = c.createGain();
  out.gain.value = 0;
  src.connect(roar);
  roar.connect(out);
  out.connect(master!);

  const low = c.createOscillator();
  low.frequency.value = 38;
  const rumble = c.createGain();
  rumble.gain.value = 0;
  low.connect(rumble);
  rumble.connect(master!);

  src.start(0, Math.random() * 4);
  low.start();
  rocket = { roar, out, rumble };
}

function applyRocket(c: AudioContext) {
  const throttle = audible() ? rocketThrottle : 0;
  if (!rocket) {
    if (throttle === 0) return;
    buildRocket(c);
  }
  const t = c.currentTime;
  rocket!.roar.frequency.setTargetAtTime(380 + 900 * throttle, t, 0.15);
  rocket!.out.gain.setTargetAtTime(throttle > 0 ? 0.08 + 0.16 * throttle : 0, t, 0.2);
  rocket!.rumble.gain.setTargetAtTime(throttle > 0 ? 0.05 + 0.05 * throttle : 0, t, 0.2);
}

/** Rocket engine level: 0 is off, about 0.4 cruising, 1 full boost. */
export function setRocket(throttle: number) {
  if (Math.abs(throttle - rocketThrottle) < 0.02 && (throttle === 0) === (rocketThrottle === 0)) return;
  rocketThrottle = throttle;
  if (ctx) applyRocket(ctx);
}

/* ------------------------------------------------------------------ */
/*  Keep the continuous sounds in step with on/off and gestures        */
/* ------------------------------------------------------------------ */
function syncContinuous() {
  if (typeof window === "undefined") return;
  const c = audible() ? ensureContext() : ctx;
  if (!c) return;
  if (audible()) startMusic(c);
  else stopMusic(c);
  applySea(c);
  applyEngine(c);
  applyRocket(c);
}
