import { px } from "./home-grid";
import { NAV_LINKS } from "./home-data";

/** Top bar — full-bleed band; logo (col 1) · links (col 4) · contact (col 12). */
export function HomeNav() {
  return (
    <div style={{ borderBottom: "1px solid var(--color-line)" }}>
      <div className="container ds-grid" style={{ alignItems: "center", paddingBlock: px(16) }}>
        <span className="t-logo" style={{ gridColumn: "1 / 4", color: "var(--color-ink)" }}>
          j.mr
        </span>

        <nav style={{ gridColumn: "4 / 10", display: "flex", gap: px(15), alignItems: "center" }}>
          {NAV_LINKS.map((l) => (
            <span key={l.label} className="t-ui" style={{ color: l.active ? "var(--color-ink)" : "var(--color-muted)" }}>
              {l.label}
            </span>
          ))}
        </nav>

        <span
          className="t-ui"
          style={{
            gridColumn: "12 / 13",
            justifySelf: "end",
            whiteSpace: "nowrap",
            color: "var(--color-ink)",
            textDecoration: "underline",
            textUnderlineOffset: px(3),
          }}
        >
          Contact
        </span>
      </div>
    </div>
  );
}
