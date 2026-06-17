import { create } from "zustand";

/* ════════════════════════════════════════════════════════════
   MOBILE GALLERY STORE · the thin bridge React ↔ the WebGL loop.
   Holds the raw scroll target (in CSS px), the drag flag, and the
   discrete Active Project index. Per-frame motion lives in the
   column's useFrame; this only carries what the Set layer needs to
   re-render — the Active index, updated once per Plane crossing.
════════════════════════════════════════════════════════════ */

interface MobileGalleryState {
  /** Accumulated scroll input, CSS px. The column lerps toward it. */
  targetOffset: number;
  /** True while a finger / mouse is actively dragging the column. */
  isDragging: boolean;
  /** Active Project index, wrapped — settled, deduped to one set per crossing. */
  activeIndex: number;
  addDelta: (d: number) => void;
  setOffset: (v: number) => void;
  setDragging: (v: boolean) => void;
  setActive: (i: number) => void;
  reset: () => void;
}

export const useMobileGalleryStore = create<MobileGalleryState>((set) => ({
  targetOffset: 0,
  isDragging: false,
  activeIndex: 0,
  addDelta: (d) => set((s) => ({ targetOffset: s.targetOffset + d })),
  setOffset: (v) => set({ targetOffset: v }),
  setDragging: (v) => set({ isDragging: v }),
  setActive: (i) => set({ activeIndex: i }),
  reset: () => set({ targetOffset: 0, activeIndex: 0 }),
}));
