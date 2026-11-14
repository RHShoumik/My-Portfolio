"use client";

import { Volume2, VolumeX } from "lucide-react";
import { playSound, setSoundEnabled, unlockAudio, useSoundEnabled } from "@/lib/sound";

/** Round mute / unmute button, sits just left of the theme switcher. */
export function SoundToggle() {
  const enabled = useSoundEnabled();

  const toggle = () => {
    unlockAudio();
    if (enabled) {
      playSound("off", { force: true });
      setSoundEnabled(false);
    } else {
      setSoundEnabled(true);
      playSound("on");
    }
  };

  return (
    <button
      type="button"
      data-sound="off"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute sound effects" : "Turn on sound effects"}
      title={enabled ? "Sound on" : "Sound off"}
      className="fixed bottom-5 right-[4.75rem] z-50 grid size-12 place-items-center rounded-full border border-foreground/20 bg-card text-foreground shadow-md transition-colors hover:border-foreground/50 md:bottom-6 md:right-20"
    >
      {enabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5 text-foreground/60" />}
    </button>
  );
}
