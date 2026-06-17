import Link from "next/link";
import { px } from "../home-grid";
import { BRAND, NAV_LINKS, CONTACT } from "./menu-data";

/**
 * Desktop menu row — logo (col 1) · sections (col 4) · Contact (col 12).
 *
 * Presentational only: it lays the content onto the 12-col grid and stops
 * there. The consumer owns the chrome around it — the home wraps it in a
 * bordered band; project detail wraps it in an absolute, blended overlay.
 *
 * Logo / Contact carry `pointer-events-auto` so they stay clickable when the
 * consumer makes the overlay `pointer-events-none`; on the in-flow home this
 * is a no-op (auto is already the default).
 */
export function SiteMenuBar() {
  return (
    <div className="container ds-grid" style={{ alignItems: "center", paddingBlock: px(16) }}>
      <Link
        href={BRAND.href}
        className="t-logo pointer-events-auto"
        style={{ gridColumn: "1 / 4", color: "var(--color-ink)", textDecoration: "none" }}
      >
        {BRAND.label}
      </Link>

      <nav style={{ gridColumn: "4 / 10", display: "flex", gap: px(15), alignItems: "center" }}>
        {NAV_LINKS.map((l) => (
          <span key={l.label} className="t-ui" style={{ color: l.active ? "var(--color-ink)" : "var(--color-muted)" }}>
            {l.label}
          </span>
        ))}
      </nav>

      <span
        className="t-ui pointer-events-auto"
        style={{
          gridColumn: "12 / 13",
          justifySelf: "end",
          whiteSpace: "nowrap",
          color: "var(--color-ink)",
          textDecoration: "underline",
          textUnderlineOffset: px(3),
        }}
      >
        {CONTACT.label}
      </span>
    </div>
  );
}
