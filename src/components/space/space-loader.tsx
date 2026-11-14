// SPIKE: throwaway prototype of the space game. Not production code.
"use client";

import dynamic from "next/dynamic";

const Space = dynamic(() => import("./space"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black text-sm font-medium text-white/60">
      Preparing for launch…
    </div>
  ),
});

export function SpaceLoader() {
  return <Space />;
}
