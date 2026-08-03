"use client";

import { useMemo } from "react";
import { buildField } from "./preloader-layout";
import { PreloaderCell } from "./preloader-cell";
import { FIELD } from "./preloader-presets";

/* ════════════════════════════════════════════════════════════
   PRELOADER FIELD  ·  the COLS×ROWS matrix, centered on screen
   ─────────────────────────────────────────────────────────
   A real CSS grid: an outer layer centers everything, the inner grid
   lays the cells out in `cols` columns with a uniform `gap`. Cells are
   plain grid items — no absolute positioning, no coordinate math. DOM
   order is row-major, so cells land exactly where buildField() lists them.
════════════════════════════════════════════════════════════ */

export function PreloaderField() {
  // Stable across renders (seeded) — the layout we art-direct against.
  const cells = useMemo(() => buildField(), []);

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
          <PreloaderCell key={cell.id} cell={cell} />
        ))}
      </div>
    </div>
  );
}
