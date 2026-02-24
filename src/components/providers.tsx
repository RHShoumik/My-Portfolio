"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PaletteSync } from "@/components/palette-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={100}>
        <PaletteSync />
        {children}
      </TooltipProvider>
    </NextThemeProvider>
  );
}
