import { describe, expect, it } from "vitest";
import { CLUSTER, LAB_PIECES, getLabPiece, labPieceHref } from "./lab-data";

describe("labPieceHref", () => {
  it("routes a slug under /lab", () => {
    expect(labPieceHref("poster-01")).toBe("/lab/poster-01");
  });
});

describe("getLabPiece", () => {
  it("finds every seeded piece by its slug", () => {
    for (const piece of LAB_PIECES) {
      expect(getLabPiece(piece.slug)).toBe(piece);
    }
  });

  it("returns undefined for an unknown slug", () => {
    expect(getLabPiece("not-a-piece")).toBeUndefined();
  });
});

describe("LAB_PIECES", () => {
  it("slugs are unique — each detail route resolves one piece", () => {
    const slugs = LAB_PIECES.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every piece sits inside the Cluster bounds", () => {
    for (const { rect } of LAB_PIECES) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.w).toBeLessThanOrEqual(CLUSTER.w);
      expect(rect.y + rect.h).toBeLessThanOrEqual(CLUSTER.h);
    }
  });
});
