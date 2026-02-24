"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CHARS = ["R", "H", "S"];

const ease = [0.76, 0, 0.24, 1] as const;

export function PageLoader() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Only once per browser session
    if (sessionStorage.getItem("rhs_loaded")) {
      return;
    }
    setVisible(true);

    let p = 0;
    const tick = setInterval(() => {
      // non-linear eased fill — speeds up after 60%
      const increment = p < 60 ? 1.2 : p < 85 ? 2.2 : 1.6;
      p = Math.min(p + increment, 100);
      setProgress(Math.floor(p));

      if (p >= 100) {
        clearInterval(tick);
        setTimeout(() => {
          setDone(true);
          sessionStorage.setItem("rhshoumik", "1");
        }, 450);
      }
    }, 18);

    return () => clearInterval(tick);
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-9999 flex items-center justify-center overflow-hidden"
          aria-label="Loading"
          aria-live="polite"
        >
          {/* ── Top curtain ── */}
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2 bg-[#0a0a0b]"
            exit={{ y: "-100%" }}
            transition={{ duration: 0.9, ease, delay: 0.05 }}
          />

          {/* ── Bottom curtain ── */}
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-[#0a0a0b]"
            exit={{ y: "100%" }}
            transition={{ duration: 0.9, ease, delay: 0.05 }}
          />

          {/* ── Content ── */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-10 select-none"
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeIn" }}
          >
            {/* Initials */}
            <div className="flex items-end gap-[0.12em]">
              {CHARS.map((char, i) => (
                <div key={char} className="overflow-hidden">
                  <motion.span
                    className="block font-bold leading-none text-white"
                    style={{ fontSize: "clamp(4rem, 14vw, 8rem)", letterSpacing: "-0.04em" }}
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.7, ease, delay: 0.15 + i * 0.1 }}
                  >
                    {char}
                  </motion.span>
                </div>
              ))}
            </div>

            {/* Subtitle */}
            <motion.p
              className="text-white/40 text-xs tracking-[0.25em] uppercase font-mono"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: "easeOut" }}
            >
              Frontend Engineer
            </motion.p>

            {/* Progress bar + counter */}
            <motion.div
              className="flex flex-col items-center gap-3 w-48"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.65 }}
            >
              {/* Track */}
              <div className="relative w-full h-px bg-white/10 overflow-hidden rounded-full">
                {/* Fill */}
                <motion.div
                  className="absolute inset-y-0 left-0 bg-white rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.02 }}
                />
                {/* Glow tip */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white blur-sm opacity-80"
                  style={{ left: `calc(${progress}% - 6px)` }}
                />
              </div>

              {/* Counter */}
              <span className="font-mono text-[11px] text-white/30 tabular-nums">
                {String(progress).padStart(3, "0")}
              </span>
            </motion.div>
          </motion.div>

          {/* Corner decorations */}
          <motion.span
            className="absolute top-6 left-7 text-[10px] font-mono text-white/20 tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            rhshoumik.dev
          </motion.span>
          <motion.span
            className="absolute bottom-6 right-7 text-[10px] font-mono text-white/20 tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            © 2026
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
