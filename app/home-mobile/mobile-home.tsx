"use client";
import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDragSettle } from "./use-drag-settle";
import { useMobileGalleryStore } from "./mobile-gallery-store";
import { galleryView } from "../gallery/gallery-logic";
import { STATEMENT } from "../home-data";
import { MobileSetLayer } from "./mobile-set-layer";

// Canvas is client-only (WebGL touches window) and must never SSR.
const MobileGalleryCanvas = dynamic(() => import("./mobile-gallery-canvas"), {
  ssr: false,
});

// Mirror of mobile-gallery-column's tunables — used only to hit-test a tap
// against the Active Plane (Q8: tapping the Active Plane opens it; a tap that
// lands on an off-center Plane does nothing, so the user settles it by drag).
const REFERENCE_LINE_PCT = 0.5;
const PLANE_WIDTH_PCT = 0.78;
const PLANE_ASPECT = 4000 / 2766;

export function MobileHome() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const onTap = useCallback(
    (clientY: number) => {
      const lineY = window.innerHeight * REFERENCE_LINE_PCT;
      const planeWpx = Math.min(560, Math.max(240, window.innerWidth * PLANE_WIDTH_PCT));
      const planeHpx = planeWpx / PLANE_ASPECT;
      if (Math.abs(clientY - lineY) > planeHpx / 2) return; // missed the Active Plane
      const { href } = galleryView(useMobileGalleryStore.getState().activeIndex);
      router.push(href);
    },
    [router]
  );

  useDragSettle(surfaceRef, onTap);

  return (
    <main
      className="absolute inset-0 isolate overflow-hidden bg-[var(--color-bg)] font-sans text-white"
      style={{ height: "100svh" }}
    >
      {/* Gallery surface — fills the screen, owns scroll + tap input. */}
      <div
        ref={surfaceRef}
        className="absolute inset-0 z-[1] touch-none [&_canvas]:h-full! [&_canvas]:w-full!"
      >
        <MobileGalleryCanvas />
      </div>

      {/* Slim top bar: logo + Contact. p-4! → 16px top + left/right; the `!`
          beats the unlayered global reset (* { padding: 0 }), which otherwise
          wins over Tailwind's layered utilities. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex items-center justify-between p-4! mix-blend-difference">
        <span className="t-logo text-white">j.mr</span>
        <span className="t-ui pointer-events-auto text-white underline underline-offset-2">
          Contact
        </span>
      </div>

      <MobileSetLayer />

      {/* Bottom band: statement on the left half, section links on the right.
          Lab/About are placeholders — to be wired to their pages later. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex items-end justify-between gap-4 p-4! mix-blend-difference">
        <p className="w-1/2 text-xs leading-snug text-white">{STATEMENT}</p>
        <nav className="pointer-events-auto flex flex-col items-end gap-1 text-xs text-white">
          <span>Lab</span>
          <span>About</span>
        </nav>
      </div>
    </main>
  );
}
