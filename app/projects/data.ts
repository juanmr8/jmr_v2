export interface Project {
  slug: string; // URL segment, e.g. "villiers"
  title: string; // display name shown under the mini-map
  year: number; // shown top-right, opposite the mini-map
  images: string[]; // ordered public paths for the gallery column
  about: string; // paragraph for the About panel
  siteUrl?: string; // "Visit site" link

  // Gallery fields (home test page). One Project = one Plane.
  color: string; // flat placeholder color for the Plane (real images come later)
  client: string; // shown in the bottom-left rail when this is the Active Project
  role: string; // shown in the bottom-left rail when this is the Active Project
}

export const projects: Project[] = [
  {
    slug: "villiers",
    title: "Villiers",
    year: 2026,
    images: [
      "/work/villiers/frame-1.jpg",
      "/work/villiers/frame-2.jpg",
      "/work/villiers/frame-3.jpg",
      "/work/villiers/frame-4.jpg",
      "/work/villiers/frame-5.jpg",
      "/work/villiers/frame-6.jpg",
    ],
    about: "A private jet charter platform.",
    siteUrl: "https://www.villiers.ai/",
    color: "#C4452F",
    client: "Villiers",
    role: "Designer, Developer",
  },
  {
    slug: "hellodoot",
    title: "HelloDoot",
    year: 2025,
    images: [
      "/work/hellodoot/img-1.jpg",
      "/work/hellodoot/img-2.jpg",
      "/work/hellodoot/img-3.jpg",
      "/work/hellodoot/img-4.jpg",
      "/work/hellodoot/img-5.jpg",
    ],
    about:
      "A platform for calculating and paying second-hand car taxes in Spain.",
    siteUrl: "https://www.hellodoot.com",
    color: "#2F7D4F",
    client: "HelloDoot",
    role: "Designer, Developer",
  },

  // Placeholder Projects — flat-color Planes for developing the Gallery's
  // motion, looping, and snapping before real imagery exists. Distinct colors
  // keep movement easy to read. Replace title/client/role with real work later.
  {
    slug: "atlas",
    title: "Atlas",
    year: 2025,
    images: [],
    about: "Placeholder project for Gallery development.",
    color: "#3A52A8",
    client: "Atlas",
    role: "Designer",
  },
  {
    slug: "marisol",
    title: "Marisol",
    year: 2024,
    images: [],
    about: "Placeholder project for Gallery development.",
    color: "#C98A2B",
    client: "Marisol",
    role: "Developer",
  },
  {
    slug: "northwind",
    title: "Northwind",
    year: 2024,
    images: [],
    about: "Placeholder project for Gallery development.",
    color: "#6B4FA0",
    client: "Northwind",
    role: "Designer, Developer",
  },
  {
    slug: "cadence",
    title: "Cadence",
    year: 2023,
    images: [],
    about: "Placeholder project for Gallery development.",
    color: "#1F8A93",
    client: "Cadence",
    role: "Designer",
  },
];

export const getProject = (slug: string): Project | null =>
  projects.find((p) => p.slug === slug) ?? null;

// Wrapping prev/next so the bottom links loop around the project list.
export function getAdjacent(slug: string): {
  prev: Project | null;
  next: Project | null;
} {
  const i = projects.findIndex((p) => p.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: projects[(i - 1 + projects.length) % projects.length],
    next: projects[(i + 1) % projects.length],
  };
}
