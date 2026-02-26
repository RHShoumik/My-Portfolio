"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Route,
  ArrowRight,
  X,
  Pause,
  Play,
  Layers,
} from "lucide-react";
import {
  travelLocations,
  getTourOrder,
  HOME_COORDINATES,
  type TravelLocation,
} from "@/data/travel-data";
import { cn } from "@/lib/utils";

/* =====================================================
   Constants
   ===================================================== */
const SHOW_DURATION = 5000;
const FLY_DURATION = 2000;
const FLY_MID_DURATION = 1200;
const IDLE_RESUME_DELAY = 15000; // 15 s idle → auto-resume tour

const DEFAULT_CENTER: [number, number] = [90.5, 23.5]; // [lng, lat]
const DEFAULT_ZOOM = 5;
const CLOSE_ZOOM = 10;
const MID_ZOOM = 7;

type TourPhase =
  | "overview"
  | "zooming-in"
  | "showing"
  | "zooming-mid"
  | "transitioning";

type MapLayer = "street" | "satellite";

/* =====================================================
   Free tile styles — zero API key required
   Street  : OpenFreeMap Liberty (vector, beautiful)
   Satellite: ESRI World Imagery + reference labels
   ===================================================== */
const STREET_STYLE = "https://tiles.openfreemap.org/styles/liberty";

function buildSatelliteStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      satellite: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "© Esri",
        maxzoom: 19,
      },
      labels: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
      },
    },
    layers: [
      { id: "satellite-layer", type: "raster", source: "satellite" },
      { id: "labels-layer", type: "raster", source: "labels" },
    ],
  };
}

/* =====================================================
   Marker DOM helpers
   ===================================================== */

/**
 * Creates a stable marker element whose inner circle/label
 * can be updated WITHOUT replacing the element itself.
 * MapLibre holds a reference to this element; replacing it
 * breaks positioning. We mutate sub-elements instead.
 *
 * Returns { wrapper, updateStyle } where updateStyle(isActive)
 * tweaks the photo circle and label in-place.
 */
function createMarkerEl(loc: TravelLocation): {
  wrapper: HTMLDivElement;
  updateStyle: (isActive: boolean) => void;
  setClickHandler: (fn: () => void) => void;
} {
  /* Outer wrapper — MapLibre positions this via transform */
  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;position:relative;";

  /* Photo circle */
  const circle = document.createElement("div");
  circle.style.cssText =
    "width:40px;height:40px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,0.7);" +
    "box-shadow:0 4px 12px rgba(0,0,0,0.4);transition:all 0.3s;flex-shrink:0;";

  const img = document.createElement("img");
  img.src = loc.coverImage;
  img.alt = loc.city;
  img.style.cssText = "display:block;width:100%;height:100%;object-fit:cover;";
  img.referrerPolicy = "no-referrer";
  img.crossOrigin = "anonymous";
  circle.appendChild(img);

  /* City label */
  const label = document.createElement("span");
  label.textContent = loc.city;
  label.style.cssText =
    "margin-top:4px;font-size:10px;font-weight:500;white-space:nowrap;" +
    "background:rgba(0,0,0,0.5);color:rgba(255,255,255,0.8);" +
    "padding:1px 6px;border-radius:999px;backdrop-filter:blur(4px);font-family:inherit;";

  wrapper.appendChild(circle);
  wrapper.appendChild(label);

  /* Click handler ref — allows swapping handler without DOM changes */
  let currentHandler: (() => void) | null = null;
  wrapper.addEventListener("click", (e) => {
    e.stopPropagation();
    currentHandler?.();
  });

  function updateStyle(isActive: boolean) {
    circle.style.width = isActive ? "56px" : "40px";
    circle.style.height = isActive ? "56px" : "40px";
    circle.style.borderColor = isActive ? "#34d399" : "rgba(255,255,255,0.7)";
    circle.style.boxShadow = isActive
      ? "0 4px 12px rgba(0,0,0,0.4),0 0 20px rgba(52,211,153,0.35)"
      : "0 4px 12px rgba(0,0,0,0.4)";
    label.style.background = isActive ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.5)";
    label.style.color = isActive ? "#fff" : "rgba(255,255,255,0.8)";
  }

  function setClickHandler(fn: () => void) {
    currentHandler = fn;
  }

  return { wrapper, updateStyle, setClickHandler };
}

function buildHomeEl(): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "display:flex;flex-direction:column;align-items:center;pointer-events:none;";
  const label = document.createElement("span");
  label.textContent = "Dhaka";
  label.style.cssText =
    "font-size:9px;font-weight:700;background:rgba(0,0,0,0.6);color:#fbbf24;padding:1px 6px;border-radius:999px;backdrop-filter:blur(4px);font-family:inherit;";
  const dot = document.createElement("div");
  dot.style.cssText =
    "margin-top:3px;width:10px;height:10px;border-radius:50%;background:#fbbf24;border:1.5px solid rgba(255,255,255,0.8);box-shadow:0 0 6px rgba(251,191,36,0.5);";
  wrapper.appendChild(label);
  wrapper.appendChild(dot);
  return wrapper;
}



/* =====================================================
   TravelMap — main exported component
   ===================================================== */
interface TravelMapProps {
  className?: string;
}

export function TravelMap({ className }: TravelMapProps) {
  const router = useRouter();
  const tourOrder = useMemo(() => getTourOrder(), []);

  const mapContainerRef = useRef<HTMLDivElement>(null!);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const homeMarkerRef = useRef<maplibregl.Marker | null>(null);
  /** Stable imperative handles for each marker's inner elements */
  const markerHandlesRef = useRef<Map<string, ReturnType<typeof createMarkerEl>>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimatingRef = useRef(false);

  const [phase, setPhase] = useState<TourPhase>("overview");
  const [tourIndex, setTourIndex] = useState(-1);
  const [selected, setSelected] = useState<TravelLocation | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [tourStarted, setTourStarted] = useState(false);
  const [userInteracting, setUserInteracting] = useState(false);
  const [mapLayer, setMapLayer] = useState<MapLayer>("satellite");
  const [mapReady, setMapReady] = useState(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
  }, []);

  /* ---- Fly-to helpers ---- */
  const flyToTarget = useCallback((loc: TravelLocation, zoom: number) => {
    const map = mapRef.current;
    if (!map) return;
    isAnimatingRef.current = true;
    map.flyTo({ center: [loc.coordinates[0], loc.coordinates[1]], zoom, duration: FLY_DURATION, essential: true });
    setTimeout(() => { isAnimatingRef.current = false; }, FLY_DURATION + 200);
  }, []);

  const flyToOverview = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    isAnimatingRef.current = true;
    map.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: FLY_MID_DURATION, essential: true });
    setTimeout(() => { isAnimatingRef.current = false; }, FLY_MID_DURATION + 200);
  }, []);

  /* ---- Initialize MapLibre map (once) ---- */
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: STREET_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      pitchWithRotate: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      /* Globe projection for real 3D feel */
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).setProjection({ name: "globe" });
      } catch { /* fallback to mercator */ }

      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

      /* Home marker */
      const homeMarker = new maplibregl.Marker({ element: buildHomeEl(), anchor: "bottom" })
        .setLngLat([HOME_COORDINATES[0], HOME_COORDINATES[1]])
        .addTo(map);
      homeMarkerRef.current = homeMarker;

      /* Location markers — created ONCE, elements are mutated in-place later */
      for (const loc of travelLocations) {
        const handle = createMarkerEl(loc);
        markerHandlesRef.current.set(loc.slug, handle);
        const marker = new maplibregl.Marker({ element: handle.wrapper, anchor: "bottom" })
          .setLngLat([loc.coordinates[0], loc.coordinates[1]])
          .addTo(map);
        markersRef.current.set(loc.slug, marker);
      }

      setMapReady(true);
    });

    /* Interaction detection */
    const onInteract = () => {
      if (isAnimatingRef.current) return;
      setUserInteracting(true);
      setIsPaused(true);
      setSelected(null);
      clearTimer();
      clearIdleTimer();
      idleTimerRef.current = setTimeout(() => {
        setUserInteracting(false);
        setIsPaused(false);
      }, IDLE_RESUME_DELAY);
    };
    map.on("dragstart", onInteract);
    map.on("wheel", onInteract);
    map.on("touchstart", onInteract);

    return () => { map.remove(); mapRef.current = null; markersRef.current.clear(); markerHandlesRef.current.clear(); setMapReady(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Update marker styles & click handlers in-place ---- */
  useEffect(() => {
    if (!mapReady) return;
    const currentTarget = tourStarted && tourIndex >= 0 && phase !== "overview" ? tourOrder[tourIndex] : null;
    const activeSlug = selected?.slug ?? currentTarget?.slug ?? null;

    for (const loc of travelLocations) {
      const handle = markerHandlesRef.current.get(loc.slug);
      if (!handle) continue;
      const isActive = loc.slug === activeSlug;

      /* Mutate circle/label styles — NO element replacement */
      handle.updateStyle(isActive);

      /* Swap the click handler */
      handle.setClickHandler(() => {
        clearTimer(); clearIdleTimer();
        setUserInteracting(false); setIsPaused(true);
        const idx = tourOrder.findIndex((l) => l.slug === loc.slug);
        if (idx >= 0) setTourIndex(idx);
        setPhase("showing");
        setTimeout(() => setSelected(loc), 400);
      });
    }
  }, [mapReady, selected, tourIndex, phase, tourStarted, tourOrder, clearTimer, clearIdleTimer]);

  /* ---- Layer toggle (street ↔ satellite) ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    isAnimatingRef.current = true;
    map.setStyle(mapLayer === "satellite" ? buildSatelliteStyle() : STREET_STYLE);
    map.once("style.load", () => {
      try { (map as any).setProjection({ name: "globe" }); } catch { /* noop */ } // eslint-disable-line @typescript-eslint/no-explicit-any
      homeMarkerRef.current?.addTo(map);
      for (const [, m] of markersRef.current) m.addTo(map);
      isAnimatingRef.current = false;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLayer, mapReady]);

  /* ---- Auto-start tour after 2 s ---- */
  useEffect(() => {
    const t = setTimeout(() => { setTourStarted(true); setTourIndex(0); }, 2000);
    return () => clearTimeout(t);
  }, []);

  /* ---- Tour step logic ---- */
  useEffect(() => {
    if (!tourStarted || tourIndex < 0 || isPaused || !mapReady) return;
    clearTimer();
    const loc = tourOrder[tourIndex];
    setPhase("zooming-in");
    setSelected(null);
    flyToTarget(loc, CLOSE_ZOOM);

    timerRef.current = setTimeout(() => {
      setPhase("showing"); setSelected(loc);
      timerRef.current = setTimeout(() => {
        setSelected(null); setPhase("zooming-mid");
        flyToTarget(loc, MID_ZOOM);
        timerRef.current = setTimeout(() => {
          setPhase("transitioning");
          const nextIdx = (tourIndex + 1) % tourOrder.length;
          if (nextIdx === 0) {
            setPhase("overview"); flyToOverview();
            timerRef.current = setTimeout(() => setTourIndex(0), 2500);
          } else {
            setTourIndex(nextIdx);
          }
        }, FLY_MID_DURATION + 300);
      }, SHOW_DURATION);
    }, FLY_DURATION + 300);

    return clearTimer;
  }, [tourIndex, tourStarted, isPaused, mapReady, clearTimer, tourOrder, flyToTarget, flyToOverview]);

  /* ---- Pause / Resume ---- */
  const togglePause = useCallback(() => {
    if (userInteracting) { clearIdleTimer(); setUserInteracting(false); }
    setIsPaused((p) => { if (!p) clearTimer(); return !p; });
  }, [clearTimer, clearIdleTimer, userInteracting]);

  const handleNavigate = useCallback((slug: string) => router.push(`/travel/${slug}`), [router]);

  /* Cleanup on unmount */
  useEffect(() => () => { clearTimer(); clearIdleTimer(); }, [clearTimer, clearIdleTimer]);

  const progress = tourStarted && tourIndex >= 0 ? ((tourIndex + 1) / tourOrder.length) * 100 : 0;

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className="relative overflow-hidden rounded-2xl border border-border/50"
        style={{ aspectRatio: "16/10" }}
      >
        {/* MapLibre container */}
        <div ref={mapContainerRef} className="size-full" />

        {/* Tour progress bar */}
        {tourStarted && (
          <div className="absolute top-0 right-0 left-0 z-20 h-0.5 bg-white/10">
            <motion.div
              className="h-full bg-emerald-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        )}

        {/* Controls */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <button
            onClick={togglePause}
            className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            {isPaused ? (<><Play className="size-3" /> Resume</>) : (<><Pause className="size-3" /> Pause</>)}
          </button>

          {/* Satellite / Street toggle */}
          <button
            onClick={() => setMapLayer((l) => l === "street" ? "satellite" : "street")}
            className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <Layers className="size-3" />
            {mapLayer === "street" ? "Satellite" : "Street"}
          </button>
        </div>

        {/* Exploring hint */}
        <AnimatePresence>
          {userInteracting && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="absolute top-3 left-1/2 z-20 -translate-x-1/2"
            >
              <span className="rounded-full bg-amber-500/25 px-3 py-1 text-[10px] font-medium text-amber-300 backdrop-blur-sm">
                Exploring — auto-resume in 15 s
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {tourStarted && tourIndex >= 0 && (
          <div className="absolute top-3 right-3 z-20 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm">
            {tourIndex + 1} / {tourOrder.length}
          </div>
        )}
      </div>

      {/* Floating Detail Card */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{
              duration: 0.4,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="absolute right-4 bottom-4 left-4 z-20 mx-auto max-w-sm sm:left-auto sm:right-6 sm:bottom-6"
          >
            <div className="glass-card overflow-hidden shadow-2xl">
              {/* Countdown bar */}
              {!isPaused && phase === "showing" && (
                <div className="absolute top-0 right-0 left-0 z-30 h-0.5 bg-border/30">
                  <motion.div
                    className="h-full bg-emerald-400/70"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{
                      duration: SHOW_DURATION / 1000,
                      ease: "linear",
                    }}
                  />
                </div>
              )}

              {/* Cover */}
              <div className="relative h-40 w-full overflow-hidden">
                <Image
                  src={selected.coverImage}
                  alt={`${selected.city}, ${selected.country}`}
                  fill
                  className="object-cover"
                  sizes="400px"
                />
                <div className="absolute inset-0 bg-linear-to-t from-card via-card/40 to-transparent" />
                <button
                  onClick={() => {
                    setSelected(null);
                    setIsPaused(true);
                    clearTimer();
                  }}
                  className="absolute top-3 right-3 rounded-full bg-background/60 p-1.5 backdrop-blur-sm transition-colors hover:bg-background/80"
                  aria-label="Close card"
                >
                  <X className="size-3.5 text-foreground" />
                </button>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-foreground">
                  {selected.city}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {selected.country}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {new Date(selected.date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Route className="size-3" />
                    {selected.distance} km
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {selected.description}
                </p>
                <button
                  onClick={() => handleNavigate(selected.slug)}
                  className="mt-4 group inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/20"
                >
                  Read the Story
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
