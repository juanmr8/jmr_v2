import { describe, expect, it } from "vitest";
import {
  clusterScale,
  instances,
  wrapCoord,
  WORLD_WIDTH,
  type ClusterSize,
  type LabViewport,
  type PieceRect,
} from "./lab-layout";

describe("wrapCoord", () => {
  it("leaves in-range values alone", () => {
    expect(wrapCoord(40, 100)).toBe(40);
    expect(wrapCoord(0, 100)).toBe(0);
  });

  it("wraps values past the span back into range", () => {
    expect(wrapCoord(140, 100)).toBe(40);
    expect(wrapCoord(340, 100)).toBe(40);
  });

  it("wraps negative values up into range", () => {
    expect(wrapCoord(-60, 100)).toBe(40);
    expect(wrapCoord(-260, 100)).toBe(40);
  });

  it("returns 0 for a degenerate span", () => {
    expect(wrapCoord(40, 0)).toBe(0);
  });
});

describe("clusterScale", () => {
  it("is 1 at the desktop design canvas", () => {
    expect(clusterScale(WORLD_WIDTH)).toBe(1);
  });

  it("shrinks proportionally below the canvas width", () => {
    expect(clusterScale(1200)).toBeCloseTo(1200 / WORLD_WIDTH);
  });

  it("floors on narrow viewports so pieces stay browsable", () => {
    expect(clusterScale(390)).toBe(clusterScale(600));
    expect(clusterScale(390)).toBeGreaterThan(390 / WORLD_WIDTH);
  });
});

describe("instances", () => {
  const cluster: ClusterSize = { w: 100, h: 100 };
  const piece: PieceRect = { x: 10, y: 10, w: 30, h: 30 };
  const viewport: LabViewport = { width: 250, height: 250 };

  it("tiles a piece across the whole viewport", () => {
    const out = instances([piece], { x: 0, y: 0 }, viewport, cluster, 1);
    // Copies at 10, 110, 210 on each axis → a 3×3 field.
    expect(out).toHaveLength(9);
    const lefts = [...new Set(out.map((r) => r.left))].sort((a, b) => a - b);
    expect(lefts).toEqual([10, 110, 210]);
  });

  it("returns only instances that intersect the viewport", () => {
    for (const offset of [
      { x: 0, y: 0 },
      { x: 37, y: 81 },
      { x: -12345.6, y: 9876.5 },
    ]) {
      const out = instances([piece], offset, viewport, cluster, 1);
      expect(out.length).toBeGreaterThan(0);
      for (const r of out) {
        expect(r.left).toBeLessThanOrEqual(viewport.width);
        expect(r.left + r.width).toBeGreaterThanOrEqual(0);
        expect(r.top).toBeLessThanOrEqual(viewport.height);
        expect(r.top + r.height).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("keeps a piece visible while it straddles the viewport edge", () => {
    const out = instances([piece], { x: 30, y: 0 }, viewport, cluster, 1);
    // The copy cut by the left edge (left = -20) is still in the set.
    expect(out.map((r) => r.left)).toContain(-20);
  });

  it("is invariant under a whole-Cluster shift — the seamless wrap", () => {
    const base = instances([piece], { x: 37, y: 81 }, viewport, cluster, 1);
    const shifted = instances(
      [piece],
      { x: 37 + cluster.w, y: 81 + cluster.h },
      viewport,
      cluster,
      1
    );
    expect(shifted).toEqual(base);
  });

  it("applies the scale to both placement and size", () => {
    const out = instances([piece], { x: 0, y: 0 }, viewport, cluster, 0.5);
    for (const r of out) {
      expect(r.width).toBe(15);
      expect(r.height).toBe(15);
    }
    // Half scale doubles the viewport in design units → a 5×5 field.
    expect(out).toHaveLength(25);
  });

  it("tags every instance with its piece index", () => {
    const second: PieceRect = { x: 60, y: 60, w: 20, h: 20 };
    const out = instances([piece, second], { x: 0, y: 0 }, viewport, cluster, 1);
    const indices = new Set(out.map((r) => r.index));
    expect(indices).toEqual(new Set([0, 1]));
  });
});
