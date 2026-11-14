// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  Layers,
  MapPin,
  Navigation,
  Rocket,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { experiences, projects, skillGroups } from "@/lib/constants";
import { travelLocations } from "@/data/travel-data";
import { contactLinks, emailAddress, glass, primaryBtn, secondaryBtn } from "./dossier";
import { LEVELS } from "./levels";
import { ACTIVITY, stationsFor, type Station } from "./stations";
import { input, useLevel, useSpace } from "./store";

const chip = "rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-xs text-white/80";
const label = "text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45";

/* ------------------------------------------------------------------ */
/*  Linking the portfolio together: which skill was used where, which  */
/*  project was built at which job.                                    */
/* ------------------------------------------------------------------ */

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\.js\b/g, "")
    .replace(/[^a-z0-9+#]/g, "");

/** "React.js" matches "React", "Tailwind CSS" matches "Tailwind CSS", and so on. */
function sameTech(a: string, b: string) {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  return x === y || (x.length > 3 && y.startsWith(x)) || (y.length > 3 && x.startsWith(y));
}

const shortCompany = (name: string) => name.replace(/\s+(Technologies|Pte\.?|Limited|Ltd\.?|InfoTech).*$/i, "");

function usedAt(skill: string) {
  return {
    jobs: experiences.filter((j) => j.tech.some((t) => sameTech(t, skill))).map((j) => shortCompany(j.company)),
    projects: projects.filter((p) => p.tech.some((t) => sameTech(t, skill))).map((p) => p.title),
  };
}

/** The job a project was built at: the one whose story names it. */
const jobFor = (title: string) => experiences.find((j) => j.description.toLowerCase().includes(title.toLowerCase()));
/** Projects a job's story names. */
const projectsAt = (description: string) =>
  projects.filter((p) => description.toLowerCase().includes(p.title.toLowerCase()));

/** "April 2024 — Present" → "since 2024 · 2 yrs" */
function tenure(period: string) {
  const years = period.match(/\d{4}/g)?.map(Number) ?? [];
  const start = years[0];
  const end = /present/i.test(period) ? new Date().getFullYear() : (years[1] ?? start);
  if (!start) return period;
  const n = Math.max(1, end - start);
  return `${n} yr${n === 1 ? "" : "s"}`;
}

/** Split a paragraph into short highlights. */
const highlights = (text: string) =>
  text
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);

/* ------------------------------------------------------------------ */
/*  What each station tells you                                        */
/* ------------------------------------------------------------------ */

function SkillBody({ i }: { i: number }) {
  const g = skillGroups[i];
  const rows = g.skills
    .map((s) => ({ skill: s, ...usedAt(s) }))
    .sort((a, b) => b.jobs.length + b.projects.length - (a.jobs.length + a.projects.length));
  const jobs = new Set(rows.flatMap((r) => r.jobs));
  const shipped = new Set(rows.flatMap((r) => r.projects));
  return (
    <>
      <p className="text-sm text-white/70">
        {g.skills.length} tools I use, across {jobs.size} {jobs.size === 1 ? "job" : "jobs"} and {shipped.size} shipped{" "}
        {shipped.size === 1 ? "project" : "projects"}.
      </p>
      <ul className="mt-4 divide-y divide-white/[0.07]">
        {rows.map((r) => {
          const where = [...r.jobs, ...r.projects];
          return (
            <li key={r.skill} className="flex items-baseline justify-between gap-3 py-2">
              <span className={`text-sm font-medium ${where.length ? "text-white" : "text-white/60"}`}>{r.skill}</span>
              <span className="truncate text-right text-xs text-white/45">
                {where.length ? where.slice(0, 3).join(" · ") : "side projects"}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function JobBody({ i }: { i: number }) {
  const j = experiences[i];
  const built = projectsAt(j.description);
  return (
    <>
      <p className="text-base font-semibold text-[#ffb394]">{j.role}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-white/55">
        <Calendar className="size-3.5" />
        {j.period} · {tenure(j.period)}
      </p>
      <ul className="mt-4 space-y-2">
        {highlights(j.description).map((h) => (
          <li key={h} className="flex gap-2.5 text-sm leading-6 text-white/80">
            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#ff9a73]" />
            {h}
          </li>
        ))}
      </ul>
      {built.length > 0 && (
        <>
          <p className={`${label} mt-5`}>Shipped here</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {built.map((p) => (
              <a key={p.title} href={p.url} target="_blank" rel="noopener noreferrer" className={`${chip} hover:bg-white/10`}>
                {p.title} ↗
              </a>
            ))}
          </div>
        </>
      )}
      <p className={`${label} mt-5`}>Stack</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {j.tech.map((t) => (
          <span key={t} className={chip}>
            {t}
          </span>
        ))}
      </div>
    </>
  );
}

function ProjectBody({ i }: { i: number }) {
  const p = projects[i];
  const live = p.url.startsWith("http");
  const job = jobFor(p.title);
  return (
    <>
      {job && (
        <p className="flex items-center gap-1.5 text-xs text-white/55">
          <Briefcase className="size-3.5" />
          Built at {shortCompany(job.company)} · {job.role}
        </p>
      )}
      <p className="mt-3 text-sm leading-6 text-white/80">{p.description}</p>
      <p className={`${label} mt-5`}>Built with</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.tech.map((t) => (
          <span key={t} className={chip}>
            {t}
          </span>
        ))}
      </div>
      {live && (
        <a href={p.url} target="_blank" rel="noopener noreferrer" className={`${primaryBtn} mt-5`}>
          Visit the live site
          <ArrowUpRight className="size-4" />
        </a>
      )}
    </>
  );
}

function TripBody({ i }: { i: number }) {
  const t = travelLocations[i];
  if (!t) return null;
  return (
    <>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-white/5">
        <Image src={t.coverImage} alt={t.city} fill sizes="400px" className="object-cover" />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {t.country}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="size-3.5" />
          {new Date(t.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <span className="flex items-center gap-1.5">
          <Navigation className="size-3.5" />
          {t.distance.toLocaleString()} km from Dhaka
        </span>
      </div>
      <p className="mt-3 text-sm italic leading-6 text-white/80">“{t.description}”</p>
      <Link href={`/travel/${t.slug}`} className={`${primaryBtn} mt-4`}>
        <BookOpen className="size-4" />
        Read the full story
      </Link>
    </>
  );
}

function RadioBody() {
  const setOpen = useSpace((s) => s.setOpen);
  return (
    <>
      <p className="text-sm leading-6 text-white/75">
        Mission control is listening. I&apos;m open to frontend roles and freelance work, and I usually reply within a
        day.
      </p>
      <a href={`mailto:${emailAddress}`} className="mt-4 block truncate text-sm font-semibold text-[#8fa7ff] hover:underline">
        {emailAddress}
      </a>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setOpen("contact")} className={primaryBtn}>
          <Send className="size-4" />
          Write a message
        </button>
        {contactLinks.slice(1).map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
            <l.icon className="size-4" />
            {l.label}
          </a>
        ))}
      </div>
    </>
  );
}

const KIND = {
  skill: { label: "Skill crystal", icon: Layers },
  job: { label: "Career outpost", icon: Briefcase },
  project: { label: "Project monolith", icon: Rocket },
  trip: { label: "Travel beacon", icon: MapPin },
  radio: { label: "Radio mast", icon: Send },
};

/**
 * Opens on its own when you walk up to a station and closes when you walk
 * away. It never blocks walking; on phones it is a short sheet at the bottom.
 */
function ActivityCard({ s, index, total }: { s: Station; index: number; total: number }) {
  const closeActivity = useSpace((st) => st.closeActivity);
  const kind = KIND[s.kind];
  return (
    <aside
      key={s.id}
      aria-label={s.title}
      aria-live="polite"
      className={`pointer-events-auto absolute inset-x-2 bottom-2 flex max-h-[46vh] select-text flex-col overflow-hidden md:inset-x-auto md:bottom-auto md:right-4 md:top-[5.5rem] md:max-h-[calc(100%-7.5rem)] md:w-[25rem] ${glass} animate-in fade-in slide-in-from-bottom-6 duration-300 md:slide-in-from-right-6`}
    >
      <header className="flex items-start gap-3 border-b border-white/10 px-5 py-3.5">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-white/10">
          <kind.icon className="size-4 text-[#ffb394]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8fa7ff]">
            {kind.label}
            {s.kind !== "radio" && ` · ${index} of ${total}`}
          </p>
          <h2 className="truncate font-display text-xl font-bold md:text-2xl">{s.title}</h2>
        </div>
        <button
          type="button"
          onClick={closeActivity}
          aria-label="Close"
          className="grid size-8 shrink-0 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:bg-white/10"
        >
          <X className="size-4" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        {s.kind === "skill" && <SkillBody i={s.index} />}
        {s.kind === "job" && <JobBody i={s.index} />}
        {s.kind === "project" && <ProjectBody i={s.index} />}
        {s.kind === "trip" && <TripBody i={s.index} />}
        {s.kind === "radio" && <RadioBody />}
      </div>
      <footer className="hidden border-t border-white/10 px-5 py-2.5 text-xs text-white/40 md:block">
        Keep walking to close · Esc
      </footer>
    </aside>
  );
}

/** Everything on screen while you walk around a landing site. */
export function EvaHud() {
  const level = useLevel();
  const stations = useMemo(() => stationsFor(level), [level]);
  const visited = useSpace((s) => s.visited);
  const near = useSpace((s) => s.near);
  const nearShip = useSpace((s) => s.nearShip);
  const activity = useSpace((s) => s.activity);
  const open = useSpace((s) => s.open);
  const setOpen = useSpace((s) => s.setOpen);
  const nextLevel = useSpace((s) => s.nextLevel);
  const retry = useSpace((s) => s.retry);
  const score = useSpace((s) => s.score);
  const kills = useSpace((s) => s.kills);

  const meta = ACTIVITY[level.section as keyof typeof ACTIVITY];
  const items = stations.filter((s) => s.kind !== "radio");
  const found = items.filter((s) => visited.includes(s.id)).length;
  const done = found === items.length;
  const nearStation = stations.find((s) => s.id === near) ?? null;
  const current = stations.find((s) => s.id === activity) ?? null;
  const upNext = LEVELS[level.number];

  useEffect(() => {
    if (done) useSpace.getState().setAlert(`All ${meta.noun} found`);
  }, [done, meta.noun]);

  const busy = !!open;
  const carded = !!current;

  return (
    <>
      {/* What's left to find */}
      <div className="absolute inset-x-0 top-[3.6rem] flex justify-center px-3 lg:top-4">
        <div className={`${glass} flex items-center gap-3 px-4 py-2 text-sm`}>
          <span className="font-semibold">On {level.site.name}</span>
          <span className="text-white/40">·</span>
          <span className="tabular-nums text-white/80">
            {found} / {items.length} {meta.noun}
          </span>
          <span className="flex gap-1">
            {items.map((s) => (
              <span
                key={s.id}
                className={`size-2 rounded-full transition-colors ${visited.includes(s.id) ? "bg-[#6ef0a0]" : "bg-white/25"}`}
              />
            ))}
          </span>
        </div>
      </div>

      {/* Beside the ship: climb in and take off for the next planet. */}
      {nearShip && !busy && !current && (
        <div className="absolute inset-x-0 bottom-28 flex justify-center px-4 md:bottom-24">
          <button
            type="button"
            onClick={() => {
              input.board = true;
            }}
            className="pointer-events-auto inline-flex items-center gap-2.5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0b0e18] shadow-2xl animate-in fade-in zoom-in-95 duration-200 active:scale-95"
          >
            <kbd className="hidden rounded-md bg-[#0b0e18]/10 px-1.5 py-0.5 font-mono text-xs [@media(pointer:fine)]:inline">E</kbd>
            <Rocket className="size-4" />
            {upNext ? `Board the jet · fly to ${upNext.to}` : "Board the jet · back to the launch line"}
          </button>
        </div>
      )}

      {/* Closed it by hand? Bring it back without walking away. */}
      {nearStation && !nearShip && !current && !busy && (
        <div className="absolute inset-x-0 bottom-28 flex justify-center px-4 md:bottom-24">
          <button
            type="button"
            onClick={() => {
              input.act = true;
            }}
            className="pointer-events-auto inline-flex items-center gap-2.5 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#0b0e18] shadow-2xl active:scale-95"
          >
            <kbd className="hidden rounded-md bg-[#0b0e18]/10 px-1.5 py-0.5 font-mono text-xs [@media(pointer:fine)]:inline">E</kbd>
            Show {nearStation.title}
            {visited.includes(nearStation.id) && <Check className="size-4 text-[#1f9d55]" />}
          </button>
        </div>
      )}

      {/* Found everything */}
      {done && !busy && !carded && (
        <div className="absolute inset-x-0 bottom-44 flex justify-center px-4 md:bottom-40">
          <div className={`${glass} pointer-events-auto max-w-md p-5 text-center animate-in fade-in zoom-in-95 duration-300`}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6ef0a0]">
              Level {level.number} complete · {score.toLocaleString()} pts · {kills} destroyed
            </p>
            <p className="mt-2 font-display text-xl font-bold">
              {upNext
                ? `Walk back to the jet to take off for ${upNext.to}.`
                : "You've explored every world. Thanks for the trip!"}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {upNext ? (
                <button type="button" onClick={() => useSpace.getState().takeoff()} className={primaryBtn}>
                  <Rocket className="size-4" />
                  Take off for {upNext.to}
                </button>
              ) : (
                <button type="button" onClick={() => setOpen("contact")} className={primaryBtn}>
                  Say hello
                </button>
              )}
              <button type="button" onClick={retry} className={secondaryBtn}>
                <RotateCcw className="size-4" />
                Fly again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Always available: read it all at once, or move on */}
      {!busy && (
        <div className={`absolute bottom-4 left-4 flex flex-wrap gap-2 max-sm:right-24 ${carded ? "max-md:hidden" : ""}`}>
          <button
            type="button"
            onClick={() => setOpen(level.section)}
            className={`${secondaryBtn} pointer-events-auto bg-[#0b0e18]/60 backdrop-blur-md`}
          >
            <BookOpen className="size-4" />
            All my {level.unlocks}
          </button>
          {upNext && !done && (
            <button
              type="button"
              onClick={nextLevel}
              className={`${secondaryBtn} pointer-events-auto bg-[#0b0e18]/60 backdrop-blur-md`}
            >
              <Rocket className="size-4" />
              Skip to {upNext.to}
            </button>
          )}
        </div>
      )}

      {!busy && !carded && (
        <p className="absolute inset-x-0 bottom-5 hidden text-center text-xs text-white/55 lg:block [@media(pointer:coarse)]:!hidden">
          Walk W A S D · Shift run · Space jump · walk up to anything to read it
        </p>
      )}

      {/* Jump (touch screens) */}
      {!busy && !carded && (
        <button
          type="button"
          data-sound="off"
          onPointerDown={() => {
            input.jump = true;
          }}
          className="pointer-events-auto absolute bottom-6 right-5 grid size-20 touch-none place-items-center rounded-full border border-white/25 bg-white/10 text-xs font-semibold text-white backdrop-blur-md active:bg-white/25 [@media(pointer:fine)]:hidden"
        >
          JUMP
        </button>
      )}

      {current && (
        <ActivityCard
          key={current.id}
          s={current}
          index={items.findIndex((x) => x.id === current.id) + 1}
          total={items.length}
        />
      )}
    </>
  );
}
