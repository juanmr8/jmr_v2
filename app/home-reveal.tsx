"use client";

/* ════════════════════════════════════════════════════════════
   HOME REVEAL · masked rise for the homepage's small text tier.
   ─────────────────────────────────────────────────────────
   Thin house wrapper around the verbatim Connoisseur port
   (app/animations/paragraph-reveal.tsx): a single-line label gets
   one overflow-hidden mask and rises into view as a whole block —
   no per-char/word splitting. All jmr_v2-specific feel lives HERE,
   never inside the ported component.

   Feel is adapted from the Gallery Intro (app/gallery/renderer.ts:
   0.7s · power3.out · 0.08 stagger) so DOM text and WebGL Planes
   move with one voice. power3.out ≈ cubic-bezier(0.165, 0.84, 0.44, 1).

   Trigger: each HomeReveal plays when its nearest reveal gate is
   open (see reveal-gate.tsx). An explicit `play` prop overrides it.
════════════════════════════════════════════════════════════ */

import { useRef } from "react";
import { useReducedMotion } from "motion/react";
import { ParagraphReveal, type ParagraphRevealProps } from "./animations/paragraph-reveal";
import { useRevealMode } from "./reveal-gate";

export const REVEAL_DURATION = 0.7;
/** Per-slot step of the small-tier cascade. Tighter than the Intro's 0.08:
    the tier is ONE 17-slot sweep (see CASCADE), and this keeps its full
    span of departures ≈ 0.64s so the statement still clearly follows. */
export const REVEAL_STAGGER = 0.04;
export const REVEAL_EASE = [0.165, 0.84, 0.44, 1];

/** Small-tier cascade: one GLOBAL slot sequence sweeping the page top to
    bottom — nav → rail top → status → rail bottom. Each region's items
    continue from the previous region's last slot, so the tier reads as a
    single stagger, never four parallel ones. delay = slot × REVEAL_STAGGER. */
export const CASCADE = {
  nav: 0, //         logo · Work · About · Lab · Contact          → 0–4
  railTop: 5, //     Services: · Design, Development · IG · Medium → 5–8
  status: 9, //      Available for work · June '26 · Scroll        → 9–11
  railBottom: 12, // Client: · value · Role: · value · View Detail → 12–16
} as const;

interface HomeRevealProps {
  children: string;
  /** Container tag — span by default so it nests inside styled spans/anchors */
  as?: ParagraphRevealProps["as"];
  className?: string;
  /** Seconds before this element starts — drive per-region cascades via index × REVEAL_STAGGER */
  delay?: number;
  /** Entrance override — defaults to the surrounding reveal gate */
  play?: boolean;
}

export function HomeReveal({ children, as = "span", className, delay = 0, play }: HomeRevealProps) {
  // The ported ParagraphReveal has no reduced-motion guard (house rule:
  // Preloader and Intro both skip) — settle instantly instead of rising.
  // `instant` (the session-flag skip) settles the same way: the visitor
  // already saw the opening, the page renders resting.
  const reduce = useReducedMotion();
  const { open, instant } = useRevealMode();
  const resolved = play ?? open;
  const still = !!reduce || instant;

  // The delay choreographs the OPENING cascade only. A mount that finds the
  // gate already open is a later re-rise (RailBottom's keyed Active values,
  // Fast Refresh) — it plays immediately instead of waiting out its slot.
  const openAtMount = useRef(open);
  const entranceDelay = openAtMount.current ? 0 : delay;

  return (
    <ParagraphReveal
      as={as}
      className={className}
      animate={resolved || !!reduce}
      delay={still ? 0 : entranceDelay}
      duration={still ? 0 : REVEAL_DURATION}
      ease={REVEAL_EASE}
    >
      {children}
    </ParagraphReveal>
  );
}
