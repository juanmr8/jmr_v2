/* ════════════════════════════════════════════════════════════
   GALLERY RENDERER · the swappable seam (BRD / ADR-0001).
   Pure OGL over a single <canvas>. No React, no Next, no DOM
   measurement — the caller hands us a canvas, the Plane colors,
   and the live pixel box; we draw the static strip.

   Slice 2 is static: one Plane fills the leftmost Active Slot at
   full height; every other Plane shares one uniform smaller scale;
   16px gutter between them. No motion — we render once per resize.
   Coordinates are CSS pixels (orthographic, center origin, +y up),
   so "Active side = inner height" and "16px gutter" map 1:1.
════════════════════════════════════════════════════════════ */

import { Renderer, Camera, Transform, Plane, Program, Mesh, Color } from "ogl";

/** Inactive Plane side as a fraction of the Active side (the inner height).
    One uniform value so the strip reads as "one hero plus a queue of equals."
    ~0.62 echoes the tallest non-hero box in the prior placeholder strip. */
const INACTIVE_SCALE = 0.62;

const vertex = /* glsl */ `
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  void main() {
    gl_FragColor = vec4(uColor, 1.0);
  }
`;

export interface GalleryRendererOptions {
  canvas: HTMLCanvasElement;
  /** One flat placeholder color per Plane, in Project order. */
  colors: string[];
}

export interface GalleryRenderer {
  /** Lay the strip out for a new pixel box and gutter, then draw one frame. */
  resize(width: number, height: number, gutterPx: number): void;
  /** Release the GL context and listeners. */
  destroy(): void;
}

export function createGalleryRenderer({
  canvas,
  colors,
}: GalleryRendererOptions): GalleryRenderer {
  const renderer = new Renderer({
    canvas,
    dpr: Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2),
    alpha: true, // transparent — the page background shows through
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  // left/right set → orthographic. Real bounds are applied in resize().
  const camera = new Camera(gl, { left: -1, right: 1, bottom: -1, top: 1 });
  camera.position.z = 1; // keep z=0 Planes inside the near/far clip range

  const scene = new Transform();
  const geometry = new Plane(gl); // unit quad, centered — scaled per Plane below

  const meshes = colors.map((hex) => {
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: { uColor: { value: new Color(hex) } },
    });
    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);
    return mesh;
  });

  function resize(width: number, height: number, gutterPx: number): void {
    if (width <= 0 || height <= 0) return;

    renderer.setSize(width, height);
    const halfW = width / 2;
    const halfH = height / 2;
    camera.orthographic({ left: -halfW, right: halfW, bottom: -halfH, top: halfH });

    const activeSide = height; // Active Plane fills the full inner height
    const inactiveSide = height * INACTIVE_SCALE;

    // Walk left → right. The Active Slot is fixed at the left edge; the cursor
    // tracks the right edge of the last laid Plane so gutters stay exact.
    let cursorRight = -halfW; // left edge of the strip
    meshes.forEach((mesh, i) => {
      const isActive = i === 0;
      const side = isActive ? activeSide : inactiveSide;
      const leftEdge = isActive ? cursorRight : cursorRight + gutterPx;

      mesh.scale.set(side, side, 1);
      mesh.position.x = leftEdge + side / 2;
      mesh.position.y = -halfH + side / 2; // bottom-aligned on the strip baseline

      cursorRight = leftEdge + side;
    });

    renderer.render({ scene, camera });
  }

  function destroy(): void {
    const ext = gl.getExtension("WEBGL_lose_context");
    ext?.loseContext();
  }

  return { resize, destroy };
}
