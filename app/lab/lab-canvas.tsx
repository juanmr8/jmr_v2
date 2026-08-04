"use client";

/* ════════════════════════════════════════════════════════════
   LAB CANVAS · the client island.
   Owns the lifecycle around the renderer seam and the DOM concerns
   it must not see: mount the <canvas>, measure the live pixel box,
   capture EVERY wheel event on the page (the Lab view is a locked
   full-height screen — all scroll drives the pan, never the
   document), and translate pointer gestures into drag calls. All
   drawing/motion lives behind the seam (lab-renderer).
════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import { CLUSTER, LAB_PIECES, PLANE_COLOR } from "./lab-data";
import { createLabRenderer } from "./lab-renderer";

export function LabCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = createLabRenderer({
      canvas,
      pieces: LAB_PIECES.map((p) => ({ rect: p.rect, image: p.image })),
      cluster: CLUSTER,
      color: PLANE_COLOR,
    });

    const sync = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.resize(width, height);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(container);

    // Page-wide capture: the Lab is a single locked screen with nothing else
    // to scroll, so every wheel event belongs to the pan — both axes, so a
    // trackpad pans diagonally and a mouse wheel walks the field vertically.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      renderer.wheel(e.deltaX, e.deltaY);
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    // Drag: pointer capture keeps the gesture alive when the hand leaves the
    // container mid-drag. One primary pointer at a time; touch is covered by
    // the same events (the shell is touch-none, so nothing competes).
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary || dragging) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      container.setPointerCapture(e.pointerId);
      container.style.cursor = "grabbing";
      renderer.dragStart();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging || !e.isPrimary) return;
      renderer.dragMove(e.clientX - lastX, e.clientY - lastY);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const endDrag = (e: PointerEvent) => {
      if (!dragging || !e.isPrimary) return;
      dragging = false;
      container.style.cursor = "grab";
      renderer.dragEnd();
    };
    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerup", endDrag);
    container.addEventListener("pointercancel", endDrag);

    return () => {
      window.removeEventListener("wheel", onWheel);
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerup", endDrag);
      container.removeEventListener("pointercancel", endDrag);
      observer.disconnect();
      renderer.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, cursor: "grab", touchAction: "none", userSelect: "none" }}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, display: "block" }} />
    </div>
  );
}
