import Link from "next/link";
import { BRAND, MOBILE_SECTIONS, CONTACT } from "./menu-data";

/**
 * Mobile top bar — logo (left) · Contact (right), differenced for legibility
 * over the gallery. p-4! → 16px inset; the `!` beats the unlayered global
 * reset (`* { padding: 0 }`), which otherwise wins over layered utilities.
 */
export function SiteMenuMobileTop() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex items-center justify-between p-4! mix-blend-difference">
      <Link href={BRAND.href} className="t-logo pointer-events-auto text-white no-underline">
        {BRAND.label}
      </Link>
      <span className="t-ui pointer-events-auto text-white underline underline-offset-2">
        {CONTACT.label}
      </span>
    </div>
  );
}

/**
 * Mobile section links (Lab · About). Presentational list only — the consumer
 * positions it (the home pins it bottom-right beside the statement). Pass
 * `className` to set alignment / placement for the surface.
 */
export function SiteMenuMobileSections({ className = "" }: { className?: string }) {
  return (
    <nav className={`pointer-events-auto flex flex-col gap-1 text-xs text-white ${className}`}>
      {MOBILE_SECTIONS.map((s) => (
        <span key={s.label}>{s.label}</span>
      ))}
    </nav>
  );
}
