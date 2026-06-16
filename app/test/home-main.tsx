import { px, colW } from "./home-grid";
import { STATEMENT } from "./home-data";
import { projects } from "@/app/projects/data";
import { galleryView } from "./gallery/gallery-logic";
import { GalleryCanvas } from "./gallery/gallery-canvas";

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
    top. Static at Active index 0 this slice — counter is derived, not motion. */
export function MainGallery() {
  const { counter } = galleryView(0);

  return (
    <div style={{ ...MAIN_COL, position: "relative", paddingBlock: px(16), display: "flex", flexDirection: "column", minHeight: 0 }}>
      <span className="t-ui" style={{ position: "absolute", top: px(16), right: 0, color: "var(--color-ink)", zIndex: 1 }}>{counter}</span>

      <GalleryCanvas colors={projects.map((p) => p.color)} />
    </div>
  );
}
