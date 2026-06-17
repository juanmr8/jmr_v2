"use client";
import { RefObject, useEffect } from "react";
import { useMobileGalleryStore } from "./mobile-gallery-store";

// Tunables. Touch is the primary path on mobile; wheel + mouse-drag exist so
// the layout is testable from a desktop browser at a narrow width.
const TOUCH_SENSITIVITY = 1.4;
const WHEEL_SENSITIVITY = 1;
const DRAG_SENSITIVITY = 1.6;
// A pointer gesture that travels less than this (px, total) counts as a tap,
// not a drag — the column never moved, so it's a navigation intent.
const TAP_SLOP = 8;

/**
 * Vertical scroll input for the mobile gallery: touch drag, wheel, and mouse
 * drag all feed `addDelta`. A gesture that barely moves fires `onTap(clientY)`
 * instead, so the screen above can decide whether that tap landed on the Active
 * Plane (→ navigate) or elsewhere. Bound to the gallery surface only; the Set
 * layer CTA and top bar sit above it with their own pointer events.
 */
export function useDragSettle(
  ref: RefObject<HTMLElement | null>,
  onTap: (clientY: number) => void
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { addDelta, setDragging } = useMobileGalleryStore.getState();
    let lastY: number | null = null;
    let startY = 0;
    let travelled = 0;
    let pointerDown = false;

    const begin = (y: number) => {
      lastY = y;
      startY = y;
      travelled = 0;
      pointerDown = true;
      setDragging(true);
    };

    const move = (y: number, sensitivity: number) => {
      if (lastY == null) return;
      const dy = lastY - y;
      addDelta(dy * sensitivity);
      travelled += Math.abs(dy);
      lastY = y;
    };

    const end = (y: number) => {
      if (pointerDown && travelled < TAP_SLOP) onTap(y);
      lastY = null;
      pointerDown = false;
      setDragging(false);
    };

    // ── touch ──
    const onTouchStart = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (y != null) begin(y);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0]?.clientY;
      if (y != null) move(y, TOUCH_SENSITIVITY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      end(e.changedTouches[0]?.clientY ?? startY);
    };

    // ── wheel (desktop testing) ──
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      addDelta(e.deltaY * WHEEL_SENSITIVITY);
    };

    // ── mouse drag (desktop testing) ──
    const onMouseDown = (e: MouseEvent) => begin(e.clientY);
    const onMouseMove = (e: MouseEvent) => {
      if (!pointerDown) return;
      move(e.clientY, DRAG_SENSITIVITY);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (pointerDown) end(e.clientY);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [ref, onTap]);
}
