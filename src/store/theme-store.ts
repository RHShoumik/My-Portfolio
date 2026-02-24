"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Palette } from "@/lib/constants";

interface ThemeStore {
  palette: Palette;
  setPalette: (palette: Palette) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      palette: "default",
      setPalette: (palette) => set({ palette }),
    }),
    {
      name: "portfolio-palette",
    }
  )
);
