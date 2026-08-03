"use client";

import { cellShown, type Cell } from "./preloader-layout";
import { PreloaderCell } from "./preloader-cell";
import { FIELD } from "./preloader-presets";

/* ════════════════════════════════════════════════════════════
   PRELOADER FIELD  ·  the COLS×ROWS matrix, centered on screen
   ─────────────────────────────────────────────────────────
   A real CSS grid: an outer layer centers everything, the inner grid
   lays the cells out in `cols` columns with a uniform `gap`. Cells are
   plain grid items — no absolute positioning, no coordinate math. DOM
   order is row-major, so cells land exactly where buildField() lists them.

   Purely time-driven: the Preloader root owns the clock and passes
   `elapsed` down; this just renders the frame for that instant. All
   phase logic (intro bloom, blink waves, decay holes, final inward
   dissolve) lives in cellShown() — one pure call per cell per frame.
════════════════════════════════════════════════════════════ */

export function PreloaderField({
  cells,
  elapsed,
  introEnd,
  portalStart,
}: {
  cells: Cell[];
  elapsed: number;
  /** Timeline instant the in animation settles — the blink phase's t=0. */
  introEnd: number;
  /** Timeline instant the heroes' exit begins — the portal's t=0. */
  portalStart: number;
}) {
  return (
    <div
      data-preloader-field
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${FIELD.cols}, ${FIELD.cellSize}px)`,
          gridAutoRows: `${FIELD.cellSize}px`,
          gap: `${FIELD.gap}px`,
        }}
      >
        {cells.map((cell) => (
          <PreloaderCell
            key={cell.id}
            cell={cell}
            shown={cellShown(cell, elapsed, introEnd)}
            portalT={elapsed - portalStart}
          />
        ))}
      </div>
    </div>
  );
}
