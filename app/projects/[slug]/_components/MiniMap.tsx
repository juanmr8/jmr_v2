"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useGalleryStore } from "./useGalleryStore";
import { PLACEHOLDER_FRAME_COUNT } from "./gallery-frames";

// A miniature recreation of the gallery: the project's images lined up in a
// tiny column, with a red frame (the viewport) that travels down — and loops —
// as you scroll. The frame is padded out so it sits AROUND the thumbnails.
const CELL_W = 16;
const CELL_H = 20; // ~gallery aspect (1 : 1.25), kept tiny
const CELL_GAP = 2;
const PAD_X = 7; // breathing room the frame adds on each side
const PAD_Y = 6; // breathing room the frame adds top/bottom

export default function MiniMap({
  images,
  color,
}: {
  images: string[];
  color: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  // Second frame: the wrapped continuation, offset one loop up. When the main
  // frame slides off the bottom, this one shows its remainder at the top.
  const wrapRef = useRef<HTMLDivElement>(null);

  // Mirror the gallery: real thumbnails, or a fixed run of flat-color cells when
  // this project has no images yet. Same count the column loops on.
  const n = images.length || PLACEHOLDER_FRAME_COUNT;
  const columnH = n * CELL_H + (n - 1) * CELL_GAP;
  const boxW = CELL_W + PAD_X * 2;
  const boxH = columnH + PAD_Y * 2;

  useEffect(() => {
    const place = (progress: number, ratio: number) => {
      const el = frameRef.current;
      const wrap = wrapRef.current;
      if (!el || !wrap) return;
      const h = `${Math.min(ratio, 1) * columnH + PAD_Y * 2}px`;
      const y = progress * columnH;
      el.style.height = h;
      el.style.transform = `translateY(${y}px)`;
      // One loop earlier — the part of the frame wrapping back to the top.
      wrap.style.height = h;
      wrap.style.transform = `translateY(${y - columnH}px)`;
    };

    // Position once from current state, then track changes imperatively so the
    // frame moves every frame without re-rendering React.
    const s = useGalleryStore.getState();
    place(s.progress, s.frameRatio);
    return useGalleryStore.subscribe((state) =>
      place(state.progress, state.frameRatio)
    );
  }, [columnH]);

  return (
    // overflow-hidden lets the red frame slide off the bottom and loop to the top.
    <div
      className="relative mb-6 flex animate-overlay-reveal flex-col overflow-hidden box-border"
      style={{ width: boxW, height: boxH, padding: `${PAD_Y}px ${PAD_X}px` }}
    >
      {Array.from({ length: n }, (_, i) => {
        const src = images[i];
        return (
          <div
            key={src ?? i}
            className="relative w-full shrink-0 overflow-hidden opacity-[0.85]"
            style={{
              height: CELL_H,
              marginBottom: i < n - 1 ? CELL_GAP : 0,
              // No image yet — fill the cell with the project's flat color.
              backgroundColor: src ? undefined : color,
            }}
          >
            {src && (
              <Image
                src={src}
                alt=""
                fill
                sizes="16px"
                className="object-cover"
              />
            )}
          </div>
        );
      })}

      {/* Red viewport frame that travels down the mini-column (+ its wrapped
          continuation). Positioned imperatively in the effect above. */}
      <div
        ref={frameRef}
        className="pointer-events-none absolute top-0 left-0 box-border border-[1.5px] border-[#ff2d2d] bg-[rgba(255,45,45,0.06)] [will-change:transform,height]"
        style={{ width: boxW }}
      />
      <div
        ref={wrapRef}
        className="pointer-events-none absolute top-0 left-0 box-border border-[1.5px] border-[#ff2d2d] bg-[rgba(255,45,45,0.06)] [will-change:transform,height]"
        style={{ width: boxW }}
      />
    </div>
  );
}
