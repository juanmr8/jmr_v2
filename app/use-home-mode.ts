"use client";
import { useEffect, useState } from "react";

export type HomeMode = "mobile" | "desktop" | "rotate";

// Phones (narrow + portrait) get the vertical mobile gallery. Everything narrow
// but the wrong shape is asked to rotate rather than forced into a layout that
// doesn't fit:
//   • portrait tablet / iPad (768–1023px wide) → rotate → landscape ≥1024 → desktop
//   • any narrow screen in landscape            → rotate → portrait        → mobile
// 1024px+ is always desktop.
const PHONE = "(max-width: 767.98px) and (orientation: portrait)";
const NARROW = "(max-width: 1023.98px)";

/**
 * `null` until mounted (the server can't know the viewport), then one of three
 * modes, tracked live across resize / orientation change. Callers render a
 * neutral placeholder while it's null so there's no hydration mismatch.
 */
export function useHomeMode(): HomeMode | null {
  const [mode, setMode] = useState<HomeMode | null>(null);

  useEffect(() => {
    const phone = window.matchMedia(PHONE);
    const narrow = window.matchMedia(NARROW);
    const sync = () => {
      if (phone.matches) return setMode("mobile");
      if (narrow.matches) return setMode("rotate");
      setMode("desktop");
    };
    sync();
    phone.addEventListener("change", sync);
    narrow.addEventListener("change", sync);
    return () => {
      phone.removeEventListener("change", sync);
      narrow.removeEventListener("change", sync);
    };
  }, []);

  return mode;
}
