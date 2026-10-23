"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useThemeStore } from "@/store/theme-store";
import { palettes } from "@/lib/constants";
import { Palette, Sun, Moon, Monitor, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { palette, setPalette } = useThemeStore();

  const themeOptions = [
    { id: "light" as const, label: "Light", icon: Sun },
    { id: "dark" as const, label: "Dark", icon: Moon },
    { id: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 md:bottom-6 md:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="glass-card absolute bottom-16 right-0 w-60 p-4 shadow-xl"
          >
            <p className="index-num mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              Appearance
            </p>
            <div className="mb-4 grid grid-cols-3 gap-1.5">
              {themeOptions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 border px-2 py-2.5 text-[10px] uppercase tracking-wide transition-colors",
                    theme === id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  )}
                  title={label}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <p className="index-num mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              Accent
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {palettes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPalette(p.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 border px-2 py-2 transition-colors",
                    palette === p.id
                      ? "border-foreground"
                      : "border-border hover:border-foreground/40"
                  )}
                  title={p.label}
                >
                  <span
                    className="size-3.5 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.94 }}
        className="flex size-11 items-center justify-center border border-foreground bg-background text-foreground shadow-sm transition-colors hover:bg-foreground hover:text-background md:size-12"
        aria-label="Toggle theme settings"
      >
        {isOpen ? <X className="size-4" /> : <Palette className="size-4" />}
      </motion.button>
    </div>
  );
}
