import { px } from "./home-grid";
import { HomeNav } from "./home-nav";
import { RailTop, RailBottom } from "./home-rail";
import { MainTop, MainGallery } from "./home-main";
import { GalleryProvider } from "./gallery/gallery-context";

/**
 * Creative Practice — Home (desktop, height-constrained).
 *
 * main = exactly 100svh, with a min-height floor: when the viewport gets
 * too short the page stops shrinking and scrolls (the escape hatch).
 * Below the nav, two equal zones (top / bottom) each hold a 12-col grid:
 * rail = cols 1–3, main = cols 4–12. Every quadrant is a flex column that
 * uses space-between, so spare height pools into the middle gaps.
 */
export default function TestHome() {
  const zone = { flex: "1 1 0", minHeight: 0, display: "flex" } as const;
  const grid = { flex: 1, height: "100%", gridTemplateRows: "minmax(0, 1fr)" } as const;

  return (
    <main
      style={{
        height: "100svh",
        minHeight: "640px",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg)",
        overflowX: "hidden",
      }}
    >
      <HomeNav />

      <section style={{ ...zone, borderBottom: "1px solid var(--color-line)" }}>
        <div className="container ds-grid" style={grid}>
          <RailTop />
          <MainTop />
        </div>
      </section>

      {/* Bottom section shares one Gallery context: the renderer pushes the
          live Active index here, and both RailBottom (Client/Role/href) and
          MainGallery's counter read it — so they update together, the moment
          the Active Project changes as you scroll. */}
      <GalleryProvider>
        <section style={zone}>
          <div className="container ds-grid" style={grid}>
            <RailBottom />
            <MainGallery />
          </div>
        </section>
      </GalleryProvider>
    </main>
  );
}
