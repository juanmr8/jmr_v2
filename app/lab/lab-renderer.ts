/* ════════════════════════════════════════════════════════════
   LAB RENDERER · the swappable seam, modeled on the Gallery's
   (see gallery/renderer.ts, ADR-0001). Pure OGL over a single
   <canvas>. No React, no Next, no DOM measurement — the caller
   hands us a canvas, the pieces, and (via resize) the live pixel
   box; we own the RAF loop.

   This loop is the per-frame source of truth for the pan. Wheel
   deltas feed momentum; drag moves the pan directly and hands its
   parting speed to momentum on release. There is no snap — the Lab
   pans freely — and no edge: the offset wraps modulo the Cluster,
   and lab-layout re-derives the visible copies every frame, so the
   field repeats seamlessly in every direction.

   The camera is PERSPECTIVE, sized so the z=0 plane maps 1:1 to
   CSS pixels — same coordinates as before, but the shader's Z-bend
   (lab-shaders) reads: the field warps with the pan velocity and
   splits color channels past a threshold, the project detail
   gallery's language on two axes. The entrance reuses its intro
   too: the field rises into place, warped, easing flat as it
   fades in — held until the piece images are decoded (with a cap,
   so a slow network can't hold the page hostage).
════════════════════════════════════════════════════════════ */

import { Renderer, Camera, Transform, Plane, Program, Mesh, Color, Texture } from "ogl";
import {
  clusterScale,
  instances,
  wrapCoord,
  type ClusterSize,
  type PieceInstance,
  type PieceRect,
} from "./lab-layout";
import { isSettled, stepPan, type PanState } from "./lab-motion";
import { labFragment, labVertex } from "./lab-shaders";

/* ── Feel constants. Tune these for input weight / glide. ──
   WHEEL_GAIN   : (units/sec) of velocity per design-unit of wheel delta —
                  at FRICTION 0.92 the glide covers ≈1× the flick.
   FRICTION     : per-frame (60fps) velocity multiplier — lower = shorter glide.
   HOLD_FRICTION: decay applied to the tracked speed while a drag is parked, so
                  press–hold–release doesn't fling.
   MIN_VELOCITY : units/sec below which the glide parks and the loop stops.
   DRAG_SMOOTH  : lerp toward the live drag speed — the release momentum reads
                  the gesture's recent motion, not one noisy frame.
   MAX_FLING    : release/wheel speed ceiling (units/sec). */
const WHEEL_GAIN = 5;
const FRICTION = 0.92;
const HOLD_FRICTION = 0.8;
const MIN_VELOCITY = 8;
const DRAG_SMOOTH = 0.25;
const MAX_FLING = 4000;

/* ── Warp feel (mirrors the project detail gallery's constants). ──
   CAMERA_Z       : perspective distance (px) — smaller bends harder per px of Z.
   BEND           : full-scale warp amplitude as a fraction of viewport height.
   DRAG_BOOST     : strength multiplier while grabbing, so a drag reacts more
                    visibly than a scroll (their DRAG_BOOST).
   STRENGTH_SMOOTH: per-frame lerp toward the live velocity — the warp eases in
                    and relaxes instead of jittering with the pointer. */
const CAMERA_Z = 1200;
const BEND = 0.55;
const DRAG_BOOST = 4.5;
const STRENGTH_SMOOTH = 0.15;
/** Loop keeps running below this residual strength is treated as flat. */
const STRENGTH_REST = 0.002;

/* ── Entrance (their INTRO_* language). The field starts lower, warped and
   transparent, then rises home while relaxing flat and fading in. ── */
const INTRO_SECONDS = 1.4;
const INTRO_SLIDE = 340; // design units the field rises
const INTRO_WARP = 1.8; // normalised strength at t=0
const TEXTURE_WAIT_MS = 3000; // cap on holding the entrance for slow images

// easeOutCubic — fast start, gentle settle, so the warp eases flat at the end.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** What the renderer needs per piece: where it sits, and what fills it. */
export interface LabRendererPiece {
  rect: PieceRect;
  /** Public image path; absent (or until decoded) the plane paints `color`. */
  image?: string;
}

export interface LabRendererOptions {
  canvas: HTMLCanvasElement;
  pieces: readonly LabRendererPiece[];
  cluster: ClusterSize;
  /** Flat stand-in painted while a piece's image is loading (or missing). */
  color: string;
  /** Emitted every redraw with the live visible instances (DOM space), so a
      DOM overlay layer can track the planes per frame — the Gallery's
      ADR-0001 seam, kept here for the piece links (AD-129). */
  onFrame?: (rects: PieceInstance[]) => void;
}

export interface LabRenderer {
  /** Lay the field out for a new pixel box, then redraw. */
  resize(width: number, height: number): void;
  /** Feed a wheel/trackpad delta (px, both axes). Adds momentum. */
  wheel(dxPx: number, dyPx: number): void;
  /** A drag gesture begins: kill momentum, follow the pointer. */
  dragStart(): void;
  /** The pointer moved by (dxPx, dyPx) — the field follows 1:1. */
  dragMove(dxPx: number, dyPx: number): void;
  /** The gesture ended: hand its parting speed to momentum. */
  dragEnd(): void;
  /** Stop the RAF loop. The GL context is left intact so a re-mounted effect
      can reuse the same canvas (see the Gallery renderer's destroy note). */
  destroy(): void;
}

const clampSpeed = (v: number) => Math.max(-MAX_FLING, Math.min(MAX_FLING, v));
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));

export function createLabRenderer({
  canvas,
  pieces,
  cluster,
  color,
  onFrame,
}: LabRendererOptions): LabRenderer {
  const renderer = new Renderer({
    canvas,
    dpr: Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2),
    alpha: true, // transparent — the shell background shows through
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const camera = new Camera(gl);
  camera.position.z = CAMERA_Z;

  const scene = new Transform();
  // Subdivided so the vertex warp curves the surface, not just the corners.
  const geometry = new Plane(gl, { widthSegments: 20, heightSegments: 20 });

  // One program per piece: each carries its own texture/size uniforms. The
  // shared per-frame uniforms (strength, opacity, bend, viewport) are written
  // to every program each draw — a handful of pieces, negligible.
  const items = pieces.map((piece) => {
    const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
    const program = new Program(gl, {
      vertex: labVertex,
      fragment: labFragment,
      transparent: true, // the entrance fades uOpacity 0 -> 1
      uniforms: {
        uTexture: { value: texture },
        uImageSizes: { value: [1, 1] },
        uPlaneSizes: { value: [piece.rect.w, piece.rect.h] }, // only the ratio matters
        uColor: { value: new Color(color) },
        uHasTexture: { value: 0 },
        uOpacity: { value: 0 },
        uStrength: { value: [0, 0] },
        uBend: { value: 0 },
        uViewportSizes: { value: [1, 1] },
      },
    });
    return { piece, texture, program };
  });

  // Meshes are a pool, not one-per-piece: how many copies are visible varies
  // with the pan, so the pool grows to the high-water mark and extras hide.
  // Each frame a pool mesh borrows the program of the piece it's showing.
  const pool: Mesh[] = [];
  function ensurePool(n: number): void {
    while (pool.length < n) {
      const mesh = new Mesh(gl, { geometry, program: items[0].program });
      mesh.setParent(scene);
      pool.push(mesh);
    }
  }

  // ── Motion state. The pan offset lives in design units, wrapped into one
  // Cluster span each frame so float precision never drifts on a long journey.
  const pan: PanState = { x: 0, y: 0, vx: 0, vy: 0 };
  let width = 0;
  let height = 0;
  let scale = 1;
  let mode: "idle" | "drag" | "momentum" = "idle";
  let raf: number | null = null;
  let lastTime = 0;

  // Design units the pan travelled since the last tick consumed them — drag
  // and momentum both deposit here, the tick turns them into warp strength.
  let movedX = 0;
  let movedY = 0;
  // Smoothed normalised velocity — what the shaders read.
  const strength = { x: 0, y: 0 };

  // ── Entrance state. Held until the piece images are decoded (or the cap),
  // then t runs 0 -> 1: the field rises INTRO_SLIDE, warp relaxes from
  // INTRO_WARP to live, opacity follows the ease.
  let introStarted = false;
  let introT = 0;
  let pendingImages = 0;
  let introTimeout: ReturnType<typeof setTimeout> | null = null;

  function startIntro(): void {
    if (introStarted) return;
    introStarted = true;
    if (introTimeout !== null) clearTimeout(introTimeout);
    ensureLoop();
  }

  for (const item of items) {
    const src = item.piece.image;
    if (!src) continue;
    pendingImages++;
    const img = new Image();
    img.onload = () => {
      item.texture.image = img;
      item.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
      item.program.uniforms.uHasTexture.value = 1;
      if (--pendingImages === 0) startIntro();
      if (raf === null) draw(); // repaint a parked frame with the new texture
    };
    img.onerror = () => {
      if (--pendingImages === 0) startIntro(); // stays a flat placeholder
    };
    img.src = src;
  }
  if (pendingImages === 0) startIntro();
  else introTimeout = setTimeout(startIntro, TEXTURE_WAIT_MS);

  function draw(): void {
    // Bail with no real box yet, or if the GL context was lost (tab GPU reset)
    // — drawing on a lost context throws inside OGL's render().
    if (width <= 0 || gl.isContextLost()) return;
    const eased = easeOut(introT);
    // The rise is a draw-time displacement, not a pan mutation — the wrap math
    // and the resting offset never know the entrance happened.
    const view = { x: pan.x, y: pan.y - INTRO_SLIDE * (1 - eased) };
    const sx = strength.x;
    const sy = strength.y + INTRO_WARP * (1 - eased);
    for (const item of items) {
      item.program.uniforms.uStrength.value = [sx, sy];
      item.program.uniforms.uOpacity.value = eased;
    }
    const visible = instances(
      items.map((it) => it.piece.rect),
      view,
      { width, height },
      cluster,
      scale
    );
    ensurePool(visible.length);
    pool.forEach((mesh, k) => {
      if (k >= visible.length) {
        mesh.visible = false;
        return;
      }
      const r = visible[k];
      mesh.visible = true;
      mesh.program = items[r.index].program;
      mesh.scale.set(r.width, r.height, 1);
      // DOM rect (top-left origin, +y down) → camera space (center, +y up).
      mesh.position.x = r.left + r.width / 2 - width / 2;
      mesh.position.y = height / 2 - (r.top + r.height / 2);
    });
    renderer.render({ scene, camera });
    onFrame?.(visible);
  }

  function tick(now: number): void {
    const dt = Math.min((now - lastTime) / 1000, 1 / 30); // clamp long stalls
    lastTime = now;

    if (mode === "momentum") {
      const next = stepPan(pan, dt, FRICTION);
      movedX += next.x - pan.x;
      movedY += next.y - pan.y;
      pan.x = wrapCoord(next.x, cluster.w);
      pan.y = wrapCoord(next.y, cluster.h);
      pan.vx = next.vx;
      pan.vy = next.vy;
      if (isSettled(pan, MIN_VELOCITY)) {
        pan.vx = 0;
        pan.vy = 0;
        mode = "idle";
      }
    } else if (mode === "drag") {
      // The pointer owns the position; only the tracked release speed decays,
      // so a parked finger sheds its momentum before letting go.
      const held = stepPan(pan, dt, HOLD_FRICTION);
      pan.vx = held.vx;
      pan.vy = held.vy;
    }

    // Frame travel (px, normalised per axis) → warp strength, boosted while
    // grabbing so a drag reacts harder than a scroll, smoothed so the field
    // eases into the warp and relaxes flat instead of twitching.
    const boost = mode === "drag" ? DRAG_BOOST : 1;
    const tx = clamp1(((movedX * scale) / width) * boost);
    const ty = clamp1(((movedY * scale) / height) * boost);
    movedX = 0;
    movedY = 0;
    strength.x += (tx - strength.x) * STRENGTH_SMOOTH;
    strength.y += (ty - strength.y) * STRENGTH_SMOOTH;

    if (introStarted && introT < 1) introT = Math.min(1, introT + dt / INTRO_SECONDS);

    draw();
    // Park only once fully settled: no gesture, no glide, entrance done, and
    // the warp has relaxed flat (a bent field must never freeze mid-warp).
    const flat = Math.abs(strength.x) < STRENGTH_REST && Math.abs(strength.y) < STRENGTH_REST;
    const settled = mode === "idle" && flat && (introT >= 1 || !introStarted);
    if (settled) {
      strength.x = 0;
      strength.y = 0;
      raf = null;
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  function ensureLoop(): void {
    if (raf !== null) return;
    lastTime = typeof performance !== "undefined" ? performance.now() : 0;
    raf = requestAnimationFrame(tick);
  }

  function resize(w: number, h: number): void {
    if (w <= 0 || h <= 0) return;
    renderer.setSize(w, h);
    // Perspective sized so the z=0 plane maps 1:1 to CSS pixels — same mesh
    // coordinates as an orthographic camera, but the shader's Z-bend reads.
    camera.perspective({
      fov: (2 * Math.atan(h / 2 / CAMERA_Z) * 180) / Math.PI,
      aspect: w / h,
      near: 100,
      far: CAMERA_Z * 2,
    });
    width = w;
    height = h;
    scale = clusterScale(w);
    for (const item of items) {
      item.program.uniforms.uViewportSizes.value = [w, h];
      item.program.uniforms.uBend.value = h * BEND;
    }
    draw(); // redraw immediately even while idle
  }

  function wheel(dxPx: number, dyPx: number): void {
    if (mode === "drag") return; // the pointer owns the pan mid-gesture
    if (!introStarted || introT < 1) return; // pan unlocks after the entrance
    pan.vx = clampSpeed(pan.vx + (dxPx / scale) * WHEEL_GAIN);
    pan.vy = clampSpeed(pan.vy + (dyPx / scale) * WHEEL_GAIN);
    mode = "momentum";
    ensureLoop();
  }

  let lastMoveTime = 0;
  function dragStart(): void {
    if (!introStarted || introT < 1) return;
    pan.vx = 0;
    pan.vy = 0;
    lastMoveTime = typeof performance !== "undefined" ? performance.now() : 0;
    mode = "drag";
    ensureLoop();
  }

  function dragMove(dxPx: number, dyPx: number): void {
    if (mode !== "drag") return;
    // The field follows the pointer 1:1: moving the hand right reveals what
    // lies to the left, so the offset runs against the pointer delta.
    const dx = -dxPx / scale;
    const dy = -dyPx / scale;
    pan.x = wrapCoord(pan.x + dx, cluster.w);
    pan.y = wrapCoord(pan.y + dy, cluster.h);
    movedX += dx;
    movedY += dy;
    // Sample the gesture's live speed for the release momentum, smoothed over
    // recent moves so one noisy frame can't set the fling.
    const now = typeof performance !== "undefined" ? performance.now() : 0;
    const sampleDt = Math.min(Math.max((now - lastMoveTime) / 1000, 1 / 240), 1 / 30);
    lastMoveTime = now;
    pan.vx += (clampSpeed(dx / sampleDt) - pan.vx) * DRAG_SMOOTH;
    pan.vy += (clampSpeed(dy / sampleDt) - pan.vy) * DRAG_SMOOTH;
  }

  function dragEnd(): void {
    if (mode !== "drag") return;
    mode = isSettled(pan, MIN_VELOCITY) ? "idle" : "momentum";
  }

  function destroy(): void {
    if (raf !== null) cancelAnimationFrame(raf);
    if (introTimeout !== null) clearTimeout(introTimeout);
    // Deliberately NOT losing the GL context — see gallery/renderer.ts: React
    // re-runs the effect on the SAME canvas, which only ever hands back its
    // one context. We stop what we own: the RAF loop and the intro timer.
  }

  return { resize, wheel, dragStart, dragMove, dragEnd, destroy };
}
