/* ════════════════════════════════════════════════════════════
   MENU DATA  ·  single source for the site-wide menu chrome
   ─────────────────────────────────────────────────────────
   The same brand mark, section links, and Contact appear on every
   portfolio surface (desktop home, mobile home, project detail,
   the Lab). Keep the model here so the wording lives in one place;
   which section reads active is the surface's call (SiteMenuBar's
   `activeLabel`), not data.
════════════════════════════════════════════════════════════ */

/** Brand mark — always an anchor back to home. */
export const BRAND = { label: "j.mr", href: "/" } as const;

export interface NavLink {
  label: string;
  /** Absent until the section has its own page — rendered as plain text. */
  href?: string;
}

/** Section links. Work is the home gallery; About has no page yet. */
export const NAV_LINKS: readonly NavLink[] = [
  { label: "Work", href: "/" },
  { label: "About" },
  { label: "Lab", href: "/lab" },
];

/** Mobile shows only the secondary sections at the bottom (Work is implied by
    the surface). Mirrors the order used on the mobile home today. */
export const MOBILE_SECTIONS: readonly NavLink[] = [
  { label: "Lab", href: "/lab" },
  { label: "About" },
];

/** Contact — placeholder link, underlined wherever it appears. */
export const CONTACT = { label: "Contact" } as const;
