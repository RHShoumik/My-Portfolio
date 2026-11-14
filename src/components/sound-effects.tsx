"use client";

import { useEffect } from "react";
import { playSound, setAudioHidden, unlockAudio, type SoundName } from "@/lib/sound";

const CLICKABLE = 'a[href], button, [role="button"], summary, [data-sound="tap"]';
const PAPER = 'a.card, [data-sound="paper"]';
const TICK = '.btn, header nav a, footer a, [data-sound="tick"]';

/**
 * Global, invisible sound layer. Wires interaction sounds by event delegation,
 * so components only need a `data-sound` attribute (or `data-sound="off"` to opt out).
 */
export function SoundEffects() {
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock, { passive: true });

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest(CLICKABLE);
      if (!el || el.closest('[data-sound="off"]')) return;
      playSound("tap");
    };

    // Play a sound only when the pointer enters an element from outside it.
    const enters = (e: PointerEvent, el: Element | null) => {
      if (!el || el.closest('[data-sound="off"]')) return false;
      const from = e.relatedTarget as Node | null;
      return !(from && el.contains(from));
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = e.target as Element | null;
      if (!target) return;

      const paper = target.closest(PAPER);
      if (enters(e, paper)) return playSound("paper");

      const tick = target.closest(TICK);
      if (enters(e, tick)) playSound("tick" as SoundName);
    };

    const onInput = (e: Event) => {
      const el = e.target as Element | null;
      if (el?.matches?.('[data-sound="type"]')) playSound("key");
    };

    const onVisibility = () => setAudioHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    document.addEventListener("click", onClick);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("input", onInput);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("input", onInput);
    };
  }, []);

  return null;
}
