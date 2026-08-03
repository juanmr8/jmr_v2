import { FIELD, COLOR, DIM, MASK } from "./preloader-presets";
import { Shape } from "./shapes";
import type { Cell } from "./preloader-layout";

/* ════════════════════════════════════════════════════════════
   PRELOADER CELL  ·  one shape, a plain grid item (static, no motion)
   ─────────────────────────────────────────────────────────
   The cell is just a cellSize box the CSS grid places. Non-lit cells
   are dimmed (not removed) so the whole grid stays legible. The two
   centre cells (heroes) get a "mask" — a frame that marks the clip
   window now and, later, clips them during the portal phase.

   data-* attributes let a future timeline target cells by ring / kind /
   hero without threading refs through React.
════════════════════════════════════════════════════════════ */

export function PreloaderCell({ cell }: { cell: Cell }) {
  const shape = <Shape kind={cell.kind} size={FIELD.cellSize} />;

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
        opacity: cell.lit ? 1 : DIM.opacity,
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
            // Static step: the frame only marks the mask window; it must NOT
            // clip the shape. The portal phase (later) switches this to
            // overflow:hidden so shapes can slide up behind it and vanish.
            overflow: "visible",
            border: MASK.border ? `${MASK.border}px solid ${COLOR.line}` : undefined,
          }}
        >
          {shape}
        </div>
      ) : (
        shape
      )}
    </div>
  );
}
