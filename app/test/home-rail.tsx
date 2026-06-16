import { px } from "./home-grid";

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
          <span className="t-ui" style={labelMuted}>Services:</span>
          <span className="t-ui" style={valueInk}>Design, Development</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
          <span className="t-ui" style={valueInk}>Instagram</span>
          <span className="t-ui" style={valueInk}>Medium</span>
        </div>
      </div>
    </div>
  );
}

/** Bottom-left quadrant: highlighted-project info ↑ / geometry shapes ↓. */
export function RailBottom() {
  return (
    <div style={RAIL}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: px(8) }}>
        <div style={{ display: "flex", flexDirection: "column", gap: px(12) }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="t-ui" style={labelMuted}>Client:</span>
            <span className="t-ui" style={valueInk}>Villiers</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="t-ui" style={labelMuted}>Role:</span>
            <span className="t-ui" style={valueInk}>Designer, Developer</span>
          </div>
        </div>
        <span className="t-ui" style={valueInk}>View Detail</span>
      </div>

      {/* geometric primitives — exported SVG (circle + triangle), fills the
          rail width and keeps its native proportions/spacing as drawn. */}
      <img src="/primitives.svg" alt="" style={{ display: "block", width: "100%", height: "auto" }} />
    </div>
  );
}
