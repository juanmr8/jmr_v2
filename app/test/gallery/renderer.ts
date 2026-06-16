/* ════════════════════════════════════════════════════════════
   GALLERY RENDERER · the swappable seam (BRD / ADR-0001).
   Pure OGL over a single <canvas>. No React, no Next, no DOM
   measurement — the caller hands us a canvas, the Plane colors,
   and (via input/resize) the live pixel box; we own the RAF loop.

   This loop is the per-frame source of truth for Plane position &
   scale (Slice 3). Scroll impulses feed momentum; momentum decays
   then snaps so exactly one Plane fills the Active Slot. The Active
   index escapes via onActiveChange the moment the Plane nearest the
   Active Slot changes — live, as the strip moves — but deduped, so
   it emits once per project crossing, never per frame. The geometry
   math is pure and lives in ./gallery-motion.
════════════════════════════════════════════════════════════ */

import { Renderer, Camera, Transform, Plane, Program, Mesh, Color } from "ogl";
import gsap from "gsap";
import { snapTarget, activeIndex } from "./gallery-logic";
import { decayVelocity, layout, type GalleryGeometry } from "./gallery-motion";

/* ── Feel constants. Tune these for input weight / glide / snap. ──
   INPUT_GAIN  : steps/sec of velocity added per wheel pixel.
   FRICTION    : per-frame (60fps) velocity multiplier — lower = shorter glide.
   MIN_VELOCITY: steps/sec below which momentum yields to the snap.
   SNAP_*      : the settle tween onto the nearest whole step. */
const INPUT_GAIN = 0.0045;
const FRICTION = 0.92;
const MIN_VELOCITY = 0.12;
const SNAP_DURATION = 0.5;
const SNAP_EASE = "power3.out";

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
  /** Emitted live with the new discrete Active index whenever the Plane
      nearest the Active Slot changes — deduped to one call per crossing. */
  onActiveChange?: (index: number) => void;
}

export interface GalleryRenderer {
  /** Lay the strip out for a new pixel box and gutter, then redraw. */
  resize(width: number, height: number, gutterPx: number): void;
  /** Feed a scroll/trackpad delta (px). Cancels any snap and adds momentum. */
  input(deltaPx: number): void;
  /** Release the GL context, RAF loop, and tweens. */
  destroy(): void;
}

export function createGalleryRenderer({
  canvas,
  colors,
  onActiveChange,
}: GalleryRendererOptions): GalleryRenderer {
  const renderer = new Renderer({
    canvas,
    dpr: Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2),
    alpha: true, // transparent — the page background shows through
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const camera = new Camera(gl, { left: -1, right: 1, bottom: -1, top: 1 });
  camera.position.z = 1; // keep z=0 Planes inside the near/far clip range

  const scene = new Transform();
  const geometry = new Plane(gl); // unit quad, centered — scaled per Plane below
  const total = colors.length;

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

  // ── Motion state. `offset` is continuous scroll in plane-steps. ──
  let geom: GalleryGeometry | null = null;
  let offset = 0;
  let velocity = 0; // steps/sec
  let mode: "idle" | "momentum" | "snapping" = "idle";
  let lastActive = 0;
  let snapTween: gsap.core.Tween | null = null;
  let raf: number | null = null;
  let lastTime = 0;

  function draw(): void {
    if (!geom) return;
    const planes = layout(offset, total, geom);
    meshes.forEach((mesh, i) => {
      const p = planes[i];
      mesh.scale.set(p.side, p.side, 1);
      mesh.position.x = p.x;
      mesh.position.y = p.y;
    });
    renderer.render({ scene, camera });
  }

  // Emit the discrete Active index whenever the Plane nearest the Active Slot
  // changes — live, as the strip moves. snapTarget rounds the continuous offset
  // to the nearest whole step, so this flips the instant the strip crosses each
  // half-step. Deduped against the last emit: React re-renders once per project
  // crossing, never per frame.
  function syncActive(): void {
    const index = activeIndex(snapTarget(offset), total);
    if (index === lastActive) return;
    lastActive = index;
    onActiveChange?.(index);
  }

  function startSnap(): void {
    velocity = 0;
    mode = "snapping";
    const target = snapTarget(offset);
    snapTween = gsap.to(
      { offset },
      {
        offset: target,
        duration: SNAP_DURATION,
        ease: SNAP_EASE,
        onUpdate(this: gsap.core.Tween) {
          offset = (this.targets()[0] as { offset: number }).offset;
        },
        onComplete() {
          offset = target;
          snapTween = null;
          mode = "idle";
          syncActive();
        },
      }
    );
  }

  function tick(now: number): void {
    const dt = Math.min((now - lastTime) / 1000, 1 / 30); // clamp long stalls
    lastTime = now;

    if (mode === "momentum") {
      offset += velocity * dt;
      velocity = decayVelocity(velocity, dt, FRICTION);
      if (Math.abs(velocity) < MIN_VELOCITY) startSnap();
    }

    syncActive(); // live (deduped) — runs through momentum and the snap glide
    draw();
    raf = mode === "idle" ? null : requestAnimationFrame(tick);
  }

  function ensureLoop(): void {
    if (raf !== null) return;
    lastTime = typeof performance !== "undefined" ? performance.now() : 0;
    raf = requestAnimationFrame(tick);
  }

  function resize(width: number, height: number, gutterPx: number): void {
    if (width <= 0 || height <= 0) return;
    renderer.setSize(width, height);
    camera.orthographic({
      left: -width / 2,
      right: width / 2,
      bottom: -height / 2,
      top: height / 2,
    });
    geom = { width, height, gutter: gutterPx };
    draw(); // redraw immediately even while idle
  }

  function input(deltaPx: number): void {
    snapTween?.kill();
    snapTween = null;
    velocity += deltaPx * INPUT_GAIN;
    mode = "momentum";
    ensureLoop();
  }

  function destroy(): void {
    if (raf !== null) cancelAnimationFrame(raf);
    snapTween?.kill();
    const ext = gl.getExtension("WEBGL_lose_context");
    ext?.loseContext();
  }

  return { resize, input, destroy };
}
