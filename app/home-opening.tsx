"use client";

/* ════════════════════════════════════════════════════════════
   HOME OPENING · Preloader → homepage handoff (first slice).
   ─────────────────────────────────────────────────────────
   Owns the `revealed` state: the reveal gate stays closed while the
   Preloader plays on top (the text entrances would otherwise finish
   unseen behind the overlay) and opens the moment its timeline
   completes — the same instant as the display:none cut. Completion
   is reported live, not latched, so scrubbing the dev player back
   re-covers the home AND re-arms the text for the next run-through.

   Still to come here: session flag, scroll lock, reduced-motion
   skip of the whole sequence, triggering the Gallery Intro.
════════════════════════════════════════════════════════════ */

import { useState, type ReactNode } from "react";
import { Preloader } from "./preloader";
import { RevealGateProvider } from "./reveal-gate";

export function HomeOpening({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <RevealGateProvider open={revealed}>
      <Preloader onComplete={setRevealed} />
      {children}
    </RevealGateProvider>
  );
}
