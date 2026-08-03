"use client";

/* ════════════════════════════════════════════════════════════
   HOME OPENING · Preloader → homepage handoff.
   ─────────────────────────────────────────────────────────
   Owns the `revealed` state: the reveal gate stays closed while the
   Preloader plays on top (the text entrances would otherwise finish
   unseen behind the overlay) and opens the moment its timeline
   completes — the same instant as the display:none cut.

   Once per session: completion writes a sessionStorage flag; a mount
   that finds the flag skips the Preloader entirely and opens the gate
   in `instant` mode, so the page renders straight in its resting state
   (AD-121) — no overlay, no entrances. The check runs in a layout
   effect (sessionStorage doesn't exist on the server), so the first
   client render matches the SSR HTML and the skip lands before paint.
   `instant` is released right after the settle, so later in-page
   entrances (RailBottom's keyed Active values) still animate.

   Still to come: a real unmount at the end of the timeline instead
   of the rig's display:none destroy.
════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { Preloader } from "./preloader";
import { RevealGateProvider } from "./reveal-gate";

const SESSION_KEY = "jmr:preloader-played";

export function HomeOpening({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  // null = undecided (SSR + hydration render, which must match the server).
  const [skip, setSkip] = useState<boolean | null>(null);
  // Flipped after the skip has settled — closes the instant window.
  const [settled, setSettled] = useState(false);

  useLayoutEffect(() => {
    try {
      setSkip(window.sessionStorage.getItem(SESSION_KEY) === "1");
    } catch {
      setSkip(false); // storage blocked → just play
    }
  }, []);

  useEffect(() => {
    if (skip) setSettled(true);
  }, [skip]);

  // Live, not latched (see Preloader): completion both opens the gate and
  // stamps the session, so the NEXT mount in this session skips.
  const onComplete = useCallback((complete: boolean) => {
    setRevealed(complete);
    if (!complete) return;
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // storage blocked → the Preloader simply plays again next time
    }
  }, []);

  // One stable tree either way — the Preloader slot empties on skip rather
  // than the children shifting position, so the hydrated homepage (and its
  // WebGL canvas) is never remounted by the decision.
  return (
    <RevealGateProvider open={skip ? true : revealed} instant={skip === true && !settled}>
      {skip !== true && <Preloader onComplete={onComplete} />}
      {children}
    </RevealGateProvider>
  );
}
