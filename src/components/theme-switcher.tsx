"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Palette, Sun, X } from "lucide-react";
import { useThemeStore } from "@/store/theme-store";
import { palettes } from "@/lib/constants";
import { playSound, type SoundName } from "@/lib/sound";
import { cn } from "@/lib/utils";

const modes = [
  { id: "light", label: "Day", icon: Sun, sound: "day" },
  { id: "dark", label: "Night", icon: Moon, sound: "night" },
  { id: "system", label: "Auto", icon: Monitor, sound: "tap" },
] as const satisfies readonly {
  id: string;
  label: string;
  icon: typeof Sun;
  sound: SoundName;
}[];

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { palette, setPalette } = useThemeStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 md:bottom-6 md:right-6">
      {open && (
        <div className="absolute bottom-16 right-0 w-64 rounded-2xl border border-border bg-card p-4 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="mb-2 text-sm font-semibold">Theme</p>
          <div className="mb-5 grid grid-cols-3 gap-1.5">
            {modes.map(({ id, label, icon: Icon, sound }) => (
              <button
                key={id}
                data-sound="off"
                onClick={() => {
                  setTheme(id);
                  playSound(sound);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors",
                  theme === id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/50"
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <p className="mb-2 text-sm font-semibold">Accent colour</p>
          <div className="grid grid-cols-3 gap-1.5">
            {palettes.map((p) => (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2 text-xs transition-colors",
                  palette === p.id
                    ? "border-foreground"
                    : "border-border hover:border-foreground/50"
                )}
              >
                <span
                  className="size-4 rounded-full border border-foreground/20"
                  style={{ backgroundColor: p.color }}
                />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="grid size-12 place-items-center rounded-full border border-foreground/20 bg-card text-foreground shadow-md transition-colors hover:border-foreground/50"
        aria-label={open ? "Close appearance settings" : "Change theme and colours"}
        aria-expanded={open}
      >
        {open ? <X className="size-5" /> : <Palette className="size-5" />}
      </button>
    </div>
  );
}
