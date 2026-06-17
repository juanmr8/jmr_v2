/* ════════════════════════════════════════════════════════════
   HOME DATA  ·  content + carousel geometry, kept out of the JSX
   ─────────────────────────────────────────────────────────
   Vertical positions (top) are canvas-pixels from the Figma frame.
   Horizontal placement is handled by the grid helpers in the JSX.
════════════════════════════════════════════════════════════ */

export const STATEMENT =
  "Juan Mora Romero is the creative practice of a multidisciplinary designer and developer who can't help but color outside the lines.";

/** Left-rail project meta. `top` = canvas-px of the label baseline row. */
export const META = [
  { label: "Services:", value: "Design, Development", top: 530 },
  { label: "Client:", value: "Villiers", top: 614 },
  { label: "Role:", value: "Designer, Developer", top: 667 },
] as const;

/** Links pinned to the right edge of the rail (col-3 edge). */
export const RAIL_LINKS = [
  { label: "Instagram", top: 544 },
  { label: "Medium", top: 564 },
  { label: "View Detail", top: 614 },
] as const;
