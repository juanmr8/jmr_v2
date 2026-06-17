/* ════════════════════════════════════════════════════════════
   GALLERY MOTION · Seam 1 (cont.) — pure, framework-free.
   No WebGL, no DOM, no React. Turns a continuous scroll `offset`
   (in plane-steps) into per-Plane geometry, and decays velocity.
   The WebGL loop calls these every frame; React never does.
   ──────────────────────────────────────────────────────────
   Layout model — "uniform lattice + a right-anchored hero":
   Every Plane's RIGHT edge sits on one uniform lattice (inactive
   side + one gutter apart), so the gap between adjacent Planes is
   ALWAYS exactly one gutter — scale never eats it. The Plane in the
   Active Slot grows from INACTIVE_SCALE up to full height anchored
   at its bottom-RIGHT corner: it scales bottom → up and right →
   left, so its right edge (and the whole queue to its right) never
   moves. The only Planes it displaces are the ones to its LEFT,
   shoved further left by exactly its extra width — which is where
   the leaver is exiting anyway. Coordinates are CSS pixels (center
   origin, +y up), matching the renderer's camera.
════════════════════════════════════════════════════════════ */

/** Inactive Plane side as a fraction of the Active side (the inner height). */
export const INACTIVE_SCALE = 0.62;

export interface GalleryGeometry {
  width: number; // strip pixel width
  height: number; // strip pixel height (= the Active Plane side)
  gutter: number; // px between adjacent Plane edges at rest
}

export interface PlaneLayout {
  x: number; // center x (px)
  y: number; // center y (px)
  side: number; // square side (px) — drives mesh scale
}

/** A Plane's on-screen box in DOM space: top-left origin, +y down, CSS px
    relative to the strip's top-left corner. What a DOM overlay needs. */
export interface ScreenRect {
  left: number; // px from the strip's left edge
  top: number; // px from the strip's top edge
  size: number; // square side (px)
}

/**
 * Convert a Plane's layout (center origin, +y up — the renderer's camera space)
 * into a DOM rect (top-left origin, +y down). Pure arithmetic, no DOM: the
 * overlay layer reads these to place its transparent `<a>` over each Plane.
 */
export function screenRect(p: PlaneLayout, geom: GalleryGeometry): ScreenRect {
  return {
    left: geom.width / 2 + p.x - p.side / 2,
    top: geom.height / 2 - p.y - p.side / 2,
    size: p.side,
  };
}

/** Steps of slack kept off the left edge for the Plane leaving the Active Slot.
    The Active Plane is left-anchored, so one step is enough to carry the leaver
    fully off-screen-left before it recycles. Keeping this at 1 also pushes the
    right-hand recycle boundary as far off-screen as possible (to rank total-1),
    so the last Plane in the queue stays put instead of flickering at the edge. */
const LEFT_SLACK = 1;

/**
 * Place a looping index on the visible track: the Active Slot is rank 0, the
 * queue runs right, and one step of slack sits off the left for the leaver.
 * Wraps into [-LEFT_SLACK, total - LEFT_SLACK), so the recycle jump always
 * happens off-screen on both ends — no seam, no dead end, and (because the whole
 * off-screen budget goes rightward) no disappearing final Plane.
 */
export function loopRank(delta: number, total: number): number {
  if (total <= 0) return 0;
  const lo = -LEFT_SLACK;
  const m = (((delta - lo) % total) + total) % total;
  return lo + m;
}

/** 1 at the Active Slot, easing to 0 by one step away (smoothstep). The Plane's
    growth curve into / out of the Slot. */
function bump(rank: number): number {
  const a = Math.min(Math.abs(rank), 1);
  return 1 - a * a * (3 - 2 * a); // 1 - smoothstep(a)
}

/** Square side (px) for a Plane `rank` steps from the Active Slot (continuous). */
export function planeSide(rank: number, geom: GalleryGeometry): number {
  const inactive = geom.height * INACTIVE_SCALE;
  const extra = geom.height - inactive;
  return inactive + extra * bump(rank);
}

/** Width (px) a Plane gains over the inactive side at this rank — the amount it
    grows leftward, and the amount it shoves the Planes to its left. */
function planeExtra(rank: number, geom: GalleryGeometry): number {
  return (geom.height - geom.height * INACTIVE_SCALE) * bump(rank);
}

/**
 * Lay out every Plane for a continuous scroll `offset`. Right edges ride a
 * uniform lattice (inactive side + one gutter), so every gap is exactly one
 * gutter regardless of scale. The Plane in the Active Slot grows from its
 * bottom-right corner (bottom → up, right → left) — its right edge stays on the
 * lattice and the queue to its right never moves; only the Planes to its left
 * (where the leaver is exiting) are pushed further left by its extra width.
 * The Active Plane is flush to the strip's left edge at full height.
 */
export function layout(
  offset: number,
  total: number,
  geom: GalleryGeometry
): PlaneLayout[] {
  const halfH = geom.height / 2;
  const inactive = geom.height * INACTIVE_SCALE;
  const pitch = inactive + geom.gutter; // uniform lattice step
  const slotRightEdge = -geom.width / 2 + geom.height; // hero flush-left at full size

  const ranks = Array.from({ length: total }, (_, i) => loopRank(i - offset, total));

  return ranks.map((rank) => {
    const side = planeSide(rank, geom);
    // Pushed left by the extra width of every Plane growing to its right.
    let push = 0;
    for (let j = 0; j < total; j++) {
      if (ranks[j] > rank) push += planeExtra(ranks[j], geom);
    }
    const rightEdge = slotRightEdge + rank * pitch - push;
    return { x: rightEdge - side / 2, y: -halfH + side / 2, side };
  });
}

/**
 * Exponential momentum decay, normalised to a per-frame factor at 60fps so the
 * feel is frame-rate independent. `perFrame` ∈ (0,1): lower = more friction.
 */
export function decayVelocity(v: number, dt: number, perFrame: number): number {
  return v * Math.pow(perFrame, dt * 60);
}
