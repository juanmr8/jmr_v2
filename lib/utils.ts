/* ════════════════════════════════════════════════════════════
   LIB UTILS · satisfies the `@/lib/utils` import in the animation
   components ported verbatim from Connoisseur.
   ─────────────────────────────────────────────────────────
   Connoisseur's cn is clsx + tailwind-merge; the ported call sites
   only join a static base class with an optional className, so a
   plain filter/join covers them without two extra dependencies.
════════════════════════════════════════════════════════════ */

export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(" ");
}
