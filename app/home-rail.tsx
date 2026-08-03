"use client";

import { px } from "./home-grid";
import { HomeReveal, REVEAL_STAGGER } from "./home-reveal";
import { useActiveView } from "./gallery/gallery-context";

const RAIL = { gridColumn: "1 / 4", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingBlock: px(16) } as const;
const labelMuted = { color: "var(--color-muted)" };
const valueInk = { color: "var(--color-ink)" };

/** Top-left quadrant: portrait + marker dot ↑ / project meta + social ↓.
    The elastic gap between top and bottom is what absorbs spare height. */
export function RailTop() {
  return (
    <div style={RAIL}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: px(184), maxWidth: "100%", aspectRatio: "184 / 194", background: "var(--color-placeholder)" }} />
        <span style={{ flexShrink: 0, width: px(14), height: px(14), borderRadius: "50%", background: "var(--color-ink)" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: px(8) }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className="t-ui" style={labelMuted}><HomeReveal>Services:</HomeReveal></span>
          <span className="t-ui" style={valueInk}><HomeReveal delay={REVEAL_STAGGER}>Design, Development</HomeReveal></span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
          <span className="t-ui" style={valueInk}><HomeReveal delay={2 * REVEAL_STAGGER}>Instagram</HomeReveal></span>
          <span className="t-ui" style={valueInk}><HomeReveal delay={3 * REVEAL_STAGGER}>Medium</HomeReveal></span>
        </div>
      </div>
    </div>
  );
}

/** Bottom-left quadrant: Active Project info ↑ / geometry shapes ↓.
    Client, Role, and the View Detail href all track the Active Project
    from the Gallery context — derived in one place via galleryView.
    The dynamic values are keyed by `href` so they rise on mount AND
    re-rise through their mask whenever the Active Project changes. */
export function RailBottom() {
  const { project, href } = useActiveView();

  return (
    <div style={RAIL}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: px(8) }}>
        <div style={{ display: "flex", flexDirection: "column", gap: px(12) }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="t-ui" style={labelMuted}><HomeReveal>Client:</HomeReveal></span>
            <span className="t-ui" style={valueInk}><HomeReveal key={href} delay={REVEAL_STAGGER}>{project.client}</HomeReveal></span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="t-ui" style={labelMuted}><HomeReveal delay={2 * REVEAL_STAGGER}>Role:</HomeReveal></span>
            <span className="t-ui" style={valueInk}><HomeReveal key={href} delay={3 * REVEAL_STAGGER}>{project.role}</HomeReveal></span>
          </div>
        </div>
        <a className="t-ui" href={href} style={{ ...valueInk, textDecoration: "none" }}><HomeReveal delay={4 * REVEAL_STAGGER}>View Detail</HomeReveal></a>
      </div>

      {/* geometric primitives — exported SVG (circle + triangle), fills the
          rail width and keeps its native proportions/spacing as drawn. */}
      <img src="/primitives.svg" alt="" style={{ display: "block", width: "100%", height: "auto" }} />
    </div>
  );
}
