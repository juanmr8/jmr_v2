/* ════════════════════════════════════════════════════════════
   LAB MOTION · Seam 1 (cont.) — pure, framework-free.
   The 2-axis pan's physics: integrate position, decay momentum.
   Reuses the Gallery's frame-rate-normalised decay so both
   surfaces share one glide feel. The renderer owns the feel
   constants (gain, friction, thresholds) and calls these per
   frame; React never does.
════════════════════════════════════════════════════════════ */

import { decayVelocity } from "../gallery/gallery-motion";

export interface PanState {
  x: number; // design units
  y: number;
  vx: number; // design units / sec
  vy: number;
}

/**
 * Advance the pan one frame: position integrates the current velocity, then
 * the velocity decays. `perFrame` ∈ (0,1) is the per-frame (60fps) friction
 * factor — lower = shorter glide. Pure: returns a new state.
 */
export function stepPan(s: PanState, dt: number, perFrame: number): PanState {
  return {
    x: s.x + s.vx * dt,
    y: s.y + s.vy * dt,
    vx: decayVelocity(s.vx, dt, perFrame),
    vy: decayVelocity(s.vy, dt, perFrame),
  };
}

/** True once the glide's speed (vector magnitude, units/sec) has dropped below
    `min` — the moment momentum reads as stopped and the loop can park. */
export function isSettled(s: PanState, min: number): boolean {
  return Math.hypot(s.vx, s.vy) < min;
}
