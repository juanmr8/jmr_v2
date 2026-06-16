"use client";

/* ════════════════════════════════════════════════════════════
   GALLERY CANVAS · the client island.
   Owns the lifecycle around the renderer seam and the DOM concerns
   it must not see: mount the <canvas>, measure the live pixel box
   and the grid's real --gutter, capture EVERY wheel event on the page
   (the home view is locked to one full-height screen, so all scroll
   drives the Gallery — never the document), forward those deltas to
   the renderer, and push the live Active index back into React.
   All drawing/motion lives behind the seam.
════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import { createGalleryRenderer } from "./renderer";
import { useGallery } from "./gallery-context";

interface GalleryCanvasProps {
  /** One flat placeholder color per Plane, in Project order. */
  colors: string[];
}

export function GalleryCanvas({ colors }: GalleryCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setActive } = useGallery();

  // Latest setter in a ref so the renderer effect never re-runs on re-render.
  const onActiveChange = useRef(setActive);
  onActiveChange.current = setActive;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = createGalleryRenderer({
      canvas,
      colors,
      onActiveChange: (index) => onActiveChange.current(index),
    });

    // The 16px gutter is a fluid --vw unit, not proportional to the strip
    // height — so resolve its real px from the cascade with a 0-height probe
    // rather than guessing. Kept in the tree so it inherits the custom props.
    const probe = document.createElement("div");
    probe.style.cssText = "width:var(--gutter);height:0;position:absolute;visibility:hidden";
    container.appendChild(probe);

    const sync = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.resize(width, height, probe.getBoundingClientRect().width);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(container);

    // Capture is page-wide: the home view is a single full-height screen with
    // nothing to scroll, so every wheel event belongs to the Gallery. Binding
    // the window (not the strip) means scrolling anywhere drives it, and the
    // preventDefault keeps the document pinned to that top view. Use whichever
    // axis dominates (trackpads mostly emit deltaY).
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      renderer.input(delta);
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWheel);
      observer.disconnect();
      probe.remove();
      renderer.destroy();
    };
  }, [colors]);

  return (
    <div ref={containerRef} style={{ flex: 1, minHeight: 0, position: "relative" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, display: "block" }} />
    </div>
  );
}
