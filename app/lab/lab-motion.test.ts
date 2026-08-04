import { describe, expect, it } from "vitest";
import { decayVelocity } from "../gallery/gallery-motion";
import { isSettled, stepPan, type PanState } from "./lab-motion";

const state = (vx: number, vy: number): PanState => ({ x: 0, y: 0, vx, vy });

describe("stepPan", () => {
  it("is the identity at dt = 0", () => {
    const s: PanState = { x: 12, y: -3, vx: 100, vy: -40 };
    expect(stepPan(s, 0, 0.92)).toEqual(s);
  });

  it("integrates position along the current velocity", () => {
    const next = stepPan({ x: 10, y: 20, vx: 60, vy: -30 }, 0.5, 0.92);
    expect(next.x).toBeCloseTo(10 + 60 * 0.5);
    expect(next.y).toBeCloseTo(20 - 30 * 0.5);
  });

  it("decays each axis with the shared Gallery curve", () => {
    const next = stepPan(state(120, -80), 1 / 60, 0.92);
    expect(next.vx).toBeCloseTo(decayVelocity(120, 1 / 60, 0.92));
    expect(next.vy).toBeCloseTo(decayVelocity(-80, 1 / 60, 0.92));
  });

  it("decays the same over one step or two half-steps — frame-rate independent", () => {
    const whole = stepPan(state(120, -80), 1 / 30, 0.92);
    const halves = stepPan(stepPan(state(120, -80), 1 / 60, 0.92), 1 / 60, 0.92);
    expect(halves.vx).toBeCloseTo(whole.vx);
    expect(halves.vy).toBeCloseTo(whole.vy);
  });

  it("does not mutate its input", () => {
    const s = state(50, 50);
    stepPan(s, 1 / 60, 0.92);
    expect(s).toEqual(state(50, 50));
  });
});

describe("isSettled", () => {
  it("measures the vector magnitude, not the axes separately", () => {
    // 3-4-5 triangle: speed is exactly 5.
    expect(isSettled(state(3, 4), 5.01)).toBe(true);
    expect(isSettled(state(3, 4), 4.99)).toBe(false);
  });

  it("treats a parked pan as settled", () => {
    expect(isSettled(state(0, 0), 0.001)).toBe(true);
  });
});
