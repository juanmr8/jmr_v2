/* ════════════════════════════════════════════════════════════
   PRELOADER PRESETS  ·  the art-direction knob panel
   ─────────────────────────────────────────────────────────
   Every value you'd want to tweak to re-time or re-shape the
   Preloader lives HERE — nothing animation-critical is buried in
   the components or the timeline. Change a number, reload, judge.
   (See docs/RECORD.md — "expose at the top the things you'd change
   on a finished UI, so you can tweak without touching the code".)

   Durations are in SECONDS (GSAP's native unit). Eases are GSAP
   ease strings. Sizes are CSS px unless noted.
════════════════════════════════════════════════════════════ */

/** The pulsing field. A COLS×ROWS matrix of cells, centered on the
    viewport, each randomly a circle or a triangle (see FIELD.seed).

    The Hero Pair is NOT a separate element — it is the two centre cells
    of THIS grid (one forced circle on the left, one forced triangle on
    the right), so the survivors line up perfectly with the field they
    emerge from. For that centre pair to sit dead-centre, keep `cols`
    EVEN (the pair straddles the vertical centre) and `rows` ODD (one
    true centre row). */
export const FIELD = {
  cols: 6,
  rows: 5,

  /** One shape's box, in px. The drawn shape fills this. */
  cellSize: 26,
  /** Gap between adjacent cells, in px. 0 = shapes touch (screenshot 1).
      Keep this ≥ MASK.pad so the hero masks don't bleed into neighbors. */
  gap: 6,

  /** Fraction of NON-hero cells lit at any pulse beat (0–1). The rest are
      dark, so the visible per-row count varies (the "irregular" look). */
  litRatio: 0.7,

  /** Deterministic seed so the random circle/triangle layout is stable
      between renders (and matches what we art-direct against). */
  seed: 20260620,
} as const;

/** Non-lit cells aren't hidden — they're dimmed to this opacity, so the
    full grid structure stays legible while we judge placement. (The pulse
    phase, later, will animate this on/off. For now it's static.) */
export const DIM = {
  opacity: 0.16,
} as const;

/** The clip-window that frames each surviving centre shape — the "mask".
    Static for now (just a visible frame so we can see it); later the portal
    phase slides shapes up behind it and `overflow: hidden` clips them. */
export const MASK = {
  /** px the mask extends beyond the cell on every side. */
  pad: 5,
  /** px frame thickness. Set 0 to hide the frame entirely. */
  border: 1,
} as const;

/** Colors — pulled from the same tokens as the live site so the handoff
    is seamless. Kept here as the single reference for the Preloader. */
export const COLOR = {
  bg: "var(--color-bg)",
  shape: "var(--color-ink)",
  line: "var(--color-line)",
} as const;
