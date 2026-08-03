"use client";

import { PreloaderField } from "./preloader-field";
import { COLOR } from "./preloader-presets";

/* ════════════════════════════════════════════════════════════
   PRELOADER  ·  static scaffold (step 1 — placement only)
   ─────────────────────────────────────────────────────────
   No animation, no lifecycle, no handoff yet. The layer just sits on
   top of the page (always active) so we can dial in the initial grid:
   the COLS×ROWS field, the lit/dim pattern, and the centre masks.

   Motion (pulse → collapse → portal → grid-draw) gets wired back in
   one phase at a time once the static frame looks right.
════════════════════════════════════════════════════════════ */

export function Preloader() {
  return (
    <div
      data-preloader
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: COLOR.bg,
        overflow: "hidden",
      }}
    >
      <PreloaderField />
    </div>
  );
}
