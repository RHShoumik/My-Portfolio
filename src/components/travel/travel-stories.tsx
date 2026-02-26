"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { travelLocations, type TravelLocation } from "@/data/travel-data";
import { cn } from "@/lib/utils";

const STORY_DURATION = 5000; // 5s per story

/* -------------------------------------------------- */
/*  Story Ring (thumbnail in horizontal scroll)        */
/* -------------------------------------------------- */
function StoryRing({
  location,
  index,
  isViewed,
  onClick,
}: {
  location: TravelLocation;
  index: number;
  isViewed: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      onClick={onClick}
      className="flex shrink-0 flex-col items-center gap-2"
    >
      <div
        className={cn(
          "rounded-full p-[2.5px] transition-all",
          isViewed
            ? "bg-muted-foreground/30"
            : "bg-gradient-to-br from-primary via-primary/80 to-primary/50"
        )}
      >
        <div className="rounded-full border-2 border-background p-0.5">
          <div className="relative size-16 overflow-hidden rounded-full sm:size-[72px]">
            <Image
              src={location.coverImage}
              alt={location.city}
              fill
              className="object-cover"
              sizes="72px"
            />
          </div>
        </div>
      </div>
      <span className="max-w-[76px] truncate text-[11px] text-muted-foreground">
        {location.city}
      </span>
    </motion.button>
  );
}

/* -------------------------------------------------- */
/*  Fullscreen Story Viewer                            */
/* -------------------------------------------------- */
function StoryViewer({
  locations,
  initialIndex,
  onClose,
}: {
  locations: TravelLocation[];
  initialIndex: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  const current = locations[currentIndex];

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < locations.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [currentIndex, locations.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  /* Auto-advance timer */
  useEffect(() => {
    clearTimer();
    setProgress(0);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / STORY_DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        clearTimer();
        goNext();
      }
    }, 50);

    return clearTimer;
  }, [currentIndex, clearTimer, goNext]);

  /* Keyboard navigation */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  /* Click left/right halves */
  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 3) goPrev();
    else goNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        aria-label="Close stories"
      >
        <X className="size-5" />
      </button>

      {/* Desktop nav arrows */}
      <button
        onClick={goPrev}
        className={cn(
          "absolute left-4 z-50 hidden rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/20 md:block",
          currentIndex === 0 && "opacity-30 pointer-events-none"
        )}
        aria-label="Previous story"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        onClick={goNext}
        className="absolute right-4 z-50 hidden rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/20 md:block"
        aria-label="Next story"
      >
        <ChevronRight className="size-5" />
      </button>

      {/* Story card */}
      <div className="relative mx-auto h-[85vh] w-full max-w-md overflow-hidden rounded-2xl">
        {/* Progress bars */}
        <div className="absolute top-0 right-0 left-0 z-30 flex gap-1 p-3">
          {locations.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-100"
                style={{
                  width:
                    i < currentIndex
                      ? "100%"
                      : i === currentIndex
                        ? `${progress * 100}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Clickable area */}
        <div
          className="absolute inset-0 z-20 cursor-pointer"
          onClick={handleAreaClick}
        />

        {/* Story image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.slug}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative h-full w-full"
          >
            <Image
              src={current.coverImage}
              alt={current.city}
              fill
              className="object-cover"
              sizes="450px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
          </motion.div>
        </AnimatePresence>

        {/* Header */}
        <div className="absolute top-8 left-0 right-0 z-30 flex items-center gap-3 px-4">
          <div className="relative size-8 overflow-hidden rounded-full border-2 border-white/50">
            <Image
              src={current.coverImage}
              alt=""
              fill
              className="object-cover"
              sizes="32px"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{current.city}</p>
            <p className="text-[11px] text-white/60">
              {new Date(current.date).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 right-0 left-0 z-30 p-6">
          <div className="flex items-center gap-1.5 text-xs text-white/70">
            <MapPin className="size-3" />
            {current.country} · {current.distance} km
          </div>
          <h3 className="mt-2 text-xl font-bold text-white">{current.city}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70 line-clamp-3">
            {current.description}
          </p>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              router.push(`/travel/${current.slug}`);
            }}
            className="relative z-40 mt-4 group inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            Read the Story
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------- */
/*  Main exported component                            */
/* -------------------------------------------------- */
export function TravelStories() {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [viewed, setViewed] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const openStory = (index: number) => {
    setViewerStartIndex(index);
    setViewerOpen(true);
    setViewed((prev) => {
      const next = new Set(prev);
      next.add(travelLocations[index].slug);
      return next;
    });
  };

  const closeStory = () => {
    setViewerOpen(false);
    // Mark all viewed up to current
  };

  /* Prevent body scroll when viewer is open */
  useEffect(() => {
    if (viewerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [viewerOpen]);

  return (
    <>
      {/* Horizontal scrollable ring list */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {travelLocations.map((loc, i) => (
            <StoryRing
              key={loc.slug}
              location={loc}
              index={i}
              isViewed={viewed.has(loc.slug)}
              onClick={() => openStory(i)}
            />
          ))}
        </div>
      </div>

      {/* Fullscreen viewer */}
      <AnimatePresence>
        {viewerOpen && (
          <StoryViewer
            locations={travelLocations}
            initialIndex={viewerStartIndex}
            onClose={closeStory}
          />
        )}
      </AnimatePresence>
    </>
  );
}
