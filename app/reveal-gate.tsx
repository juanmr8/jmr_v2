"use client";

/* ════════════════════════════════════════════════════════════
   REVEAL GATE · "is the page revealed yet?" — one signal.
   ─────────────────────────────────────────────────────────
   The home's entrances (text reveals, Gallery Intro) all key off
   the same moment: the Preloader's cut. This context carries that
   signal so each consumer reads one boolean instead of wiring to
   the Preloader directly. Default is OPEN — surfaces without an
   opening sequence (project detail, a bare Gallery) play on mount;
   only the home closes it (see home-opening.tsx).
════════════════════════════════════════════════════════════ */

import { createContext, useContext, type ReactNode } from "react";

/* ── Phases. Seconds after the gate opens that each tier begins, so the page
   assembles in a legible order: the small text leads, the statement's lines
   follow, and the Gallery Intro closes. Each phase starts while the previous
   one is landing (not after it settles) — overlap keeps it flowing; these
   offsets keep the order unmistakable. Tune here, nowhere else.
   The small tier is a single 17-slot cascade (see CASCADE, home-reveal.tsx):
   its last departure is ≈0.8s, so the statement follows right behind it. ── */
export const PHASE_SMALL = 0;
export const PHASE_STATEMENT = 0.9;
export const PHASE_GALLERY = 1.5;

const RevealGate = createContext(true);

/** Scopes the entrance: children hold their entrances until `open`. */
export function RevealGateProvider({ open, children }: { open: boolean; children: ReactNode }) {
  return <RevealGate.Provider value={open}>{children}</RevealGate.Provider>;
}

export function useRevealGate(): boolean {
  return useContext(RevealGate);
}
