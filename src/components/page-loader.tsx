"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.76, 0, 0.24, 1] as const;

const bootLines = [
  "booting frontend runtime",
  "compiling components",
  "hydrating interface",
];

export function PageLoader() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem("rhs_loaded")) {
      return;
    }
    setVisible(true);

    const minVisible = 2400;
    const start = Date.now();

    let p = 0;
    const tick = setInterval(() => {
      const increment = p < 60 ? 2.2 : p < 85 ? 3.4 : 2.4;
      p = Math.min(p + increment, 100);
      setProgress(Math.floor(p));
      setLineIndex(Math.min(Math.floor((p / 100) * bootLines.length), bootLines.length - 1));

      if (p >= 100) {
        clearInterval(tick);
        const elapsed = Date.now() - start;
        const wait = Math.max(0, minVisible - elapsed);
        setTimeout(() => {
          setDone(true);
          sessionStorage.setItem("rhs_loaded", "1");
        }, wait + 200);
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
          className="fixed inset-0 z-9999 flex items-center justify-center overflow-hidden bg-[#151210]"
          aria-label="Loading"
          aria-live="polite"
        >
          {/* ── Top curtain ── */}
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2 bg-[#151210]"
            exit={{ y: "-100%" }}
            transition={{ duration: 0.9, ease, delay: 0.05 }}
          />

          {/* ── Bottom curtain ── */}
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-[#151210]"
            exit={{ y: "100%" }}
            transition={{ duration: 0.9, ease, delay: 0.05 }}
          />

          {/* Dot grid backdrop */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* ── Content ── */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-8 select-none"
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeIn" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease }}
              className="flex size-20 items-center justify-center border border-white/25 font-mono text-2xl font-semibold tracking-tight text-white"
            >
              RH
            </motion.div>

            <motion.p
              key={lineIndex}
              className="font-mono text-[11px] tracking-[0.2em] uppercase text-white/40"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {bootLines[lineIndex]}
            </motion.p>

            <div className="flex flex-col items-center gap-3 w-56">
              <div className="relative h-px w-full overflow-hidden bg-white/10">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-white"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.02 }}
                />
              </div>
              <span className="font-mono text-[11px] text-white/30 tabular-nums">
                {String(progress).padStart(3, "0")}%
              </span>
            </div>
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
