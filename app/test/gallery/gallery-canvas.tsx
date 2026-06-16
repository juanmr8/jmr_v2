"use client";

/* ════════════════════════════════════════════════════════════
   GALLERY CANVAS · the client island.
   Owns only the lifecycle around the renderer seam: mount the
   <canvas>, measure the live pixel box and the grid's real
   --gutter, drive the renderer on resize, tear down on unmount.
   All drawing lives in renderer.ts — swap that, keep this.
════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import { createGalleryRenderer } from "./renderer";

interface GalleryCanvasProps {
  /** One flat placeholder color per Plane, in Project order. */
  colors: string[];
}

export function GalleryCanvas({ colors }: GalleryCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = createGalleryRenderer({ canvas, colors });

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

    return () => {
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
