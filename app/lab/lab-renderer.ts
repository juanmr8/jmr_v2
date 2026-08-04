/* ════════════════════════════════════════════════════════════
   LAB RENDERER · the swappable seam, modeled on the Gallery's
   (see gallery/renderer.ts, ADR-0001). Pure OGL over a single
   <canvas>. No React, no Next, no DOM measurement — the caller
   hands us a canvas, the piece rects, and (via resize) the live
   pixel box; we own the RAF loop.

   This loop is the per-frame source of truth for the pan. Wheel
   deltas feed momentum; drag moves the pan directly and hands its
   parting speed to momentum on release. There is no snap — the Lab
   pans freely — and no edge: the offset wraps modulo the Cluster,
   and lab-layout re-derives the visible copies every frame, so the
   field repeats seamlessly in every direction.
════════════════════════════════════════════════════════════ */

import { Renderer, Camera, Transform, Plane, Program, Mesh, Color } from "ogl";
import {
  clusterScale,
  instances,
  wrapCoord,
  type ClusterSize,
  type PieceInstance,
  type PieceRect,
} from "./lab-layout";
import { isSettled, stepPan, type PanState } from "./lab-motion";

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

export interface LabRendererOptions {
  canvas: HTMLCanvasElement;
  /** Each piece's placement inside the Cluster, in piece order. */
  pieces: readonly PieceRect[];
  cluster: ClusterSize;
  /** Flat placeholder color shared by every plane (textures come later). */
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

  const camera = new Camera(gl, { left: -1, right: 1, bottom: -1, top: 1 });
  camera.position.z = 1; // keep z=0 planes inside the near/far clip range

  const scene = new Transform();
  const geometry = new Plane(gl); // unit quad, centered — scaled per instance
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: { uColor: { value: new Color(color) } },
  });

  // Meshes are a pool, not one-per-piece: how many copies are visible varies
  // with the pan, so the pool grows to the high-water mark and extras hide.
  const pool: Mesh[] = [];
  function ensurePool(n: number): void {
    while (pool.length < n) {
      const mesh = new Mesh(gl, { geometry, program });
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

  function draw(): void {
    // Bail with no real box yet, or if the GL context was lost (tab GPU reset)
    // — drawing on a lost context throws inside OGL's render().
    if (width <= 0 || gl.isContextLost()) return;
    const visible = instances(pieces, pan, { width, height }, cluster, scale);
    ensurePool(visible.length);
    pool.forEach((mesh, k) => {
      if (k >= visible.length) {
        mesh.visible = false;
        return;
      }
      const r = visible[k];
      mesh.visible = true;
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

    draw();
    raf = mode === "idle" ? null : requestAnimationFrame(tick);
  }

  function ensureLoop(): void {
    if (raf !== null) return;
    lastTime = typeof performance !== "undefined" ? performance.now() : 0;
    raf = requestAnimationFrame(tick);
  }

  function resize(w: number, h: number): void {
    if (w <= 0 || h <= 0) return;
    renderer.setSize(w, h);
    camera.orthographic({ left: -w / 2, right: w / 2, bottom: -h / 2, top: h / 2 });
    width = w;
    height = h;
    scale = clusterScale(w);
    draw(); // redraw immediately even while idle
  }

  function wheel(dxPx: number, dyPx: number): void {
    if (mode === "drag") return; // the pointer owns the pan mid-gesture
    pan.vx = clampSpeed(pan.vx + (dxPx / scale) * WHEEL_GAIN);
    pan.vy = clampSpeed(pan.vy + (dyPx / scale) * WHEEL_GAIN);
    mode = "momentum";
    ensureLoop();
  }

  let lastMoveTime = 0;
  function dragStart(): void {
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
    // Deliberately NOT losing the GL context — see gallery/renderer.ts: React
    // re-runs the effect on the SAME canvas, which only ever hands back its
    // one context. We stop what we own: the RAF loop.
  }

  return { resize, wheel, dragStart, dragMove, dragEnd, destroy };
}
