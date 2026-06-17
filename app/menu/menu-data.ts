/* ════════════════════════════════════════════════════════════
   MENU DATA  ·  single source for the site-wide menu chrome
   ─────────────────────────────────────────────────────────
   The same brand mark, section links, and Contact appear on every
   portfolio surface (desktop home, mobile home, project detail).
   Keep the model here so the wording / active state lives in one place.
════════════════════════════════════════════════════════════ */

/** Brand mark — the only real anchor in the menu (back to home). */
export const BRAND = { label: "j.mr", href: "/" } as const;

/** Section links. `active` marks the current section. Hrefs are placeholders
    until Work/About/Lab get their own pages — rendered as plain text for now. */
export const NAV_LINKS = [
  { label: "Work", active: true },
  { label: "About", active: false },
  { label: "Lab", active: false },
] as const;

/** Mobile shows only the secondary sections at the bottom (Work is implied by
    the surface). Mirrors the order used on the mobile home today. */
export const MOBILE_SECTIONS = [{ label: "Lab" }, { label: "About" }] as const;

/** Contact — placeholder link, underlined wherever it appears. */
export const CONTACT = { label: "Contact" } as const;
