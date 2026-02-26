"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Globe, Route, BookOpen } from "lucide-react";
import { getTravelStats } from "@/data/travel-data";

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
  delay: number;
}

function AnimatedCounter({ target, delay }: { target: number; delay: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!isInView) return;

    const timeout = setTimeout(() => {
      const duration = 1500;
      const steps = 40;
      const increment = target / steps;
      let current = 0;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        current = Math.min(Math.round(increment * step), target);
        setCount(current);
        if (step >= steps) clearInterval(interval);
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [isInView, target, delay]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

function StatItem({ icon, value, label, suffix = "", delay }: StatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg"
    >
      {/* Subtle glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 size-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />

      <div className="relative">
        <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">
          {icon}
        </div>
        <p className="text-3xl font-bold tracking-tight text-foreground">
          <AnimatedCounter target={value} delay={delay} />
          {suffix && <span className="ml-0.5 text-xl text-primary">{suffix}</span>}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

export function TravelStats() {
  const stats = getTravelStats();

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatItem
        icon={<MapPin className="size-5" />}
        value={stats.placesVisited}
        label="Places Visited"
        delay={0}
      />
      <StatItem
        icon={<Globe className="size-5" />}
        value={stats.countriesExplored}
        label="Countries Explored"
        delay={0.1}
      />
      <StatItem
        icon={<Route className="size-5" />}
        value={stats.totalDistance}
        label="Kilometers Traveled"
        suffix=" km"
        delay={0.2}
      />
      <StatItem
        icon={<BookOpen className="size-5" />}
        value={stats.storiesWritten}
        label="Stories Written"
        delay={0.3}
      />
    </div>
  );
}
