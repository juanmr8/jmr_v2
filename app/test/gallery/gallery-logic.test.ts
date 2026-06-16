import { describe, expect, it } from "vitest";
import {
  activeIndex,
  galleryView,
  neighbor,
  snapTarget,
  wrapIndex,
} from "./gallery-logic";
import type { Project } from "@/app/projects/data";

// Minimal fixture so tests don't depend on the real list's length/content.
const FIXTURE: Project[] = Array.from({ length: 8 }, (_, i) => ({
  slug: `p${i}`,
  title: `Project ${i}`,
  year: 2026,
  images: [],
  about: "",
  color: "#000000",
  client: `Client ${i}`,
  role: "Role",
}));

describe("wrapIndex", () => {
  it("is identity inside the range", () => {
    expect(wrapIndex(0, 8)).toBe(0);
    expect(wrapIndex(7, 8)).toBe(7);
  });

  it("wraps past the end back to the start (infinite loop)", () => {
    expect(wrapIndex(8, 8)).toBe(0);
    expect(wrapIndex(10, 8)).toBe(2);
  });

  it("wraps negative indices to the end", () => {
    expect(wrapIndex(-1, 8)).toBe(7);
    expect(wrapIndex(-9, 8)).toBe(7);
  });

  it("guards an empty list", () => {
    expect(wrapIndex(3, 0)).toBe(0);
  });
});

describe("neighbor", () => {
  it("wraps forward off the end", () => {
    expect(neighbor(7, 1, 8)).toBe(0);
  });

  it("wraps backward off the start", () => {
    expect(neighbor(0, -1, 8)).toBe(7);
  });

  it("steps by more than one", () => {
    expect(neighbor(6, 3, 8)).toBe(1);
  });
});

describe("snapTarget", () => {
  it("rounds to the nearest whole step", () => {
    expect(snapTarget(2.4)).toBe(2);
    expect(snapTarget(2.6)).toBe(3);
  });

  it("normalises -0 to 0 near the origin", () => {
    expect(Object.is(snapTarget(-0.4), 0)).toBe(true);
  });
});

describe("activeIndex", () => {
  it("maps an in-range snap straight through", () => {
    expect(activeIndex(3, 8)).toBe(3);
  });

  it("wraps a snap past the end (loop)", () => {
    expect(activeIndex(8, 8)).toBe(0);
    expect(activeIndex(-1, 8)).toBe(7);
  });
});

describe("galleryView", () => {
  it("derives project, href, and zero-padded counter", () => {
    const view = galleryView(2, FIXTURE);
    expect(view.project.slug).toBe("p2");
    expect(view.href).toBe("/projects/p2");
    expect(view.counter).toBe("03/08");
  });

  it("wraps the index before deriving (loop)", () => {
    const view = galleryView(8, FIXTURE); // 8 → 0
    expect(view.project.slug).toBe("p0");
    expect(view.counter).toBe("01/08");
  });
});
