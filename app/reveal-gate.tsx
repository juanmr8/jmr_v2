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

import { createContext, useContext, useMemo, type ReactNode } from "react";

/* ── Phases. Seconds after the gate opens that each tier begins, so the page
   assembles in a legible order: the small text leads, the statement's lines
   follow, and the Gallery Intro closes. Each phase starts while the previous
   one is landing (not after it settles) — overlap keeps it flowing; these
   offsets keep the order unmistakable. Tune here, nowhere else.
   The small tier is a single 17-slot cascade (see CASCADE, home-reveal.tsx):
   its last departure is ≈0.64s, so the statement follows right behind it. ── */
export const PHASE_SMALL = 0;
export const PHASE_STATEMENT = 0.1;
export const PHASE_GALLERY = 0.3;

export interface RevealMode {
  /** Is the page revealed — may the entrances play? */
  open: boolean;
  /** Settle instantly instead of animating — the session-flag skip: the
      visitor has already seen the opening this session, so the page renders
      in its resting state (AD-121). Only meaningful while `open`. */
  instant: boolean;
}

const RevealGate = createContext<RevealMode>({ open: true, instant: false });

/** Scopes the entrance: children hold their entrances until `open`. */
export function RevealGateProvider({
  open,
  instant = false,
  children,
}: {
  open: boolean;
  instant?: boolean;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ open, instant }), [open, instant]);
  return <RevealGate.Provider value={value}>{children}</RevealGate.Provider>;
}

export function useRevealGate(): boolean {
  return useContext(RevealGate).open;
}

export function useRevealMode(): RevealMode {
  return useContext(RevealGate);
}
