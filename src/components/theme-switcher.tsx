"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useThemeStore } from "@/store/theme-store";
import { palettes } from "@/lib/constants";
import { Palette, Sun, Moon, Monitor } from "lucide-react";
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
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="glass-card absolute bottom-14 right-0 w-56 p-4 shadow-xl"
          >
            {/* Mode Toggle */}
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Mode
            </p>
            <div className="mb-4 flex gap-1">
              {themeOptions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs transition-colors",
                    theme === id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                  title={label}
                >
                  <Icon className="size-3.5" />
                  <span className="sr-only md:not-sr-only">{label}</span>
                </button>
              ))}
            </div>

            {/* Palette Selection */}
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Palette
            </p>
            <div className="grid grid-cols-3 gap-2">
              {palettes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPalette(p.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg p-2 transition-all",
                    palette === p.id
                      ? "bg-accent ring-1 ring-primary"
                      : "hover:bg-accent/60"
                  )}
                  title={p.label}
                >
                  <span
                    className="size-4 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-[10px] text-muted-foreground">
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex size-12 items-center justify-center rounded-full shadow-lg transition-colors",
          "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        aria-label="Toggle theme settings"
      >
        <Palette className="size-5" />
      </motion.button>
    </div>
  );
}
