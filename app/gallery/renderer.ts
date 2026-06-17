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
import {
  decayVelocity,
  entranceOffset,
  layout,
  loopRank,
  screenRect,
  type GalleryGeometry,
  type ScreenRect,
} from "./gallery-motion";

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

/* ── Intro feel. The one-time entrance played when the Gallery mounts (the
   "Intro" — see CONTEXT.md). The spatial magnitudes live in gallery-motion;
   these are the timing.
   ENTRANCE_DURATION : per-Plane ease time (s).
   ENTRANCE_STAGGER  : delay between consecutive Planes (s) — Active first.
   ENTRANCE_EASE     : settle curve — same deceleration language as the snap. */
const ENTRANCE_DURATION = 0.7;
const ENTRANCE_STAGGER = 0.08;
const ENTRANCE_EASE = "power3.out";

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
  /** Emitted every redraw with each Plane's live on-screen rect (DOM space,
      Plane order), so the DOM link overlays can track the strip per frame —
      ADR-0001: anchors follow the Planes, no in-canvas hit-testing. */
  onFrame?: (rects: ScreenRect[]) => void;
}

export interface GalleryRenderer {
  /** Lay the strip out for a new pixel box and gutter, then redraw. */
  resize(width: number, height: number, gutterPx: number): void;
  /** Feed a scroll/trackpad delta (px). Cancels any snap and adds momentum. */
  input(deltaPx: number): void;
  /** Stop the RAF loop and any running tween. The GL context is left intact so
      a re-mounted effect can reuse the same canvas (see destroy() body). */
  destroy(): void;
}

export function createGalleryRenderer({
  canvas,
  colors,
  onActiveChange,
  onFrame,
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
  let mode: "idle" | "momentum" | "snapping" | "entrance" = "idle";
  let lastActive = 0;
  let snapTween: gsap.core.Tween | null = null;
  let raf: number | null = null;
  let lastTime = 0;

  // ── Intro state. One entrance progress per Plane (0 = off-screen below-right,
  // 1 = home), layered on the resting layout in draw(). Two Planes start home:
  // under prefers-reduced-motion every Plane does (the Intro is skipped), and
  // the leaver — the one Plane resting off-screen-left at offset 0 (loopRank < 0)
  // — always does, so it can't streak across the viewport mid-entrance.
  const reduceMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const introProgress = colors.map((_, i) => {
    const offLeft = total > 1 && loopRank(i, total) < 0;
    return { p: reduceMotion || offLeft ? 1 : 0 };
  });
  let introTween: gsap.core.Tween | null = null;
  let introStarted = false;

  function draw(): void {
    // Bail if we have no geometry yet, or the GL context was lost (tab GPU
    // reset, browser context limit). Drawing on a lost context reads OGL's
    // program/attribute maps as undefined and throws inside render().
    if (!geom || gl.isContextLost()) return;
    const g = geom; // narrow for the closures below
    // Resting layout + each Plane's live Intro displacement (zero once home, so
    // this is identity for every frame after the entrance finishes). The offset
    // Planes drive both the meshes and the overlay rects, so anchors ride along.
    const planes = layout(offset, total, g).map((p, i) => {
      const { dx, dy } = entranceOffset(introProgress[i].p, g);
      return { x: p.x + dx, y: p.y + dy, side: p.side };
    });
    meshes.forEach((mesh, i) => {
      const p = planes[i];
      mesh.scale.set(p.side, p.side, 1);
      mesh.position.x = p.x;
      mesh.position.y = p.y;
    });
    renderer.render({ scene, camera });
    // Hand the same per-frame rects to the DOM overlay layer (anchors track the
    // Planes). Runs on every redraw — momentum, snap glide, and idle resize —
    // so overlays stay synced even when the RAF loop is parked.
    onFrame?.(planes.map((p) => screenRect(p, g)));
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

  // The Intro: ease every Plane home from off-screen, staggered in array order
  // (Plane 0 is the Active Plane at offset 0, so it lands first; the queue
  // follows left-to-right). Runs once, on the first real geometry. Scroll is
  // locked until it completes (input() no-ops while mode === "entrance"). The
  // leaver and — under reduced motion — every Plane already sit at p=1, so the
  // tween is a no-op for them. Skipped entirely under reduced motion.
  function startIntro(): void {
    if (introStarted || reduceMotion) return;
    introStarted = true;
    mode = "entrance";
    introTween = gsap.to(introProgress, {
      p: 1,
      duration: ENTRANCE_DURATION,
      ease: ENTRANCE_EASE,
      stagger: ENTRANCE_STAGGER,
      onComplete() {
        introProgress.forEach((o) => (o.p = 1));
        introTween = null;
        mode = "idle";
        draw(); // settle on the final resting frame
      },
    });
    ensureLoop();
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
    draw(); // redraw immediately even while idle — paints the entrance state
    // before the tween starts (introProgress=0), so the first frame is the
    // Planes off-screen, never a flash of the resting layout.
    startIntro(); // begins on the first real geometry; no-op after the first call
  }

  function input(deltaPx: number): void {
    if (mode === "entrance") return; // Intro locks scroll until it completes
    snapTween?.kill();
    snapTween = null;
    velocity += deltaPx * INPUT_GAIN;
    mode = "momentum";
    ensureLoop();
  }

  function destroy(): void {
    if (raf !== null) cancelAnimationFrame(raf);
    snapTween?.kill();
    introTween?.kill();
    // Deliberately NOT calling WEBGL_lose_context.loseContext(): React
    // (StrictMode / Fast Refresh) tears this effect down and re-runs it on the
    // SAME <canvas>, and a canvas only ever hands back its one context. Losing
    // it here poisons the next renderer built on that canvas — its programs
    // compile against a dead context and render() throws. The context is freed
    // by the browser when the canvas unmounts; the RAF loop + tween are what we
    // actually own and stop here.
  }

  return { resize, input, destroy };
}
