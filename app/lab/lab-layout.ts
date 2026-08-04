/* ════════════════════════════════════════════════════════════
   LAB LAYOUT · Seam 1 — pure, framework-free.
   No WebGL, no DOM, no React. Turns a continuous 2-axis pan
   `offset` (design units) into the set of piece instances visible
   in the viewport. The infinite feel is this file: the Cluster
   repeats on an integer lattice, and every copy of a piece that
   intersects the viewport gets an instance — so panning past an
   edge is indistinguishable from panning anywhere else.
   Screen rects are DOM space (top-left origin, +y down, CSS px);
   the renderer converts to camera space, overlays use them as-is.
════════════════════════════════════════════════════════════ */

export interface ClusterSize {
  w: number; // Cluster width (design units)
  h: number; // Cluster height (design units)
}

export interface PieceRect {
  x: number; // left edge inside the Cluster (design units)
  y: number; // top edge inside the Cluster (design units)
  w: number;
  h: number;
}

export interface LabViewport {
  width: number; // CSS px
  height: number; // CSS px
}

/** One visible copy of a piece: which piece, and its on-screen box. */
export interface PieceInstance {
  index: number; // index into the pieces array
  left: number; // CSS px from the viewport's left edge
  top: number; // CSS px from the viewport's top edge
  width: number;
  height: number;
}

/** Wrap a coordinate into [0, span). Keeps the pan offset bounded so float
    precision never drifts, without ever changing what's on screen. */
export function wrapCoord(v: number, span: number): number {
  if (span <= 0) return 0;
  return ((v % span) + span) % span;
}

/** The design canvas the Cluster is drawn against (desktop Figma frame). */
export const WORLD_WIDTH = 1728;

/** Below this viewport width the scale stops shrinking: a phone reads as a
    smaller window onto the same world, not a world of confetti. */
const MIN_EFFECTIVE_WIDTH = 900;

/** Design-unit → screen-px factor: 1 at the 1728 desktop canvas, floored so
    pieces stay browsable on narrow viewports. */
export function clusterScale(viewportWidth: number): number {
  return Math.max(viewportWidth, MIN_EFFECTIVE_WIDTH) / WORLD_WIDTH;
}

/**
 * Every copy of every piece that intersects the viewport at this pan offset.
 * For each piece, the integer lattice steps (i, j) whose copy overlaps the
 * viewport are solved directly from the rect bounds — no iteration over
 * off-screen copies, no cap on how far the pan has travelled. Offsets need not
 * be pre-wrapped; any real value lands on the same instances.
 */
export function instances(
  pieces: readonly PieceRect[],
  offset: { x: number; y: number },
  viewport: LabViewport,
  cluster: ClusterSize,
  scale: number
): PieceInstance[] {
  const out: PieceInstance[] = [];
  const vw = viewport.width / scale; // viewport in design units
  const vh = viewport.height / scale;
  pieces.forEach((p, index) => {
    const iMin = Math.ceil((offset.x - p.x - p.w) / cluster.w);
    const iMax = Math.floor((offset.x + vw - p.x) / cluster.w);
    const jMin = Math.ceil((offset.y - p.y - p.h) / cluster.h);
    const jMax = Math.floor((offset.y + vh - p.y) / cluster.h);
    for (let i = iMin; i <= iMax; i++) {
      for (let j = jMin; j <= jMax; j++) {
        out.push({
          index,
          left: (p.x + i * cluster.w - offset.x) * scale,
          top: (p.y + j * cluster.h - offset.y) * scale,
          width: p.w * scale,
          height: p.h * scale,
        });
      }
    }
  });
  return out;
}
