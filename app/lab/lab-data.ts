/* ════════════════════════════════════════════════════════════
   LAB DATA  ·  single source for the Lab's pieces.
   ─────────────────────────────────────────────────────────
   The Lab is an infinite canvas built from one hand-placed
   arrangement — the Cluster — that tiles seamlessly in every
   direction. Each piece is placed once inside the Cluster; the
   layout math repeats the whole Cluster, so adding a piece is a
   data change here (place its rect), never a layout change.
   Coordinates are design units on the 1728-wide desktop canvas.
════════════════════════════════════════════════════════════ */

/** The Cluster's bounds (design units). Sized under one desktop viewport so
    neighbouring repeats peek in and the field reads as continuous. */
export const CLUSTER = { w: 1440, h: 1080 } as const;

/** Flat stand-in color for every plane until the piece captures land. */
export const PLANE_COLOR = "#141414";

export interface LabPiece {
  slug: string; // URL segment for the piece's detail route (AD-129)
  title: string; // display name
  image: string; // public path — becomes the plane's texture later
  live?: string; // external live link, where one exists
  /** Placement inside the Cluster — top-left origin, +y down, design units. */
  rect: { x: number; y: number; w: number; h: number };
}

/* Seeded with the posters already in the repo. Rects echo the reference
   scatter: varied aspects (landscape / portrait / square), organic gaps, and
   clearance from the Cluster edge so wrapped repeats never touch. */
export const LAB_PIECES: LabPiece[] = [
  {
    slug: "poster-01",
    title: "Poster 01",
    image: "/posters/poster-1.jpg",
    rect: { x: 80, y: 100, w: 480, h: 320 },
  },
  {
    slug: "poster-02",
    title: "Poster 02",
    image: "/posters/poster-2.jpg",
    rect: { x: 940, y: 40, w: 330, h: 470 },
  },
  {
    slug: "poster-03",
    title: "Poster 03",
    image: "/posters/poster-3.jpg",
    rect: { x: 520, y: 560, w: 430, h: 430 },
  },
];
