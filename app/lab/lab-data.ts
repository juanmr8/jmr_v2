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

/** The Cluster's bounds (design units). Roughly two desktop viewports per
    axis at full piece count, so a pan crosses fresh work for a while before
    the arrangement repeats — and neighbouring repeats still peek in. */
export const CLUSTER = { w: 3600, h: 2600 } as const;

/** Flat stand-in painted while a piece's image is loading (or missing). */
export const PLANE_COLOR = "#141414";

export interface LabPiece {
  slug: string; // URL segment for the piece's detail route (AD-129)
  title: string; // display name
  image: string; // public path — the plane's texture (cover-cropped)
  description?: string; // detail-panel copy, where it exists
  live?: string; // external live link, where one exists
  code?: string; // public GitHub repo, where one exists
  /** Placement inside the Cluster — top-left origin, +y down, design units. */
  rect: { x: number; y: number; w: number; h: number };
}

/** The piece's detail route (AD-129). */
export function labPieceHref(slug: string): string {
  return `/lab/${slug}`;
}

/** The piece's capture loop, shown autoplaying in the detail panel. Every
    capture under public/lab/ ships a sibling video.mp4 next to its image
    (AD-125), so the path is derived, not stored; posters have no loop. */
export function labPieceVideo(piece: LabPiece): string | undefined {
  if (!piece.image.startsWith("/lab/")) return undefined;
  return piece.image.replace(/\/[^/]+$/, "/video.mp4");
}

export function getLabPiece(slug: string): LabPiece | undefined {
  return LAB_PIECES.find((p) => p.slug === slug);
}

/* Launch content (AD-130): the three repo posters plus every capture from
   the old exploration series (manifest: vault/products/portfolio/lab-pieces.md).
   Rects echo the reference scatter — varied aspects, organic gaps, clearance
   from the Cluster edge so wrapped repeats never touch — and roughly honour
   each capture's own aspect so the cover-crop stays gentle: the 01–10 article
   captures are ~2:1 landscape, the IG-batch captures (12–24, design pieces)
   are 9:16 portrait with the caption framing baked in, posters are 784×1109
   portrait. Ordered in reading order, top band to bottom. */
export const LAB_PIECES: LabPiece[] = [
  {
    slug: "poster-01",
    title: "Poster 01",
    image: "/posters/poster-1.jpg",
    rect: { x: 90, y: 100, w: 330, h: 460 },
  },
  {
    slug: "01-on-load-basic",
    title: "On-load timeline",
    image: "/lab/01-on-load-basic/image.png",
    description:
      "On-load timeline animation — staggered entrance choreography built with Motion.",
    code: "https://github.com/juanmr8/01-timeline-animation-motion",
    rect: { x: 560, y: 70, w: 460, h: 260 },
  },
  {
    slug: "13-text-superposition",
    title: "Text superposition",
    image: "/lab/13-text-superposition/image.png",
    description: "Jittering type superposition, React + Motion.",
    live: "https://www.instagram.com/p/DTIMLj7idQn/",
    code: "https://github.com/juanmr8/13-text-superposition",
    rect: { x: 1160, y: 140, w: 270, h: 480 },
  },
  {
    slug: "05-page-transition-basic",
    title: "View transitions",
    image: "/lab/05-page-transition-basic/image.png",
    description:
      "Page-transition study with the View Transition API in the Next.js App Router.",
    live: "https://www.juanmoraromero.com/lab/05-page-transition-basic",
    code: "https://github.com/juanmr8/05-page-transition-basic",
    rect: { x: 1570, y: 60, w: 440, h: 230 },
  },
  {
    slug: "17-mouse-image-gallery",
    title: "Mouse image gallery",
    image: "/lab/17-mouse-image-gallery/image.png",
    description: "Mouse-position image gallery, React + vanilla JS.",
    live: "https://www.instagram.com/p/DTkVmmPiGbN/",
    code: "https://github.com/juanmr8/17-mouse-image-gallery",
    rect: { x: 2150, y: 120, w: 280, h: 500 },
  },
  {
    slug: "poster-02",
    title: "Poster 02",
    image: "/posters/poster-2.jpg",
    rect: { x: 2570, y: 70, w: 320, h: 450 },
  },
  {
    slug: "07-stairs-page-transition",
    title: "Stairs transition",
    image: "/lab/07-stairs-page-transition/image.png",
    description: "Stairs page transition — GSAP with the Next.js App Router.",
    live: "https://www.juanmoraromero.com/lab/07-stairs-page-transition",
    code: "https://github.com/juanmr8/07-stairs-page-transition",
    rect: { x: 3030, y: 130, w: 470, h: 240 },
  },
  {
    slug: "02-scroll-animation",
    title: "Scroll choreography",
    image: "/lab/02-scroll-animation/image.png",
    description:
      "Scroll-driven animation study replicating telescope.fyi — React + Motion.",
    // The old site routes this piece as 02-on-scroll-basic — not a slug typo.
    live: "https://www.juanmoraromero.com/lab/02-on-scroll-basic",
    code: "https://github.com/juanmr8/02-scroll-animation",
    rect: { x: 100, y: 680, w: 480, h: 250 },
  },
  {
    slug: "19-pixelated-image",
    title: "Pixel shader on hover",
    image: "/lab/19-pixelated-image/image.png",
    description: "Hover pixelation shader, R3F + GLSL.",
    live: "https://www.instagram.com/p/DTqDfAZCEf5/",
    code: "https://github.com/juanmr8/19-pixelated-image",
    rect: { x: 700, y: 480, w: 260, h: 460 },
  },
  {
    slug: "perlin-meatball",
    title: "Perlin Meatball",
    image: "/lab/perlin-meatball/image.png",
    description: "Perlin-displaced sphere, Cinema 4D + Octane.",
    live: "https://www.instagram.com/p/C0sbpx-pw4I/",
    rect: { x: 1080, y: 760, w: 300, h: 300 },
  },
  {
    slug: "08-pixel-transition",
    title: "Pixel transition",
    image: "/lab/08-pixel-transition/image.png",
    description: "Pixelated page transition — React, Next.js and GSAP.",
    live: "https://www.juanmoraromero.com/lab/08-pixel-transition",
    code: "https://github.com/juanmr8/08-pixel-transition",
    rect: { x: 1520, y: 420, w: 460, h: 250 },
  },
  {
    slug: "21-2d-physics",
    title: "2D physics",
    image: "/lab/21-2d-physics/image.png",
    description: "Matter.js physics playground, React.",
    live: "https://www.instagram.com/p/DTu525vCIEk/",
    code: "https://github.com/juanmr8/21-2d-physics",
    rect: { x: 2080, y: 740, w: 270, h: 480 },
  },
  {
    slug: "04-svg-animation-basic",
    title: "SVG path draw",
    image: "/lab/04-svg-animation-basic/image.png",
    description:
      "SVG path animation study — line draws and hand-drawn annotations, React + Motion.",
    live: "https://www.juanmoraromero.com/lab/04-svg-animation-basic",
    code: "https://github.com/juanmr8/04-svg-animation-basic",
    rect: { x: 2490, y: 640, w: 450, h: 240 },
  },
  {
    slug: "loops-poster",
    title: "LOOPS",
    image: "/lab/loops-poster/image.png",
    description: "Geometric motion poster, design piece.",
    live: "https://www.instagram.com/p/C64nmQcpgml/",
    rect: { x: 3090, y: 490, w: 290, h: 520 },
  },
  {
    slug: "14-text-gradient",
    title: "Text gradient",
    image: "/lab/14-text-gradient/image.png",
    description: "Text gradient reveal, GSAP + Motion versions.",
    live: "https://www.instagram.com/p/DTNtLHQCMT5/",
    code: "https://github.com/juanmr8/14-text-gradient",
    rect: { x: 140, y: 1050, w: 260, h: 470 },
  },
  {
    slug: "09-text-scramble",
    title: "Text scramble",
    image: "/lab/09-text-scramble/image.png",
    description:
      "Advanced text scramble on a dark editorial layout — GSAP, React, Next.js.",
    live: "https://www.juanmoraromero.com/lab/09-text-scramble",
    code: "https://github.com/juanmr8/09-text-scramble",
    rect: { x: 520, y: 1080, w: 470, h: 250 },
  },
  {
    slug: "poster-03",
    title: "Poster 03",
    image: "/posters/poster-3.jpg",
    rect: { x: 1130, y: 1180, w: 330, h: 470 },
  },
  {
    slug: "16-text-mask-blend-mode",
    title: "Text mask blend",
    image: "/lab/16-text-mask-blend-mode/image.png",
    description: "Text over video with blend modes, React + Motion.",
    live: "https://www.instagram.com/p/DTh2qVLCClD/",
    code: "https://github.com/juanmr8/16-text-mask-blend-mode",
    rect: { x: 1600, y: 800, w: 270, h: 480 },
  },
  {
    slug: "06-on-scroll-blur",
    title: "Scroll blur",
    image: "/lab/06-on-scroll-blur/image.png",
    description:
      "Bottom-of-viewport blur with moving noise, activated on scroll — React, Motion, CSS.",
    live: "https://www.juanmoraromero.com/lab/06-on-scroll-blur",
    code: "https://github.com/juanmr8/06-on-scroll-blur",
    rect: { x: 2010, y: 1350, w: 450, h: 240 },
  },
  {
    slug: "23-video-on-scroll",
    title: "Video on scroll",
    image: "/lab/23-video-on-scroll/image.png",
    description: "Scroll-scrubbed video, React + Motion.",
    live: "https://www.instagram.com/p/DT0VV_aCI4B/",
    code: "https://github.com/juanmr8/23-video-on-scroll",
    rect: { x: 2560, y: 1010, w: 280, h: 500 },
  },
  {
    slug: "12-svg-mask",
    title: "Masking practice",
    image: "/lab/12-svg-mask/image.png",
    description: "SVG mask animation studies, React + Motion.",
    live: "https://www.instagram.com/p/DTF6HanCfRb/",
    code: "https://github.com/juanmr8/12-svg-mask",
    rect: { x: 3000, y: 1130, w: 280, h: 500 },
  },
  {
    slug: "03-mouse-move-basic",
    title: "Mouse lens",
    image: "/lab/03-mouse-move-basic/image.png",
    description: "Cursor-following lens study over an image grid — GSAP + React.",
    live: "https://www.juanmoraromero.com/lab/03-mouse-move-basic",
    code: "https://github.com/juanmr8/03-mouse-move-basic",
    rect: { x: 90, y: 1650, w: 460, h: 240 },
  },
  {
    slug: "20-infinite-scroll",
    title: "Infinite gallery",
    image: "/lab/20-infinite-scroll/image.png",
    description: "Infinite scrolling gallery, React + vanilla JS.",
    live: "https://www.instagram.com/p/DTs4PS2iBRG/",
    code: "https://github.com/juanmr8/20-infinite-scroll",
    rect: { x: 680, y: 1450, w: 270, h: 480 },
  },
  {
    slug: "10-interactive-buttons",
    title: "Interactive buttons",
    image: "/lab/10-interactive-buttons/image.png",
    description: "Four interactive button studies recreated in Tailwind + React.",
    live: "https://www.juanmoraromero.com/lab/10-interactive-buttons",
    code: "https://github.com/juanmr8/10-interactive-buttons",
    rect: { x: 1090, y: 1790, w: 450, h: 240 },
  },
  {
    slug: "22-gooey-effect",
    title: "Meta balls",
    image: "/lab/22-gooey-effect/image.png",
    description:
      "Metaballs in three phases (CSS / Canvas SDF / WebGL), React + Three.js.",
    live: "https://www.instagram.com/p/DTxwr7aiJfk/",
    code: "https://github.com/juanmr8/22-gooey-effect",
    rect: { x: 1680, y: 1420, w: 280, h: 500 },
  },
  {
    slug: "jmr-ident",
    title: "JMR ident",
    image: "/lab/jmr-ident/image.png",
    description: "Animated name ident card, design piece.",
    live: "https://www.instagram.com/p/DTDg0q9CSfK/",
    rect: { x: 2130, y: 1730, w: 260, h: 460 },
  },
  {
    slug: "15-text-mask-split",
    title: "Text mask split",
    image: "/lab/15-text-mask-split/image.png",
    description: "Split text mask, side + scroll variants, React + Motion.",
    live: "https://www.instagram.com/p/DTfTT2zCLAZ/",
    code: "https://github.com/juanmr8/15-text-mask-split",
    rect: { x: 2530, y: 1650, w: 260, h: 470 },
  },
  {
    slug: "24-pixel-shader",
    title: "Pixel shader + mouse",
    image: "/lab/24-pixel-shader/image.png",
    description:
      "Pixel shader with mouse interaction + colour-channel splitting, R3F + GLSL.",
    live: "https://www.instagram.com/p/DT2_kjtiNnr/",
    code: "https://github.com/juanmr8/24-pixel-shader",
    rect: { x: 2950, y: 1770, w: 280, h: 500 },
  },
  {
    slug: "18-scroll-stacked-cards",
    title: "Stacked cards",
    image: "/lab/18-scroll-stacked-cards/image.png",
    description: "Scroll-stacked cards + SVG path draw, React + Motion.",
    live: "https://www.instagram.com/p/DTnwe8hiK-i/",
    code: "https://github.com/juanmr8/18-scroll-stacked-cards",
    rect: { x: 430, y: 2050, w: 270, h: 480 },
  },
];
