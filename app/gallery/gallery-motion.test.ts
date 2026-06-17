import { describe, expect, it } from "vitest";
import {
  INACTIVE_SCALE,
  decayVelocity,
  layout,
  loopRank,
  planeSide,
  screenRect,
  type GalleryGeometry,
} from "./gallery-motion";

const GEOM: GalleryGeometry = { width: 1000, height: 300, gutter: 16 };
const TOTAL = 6;

/** Plane edges, for gap/visibility assertions. */
const leftEdge = (p: { x: number; side: number }) => p.x - p.side / 2;
const rightEdge = (p: { x: number; side: number }) => p.x + p.side / 2;

describe("loopRank", () => {
  it("puts the Active Slot at rank 0 with the queue to its right", () => {
    expect(loopRank(0, 6)).toBe(0);
    expect(loopRank(2, 6)).toBe(2);
    expect(loopRank(3, 6)).toBe(3);
  });

  it("keeps one step of slack off the left for the leaver, recycling the rest right", () => {
    expect(loopRank(-1, 6)).toBe(-1); // the leaving Plane sits at -1
    expect(loopRank(5, 6)).toBe(-1); // a far Plane recycles to that left exit
    expect(loopRank(4, 6)).toBe(4); // the queue reaches rank total-1, off the right
  });

  it("wraps a whole revolution back to the start", () => {
    expect(loopRank(6, 6)).toBe(0);
  });

  it("is safe for an empty list", () => {
    expect(loopRank(3, 0)).toBe(0);
  });
});

describe("planeSide", () => {
  it("is the full height at the Active Slot", () => {
    expect(planeSide(0, GEOM)).toBeCloseTo(GEOM.height);
  });

  it("is the inactive side one step away and beyond", () => {
    const inactive = GEOM.height * INACTIVE_SCALE;
    expect(planeSide(1, GEOM)).toBeCloseTo(inactive);
    expect(planeSide(2.5, GEOM)).toBeCloseTo(inactive);
  });

  it("scales smoothly between the two within one step (half-grown midway)", () => {
    const inactive = GEOM.height * INACTIVE_SCALE;
    const mid = planeSide(0.5, GEOM);
    expect(mid).toBeGreaterThan(inactive);
    expect(mid).toBeLessThan(GEOM.height);
  });
});

describe("layout at rest", () => {
  const planes = layout(0, TOTAL, GEOM);

  it("puts exactly one Plane at full height (fills the Active Slot)", () => {
    const heroes = planes.filter((p) => Math.abs(p.side - GEOM.height) < 0.5);
    expect(heroes).toHaveLength(1);
  });

  it("anchors the Active Plane flush to the strip's left edge at full height", () => {
    expect(leftEdge(planes[0])).toBeCloseTo(-GEOM.width / 2);
  });
});

describe("layout keeps exactly one gutter between every Plane at any scale", () => {
  // The core of the right→left growth fix: scale must never eat the gap.
  for (const offset of [0, 0.25, 0.5, 0.75, 1, 2.5, -0.3]) {
    it(`holds at offset ${offset}`, () => {
      const planes = layout(offset, TOTAL, GEOM);
      const ranks = planes.map((_, i) => loopRank(i - offset, TOTAL));
      const order = [...planes.keys()].sort((a, b) => ranks[a] - ranks[b]);
      for (let k = 1; k < order.length; k++) {
        const gap = leftEdge(planes[order[k]]) - rightEdge(planes[order[k - 1]]);
        expect(gap).toBeCloseTo(GEOM.gutter);
      }
    });
  }
});

describe("layout grows the Active Plane bottom → up and right → left", () => {
  it("keeps every Plane's bottom on the baseline (grows upward) at any offset", () => {
    for (const offset of [0, 0.4, 1.7]) {
      for (const p of layout(offset, TOTAL, GEOM)) {
        expect(p.y - p.side / 2).toBeCloseTo(-GEOM.height / 2);
      }
    }
  });

  it("anchors growth to the right edge — Planes only ever extend leftward", () => {
    // Any Plane with nothing growing to its right keeps its right edge on the
    // pure lattice no matter how large it scales: growth is right → left only.
    const inactive = GEOM.height * INACTIVE_SCALE;
    const pitch = inactive + GEOM.gutter;
    const slotRightEdge = -GEOM.width / 2 + GEOM.height;
    for (const offset of [0, 0.5, 1.25]) {
      const planes = layout(offset, TOTAL, GEOM);
      const ranks = planes.map((_, i) => loopRank(i - offset, TOTAL));
      planes.forEach((p, i) => {
        const grownToRight = ranks.some(
          (r, j) => r > ranks[i] && planeSide(ranks[j], GEOM) > inactive + 0.5
        );
        if (grownToRight) return;
        expect(rightEdge(p)).toBeCloseTo(slotRightEdge + ranks[i] * pitch);
      });
    }
  });
});

describe("layout never rests half-scaled", () => {
  it("has no Plane stuck mid-scale at an integer offset", () => {
    const inactive = GEOM.height * INACTIVE_SCALE;
    for (const offset of [0, 1, 2, 3, -1, 7]) {
      for (const p of layout(offset, TOTAL, GEOM)) {
        const isHero = Math.abs(p.side - GEOM.height) < 0.5;
        const isInactive = Math.abs(p.side - inactive) < 0.5;
        expect(isHero || isInactive).toBe(true);
      }
    }
  });
});

describe("layout is seamless across the loop", () => {
  const onScreen = (p: { x: number; side: number }) =>
    rightEdge(p) > -GEOM.width / 2 && leftEdge(p) < GEOM.width / 2;

  it("moves every on-screen Plane continuously past an integer boundary", () => {
    const before = layout(1 - 1e-3, TOTAL, GEOM);
    const after = layout(1 + 1e-3, TOTAL, GEOM);
    for (let i = 0; i < TOTAL; i++) {
      if (!onScreen(before[i])) continue; // skip the recycler (jumps off-screen)
      expect(Math.abs(after[i].x - before[i].x)).toBeLessThan(2);
      expect(Math.abs(after[i].side - before[i].side)).toBeLessThan(2);
    }
  });

  it("advancing offset by one reproduces the layout shifted by one Plane", () => {
    const a = layout(0, TOTAL, GEOM);
    const b = layout(1, TOTAL, GEOM);
    expect(b[1].x).toBeCloseTo(a[0].x);
    expect(b[1].side).toBeCloseTo(a[0].side);
  });
});

describe("screenRect", () => {
  it("maps a centered Plane to the strip's middle, flipping +y up → +y down", () => {
    const r = screenRect({ x: 0, y: 0, side: 100 }, GEOM);
    expect(r.left).toBeCloseTo(GEOM.width / 2 - 50);
    expect(r.top).toBeCloseTo(GEOM.height / 2 - 50);
    expect(r.size).toBe(100);
  });

  it("puts the Active Plane (flush bottom-left, full height) at the strip's bottom-left", () => {
    const [hero] = layout(0, TOTAL, GEOM); // rank 0, full height, left-anchored
    const r = screenRect(hero, GEOM);
    expect(r.left).toBeCloseTo(0); // flush to the strip's left edge
    expect(r.top + r.size).toBeCloseTo(GEOM.height); // bottom sits on the baseline
    expect(r.size).toBeCloseTo(GEOM.height);
  });

  it("flips the y axis — a Plane higher up (larger +y) gets a smaller top", () => {
    const low = screenRect({ x: 0, y: -50, side: 40 }, GEOM);
    const high = screenRect({ x: 0, y: 50, side: 40 }, GEOM);
    expect(high.top).toBeLessThan(low.top);
  });
});

describe("decayVelocity", () => {
  it("shrinks velocity toward zero", () => {
    expect(Math.abs(decayVelocity(5, 1 / 60, 0.9))).toBeLessThan(5);
  });

  it("decays more over a longer frame (frame-rate independent)", () => {
    const short = decayVelocity(5, 1 / 120, 0.9);
    const long = decayVelocity(5, 1 / 30, 0.9);
    expect(long).toBeLessThan(short);
  });

  it("preserves direction", () => {
    expect(decayVelocity(-3, 1 / 60, 0.9)).toBeLessThan(0);
  });
});
