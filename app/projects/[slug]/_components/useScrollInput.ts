import { RefObject, useEffect } from "react";
import { useGalleryStore } from "./useGalleryStore";

// Live-tunable config. Open DevTools and mutate any field — changes take
// effect on the next frame with no reload needed:
//   window.__gallery.dragSensitivity = 2.5
//   window.__gallery.dragBoost = 3.5   ← warp/aberration multiplier while grabbing
//   window.__gallery.wheelSensitivity = 0.8
const cfg = {
  wheelSensitivity: 1,
  touchSensitivity: 1.5,
  dragSensitivity: 2.0,
  // Strength multiplier applied to warp + chromatic aberration while dragging.
  // Read by GalleryColumn each frame, so you can tune it live in DevTools.
  dragBoost: 2.8,
};

if (typeof window !== "undefined") {
  (window as any).__gallery = cfg;
}

// Captures wheel + touch + mouse-drag input and feeds it into the gallery
// store. Wheel/touch are registered on `targetRef` (the whole root).
// Mouse drag is registered on `dragRef` — a narrow hit-area over just the
// gallery slice — so dragging anywhere else on the page does nothing.
// mousemove / mouseup go on window so the gesture keeps working if the cursor
// strays outside the hit area while dragging.
export function useScrollInput(
  targetRef: RefObject<HTMLElement | null>,
  dragRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const { addDelta, setDragging } = useGalleryStore.getState();
    let lastTouchY: number | null = null;
    let dragging = false;
    let lastMouseY: number | null = null;

    // ── wheel ──────────────────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      addDelta(e.deltaY * cfg.wheelSensitivity);
    };

    // ── touch ──────────────────────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0]?.clientY;
      if (y == null || lastTouchY == null) return;
      addDelta((lastTouchY - y) * cfg.touchSensitivity);
      lastTouchY = y;
    };

    const onTouchEnd = () => {
      lastTouchY = null;
    };

    // ── mouse drag ─────────────────────────────────────────────────────────
    // mousedown goes on the narrow hit-area (dragRef) so only dragging the
    // gallery slice starts the gesture. Falls back to the full root if no
    // dragRef is provided.
    const dragEl = dragRef?.current ?? el;

    const onMouseDown = (e: MouseEvent) => {
      dragging = true;
      lastMouseY = e.clientY;
      setDragging(true);
      document.body.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging || lastMouseY == null) return;
      addDelta((lastMouseY - e.clientY) * cfg.dragSensitivity);
      lastMouseY = e.clientY;
    };

    const onMouseUp = () => {
      dragging = false;
      lastMouseY = null;
      setDragging(false);
      document.body.style.cursor = "";
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    dragEl.addEventListener("mousedown", onMouseDown);
    // mousemove / mouseup on window: drag keeps working if cursor leaves the hit area.
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      dragEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
    };
  }, [targetRef, dragRef]);
}
