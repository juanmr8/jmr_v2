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

import { useReducedMotion } from "motion/react";
import { ParagraphReveal, type ParagraphRevealProps } from "./animations/paragraph-reveal";
import { useRevealGate } from "./reveal-gate";

export const REVEAL_DURATION = 0.7;
export const REVEAL_STAGGER = 0.08;
export const REVEAL_EASE = [0.165, 0.84, 0.44, 1];

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
  const reduce = useReducedMotion();
  const gate = useRevealGate();
  const resolved = play ?? gate;

  return (
    <ParagraphReveal
      as={as}
      className={className}
      animate={resolved || !!reduce}
      delay={reduce ? 0 : delay}
      duration={reduce ? 0 : REVEAL_DURATION}
      ease={REVEAL_EASE}
    >
      {children}
    </ParagraphReveal>
  );
}
