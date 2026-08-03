import { BLINK, EMERGE, FIELD, INTRO, LINES, OUT, PORTAL } from "./preloader-presets";
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

/** Seeded per-cell (and optionally per-beat) hash → [0, 1). Same inputs,
    same value, every render — the phases stay deterministic just like
    the field layout, which is also what makes them scrubbable. */
function hash01(seed: number, row: number, col: number, beat = 0): number {
  let h = (2166136261 ^ seed) >>> 0;
  h = Math.imul(h ^ row, 16777619);
  h = Math.imul(h ^ col, 16777619);
  h = Math.imul(h ^ beat, 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Euclidean distance from the field's centre, in cell units. */
function centreDist(cell: Cell): number {
  const dx = cell.col - (FIELD.cols - 1) / 2;
  const dy = cell.row - (FIELD.rows - 1) / 2;
  return Math.hypot(dx, dy);
}

/** The farthest any cell sits from the centre — a field corner. */
const CORNER_DIST = Math.hypot((FIELD.cols - 1) / 2, (FIELD.rows - 1) / 2);

/** When (seconds from phase start) this cell lands during the in
    animation: INTRO.hold of empty background, then its Euclidean
    distance from the centre ± seeded noise, so the reveal blooms
    organically outward from the Hero Pair. Heroes are the origin — they
    pop in first, exactly at the hold, jitter-free. */
export function revealAt(cell: Cell): number {
  if (cell.hero) return INTRO.hold;
  // −0.5: the hero slots sit half a cell off the true centre; shift so
  // distance 0 is "at the heroes", and the bloom starts right beside them.
  const dist = centreDist(cell) - 0.5;
  const noise = (hash01(FIELD.seed, cell.row, cell.col) - 0.5) * INTRO.jitter;
  return INTRO.hold + Math.max(0, (dist + noise) * INTRO.step);
}

/** Whether this cell is showing (vs blanked to opacity 0) at `t` seconds
    into the blink phase; t < 0 (not started) and t ≥ duration (settled)
    are always-showing. Beat-quantized — state only changes on BLINK.beat
    boundaries — and pure in t, so the player can scrub it.

    Blank chance = strength × rim × wave: `rim` rises ring by ring toward
    the field's edge (0 at the calm core), `wave` is a Gaussian around
    the nearest of the evenly-spaced crests rotating about the centre.
    Seeded per-beat noise decides each cell against that chance. */
export function blinkVisible(cell: Cell, t: number): boolean {
  if (t < 0 || t >= BLINK.duration) return true;
  if (cell.hero || cell.ring <= BLINK.calmRings) return true;

  const beat = Math.floor(t / BLINK.beat);

  const outermost = Math.round(Math.max((FIELD.cols - 1) / 2, (FIELD.rows - 1) / 2));
  const rim = (cell.ring - BLINK.calmRings) / (outermost - BLINK.calmRings);

  // Angle of this cell around the centre vs the crests' (beat-quantized)
  // rotation, folded into the nearest crest's sector.
  const angle = Math.atan2(cell.row - (FIELD.rows - 1) / 2, cell.col - (FIELD.cols - 1) / 2);
  const crest = beat * BLINK.beat * BLINK.spin * 2 * Math.PI;
  const sector = (2 * Math.PI) / BLINK.crests;
  let d = (((angle - crest) % sector) + sector) % sector;
  if (d > sector / 2) d = sector - d;

  const widthRad = (BLINK.width * Math.PI) / 180;
  const wave = Math.exp(-(d * d) / (2 * widthRad * widthRad));

  return hash01(BLINK.seed, cell.row, cell.col, beat) >= BLINK.strength * rim * wave;
}

/** When (seconds into the blink phase) this cell decays for good — a
    hole that never closes — or Infinity if it survives to the dissolve.
    Rim-weighted (BLINK.holes × rim), opening within the phase's first
    BLINK.holesBy, so the rectangle silhouette breaks up early. */
export function holeAt(cell: Cell): number {
  if (cell.hero || cell.ring <= BLINK.calmRings) return Infinity;
  const outermost = Math.round(Math.max((FIELD.cols - 1) / 2, (FIELD.rows - 1) / 2));
  const rim = (cell.ring - BLINK.calmRings) / (outermost - BLINK.calmRings);
  if (hash01(BLINK.seed + 1, cell.row, cell.col) >= BLINK.holes * rim) return Infinity;
  return hash01(BLINK.seed + 2, cell.row, cell.col) * BLINK.duration * BLINK.holesBy;
}

/** When (seconds into the out phase) this cell dissolves to 0: the
    inward collapse — corners first, core last, ± seeded jitter. Heroes
    never dissolve; they're what the Preloader leaves on screen. */
export function outAt(cell: Cell): number {
  if (cell.hero) return Infinity;
  const noise = (hash01(FIELD.seed + 1, cell.row, cell.col) - 0.5) * OUT.jitter;
  return Math.max(0, (CORNER_DIST - centreDist(cell) + noise) * OUT.step);
}

/** Seconds the out phase needs until its last cell has dissolved. */
export function outSpan(cells: Cell[]): number {
  return Math.max(...cells.map(outAt).filter(Number.isFinite));
}

/** Pronounced exponential ease-out — the shape launches at full speed
    the instant it starts, then spends most of the duration decelerating
    into a soft landing. The finale's shared ease (exits + rises).
    Lower the 10 (e.g. 6) for a less extreme launch/settle contrast. */
function sharpOut(p: number): number {
  const c = Math.min(1, Math.max(0, p));
  return c === 1 ? 1 : 1 - 2 ** (-10 * c);
}

/** Eased 0→1 progress of a hero's exit at `t` seconds into the portal
    phase: 0 = resting in place, 1 = fully clipped away by its mask.
    Asynchronous — the circle leads, the triangle starts PORTAL.stagger
    later. Pure in t, so the exit scrubs like every other phase. */
export function heroExit(hero: ShapeKind, t: number): number {
  return sharpOut((t - (hero === "triangle" ? PORTAL.stagger : 0)) / PORTAL.duration);
}

/** Eased 0→1 progress of one rail entity's rise out of the emergence
    mask at `t` seconds into that phase — same one-then-the-other stagger
    and ease as the exits, so the two motions answer each other. */
export function emergeProgress(shape: ShapeKind, t: number): number {
  return sharpOut((t - (shape === "triangle" ? EMERGE.stagger : 0)) / EMERGE.duration);
}

/** Eased 0→1 progress of the top rule's left→right sweep at `elapsed`:
    departs at LINES.sweepDelay, completes exactly at `end` (the finale's
    start, computed by the root). Same sharp launch-and-settle ease as the
    shapes and the travellers — one motion language throughout. Pure in
    elapsed, so it scrubs like the rest. */
export function sweepProgress(elapsed: number, end: number): number {
  return sharpOut((elapsed - LINES.sweepDelay) / (end - LINES.sweepDelay));
}

/** Eased 0→1 progress of a travelling rule (the vertical column rule /
    the mid divider) at `elapsed`: departs exactly at `end` (the finale's
    start) and rides alongside the shapes' slide-up and rise, with the
    same sharp launch-and-settle ease. */
export function lineTravel(elapsed: number, end: number): number {
  return sharpOut((elapsed - end) / LINES.travel);
}

/** The one visibility answer: is this cell showing at `elapsed` seconds
    into the Preloader timeline? Composes the phases — intro reveal,
    blink flicker, decay holes, and the final inward dissolve — all pure
    in `elapsed`, so the whole timeline scrubs. (The heroes' portal exit
    is a transform inside the mask, not a visibility change — it lives
    in the cell.) */
export function cellShown(cell: Cell, elapsed: number, introEnd: number): boolean {
  const tBlink = elapsed - introEnd;
  const tOut = tBlink - BLINK.duration;
  return (
    elapsed >= revealAt(cell) &&
    blinkVisible(cell, tBlink) &&
    tBlink < holeAt(cell) &&
    tOut < outAt(cell)
  );
}
