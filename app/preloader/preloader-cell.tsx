import { FIELD, COLOR, DIM, MASK } from "./preloader-presets";
import { Shape } from "./shapes";
import { heroExit, type Cell } from "./preloader-layout";

/* ════════════════════════════════════════════════════════════
   PRELOADER CELL  ·  one shape, a plain grid item (presentational)
   ─────────────────────────────────────────────────────────
   The cell is just a cellSize box the CSS grid places; the field's phase
   clock tells it what to show (`shown`, `portalT`) and it renders that
   instant — no state of its own. Non-lit cells are dimmed (not removed)
   so the whole grid structure stays legible.

   Heroes carry the mask — the clip window for the portal: once the
   portal starts it switches to overflow:hidden and the shape slides up
   into it, clipped away. Nothing replaces it here — the counterpart
   entity emerges separately at the rail (see the root's EMERGE layer).

   data-* attributes let a future timeline target cells by ring / kind /
   hero without threading refs through React.
════════════════════════════════════════════════════════════ */

export function PreloaderCell({
  cell,
  shown,
  portalT,
}: {
  cell: Cell;
  shown: boolean;
  /** Seconds into the portal phase (negative until it starts). */
  portalT: number;
}) {
  const shape = <Shape kind={cell.kind} size={FIELD.cellSize} />;

  // How far this hero's exit has run (0 before the portal reaches it),
  // and the vertical travel that takes the shape fully out of the mask.
  const exit = cell.hero ? heroExit(cell.hero, portalT) : 0;
  const travel = FIELD.cellSize + MASK.pad * 2;

  return (
    <div
      data-cell={cell.id}
      data-ring={cell.ring}
      data-kind={cell.kind}
      {...(cell.hero ? { "data-hero": cell.hero } : {})}
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        width: FIELD.cellSize,
        height: FIELD.cellSize,
        // Snaps between hidden and its resting opacity — no fade. The field
        // decides `shown` per phase (intro reveal, blink blanking).
        opacity: !shown ? 0 : cell.lit ? 1 : DIM.opacity,
      }}
    >
      {cell.hero ? (
        <div
          data-mask
          style={{
            position: "absolute",
            inset: -MASK.pad,
            boxSizing: "border-box",
            display: "grid",
            placeItems: "center",
            // Open until the portal starts, so the frame only marks the clip
            // window; then it clips the two shapes sliding through it.
            overflow: portalT >= 0 ? "hidden" : "visible",
            border: MASK.border ? `${MASK.border}px solid ${COLOR.line}` : undefined,
          }}
        >
          {/* The shape rides up and out of the window — and that's all. */}
          <div style={{ gridArea: "1 / 1", transform: `translateY(${-exit * travel}px)` }}>
            {shape}
          </div>
        </div>
      ) : (
        shape
      )}
    </div>
  );
}
