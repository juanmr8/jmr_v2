import Link from "next/link";
import { px } from "../home-grid";
import { CASCADE, HomeReveal, REVEAL_STAGGER } from "../home-reveal";
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
 *
 * `reveal` turns on the homepage entrance: each label rises inside its own
 * mask, cascading left-to-right. Every other surface renders plain text.
 *
 * `activeLabel` names the section this surface belongs to — it reads in ink,
 * the rest in muted. Defaults to Work (the home gallery and its details).
 */
export function SiteMenuBar({
  reveal = false,
  activeLabel = "Work",
}: {
  reveal?: boolean;
  activeLabel?: string;
}) {
  const label = (text: string, slot: number, className?: string) =>
    reveal ? (
      <HomeReveal delay={(CASCADE.nav + slot) * REVEAL_STAGGER} className={className}>
        {text}
      </HomeReveal>
    ) : (
      text
    );

  return (
    <div className="container ds-grid" style={{ alignItems: "center", paddingBlock: px(16) }}>
      <Link
        href={BRAND.href}
        className="t-logo pointer-events-auto"
        style={{ gridColumn: "1 / 4", color: "var(--color-ink)", textDecoration: "none" }}
      >
        {label(BRAND.label, 0)}
      </Link>

      <nav style={{ gridColumn: "4 / 10", display: "flex", gap: px(15), alignItems: "center" }}>
        {NAV_LINKS.map((l, i) => {
          const color = l.label === activeLabel ? "var(--color-ink)" : "var(--color-muted)";
          return l.href ? (
            <Link
              key={l.label}
              href={l.href}
              className="t-ui pointer-events-auto"
              style={{ color, textDecoration: "none" }}
            >
              {label(l.label, i + 1)}
            </Link>
          ) : (
            <span key={l.label} className="t-ui" style={{ color }}>
              {label(l.label, i + 1)}
            </span>
          );
        })}
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
        {/* Underline can't propagate into the reveal's absolutely-positioned
            animated layer — .reveal-underline (globals.css) re-applies it there. */}
        {label(CONTACT.label, NAV_LINKS.length + 1, "reveal-underline")}
      </span>
    </div>
  );
}
