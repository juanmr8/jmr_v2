import type { CSSProperties } from "react";
import { COLOR } from "./preloader-presets";

/* ════════════════════════════════════════════════════════════
   SHAPES  ·  the two primitives, drawn to match /primitives.svg
   ─────────────────────────────────────────────────────────
   Circle = a disc that fills its box. Triangle = an upward triangle
   that fills its box (apex top-center, base along the bottom) — the
   same silhouette as the bottom-left rail's primitives, so the Hero
   Pair can come to rest exactly on top of them.

   Rendered as inline SVG (not CSS borders) so GSAP can transform a
   real DOM node and so the fill tracks --color-ink like the live site.
════════════════════════════════════════════════════════════ */

export type ShapeKind = "circle" | "triangle";

type ShapeProps = {
  kind: ShapeKind;
  /** Box edge length in px. */
  size: number;
  style?: CSSProperties;
  className?: string;
};

export function Shape({ kind, size, style, className }: ShapeProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 100 100",
    fill: COLOR.shape,
    style: { display: "block", ...style },
    className,
    "aria-hidden": true,
  } as const;

  if (kind === "circle") {
    return (
      <svg {...common}>
        <circle cx="50" cy="50" r="50" />
      </svg>
    );
  }

  // Upward triangle filling the box: apex top-center, base along bottom.
  return (
    <svg {...common}>
      <polygon points="50,0 100,100 0,100" />
    </svg>
  );
}
