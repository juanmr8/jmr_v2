"use client";

/* ════════════════════════════════════════════════════════════
   GALLERY CANVAS · the client island.
   Owns the lifecycle around the renderer seam and the DOM concerns
   it must not see: mount the <canvas>, measure the live pixel box
   and the grid's real --gutter, capture EVERY wheel event on the page
   (the home view is locked to one full-height screen, so all scroll
   drives the Gallery — never the document), forward those deltas to
   the renderer, and push the live Active index back into React. It also owns
   the transparent DOM link overlays (ADR-0001): one real <a> per Plane,
   positioned over the Plane's live rect every frame via the renderer's onFrame
   seam — anchors track the Planes, never an in-canvas click handler.
   All drawing/motion lives behind the seam.
════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { createGalleryRenderer } from "./renderer";
import { useGallery } from "./gallery-context";
import { projectHref } from "./gallery-logic";

/** One Plane's worth of data: its color (for the mesh) and the link it carries.
    Plane i is always Project i, so each anchor's href/label is fixed — only its
    rect moves as the strip loops. */
export interface GalleryItem {
  color: string;
  slug: string;
  title: string;
}

interface GalleryCanvasProps {
  /** One entry per Plane, in Project order. */
  items: GalleryItem[];
}

export function GalleryCanvas({ items }: GalleryCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The live <a> overlays, in Plane order — positioned imperatively per frame.
  const anchorsRef = useRef<(HTMLAnchorElement | null)[]>([]);
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
      colors: items.map((it) => it.color),
      onActiveChange: (index) => onActiveChange.current(index),
      // Per-frame, no React re-render: write each Plane's live rect straight to
      // its overlay. Fires on every redraw (momentum, snap, idle resize), so a
      // focused or hovered anchor stays glued to its Plane even at rest.
      onFrame: (rects) => {
        for (let i = 0; i < rects.length; i++) {
          const a = anchorsRef.current[i];
          if (!a) continue;
          const r = rects[i];
          a.style.transform = `translate(${r.left}px, ${r.top}px)`;
          a.style.width = `${r.size}px`;
          a.style.height = `${r.size}px`;
        }
      },
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
  }, [items]);

  return (
    <div ref={containerRef} style={{ flex: 1, minHeight: 0, position: "relative" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, display: "block" }} />

      {/* Transparent DOM anchors over each Plane (ADR-0001). Real links — so
          hover shows the URL, right-click offers "open in new tab", and Tab
          focuses each Plane. The renderer positions/sizes them every frame via
          onFrame; they start collapsed until the first redraw places them. */}
      {items.map((it, i) => (
        <Link
          key={it.slug}
          ref={(el) => {
            anchorsRef.current[i] = el;
          }}
          href={projectHref(it.slug)}
          aria-label={`${it.title} — open project`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            transformOrigin: "top left",
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
