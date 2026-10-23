"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springX = useSpring(cursorX, { damping: 25, stiffness: 260 });
  const springY = useSpring(cursorY, { damping: 25, stiffness: 260 });
  const ringX = useSpring(cursorX, { damping: 30, stiffness: 200 });
  const ringY = useSpring(cursorY, { damping: 30, stiffness: 200 });

  useEffect(() => {
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsVisible(true);
    };

    const checkPointer = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const labelTarget = target.closest<HTMLElement>("[data-cursor]");
      const isLink =
        target.closest("a") ||
        target.closest("button") ||
        target.closest("[role='button']") ||
        window.getComputedStyle(target).cursor === "pointer";
      setIsPointer(!!isLink);
      setLabel(labelTarget?.dataset.cursor ?? null);
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", checkPointer);
    const onLeave = () => setIsVisible(false);
    const onEnter = () => setIsVisible(true);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", checkPointer);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[100] hidden items-center justify-center rounded-full border border-foreground mix-blend-difference md:flex"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: label ? 84 : isPointer ? 44 : 32,
          height: label ? 84 : isPointer ? 44 : 32,
          opacity: 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <AnimatePresence>
          {label && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="font-mono text-[10px] uppercase tracking-wider text-foreground"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      {/* Inner dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[100] hidden size-1.5 rounded-full bg-foreground mix-blend-difference md:block"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{ opacity: label ? 0 : 1 }}
      />
    </>
  );
}
