"use client";

import { type ReactNode, useRef, useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useInView,
  type HTMLMotionProps,
} from "framer-motion";

/* -------------------------------------------------- */
/*  FadeUp                                            */
/* -------------------------------------------------- */
interface FadeUpProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------- */
/*  FadeIn                                            */
/* -------------------------------------------------- */
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------- */
/*  StaggerContainer + StaggerItem                    */
/* -------------------------------------------------- */
const containerVariants = (staggerDelay: number) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number],
    },
  },
};

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.08,
}: StaggerContainerProps) {
  return (
    <motion.div
      variants={containerVariants(staggerDelay)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------- */
/*  ScaleOnHover                                      */
/* -------------------------------------------------- */
interface ScaleOnHoverProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  scale?: number;
}

export function ScaleOnHover({
  children,
  scale = 1.03,
  ...props
}: ScaleOnHoverProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------- */
/*  Magnetic                                          */
/* -------------------------------------------------- */
interface MagneticProps {
  children: ReactNode;
  strength?: number;
}

export function Magnetic({ children, strength = 0.35 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------- */
/*  AnimatedText                                      */
/* -------------------------------------------------- */
interface AnimatedTextProps {
  text: string;
  delay?: number;
  className?: string;
}

export function AnimatedText({
  text,
  delay = 0,
  className,
}: AnimatedTextProps) {
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: delay + i * 0.08,
            ease: [0.21, 0.47, 0.32, 0.98],
          }}
          className="inline-block"
        >
          {word}
          {i < words.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </span>
  );
}

/* -------------------------------------------------- */
/*  Marquee \u2014 seamless infinite horizontal ticker      */
/* -------------------------------------------------- */
interface MarqueeProps {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  speed?: "slow" | "normal" | "fast";
}

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = true,
  speed = "normal",
}: MarqueeProps) {
  const durations = { slow: "55s", normal: "28s", fast: "16s" };
  return (
    <div className={`group relative flex overflow-hidden ${className ?? ""}`}>
      <div
        className={`flex shrink-0 items-center ${pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""}`}
        style={{
          animation: `${reverse ? "marquee-reverse" : "marquee"} ${durations[speed]} linear infinite`,
        }}
      >
        {children}
      </div>
      <div
        className={`flex shrink-0 items-center ${pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""}`}
        style={{
          animation: `${reverse ? "marquee-reverse" : "marquee"} ${durations[speed]} linear infinite`,
        }}
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/*  Counter \u2014 animated count-up, triggers once in view */
/* -------------------------------------------------- */
interface CounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function Counter({
  value,
  suffix = "",
  prefix = "",
  duration = 1.4,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Safety net: guarantee the final value lands even if rAF stalls
    // (e.g. the tab is backgrounded mid-animation).
    const fallback = setTimeout(() => setDisplay(value), duration * 1000 + 250);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------- */
/*  ScrambleText — matrix-style decode effect.         */
/*  trigger="hover" resolves on mouse enter (default). */
/*  trigger="mount" runs once after `delay` seconds.   */
/* -------------------------------------------------- */
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

interface ScrambleTextProps {
  text: string;
  className?: string;
  trigger?: "hover" | "mount";
  delay?: number;
  speed?: number;
}

export function ScrambleText({
  text,
  className,
  trigger = "hover",
  delay = 0,
  speed = 28,
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(trigger === "mount" ? "" : text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  const runScramble = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let iteration = 0;
    intervalRef.current = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) return text[index];
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join("")
      );
      iteration += 0.6;
      if (iteration >= text.length) {
        setDisplay(text);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, speed);
  };

  useEffect(() => {
    if (trigger !== "mount" || !inView) return;
    const t = setTimeout(runScramble, delay * 1000);
    return () => {
      clearTimeout(t);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, inView, delay, text]);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return (
    <span
      ref={ref}
      className={className}
      onMouseEnter={trigger === "hover" ? runScramble : undefined}
    >
      {display}
    </span>
  );
}

/* -------------------------------------------------- */
/*  TiltCard — mouse-tracked 3D tilt with perspective  */
/* -------------------------------------------------- */
interface TiltCardProps {
  children: ReactNode;
  className?: string;
  max?: number;
}

export function TiltCard({ children, className, max = 10 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 220, damping: 22 });
  const springY = useSpring(rotateY, { stiffness: 220, damping: 22 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * max);
    rotateX.set(-py * max);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{
        rotateX: springX,
        rotateY: springY,
        transformPerspective: 800,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
