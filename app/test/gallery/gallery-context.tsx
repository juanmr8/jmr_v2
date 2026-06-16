"use client";

/* ════════════════════════════════════════════════════════════
   GALLERY CONTEXT · the discrete Active index.
   Holds ONLY the settled Active Project index — updated once per
   snap-settle, never per frame. Per-frame motion lives in the
   WebGL loop; this is the thin bridge back to React so the
   counter/rail can re-render once when the Active Project changes.
════════════════════════════════════════════════════════════ */

import { createContext, useContext, useState, type ReactNode } from "react";

interface GalleryState {
  /** Active Project index, wrapped into the list — settled, not live. */
  active: number;
  /** Called by the renderer on snap-settle with the new discrete index. */
  setActive: (index: number) => void;
}

const GalleryContext = createContext<GalleryState | null>(null);

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  return (
    <GalleryContext.Provider value={{ active, setActive }}>
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery(): GalleryState {
  const context = useContext(GalleryContext);
  if (!context) throw new Error("useGallery must be used within a GalleryProvider");
  return context;
}
