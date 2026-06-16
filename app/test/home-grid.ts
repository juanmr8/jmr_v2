/* ════════════════════════════════════════════════════════════
   GRID HELPERS  ·  everything positions against the 12-col grid
   ─────────────────────────────────────────────────────────
   The grid vars (--marge-x, --col, --gutter) live in globals.css
   and already match the Figma frame: 12 col · 24 margin · 16 gutter.

   colX(n)  → left edge of column n (1-indexed)
   colW(s)  → width of an s-column span (gutters included)
   px(n)    → n design-pixels as a fluid value (vertical / sizing)
════════════════════════════════════════════════════════════ */

const M = "var(--marge-x)";
const C = "var(--col)";
const G = "var(--gutter)";

/** Left edge of column `n` (1-indexed): marge-x + (n-1)·(col+gutter). */
export const colX = (n: number) => `calc(${M} + ${n - 1} * (${C} + ${G}))`;

/** Width of an `s`-column span: s·col + (s-1)·gutter. */
export const colW = (s: number) => `calc(${s} * ${C} + ${s - 1} * ${G})`;

/** `n` canvas-pixels as a width-fluid value — for vertical offsets & sizes. */
export const px = (n: number) => `calc(var(--vw) * ${n})`;
