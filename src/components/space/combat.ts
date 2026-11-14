// SPIKE: throwaway prototype of the space game. Not production code.
import * as THREE from "three";
import { playSound } from "@/lib/sound";
import { rocketLive, useSpace } from "./store";
import { CORRIDOR, rocks, type Rock } from "./world";

/*
 * Everything you can shoot, and everything that can shoot you.
 * Plain mutable state, updated once a frame by the flight controller and
 * drawn by the components in combat-view.tsx.
 *
 * The guns fire on their own at whatever is in front of you (with a little
 * aim assist). Missiles are launched by the player and home in on a target.
 */

const V = () => new THREE.Vector3();

/* ------------------------------------------------------------------ */
/*  Explosions requested by the game, drawn by <Blasts />              */
/* ------------------------------------------------------------------ */
export type BlastKind = "fire" | "rock" | "hit" | "mine";
export const blastQueue: { pos: THREE.Vector3; size: number; kind: BlastKind }[] = [];
function blast(x: number, y: number, z: number, size: number, kind: BlastKind) {
  if (blastQueue.length < 24) blastQueue.push({ pos: new THREE.Vector3(x, y, z), size, kind });
}

/** Ship hit test: spheres along the fuselage and one on each wing, as [x, z, radius]. */
export const HULL: [number, number, number][] = [
  [0, -3.3, 0.7],
  [0, -1.0, 0.8],
  [0, 1.6, 0.85],
  [-2.2, 2.0, 0.6],
  [2.2, 2.0, 0.6],
];

/** The two cannon muzzles under the wings, in ship space. */
export const GUNS = [V().set(-1.45, -0.42, -1.85), V().set(1.45, -0.42, -1.85)];
/** Where the two streams of fire cross when nothing is locked. */
export const CONVERGE = 150;

const BOLT_SPEED = 430;
const ENEMY_BOLT_SPEED = 150;
const FIGHTER_SPEED = 46;
const MISSILE_SPEED = 92;
const PLAYER_MISSILE_SPEED = 270;
/** How far ahead the guns will lock on. */
const LOCK_RANGE = 300;

export const MAX_MISSILES = 6;
const MISSILE_RECHARGE = 7;

export const SCORE = { rock: 10, satellite: 60, mine: 80, missile: 120, fighter: 150 };

/* ------------------------------------------------------------------ */
/*  Pools                                                              */
/* ------------------------------------------------------------------ */
export interface Bolt {
  pos: THREE.Vector3;
  prev: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  alive: boolean;
}
const makeBolts = (n: number): Bolt[] =>
  Array.from({ length: n }, () => ({ pos: V(), prev: V(), vel: V(), life: 0, alive: false }));
export const bolts = makeBolts(56);
export const enemyBolts = makeBolts(48);

export interface Fighter {
  pos: THREE.Vector3;
  active: boolean;
  hp: number;
  baseX: number;
  baseY: number;
  phase: number;
  fireIn: number;
  roll: number;
}
export const fighters: Fighter[] = Array.from({ length: 18 }, () => ({
  pos: V(),
  active: false,
  hp: 0,
  baseX: 0,
  baseY: 0,
  phase: 0,
  fireIn: 0,
  roll: 0,
}));

export interface Missile {
  pos: THREE.Vector3;
  prev: THREE.Vector3;
  vel: THREE.Vector3;
  active: boolean;
  life: number;
  /** Player missiles only: what it is homing in on. */
  target: TargetRef | null;
}
const makeMissiles = (n: number): Missile[] =>
  Array.from({ length: n }, () => ({ pos: V(), prev: V(), vel: V(), active: false, life: 0, target: null }));
/** Enemy missiles, homing in on you. */
export const missiles = makeMissiles(12);
/** Your missiles. */
export const playerMissiles = makeMissiles(8);

/** Old satellites and mines: placed along the route, shootable, deadly to touch. */
export interface Prop {
  pos: THREE.Vector3;
  base: THREE.Vector3;
  r: number;
  maxHp: number;
  hp: number;
  alive: boolean;
  axis: THREE.Vector3;
  spin: number;
  phase: number;
}

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a * 16807) % 2147483647;
    return a / 2147483647;
  };
}

const makeProps = (zs: number[], r: number, hp: number, seed: number): Prop[] => {
  const rnd = seeded(seed);
  return zs.map((z) => {
    const base = V().set((rnd() * 2 - 1) * CORRIDOR.x * 0.85, (rnd() * 2 - 1) * CORRIDOR.y * 0.8, z);
    return {
      pos: base.clone(),
      base,
      r,
      maxHp: hp,
      hp,
      alive: true,
      axis: V().set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
      spin: 0.2 + rnd() * 0.5,
      phase: rnd() * Math.PI * 2,
    };
  });
};

export const satellites = makeProps([-260, -540, -780, -2080, -2420, -2720, -2960], 3.0, 3, 11);
export const mines = makeProps(
  [-960, -990, -1030, -1060, -1100, -1130, -1170, -1200, -2330, -2370, -2400, -2440, -2480, -2520],
  1.7,
  1,
  23
);

/* ------------------------------------------------------------------ */
/*  Targets: anything that can be shot, behind one small interface     */
/* ------------------------------------------------------------------ */
type TargetKind = "rock" | "fighter" | "missile" | "satellite" | "mine";
export interface TargetRef {
  kind: TargetKind;
  obj: Rock | Fighter | Missile | Prop;
}

function alive(t: TargetRef) {
  switch (t.kind) {
    case "rock":
    case "satellite":
    case "mine":
      return (t.obj as Rock | Prop).alive;
    default:
      return (t.obj as Fighter | Missile).active;
  }
}
function posOf(t: TargetRef, out: THREE.Vector3) {
  if (t.kind === "rock") {
    const r = t.obj as Rock;
    return out.set(r.x, r.y, r.z);
  }
  return out.copy((t.obj as Fighter).pos);
}
function radiusOf(t: TargetRef) {
  switch (t.kind) {
    case "rock":
      return (t.obj as Rock).r * 0.92;
    case "fighter":
      return 4.2;
    case "missile":
      return 2.3;
    case "satellite":
      return (t.obj as Prop).r * 1.1;
    case "mine":
      return 2.0;
  }
}

/** What the guns are locked on to right now (read by the reticle). */
export const lock = { target: null as TargetRef | null, pos: V(), r: 0 };

/* ------------------------------------------------------------------ */
/*  The script for the run: who shows up where                         */
/* ------------------------------------------------------------------ */
interface Wave {
  at: number;
  kind: "fighters" | "missiles" | "note";
  count?: number;
  text: string;
  done: boolean;
}
const WAVES: Wave[] = [
  { at: -60, kind: "note", text: "Guns fire on their own · Space launches a missile", done: false },
  { at: -380, kind: "fighters", count: 3, text: "Enemy fighters ahead", done: false },
  { at: -880, kind: "note", text: "Minefield · one shot sets off the whole cluster", done: false },
  { at: -1240, kind: "fighters", count: 4, text: "Enemy fighters ahead", done: false },
  { at: -1400, kind: "note", text: "Entering the asteroid belt", done: false },
  { at: -1620, kind: "missiles", count: 2, text: "Missile warning", done: false },
  { at: -1960, kind: "missiles", count: 3, text: "Missile warning", done: false },
  { at: -2220, kind: "fighters", count: 5, text: "Enemy squadron ahead", done: false },
  { at: -2600, kind: "missiles", count: 2, text: "Missile warning", done: false },
  { at: -2800, kind: "fighters", count: 3, text: "Last wave before Mars", done: false },
  { at: -3010, kind: "missiles", count: 2, text: "Missile warning", done: false },
];

export const combat = { cooldown: 0, side: 1, ammo: MAX_MISSILES, recharge: 0, missileSide: 1 };

export function resetCombat() {
  for (const r of rocks) {
    r.alive = true;
    r.hp = r.maxHp;
  }
  for (const b of bolts) b.alive = false;
  for (const b of enemyBolts) b.alive = false;
  for (const f of fighters) f.active = false;
  for (const m of missiles) m.active = false;
  for (const m of playerMissiles) m.active = false;
  for (const p of [...satellites, ...mines]) {
    p.alive = true;
    p.hp = p.maxHp;
  }
  for (const w of WAVES) w.done = false;
  combat.cooldown = 0;
  combat.ammo = MAX_MISSILES;
  combat.recharge = 0;
  lock.target = null;
  blastQueue.length = 0;
  useSpace.getState().setAmmo(MAX_MISSILES);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const rand = Math.random;
const tmp = V();
const tmp2 = V();
const tpos = V();

/** Squared distance from point c to the segment a→b. */
function segDist2(a: THREE.Vector3, b: THREE.Vector3, cx: number, cy: number, cz: number) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;
  const len2 = abx * abx + aby * aby + abz * abz || 1e-6;
  let k = ((cx - a.x) * abx + (cy - a.y) * aby + (cz - a.z) * abz) / len2;
  k = Math.max(0, Math.min(1, k));
  const dx = a.x + abx * k - cx;
  const dy = a.y + aby * k - cy;
  const dz = a.z + abz * k - cz;
  return dx * dx + dy * dy + dz * dz;
}

function award(points: number) {
  useSpace.getState().addScore(points);
}

/* ------------------------------------------------------------------ */
/*  Damage                                                             */
/* ------------------------------------------------------------------ */
function damageRock(r: Rock, at: THREE.Vector3, power = 1) {
  r.hp -= power;
  if (r.hp > 0) {
    blast(at.x, at.y, at.z, 1.2, "hit");
    playSound("hit");
    return;
  }
  r.alive = false;
  blast(r.x, r.y, r.z, r.r * 1.3, "rock");
  award(SCORE.rock * r.maxHp);
  playSound("blast");
}

function destroyFighter(f: Fighter) {
  f.active = false;
  blast(f.pos.x, f.pos.y, f.pos.z, 7, "fire");
  award(SCORE.fighter);
  playSound("blast");
}

function destroyMissile(m: Missile) {
  m.active = false;
  blast(m.pos.x, m.pos.y, m.pos.z, 4.5, "fire");
  award(SCORE.missile);
  playSound("blast");
}

function destroySatellite(p: Prop) {
  p.alive = false;
  blast(p.pos.x, p.pos.y, p.pos.z, 6, "fire");
  award(SCORE.satellite);
  playSound("blast");
}

/**
 * A big explosion (a mine, or one of your missiles) that destroys everything
 * close by. Mines caught in it go off too, so they chain.
 */
function areaBlast(x: number, y: number, z: number, radius: number, size: number, kind: BlastKind, scored: boolean) {
  const queue: { x: number; y: number; z: number; r: number; size: number; kind: BlastKind }[] = [
    { x, y, z, r: radius, size, kind },
  ];
  while (queue.length) {
    const b = queue.pop()!;
    blast(b.x, b.y, b.z, b.size, b.kind);
    playSound("blast");
    const near = (px: number, py: number, pz: number, r: number) =>
      (px - b.x) ** 2 + (py - b.y) ** 2 + (pz - b.z) ** 2 < (b.r + r) ** 2;
    for (const r of rocks) if (r.alive && Math.abs(r.z - b.z) < b.r + 10 && near(r.x, r.y, r.z, r.r)) damageRock(r, tmp.set(b.x, b.y, b.z), 99);
    for (const m of mines) {
      if (m.alive && near(m.pos.x, m.pos.y, m.pos.z, 0)) {
        m.alive = false;
        if (scored) award(SCORE.mine);
        queue.push({ x: m.pos.x, y: m.pos.y, z: m.pos.z, r: 16, size: 11, kind: "mine" });
      }
    }
    for (const s of satellites) if (s.alive && near(s.pos.x, s.pos.y, s.pos.z, s.r)) destroySatellite(s);
    for (const f of fighters) if (f.active && near(f.pos.x, f.pos.y, f.pos.z, 3)) destroyFighter(f);
    for (const mi of missiles) if (mi.active && near(mi.pos.x, mi.pos.y, mi.pos.z, 1.5)) destroyMissile(mi);
  }
}

function detonateMine(m: Prop, scored = true) {
  m.alive = false;
  if (scored) award(SCORE.mine);
  areaBlast(m.pos.x, m.pos.y, m.pos.z, 16, 11, "mine", scored);
}

/** The first thing the segment a→b passes through, if any. */
const hitRef: TargetRef = { kind: "rock", obj: rocks[0] };
function firstHit(a: THREE.Vector3, b: THREE.Vector3): TargetRef | null {
  const z = b.z;
  for (const r of rocks) {
    if (!r.alive || Math.abs(r.z - z) > r.r + 14) continue;
    const rr = r.r * 0.92;
    if (segDist2(a, b, r.x, r.y, r.z) < rr * rr) return Object.assign(hitRef, { kind: "rock", obj: r });
  }
  for (const f of fighters) {
    if (!f.active || Math.abs(f.pos.z - z) > 18) continue;
    if (segDist2(a, b, f.pos.x, f.pos.y, f.pos.z) < 4.2 * 4.2) return Object.assign(hitRef, { kind: "fighter", obj: f });
  }
  for (const m of missiles) {
    if (!m.active || Math.abs(m.pos.z - z) > 16) continue;
    if (segDist2(a, b, m.pos.x, m.pos.y, m.pos.z) < 2.3 * 2.3) return Object.assign(hitRef, { kind: "missile", obj: m });
  }
  for (const s of satellites) {
    if (!s.alive || Math.abs(s.pos.z - z) > 16) continue;
    if (segDist2(a, b, s.pos.x, s.pos.y, s.pos.z) < s.r * s.r * 1.2) return Object.assign(hitRef, { kind: "satellite", obj: s });
  }
  for (const m of mines) {
    if (!m.alive || Math.abs(m.pos.z - z) > 16) continue;
    if (segDist2(a, b, m.pos.x, m.pos.y, m.pos.z) < 2.0 * 2.0) return Object.assign(hitRef, { kind: "mine", obj: m });
  }
  return null;
}

/** One bolt hits one thing for one point of damage. */
function boltDamage(t: TargetRef, at: THREE.Vector3) {
  switch (t.kind) {
    case "rock":
      damageRock(t.obj as Rock, at);
      break;
    case "missile":
      destroyMissile(t.obj as Missile);
      break;
    case "mine":
      detonateMine(t.obj as Prop);
      break;
    case "fighter":
    case "satellite": {
      const o = t.obj as Fighter | Prop;
      o.hp -= 1;
      if (o.hp > 0) {
        blast(at.x, at.y, at.z, 1.4, "hit");
        playSound("hit");
      } else if (t.kind === "fighter") destroyFighter(o as Fighter);
      else destroySatellite(o as Prop);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Lock-on: the best thing to shoot in front of the ship              */
/* ------------------------------------------------------------------ */
const PRIORITY: Record<TargetKind, number> = { missile: 140, fighter: 110, mine: 40, satellite: 30, rock: 0 };

/**
 * Picks a target in a cone ahead of the ship. Incoming missiles and fighters
 * come first, then whatever is nearest.
 */
function pickTarget(sx: number, sy: number, sz: number, out: TargetRef): boolean {
  let best = Infinity;
  const consider = (kind: TargetKind, obj: TargetRef["obj"], x: number, y: number, z: number, r: number) => {
    const ahead = sz - z;
    if (ahead < 14 || ahead > LOCK_RANGE) return;
    const lateral = Math.hypot(x - sx, y - sy);
    if (lateral > 8 + ahead * 0.22 + r) return;
    const score = ahead + lateral * 2.5 - PRIORITY[kind];
    if (score < best) {
      best = score;
      out.kind = kind;
      out.obj = obj;
    }
  };
  for (const r of rocks) if (r.alive && r.z < sz && sz - r.z < LOCK_RANGE) consider("rock", r, r.x, r.y, r.z, r.r);
  for (const f of fighters) if (f.active) consider("fighter", f, f.pos.x, f.pos.y, f.pos.z, 3);
  for (const m of missiles) if (m.active) consider("missile", m, m.pos.x, m.pos.y, m.pos.z, 2);
  for (const s of satellites) if (s.alive) consider("satellite", s, s.pos.x, s.pos.y, s.pos.z, s.r);
  for (const m of mines) if (m.alive) consider("mine", m, m.pos.x, m.pos.y, m.pos.z, 2);
  return best < Infinity;
}

const pickRef: TargetRef = { kind: "rock", obj: rocks[0] };

/* ------------------------------------------------------------------ */
/*  Waves                                                              */
/* ------------------------------------------------------------------ */
function startWave(w: Wave, sz: number) {
  const game = useSpace.getState();
  game.setAlert(w.text);
  if (w.kind === "fighters") {
    const n = w.count ?? 3;
    for (let i = 0; i < n; i++) {
      const f = fighters.find((x) => !x.active);
      if (!f) break;
      const slot = i - (n - 1) / 2;
      f.active = true;
      f.hp = 2;
      f.baseX = THREE.MathUtils.clamp(slot * 9 + (rand() - 0.5) * 4, -CORRIDOR.x, CORRIDOR.x);
      f.baseY = (rand() - 0.5) * CORRIDOR.y * 1.2;
      f.phase = rand() * Math.PI * 2;
      f.fireIn = 0.8 + rand() * 1.6;
      f.roll = 0;
      // A V formation: the leader in front
      f.pos.set(f.baseX, f.baseY, sz - 560 - Math.abs(slot) * 16);
    }
  }
  if (w.kind === "missiles") {
    playSound("alarm");
    const n = w.count ?? 2;
    for (let i = 0; i < n; i++) {
      const m = missiles.find((x) => !x.active);
      if (!m) break;
      m.active = true;
      m.life = 10;
      m.pos.set((rand() - 0.5) * 34, (rand() - 0.5) * 18, sz - 470 - i * 45);
      m.prev.copy(m.pos);
      m.vel.set(0, 0, MISSILE_SPEED);
    }
  }
}

function fireEnemy(from: THREE.Vector3, sx: number, sy: number, sz: number) {
  const b = enemyBolts.find((x) => !x.alive);
  if (!b) return;
  b.alive = true;
  b.life = 4;
  b.pos.copy(from);
  b.prev.copy(from);
  b.vel.set(sx - from.x, sy - from.y, sz - from.z).normalize().multiplyScalar(ENEMY_BOLT_SPEED);
  b.vel.z += FIGHTER_SPEED;
  playSound("zap");
}

/* ------------------------------------------------------------------ */
/*  One frame of combat                                                */
/* ------------------------------------------------------------------ */
export interface ShipState {
  x: number;
  y: number;
  z: number;
  speed: number;
  roll: number;
}

/**
 * Moves everything, fires the guns, launches missiles, resolves hits.
 * Returns true if the player's ship was hit by something.
 */
export function updateCombat(
  dt: number,
  t: number,
  ship: ShipState,
  controls: { fire: boolean; missile: boolean; weapons: boolean },
  invulnerable: boolean
): boolean {
  const { x: sx, y: sy, z: sz } = ship;

  for (const w of WAVES) {
    if (!w.done && sz <= w.at) {
      w.done = true;
      startWave(w, sz);
    }
  }

  /* ---------- Lock-on ---------- */
  if (controls.weapons && pickTarget(sx, sy, sz, pickRef)) {
    lock.target = lock.target ?? { kind: pickRef.kind, obj: pickRef.obj };
    lock.target.kind = pickRef.kind;
    lock.target.obj = pickRef.obj;
    posOf(lock.target, lock.pos);
    lock.r = radiusOf(lock.target);
  } else lock.target = null;

  /* ---------- Guns: fire on their own at the locked target ---------- */
  combat.cooldown -= dt;
  if (controls.weapons && (lock.target || controls.fire) && combat.cooldown <= 0) {
    combat.cooldown = 0.1;
    combat.side = combat.side > 0 ? 0 : 1;
    const b = bolts.find((x) => !x.alive);
    if (b) {
      const gun = GUNS[combat.side];
      b.alive = true;
      b.life = 1.3;
      b.pos.set(sx + gun.x, sy + gun.y, sz + gun.z);
      b.prev.copy(b.pos);
      // Aim assist: straight at the locked target, or where the streams cross.
      if (lock.target) tmp.copy(lock.pos);
      else tmp.set(sx, sy, sz - CONVERGE);
      tmp.sub(b.pos).normalize();
      b.vel.copy(tmp).multiplyScalar(BOLT_SPEED).add(tmp2.set(0, 0, -ship.speed));
      rocketLive.muzzle[combat.side] = 0.06;
      playSound("laser");
    }
  }

  for (const b of bolts) {
    if (!b.alive) continue;
    b.life -= dt;
    if (b.life <= 0) {
      b.alive = false;
      continue;
    }
    b.prev.copy(b.pos);
    b.pos.addScaledVector(b.vel, dt);
    const hit = firstHit(b.prev, b.pos);
    if (hit) {
      b.alive = false;
      boltDamage(hit, b.pos);
    }
  }

  /* ---------- Your missiles ---------- */
  combat.recharge += dt;
  if (combat.ammo < MAX_MISSILES && combat.recharge >= MISSILE_RECHARGE) {
    combat.recharge = 0;
    combat.ammo += 1;
    useSpace.getState().setAmmo(combat.ammo);
  }
  if (controls.weapons && controls.missile) {
    const m = playerMissiles.find((x) => !x.active);
    if (combat.ammo > 0 && m) {
      combat.ammo -= 1;
      combat.recharge = 0;
      combat.missileSide = -combat.missileSide;
      useSpace.getState().setAmmo(combat.ammo);
      m.active = true;
      m.life = 3.2;
      m.pos.set(sx + combat.missileSide * 0.9, sy - 0.75, sz - 0.5);
      m.prev.copy(m.pos);
      m.vel.set(combat.missileSide * 10, -6, -(ship.speed + 60));
      m.target = lock.target ? { kind: lock.target.kind, obj: lock.target.obj } : null;
      playSound("whoosh");
    } else {
      playSound("error");
    }
  }
  for (const m of playerMissiles) {
    if (!m.active) continue;
    m.life -= dt;
    // Lost its target? Pick the next best one.
    if (!m.target || !alive(m.target)) {
      m.target = pickTarget(m.pos.x, m.pos.y, m.pos.z, pickRef) ? { kind: pickRef.kind, obj: pickRef.obj } : null;
    }
    const speed = Math.min(PLAYER_MISSILE_SPEED, m.vel.length() + dt * 420);
    if (m.target) {
      posOf(m.target, tpos);
      tmp.subVectors(tpos, m.pos).normalize().multiplyScalar(speed);
      m.vel.lerp(tmp, 1 - Math.exp(-dt * 7)).setLength(speed);
    } else m.vel.setLength(speed);
    m.prev.copy(m.pos);
    m.pos.addScaledVector(m.vel, dt);

    const close = m.target && tpos.distanceToSquared(m.pos) < (radiusOf(m.target) + 1.5) ** 2;
    if (close || firstHit(m.prev, m.pos) || m.life <= 0) {
      m.active = false;
      areaBlast(m.pos.x, m.pos.y, m.pos.z, 14, 9, "fire", true);
    }
  }

  /* ---------- Fighters fly at you, weaving, and shoot when in range ---------- */
  for (const f of fighters) {
    if (!f.active) continue;
    f.pos.z += FIGHTER_SPEED * dt;
    const nx = f.baseX + Math.sin(t * 1.2 + f.phase) * 8;
    const ny = f.baseY + Math.cos(t * 0.9 + f.phase) * 3;
    const vx = (nx - f.pos.x) / Math.max(dt, 1e-3);
    f.roll += (THREE.MathUtils.clamp(-vx * 0.09, -1.1, 1.1) - f.roll) * Math.min(1, dt * 4);
    f.pos.x = nx;
    f.pos.y = ny;
    const ahead = sz - f.pos.z;
    if (ahead > 70 && ahead < 380) {
      f.fireIn -= dt;
      if (f.fireIn <= 0) {
        f.fireIn = 1.3 + rand() * 1.4;
        fireEnemy(f.pos, sx, sy, sz);
      }
    }
    if (ahead < -40) f.active = false;
  }

  /* ---------- Enemy missiles home in, then fly straight so they can be dodged ---------- */
  for (const m of missiles) {
    if (!m.active) continue;
    m.life -= dt;
    const ahead = sz - m.pos.z;
    if (ahead > 70) {
      tmp.set(sx - m.pos.x, sy - m.pos.y, sz - m.pos.z).normalize().multiplyScalar(MISSILE_SPEED);
      m.vel.lerp(tmp, 1 - Math.exp(-dt * 0.8)).setLength(MISSILE_SPEED);
    }
    m.prev.copy(m.pos);
    m.pos.addScaledVector(m.vel, dt);
    if (ahead < -60 || m.life <= 0) m.active = false;
  }

  for (const b of enemyBolts) {
    if (!b.alive) continue;
    b.life -= dt;
    b.prev.copy(b.pos);
    b.pos.addScaledVector(b.vel, dt);
    if (b.life <= 0 || b.pos.z > sz + 30) b.alive = false;
  }

  for (const m of mines) {
    if (m.alive) m.pos.y = m.base.y + Math.sin(t * 1.2 + m.phase) * 0.6;
  }

  if (invulnerable) return false;

  /* ---------- Did anything hit the ship? Wingtips rise and fall as it banks. ---------- */
  const cos = Math.cos(ship.roll);
  const sin = Math.sin(ship.roll);
  for (const [hx, hz, hr] of HULL) {
    const wx = sx + hx * cos;
    const wy = sy + hx * sin;
    const wz = sz + hz;
    const touch = (x: number, y: number, z: number, r: number) =>
      (x - wx) ** 2 + (y - wy) ** 2 + (z - wz) ** 2 < (r + hr) ** 2;

    for (const r of rocks) if (r.alive && Math.abs(r.z - wz) < r.r + 3 && touch(r.x, r.y, r.z, r.r * 0.82)) return true;
    for (const f of fighters) if (f.active && touch(f.pos.x, f.pos.y, f.pos.z, 3.0)) return true;
    for (const m of missiles) {
      if (m.active && touch(m.pos.x, m.pos.y, m.pos.z, 1.6)) {
        m.active = false;
        return true;
      }
    }
    for (const s of satellites) if (s.alive && touch(s.pos.x, s.pos.y, s.pos.z, s.r * 0.85)) return true;
    for (const m of mines) {
      if (m.alive && touch(m.pos.x, m.pos.y, m.pos.z, 2.6)) {
        detonateMine(m, false);
        return true;
      }
    }
    for (const b of enemyBolts) {
      if (b.alive && touch(b.pos.x, b.pos.y, b.pos.z, 0.5)) {
        b.alive = false;
        return true;
      }
    }
  }
  return false;
}
