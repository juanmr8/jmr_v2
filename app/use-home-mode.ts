"use client";
import { useEffect, useState } from "react";

export type HomeMode = "mobile" | "desktop" | "rotate";

// Phones (narrow + portrait) get the vertical mobile gallery. Only genuinely
// wrong-shape viewports are asked to rotate — a merely small/narrow window is
// NOT, so resizing a desktop browser keeps showing the desktop layout:
//   • portrait tablet / iPad (768–1023px wide, portrait) → rotate → landscape ≥1024 → desktop
//   • phone in landscape (narrow AND short ≤500px tall)  → rotate → portrait        → mobile
// Everything else (incl. small balanced desktop windows) is desktop.
const PHONE = "(max-width: 767.98px) and (orientation: portrait)";
const PORTRAIT_TABLET =
  "(min-width: 768px) and (max-width: 1023.98px) and (orientation: portrait)";
const PHONE_LANDSCAPE =
  "(orientation: landscape) and (max-width: 1023.98px) and (max-height: 500px)";

/**
 * `null` until mounted (the server can't know the viewport), then one of three
 * modes, tracked live across resize / orientation change. Callers render a
 * neutral placeholder while it's null so there's no hydration mismatch.
 */
export function useHomeMode(): HomeMode | null {
  const [mode, setMode] = useState<HomeMode | null>(null);

  useEffect(() => {
    const phone = window.matchMedia(PHONE);
    const portraitTablet = window.matchMedia(PORTRAIT_TABLET);
    const phoneLandscape = window.matchMedia(PHONE_LANDSCAPE);
    const sync = () => {
      if (phone.matches) return setMode("mobile");
      if (portraitTablet.matches || phoneLandscape.matches) return setMode("rotate");
      setMode("desktop");
    };
    sync();
    const queries = [phone, portraitTablet, phoneLandscape];
    queries.forEach((q) => q.addEventListener("change", sync));
    return () => queries.forEach((q) => q.removeEventListener("change", sync));
  }, []);

  return mode;
}
