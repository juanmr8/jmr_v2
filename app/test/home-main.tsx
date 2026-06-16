import { px, colW } from "./home-grid";
import { STATEMENT } from "./home-data";
import { projects } from "@/app/projects/data";
import { GalleryCanvas } from "./gallery/gallery-canvas";
import { GalleryCounter } from "./gallery/gallery-counter";

const MAIN_COL = { gridColumn: "4 / 13", height: "100%", paddingLeft: px(16), borderLeft: "1px solid var(--color-line)" } as const;

/** Top-right quadrant: statement ↑ / status + scroll ↓.
    The gap between the two is the main column's elastic constraint. */
export function MainTop() {
  return (
    <div style={{ ...MAIN_COL, display: "flex", flexDirection: "column", justifyContent: "space-between", paddingBlock: px(16) }}>
      <div style={{ position: "relative" }}>
        <span className="t-ui" style={{ position: "absolute", left: 0, top: 0, lineHeight: 1.4, color: "var(--color-ink)" }}>↳</span>
        <h1 className="t-statement" style={{ color: "var(--color-ink)", textIndent: colW(1) }}>{STATEMENT}</h1>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: px(8) }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className="t-ui" style={{ color: "var(--color-muted)" }}>Available for work</span>
          <span className="t-ui" style={{ color: "var(--color-ink)" }}>June ‘26</span>
        </div>
        <span className="t-ui" style={{ color: "var(--color-muted)" }}>Scroll</span>
      </div>
    </div>
  );
}

/** Bottom-right quadrant: the Gallery. Height-bound (never exceeds its zone).
    A single WebGL <canvas> renders the Projects as square Planes; the renderer
    is isolated in ./gallery so it stays swappable. Same 16px section padding as
    the other quadrants, so the Active Plane's top aligns with "View Detail" and
    its left with the statement; the counter floats clear so nothing eats the
    top. The strip bleeds past the container's right margin to the viewport edge
    (negative marginRight cancels --marge-x), so the queue of Planes runs off the
    right and is intentionally cut off there — no right-hand padding. The page's
    overflowX:hidden clips the bleed. Counter + rail track the Active Project
    via the Gallery context (provided around the bottom section in page.tsx). */
export function MainGallery() {
  return (
    <div style={{ ...MAIN_COL, position: "relative", paddingBlock: px(16), marginRight: "calc(var(--marge-x) * -1)", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <GalleryCounter />

      <GalleryCanvas colors={projects.map((p) => p.color)} />
    </div>
  );
}
