import { create } from "zustand";

interface GalleryState {
  targetOffset: number;
  progress: number;
  frameRatio: number;
  loadedSlug: string | null;
  // True while the user is actively mouse-dragging the gallery slice.
  // GalleryColumn reads this to apply a tighter LERP + strength boost so
  // dragging produces a more accentuated warp than passive scrolling.
  isDragging: boolean;
  addDelta: (d: number) => void;
  setProgress: (p: number) => void;
  setFrameRatio: (r: number) => void;
  setLoadedSlug: (slug: string) => void;
  setDragging: (v: boolean) => void;
  reset: () => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  targetOffset: 0,
  progress: 0,
  frameRatio: 0.3,
  loadedSlug: null,
  isDragging: false,
  addDelta: (d) => set((s) => ({ targetOffset: s.targetOffset + d })),
  setProgress: (p) => set({ progress: p }),
  setFrameRatio: (r) => set({ frameRatio: r }),
  setLoadedSlug: (slug) => set({ loadedSlug: slug }),
  setDragging: (v) => set({ isDragging: v }),
  reset: () => set({ targetOffset: 0, progress: 0 }),
}));
