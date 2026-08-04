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

/** The Cluster's bounds (design units). A little over one desktop viewport so
    neighbouring repeats peek in and the field reads as continuous. */
export const CLUSTER = { w: 2000, h: 1500 } as const;

/** Flat stand-in painted while a piece's image is loading (or missing). */
export const PLANE_COLOR = "#141414";

export interface LabPiece {
  slug: string; // URL segment for the piece's detail route (AD-129)
  title: string; // display name
  image: string; // public path — the plane's texture (cover-cropped)
  description?: string; // detail-panel copy, where it exists
  live?: string; // external live link, where one exists
  /** Placement inside the Cluster — top-left origin, +y down, design units. */
  rect: { x: number; y: number; w: number; h: number };
}

/** The piece's detail route (AD-129). */
export function labPieceHref(slug: string): string {
  return `/lab/${slug}`;
}

export function getLabPiece(slug: string): LabPiece | undefined {
  return LAB_PIECES.find((p) => p.slug === slug);
}

/* Seeded with the posters in the repo, filled out with project frames to
   check the look and feel with real imagery until the old-repo captures land.
   Rects echo the reference scatter: varied aspects (landscape / portrait /
   square), organic gaps, and clearance from the Cluster edge so wrapped
   repeats never touch. Images cover-crop into their rects, so aspects are a
   placement choice, not an image constraint. */
export const LAB_PIECES: LabPiece[] = [
  {
    slug: "poster-01",
    title: "Poster 01",
    image: "/posters/poster-1.jpg",
    rect: { x: 80, y: 90, w: 460, h: 310 },
  },
  {
    slug: "villiers-frame-01",
    title: "Villiers — Frame 01",
    image: "/work/villiers/frame-1.jpg",
    rect: { x: 700, y: 40, w: 300, h: 420 },
  },
  {
    slug: "poster-02",
    title: "Poster 02",
    image: "/posters/poster-2.jpg",
    rect: { x: 1250, y: 130, w: 520, h: 350 },
  },
  {
    slug: "hellodoot-01",
    title: "Hellodoot — 01",
    image: "/work/hellodoot/img-1.jpg",
    rect: { x: 330, y: 560, w: 380, h: 380 },
  },
  {
    slug: "villiers-frame-02",
    title: "Villiers — Frame 02",
    image: "/work/villiers/frame-2.jpg",
    rect: { x: 1030, y: 620, w: 460, h: 300 },
  },
  {
    slug: "poster-03",
    title: "Poster 03",
    image: "/posters/poster-3.jpg",
    rect: { x: 1660, y: 700, w: 280, h: 280 },
  },
  {
    slug: "hellodoot-02",
    title: "Hellodoot — 02",
    image: "/work/hellodoot/img-2.jpg",
    rect: { x: 90, y: 1060, w: 330, h: 400 },
  },
  {
    slug: "villiers-frame-03",
    title: "Villiers — Frame 03",
    image: "/work/villiers/frame-3.jpg",
    rect: { x: 760, y: 1100, w: 480, h: 320 },
  },
  {
    slug: "hellodoot-03",
    title: "Hellodoot — 03",
    image: "/work/hellodoot/img-3.jpg",
    rect: { x: 1430, y: 1080, w: 350, h: 350 },
  },
];
