import { existsSync } from "node:fs";
import { join } from "node:path";
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

  it("no two pieces overlap, even across the wrap seam", () => {
    // The Cluster tiles on an integer lattice, so a piece near one edge can
    // collide with a neighbouring repeat of a piece near the opposite edge.
    // Checking each pair against the 3×3 neighbourhood of repeats covers that.
    for (let a = 0; a < LAB_PIECES.length; a++) {
      for (let b = a; b < LAB_PIECES.length; b++) {
        const ra = LAB_PIECES[a].rect;
        const rb = LAB_PIECES[b].rect;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (a === b && i === 0 && j === 0) continue;
            const bx = rb.x + i * CLUSTER.w;
            const by = rb.y + j * CLUSTER.h;
            const overlaps =
              ra.x < bx + rb.w &&
              bx < ra.x + ra.w &&
              ra.y < by + rb.h &&
              by < ra.y + ra.h;
            expect(
              overlaps,
              `${LAB_PIECES[a].slug} overlaps ${LAB_PIECES[b].slug} at repeat (${i},${j})`
            ).toBe(false);
          }
        }
      }
    }
  });

  it("every piece's image exists under public/", () => {
    for (const piece of LAB_PIECES) {
      const file = join(__dirname, "../../public", piece.image);
      expect(existsSync(file), `${piece.slug} → ${piece.image}`).toBe(true);
    }
  });
});
