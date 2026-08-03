import { FIELD } from "./preloader-presets";
import type { ShapeKind } from "./shapes";

/* ════════════════════════════════════════════════════════════
   PRELOADER LAYOUT  ·  pure data, no React, no coordinates
   ─────────────────────────────────────────────────────────
   Turns the FIELD presets into a stable list of cells + a stable
   circle/triangle assignment. Kept framework-free so it's trivial
   to reason about (and unit-test): same seed → same field, every render.

   No positions here: the field is a real CSS grid, so cells fall into
   place by DOM order (row-major). This file only decides WHAT each cell
   is (kind / lit / hero) and its ring — the grid handles WHERE.
════════════════════════════════════════════════════════════ */

/** Deterministic PRNG (mulberry32) — stable field between renders. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Cell = {
  id: string;
  row: number;
  col: number;
  kind: ShapeKind;
  /** Whether this cell starts lit on the first pulse beat. */
  lit: boolean;
  /** Chebyshev distance from center, bucketed — drives outer→inner collapse. */
  ring: number;
  /** Set on the two centre cells that survive the collapse and fly to the
      corner. `"circle"` = left survivor, `"triangle"` = right survivor. */
  hero: ShapeKind | null;
};

/** Build the full COLS×ROWS field of cells, with the centre pair tagged
    as heroes. Requires even `cols` + odd `rows` so the pair is centred
    (see FIELD preset note). */
export function buildField(): Cell[] {
  const { cols, rows, litRatio, seed } = FIELD;
  const rng = mulberry32(seed);

  const colMid = (cols - 1) / 2;
  const rowMid = (rows - 1) / 2;

  // Centre pair: the two middle columns of the centre row.
  const heroRow = Math.floor(rows / 2);
  const heroColLeft = cols / 2 - 1;
  const heroColRight = cols / 2;

  const cells: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const isHeroLeft = row === heroRow && col === heroColLeft;
      const isHeroRight = row === heroRow && col === heroColRight;
      const hero: ShapeKind | null = isHeroLeft ? "circle" : isHeroRight ? "triangle" : null;

      cells.push({
        id: `${row}-${col}`,
        row,
        col,
        // Heroes have a fixed identity; the rest are seeded-random.
        kind: hero ?? (rng() < 0.5 ? "circle" : "triangle"),
        lit: hero != null || rng() < litRatio,
        ring: Math.round(Math.max(Math.abs(col - colMid), Math.abs(row - rowMid))),
        hero,
      });
    }
  }
  return cells;
}

/** The highest ring index present — the outermost shell (collapse starts here). */
export function maxRing(cells: Cell[]): number {
  return cells.reduce((m, c) => Math.max(m, c.ring), 0);
}
