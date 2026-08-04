"use client";

/* ════════════════════════════════════════════════════════════
   LAB VIEW · one route, two surfaces.
   The branch happens on the client (matchMedia) so the WebGL
   canvas never mounts for a reduced-motion visitor — they get the
   same pieces as a natively-scrolling document instead of a
   free-panning field. Until the query resolves, a bare shell in
   the Lab's background holds the frame (the home-router pattern —
   no hydration mismatch, no canvas flash).
   The menu chrome mirrors the project detail surface: differenced
   over the light shell for legibility, desktop bar ↔ mobile bar at
   the 760px reflow.
════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { SiteMenuBar, SiteMenuMobileTop } from "../menu";
import { LabCanvas } from "./lab-canvas";
import { LabGrid } from "./lab-grid";

/** The Lab's shell — the light surface the project detail pages use. */
const SHELL_BG = "#e9e6df";

export function LabView() {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Lock document scroll only around the canvas surface — the reduced-motion
  // grid scrolls natively. Same restore discipline as projects/layout.tsx.
  useEffect(() => {
    if (reduced !== false) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [reduced]);

  if (reduced === null) {
    return <div className="fixed inset-0" style={{ background: SHELL_BG }} />;
  }

  const menu = (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] mix-blend-difference max-[760px]:hidden">
        <SiteMenuBar activeLabel="Lab" />
      </div>
      <div className="hidden max-[760px]:contents">
        <SiteMenuMobileTop />
      </div>
    </>
  );

  if (reduced) {
    return (
      <div className="relative isolate min-h-dvh" style={{ background: SHELL_BG }}>
        {menu}
        <LabGrid />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 isolate h-dvh w-screen touch-none overflow-hidden overscroll-none"
      style={{ background: SHELL_BG }}
    >
      <LabCanvas />
      {menu}
    </div>
  );
}
