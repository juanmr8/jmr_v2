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
      Below MASK.pad the hero masks overlap neighbor cells — harmless
      while the frame is hidden (MASK.border 0) since by the time the
      masks clip anything, only the heroes are left on screen. */
  gap: 2,

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
  border: 0,
} as const;

/** The in animation. Cells appear with a 0-duration snap (no tween),
    blooming outward from the centre: the Hero Pair lands first (exactly
    at 0), then each cell by its straight-line distance from the centre —
    Euclidean, so the bloom reads round, not square — plus a seeded
    per-cell offset that keeps the growing edge ragged and organic. */
export const INTRO = {
  /** Seconds of empty background before the first landing — so the Hero
      Pair visibly pops IN rather than already being there on frame one. */
  hold: 0.2,
  /** Seconds per cell-distance of outward travel — the bloom's pace.
      Full bloom ≈ hold + step × (max distance ≈ 2.7 for 6×5 + jitter/2). */
  step: 0.1,
  /** Organic-ness, in cell-distances: each cell lands up to ±jitter/2
      early/late. 0 = perfect concentric bloom; ~1.5 = clearly ragged
      edge; ≥3 = order reads as almost random, origin only barely felt. */
  jitter: 1.5,
} as const;

/** The blink phase — runs once the in animation has settled. The outer
    cells (the ones closest to the edge) blink between opacity 0 and
    their resting look, in beats: every state change lands exactly on a
    beat (0-duration snap, no tween).

    The blanks ride waves that circle the structure: `crests` evenly
    spaced crest(s) rotate around the field, so at any moment a
    different SIDE is flickering. Blink likelihood also grows ring by
    ring toward the edge — the calm core (rings ≤ calmRings, heroes
    included) never blinks. Per-cell seeded noise keeps each pass
    ragged rather than mechanical.

    On top of the flicker, `holes`: a seeded share of cells drops out
    early in the phase and STAYS out, so the field thins as it goes and
    the grid's rectangle silhouette stops being obvious. */
export const BLINK = {
  /** Seconds the phase runs, measured from the last intro landing. */
  duration: 0.7,

  /** Seconds between beats. Every state change lands exactly on a beat. */
  beat: 0.06,

  /** Rings (Chebyshev, from centre) that never blink. The heroes are the
      innermost cells, so the centre pair always stays on screen. */
  calmRings: 1,

  /** Wave crests circling at once, evenly spaced: 1 = a single wave
      orbiting the structure; 2 = opposite sides flicker together. */
  crests: 2,

  /** Revolutions per second of the crest set around the structure. */
  spin: 1.2,

  /** Angular half-width of a crest, in degrees — how much of a side one
      wave covers. */
  width: 55,

  /** 0–1: blank probability at a crest centre on the outermost ring.
      Falls off toward the core and away from the crest. */
  strength: 0.85,

  /** 0–1: how much of the field decays away for good during the phase.
      An outermost-ring cell drops out with this probability (inner rings
      proportionally less), at a seeded moment in the phase's first
      `holesBy` — and never comes back. 0 = the rectangle stays intact
      until the dissolve. */
  holes: 0.5,
  /** 0–1: holes open within this first fraction of the phase, so the
      thinned-out field is what you see for most of the blink. */
  holesBy: 0.5,

  /** Seed for the per-beat noise — change to re-roll the whole flicker
      pattern while keeping it deterministic (and scrubbable). */
  seed: 977,
} as const;

/** The out animation — the exit. After the blink, every cell except the
    Hero Pair snaps to 0 (0-duration, like everything else), collapsing
    inward: the farthest cells dissolve first, the core last, each ±
    seeded jitter so the collapse reads organic, not concentric. Ends
    with just the two centre shapes on screen. */
export const OUT = {
  /** Seconds per cell-distance of inward collapse — the exit's pace. */
  step: 0.12,
  /** Organic-ness of the collapse edge, in cell-distances (same scale
      as INTRO.jitter). */
  jitter: 1.5,
} as const;

/** The portal — the centre pair's exit. Once the dissolve leaves only
    the Hero Pair, each hero slides UP into its mask and is clipped
    away — nothing replaces it in the centre; its counterpart appears as
    a separate entity at the rail (see EMERGE). The first tweened motion
    in the Preloader — everything before it is 0-duration snaps.
    Asynchronous: the circle leads, the triangle follows. */
export const PORTAL = {
  /** Seconds of stillness after the dissolve before the exit begins. */
  hold: 0.25,
  /** Seconds the triangle's exit starts after the circle's — wide
      enough that the one-then-the-other clearly reads. */
  stagger: 0.22,
  /** Seconds one hero's exit takes (pronounced expo ease-out). */
  duration: 0.75,
} as const;

/** The emergence — the answering composition. The final artwork rises
    bottom-up out of a mask sitting in the EXACT spot the homepage's
    bottom-left rail renders /primitives.svg (measured from the live DOM
    beneath the overlay) — so when the Preloader is destroyed at the end
    of the timeline, the real page continues the frame pixel-for-pixel.

    Not one image: TWO separate entities — the artwork's circle and
    triangle split into independent layers — rising one-then-the-other,
    mirroring the exits' stagger and sharp ease. */
export const EMERGE = {
  /** Seconds after the portal's start that the first rise begins —
      0 = each rise starts the instant its counterpart's exit does;
      negative would start the rises first. */
  delay: 0,
  /** Seconds the triangle's rise starts after the circle's. */
  stagger: 0.22,
  /** Seconds one entity's rise takes (pronounced expo ease-out). */
  duration: 1.1,
} as const;

/** The frame lines — the homepage's three hairline rules, drawn in ON
    the stage during the run so the frame is already standing when the
    stage is destroyed. The top rule (under the menu) sweeps left→right
    across the whole main run; the vertical column rule and the mid
    divider travel in from the extreme left / extreme bottom edges. ALL
    THREE land exactly as the finale begins (the heroes' slide-up) — that
    arrival is computed by the root, not a knob here. Resting geometry is
    measured from the live homepage beneath the overlay (same trick as
    the emergence window), so the cut stays pixel-perfect. */
export const LINES = {
  /** Seconds into the timeline the top rule sets out — matched to
      INTRO.hold so it departs the instant the Hero Pair pops in. */
  sweepDelay: 0.2,
  /** Seconds the vertical/mid rules spend travelling. They land at the
      finale, so this also sets how long before it they depart. */
  travel: 0.9,
} as const;

/** Dev-only: the transport bar for art-directing the Preloader —
    play/pause, restart, timeline scrubber, playback speed. Flip off
    (or delete) once the Preloader ships with its real lifecycle. */
export const PLAYER = {
  enabled: true,
  /** Playback-rate choices offered by the bar. */
  speeds: [0.25, 0.5, 1] as readonly number[],
} as const;

/** Colors — pulled from the same tokens as the live site so the handoff
    is seamless. Kept here as the single reference for the Preloader. */
export const COLOR = {
  bg: "var(--color-bg)",
  shape: "var(--color-ink)",
  line: "var(--color-line)",
} as const;
