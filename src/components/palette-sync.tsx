"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme-store";

/**
 * Syncs `data-palette` attribute on <html> with the Zustand palette store.
 * Rendered once in the root layout.
 */
export function PaletteSync() {
  const palette = useThemeStore((s) => s.palette);

  useEffect(() => {
    const root = document.documentElement;
    if (palette === "default") {
      root.removeAttribute("data-palette");
    } else {
      root.setAttribute("data-palette", palette);
    }
  }, [palette]);

  return null;
}
