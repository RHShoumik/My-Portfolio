"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Link from "next/link";
import { create } from "zustand";
import { featuredJourneys } from "./travel-gallery-data";
import { heightAt, playerPos } from "./world";
import { Rounded } from "./details";
import { Sign } from "./archipelago";
import { useActivity } from "./activities";

const useGallery = create<{ near: number | null }>()(() => ({ near: null }));
type Journey = (typeof featuredJourneys)[number];
function captionTexture(journey: Journey, index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 320;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#e9e1cf";
  g.fillRect(0, 0, 1024, 320);
  g.fillStyle = "#637367";
  g.font = "22px sans-serif";
  g.fillText(
    `FIELD NOTES / 0${index + 1}                  ${journey.date}`,
    44,
    46,
  );
  g.fillStyle = "#263e36";
  g.font = "bold 48px sans-serif";
  g.fillText(journey.city, 44, 110, 930);
  g.font = "25px sans-serif";
  g.fillStyle = "#4d5f53";
  let line = "",
    y = 164;
  for (const word of journey.description.split(" ")) {
    const next = line + word + " ";
    if (g.measureText(next).width > 930) {
      g.fillText(line, 44, y);
      line = word + " ";
      y += 34;
    } else line = next;
  }
  g.fillText(line, 44, y);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
function PhotoStop({ journey, index }: { journey: Journey; index: number }) {
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const caption = useMemo(
    () => captionTexture(journey, index),
    [journey, index],
  );
  useEffect(() => () => caption.dispose(), [caption]);
  useEffect(() => {
    let disposed = false;
    let loaded: THREE.Texture | undefined;
    new THREE.TextureLoader().setCrossOrigin("anonymous").load(
      journey.coverImage,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        loaded = texture;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        // Crop the source to the 8:5 print instead of stretching the photograph.
        const aspect = texture.image.width / texture.image.height,
          target = 8 / 5;
        if (aspect > target) {
          texture.repeat.x = target / aspect;
          texture.offset.x = (1 - texture.repeat.x) / 2;
        } else {
          texture.repeat.y = aspect / target;
          texture.offset.y = (1 - texture.repeat.y) / 2;
        }
        if (material.current) {
          material.current.map = texture;
          material.current.color.set("#ffffff");
          material.current.needsUpdate = true;
        }
      },
      undefined,
      () => {
        /* Keep the neutral frame and readable caption when a remote cover is unavailable. */
      },
    );
    return () => {
      disposed = true;
      loaded?.dispose();
    };
  }, [journey.coverImage]);
  const y = heightAt(journey.x, journey.z) ?? 3;
  return (
    <group position={[journey.x, y, journey.z]} rotation-y={Math.PI}>
      <Rounded size={[10, 0.25, 4]} color="#9d9b89" position={[0, 0.12, 0]} />
      {[-3.7, 3.7].map((x) => (
        <Rounded
          key={x}
          size={[0.18, 7, 0.18]}
          color="#657368"
          metal={0.3}
          position={[x, 3.5, 0]}
        />
      ))}
      <Rounded size={[8.5, 5.5, 0.25]} color="#75674f" position={[0, 4.5, 0]} />
      <mesh position={[0, 4.5, 0.14]}>
        <planeGeometry args={[8, 5]} />
        <meshBasicMaterial ref={material} color="#658076" />
      </mesh>
      <mesh position={[0, 4.5, -0.14]} rotation-y={Math.PI}>
        <planeGeometry args={[8, 5]} />
        <meshBasicMaterial color="#405a4e" />
      </mesh>
      <mesh position={[0, 1.2, 0.16]}>
        <planeGeometry args={[8, 2.5]} />
        <meshBasicMaterial map={caption} />
      </mesh>
      <Rounded size={[8.8, 0.2, 0.8]} color="#657368" position={[0, 7.4, 0]} />
      <Rounded size={[5, 0.18, 1]} color="#9d8967" position={[0, 0.6, 5]} />
      {[-2, 2].map((x) => (
        <Rounded
          key={x}
          size={[0.15, 0.6, 0.8]}
          color="#56665a"
          position={[x, 0.3, 5]}
        />
      ))}
    </group>
  );
}
export function TravelGallery() {
  const last = useRef(0);
  useEffect(() => () => useGallery.setState({ near: null }), []);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current < 0.15) return;
    last.current = clock.elapsedTime;
    let near: number | null = null,
      best = 13;
    featuredJourneys.forEach((j, i) => {
      const d = Math.hypot(playerPos.x - j.x, playerPos.z - j.z);
      if (d < best) {
        near = i;
        best = d;
      }
    });
    if (useGallery.getState().near !== near) useGallery.setState({ near });
  });
  return (
    <>
      <Sign
        text="THE PHOTO WALK · SIX JOURNEYS"
        position={[330, heightAt(330, 122) ?? 3, 122]}
        scale={1.4}
      />
      {featuredJourneys.map((journey, i) => (
        <PhotoStop key={journey.slug} journey={journey} index={i} />
      ))}
    </>
  );
}
const button =
  "rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-stone-100 hover:bg-white/20";
export function GalleryReader({
  publishedSlugs,
}: {
  publishedSlugs: string[];
}) {
  const near = useGallery((s) => s.near);
  const panel = useActivity((s) => s.panel);
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const isOpen = selected !== null;
  const journey = selected === null ? null : featuredJourneys[selected];
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (isOpen) {
      useActivity.getState().open("gallery");
      el.showModal();
    } else el.close();
    return () => {
      if (el.open) el.close();
    };
  }, [isOpen]);
  const close = () => {
    setSelected(null);
    useActivity.getState().open(null);
  };
  return (
    <>
      {near !== null && !panel && (
        <button
          className={`${button} absolute bottom-60 left-1/2 z-20 max-w-[90vw] -translate-x-1/2 bg-[#172b27]/95 shadow-xl`}
          onClick={() => setSelected(near)}
        >
          Read {featuredJourneys[near].city} · photo {near + 1}/5
        </button>
      )}
      <dialog
        ref={dialog}
        onCancel={close}
        className="fixed inset-0 m-auto max-h-[88dvh] w-[min(92vw,760px)] overflow-y-auto rounded-3xl border border-white/15 bg-[#172b27] p-5 text-stone-100 shadow-2xl backdrop:bg-black/60"
        aria-labelledby="journey-title"
      >
        {journey && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-amber-100/70">
                The photo walk · {selected! + 1} / {featuredJourneys.length}
              </span>
              <button
                className={button}
                onClick={close}
                aria-label="Close travel note"
              >
                ✕
              </button>
            </div>
            {/* Existing remote travel covers; no claim that these are original personal photographs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={journey.slug}
              src={journey.coverImage}
              alt={`${journey.city} travel cover`}
              className="aspect-[8/5] w-full rounded-2xl bg-white/10 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <h2 id="journey-title" className="mt-5 text-3xl font-semibold">
              {journey.city}
            </h2>
            <p className="mt-2 text-sm text-amber-100/70">
              {journey.country} · {journey.date} · {journey.distance} km from
              Dhaka
            </p>
            <p className="my-5 text-lg leading-8 text-stone-200">
              {journey.description}
            </p>
            {publishedSlugs.includes(journey.slug) ? (
              <Link href={`/travel/${journey.slug}`} className={button}>
                Read full story ↗
              </Link>
            ) : (
              <p className="text-sm text-stone-400">
                Travel note · a full blog post hasn’t been published yet.
              </p>
            )}
            <div className="mt-6 flex justify-between">
              <button
                className={button}
                disabled={selected === 0}
                onClick={() => setSelected((n) => Math.max(0, (n ?? 0) - 1))}
              >
                ← Previous
              </button>
              <button
                className={button}
                disabled={selected === featuredJourneys.length - 1}
                onClick={() => setSelected((n) => Math.min(4, (n ?? 0) + 1))}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
