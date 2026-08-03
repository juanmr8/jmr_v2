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

const RevealGate = createContext(true);

/** Scopes the entrance: children hold their entrances until `open`. */
export function RevealGateProvider({ open, children }: { open: boolean; children: ReactNode }) {
  return <RevealGate.Provider value={open}>{children}</RevealGate.Provider>;
}

export function useRevealGate(): boolean {
  return useContext(RevealGate);
}
