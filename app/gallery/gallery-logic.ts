import { projects, type Project } from "@/app/projects/data";

/* ════════════════════════════════════════════════════════════
   GALLERY LOGIC · Seam 1 — pure, framework-free.
   No WebGL, no DOM, no React. The WebGL loop owns per-frame
   motion; these functions own the discrete index math that
   drives the Active Project, counter, and rail.
   ──────────────────────────────────────────────────────────
   Model: scroll is a continuous `offset` in plane-steps
   (0 = Project 0 in the Active Slot, 1 = Project 1, …).
   `snapTarget` lands it on a whole step; `activeIndex` wraps
   that step onto the looping list of Projects.
════════════════════════════════════════════════════════════ */

/**
 * Wrap an index into [0, total) with true modular arithmetic, so the Gallery
 * loops infinitely in both directions. Negative indices wrap to the end.
 */
export function wrapIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return ((Math.trunc(index) % total) + total) % total;
}

/**
 * The Project index `step` positions away from `index`, wrapped. Positive step
 * looks forward (right), negative looks back (left). Used for loop neighbors.
 */
export function neighbor(index: number, step: number, total: number): number {
  return wrapIndex(index + step, total);
}

/**
 * Snap a continuous scroll offset (in plane-steps) to the nearest whole step,
 * so exactly one Plane lands in the Active Slot — never a half-scaled rest.
 * Unbounded; wrapping onto a Project index is `activeIndex`'s job.
 */
export function snapTarget(offset: number): number {
  const r = Math.round(offset);
  return r === 0 ? 0 : r; // normalise -0 → 0
}

/** The Active Project index for a snap target (or raw offset). */
export function activeIndex(snap: number, total: number): number {
  return wrapIndex(snap, total);
}

/** The detail-page href for a Project slug — the one owner of this URL shape,
    shared by the Active view and the per-Plane link overlays. */
export const projectHref = (slug: string): string => `/projects/${slug}`;

export interface GalleryView {
  project: Project;
  href: string;
  counter: string; // e.g. "03/06"
}

/** Zero-pad to at least 2 digits, widening for sets of 100+ (e.g. 3 → "03"). */
function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

/**
 * Derive everything the surrounding UI needs from the Active index: the Active
 * Project, its detail href, and the `NN/MM` counter. Defaults to the real list
 * but accepts one so it stays pure and testable.
 */
export function galleryView(
  index: number,
  list: readonly Project[] = projects
): GalleryView {
  const total = list.length;
  const active = wrapIndex(index, total);
  const project = list[active];
  const width = Math.max(2, String(total).length);
  return {
    project,
    href: projectHref(project.slug),
    counter: `${pad(active + 1, width)}/${pad(total, width)}`,
  };
}
