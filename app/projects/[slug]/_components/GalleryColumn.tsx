"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import GalleryPlane from "./GalleryPlane";
import { useGalleryStore } from "./useGalleryStore";
import { PLACEHOLDER_FRAME_COUNT } from "./gallery-frames";

const GAP_PX = 40;
const LERP = 0.085;      // inertia during wheel / touch
const DRAG_LERP = 0.18;  // tighter follow during mouse drag → larger velocity spike
const BEND = 1.6;        // max warp amplitude in world units
// Extra strength multiplier applied only while mouse-dragging so the warp and
// chromatic aberration react more visibly to grabbing than to scrolling.
// Tunable from DevTools: window.__gallery.dragBoost = 2.0
const DRAG_BOOST = 2.8;
const INTRO_SECONDS = 1.4;
const AUTO_SCROLL = 90;
// Intro is tuned independently of scroll-time feel: planes are now wider and
// shorter (landscape), which shrinks both `step` and the relative read of BEND,
// so the intro slides several planes and warps harder to keep its old impact.
const INTRO_SLIDE = 2.4;  // planes swept during the intro
const INTRO_WARP = 1.8;   // warp multiplier vs. BEND, intro only

// easeOutCubic — fast start, gentle settle, so the warp eases flat near the end.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

interface Props {
  images: string[];
  slug: string;
  color: string; // flat fill for placeholder projects (no images yet)
}

export default function GalleryColumn({ images, slug, color }: Props) {
  const { size, viewport } = useThree();
  const textures = useTexture(images) as THREE.Texture[];
  textures.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace));

  // Frames in one loop cycle: real images, or a fixed run of flat-color planes
  // when this project has none yet. Everything below sizes off `frameCount`, so
  // an image-less project still loops instead of collapsing to NaN geometry.
  const frameCount = images.length || PLACEHOLDER_FRAME_COUNT;

  // CSS pixels -> world units at the z=0 focal plane (perspective camera).
  const pxToWorld = viewport.width / size.width;

  // Uniform plane size, anchored in the second fourth, left edges aligned.
  // Images are 4000×2766 (landscape); planes match that ratio so no cropping.
  const IMAGE_ASPECT = 4000 / 2766;
  const planeWpx = THREE.MathUtils.clamp(size.width * 0.34, 420, 680);
  const planeHpx = planeWpx / IMAGE_ASPECT;
  const W = planeWpx * pxToWorld;
  const H = planeHpx * pxToWorld;
  const gap = GAP_PX * pxToWorld;
  const step = H + gap;

  // One image cycle in CSS pixels — used to map the scroll offset to mini-map
  // progress, and to size the mini-map's viewport frame.
  const stepPx = planeHpx + GAP_PX;
  const cyclePx = frameCount * stepPx;
  const frameRatio = THREE.MathUtils.clamp(size.height / cyclePx, 0, 1);

  // Left edge at ~25% of the viewport; every image shares this left edge.
  const xLeft = -viewport.width / 2 + viewport.width * 0.25;
  const xCenter = xLeft + W / 2;

  // Duplicate the set enough times to fill the loop without gaps (covers
  // projects with only a few images).
  const baseStack = frameCount * step;
  const reps = Math.max(2, Math.ceil((viewport.height * 2) / baseStack));
  const count = frameCount * reps;
  const totalH = count * step;

  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        texture: textures[i % frameCount],
        imageIndex: i % frameCount,
        baseY: -i * step,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, step, frameCount, textures]
  );

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const current = useRef(0); // lerped scroll offset, in CSS pixels
  const lastRatio = useRef(-1);
  // Intro progress, 0 -> 1. Textures are loaded by the time this column mounts
  // (useTexture suspends), so the column appears hidden and warped, then fades
  // in while the warp relaxes flat — the same Z-bend as scrolling at max speed.
  const intro = useRef(0);
  // Continuous upward drift accrued over time; scroll input (targetOffset) adds
  // to or subtracts from this, so the gallery always advances on its own.
  const auto = useRef(0);

  // This component renders only after useTexture resolves (Suspense), so its
  // mount is the moment this project's images are ready — cue the overlays for
  // this slug to mount and fade in.
  useEffect(() => {
    useGalleryStore.getState().setLoadedSlug(slug);
  }, [slug]);

  useFrame((_, delta) => {
    const store = useGalleryStore.getState();
    const dragging = store.isDragging;

    // On a hard refresh the first frame after texture decode / GPU upload /
    // shader compile arrives with a huge delta (~1s+). Left unclamped it would
    // advance the intro from 0 to ~1 in a single frame — the warp/slide is gone
    // before anything paints. Client-side nav has no such stall. Clamp the step
    // so time-based motion always plays out over real frames either way.
    const dt = Math.min(delta, 1 / 30);

    auto.current += AUTO_SCROLL * dt;
    const target = store.targetOffset + auto.current;
    const prev = current.current;
    // Tighter lerp while dragging → rendered offset chases the target faster →
    // velocity spike is larger → warp + aberration are more accentuated.
    const lerp = dragging ? DRAG_LERP : LERP;
    current.current = THREE.MathUtils.lerp(current.current, target, lerp);

    intro.current = Math.min(1, intro.current + dt / INTRO_SECONDS);
    const introT = easeOut(intro.current);
    const opacity = introT;
    const introWarp = BEND * INTRO_WARP * (1 - introT);
    const introOffset = -step * INTRO_SLIDE * (1 - introT);

    const offsetWorld = current.current * pxToWorld + introOffset;
    const velNorm = (current.current - prev) / size.height;
    const scrollStrength = THREE.MathUtils.clamp(velNorm * BEND, -BEND, BEND);
    // While grabbing, multiply by dragBoost (live-tunable: window.__gallery.dragBoost).
    const boost = dragging
      ? ((window as any).__gallery?.dragBoost ?? DRAG_BOOST)
      : 1;

    const strength = scrollStrength * boost + introWarp;

    for (let i = 0; i < items.length; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;

      const raw = items[i].baseY + offsetWorld;
      // Wrap into [-totalH/2, totalH/2) so each plane loops independently.
      const wrapped =
        (((raw + totalH / 2) % totalH) + totalH) % totalH - totalH / 2;
      mesh.position.y = wrapped;
      const uniforms = (mesh.material as THREE.ShaderMaterial).uniforms;
      uniforms.uStrength.value = strength;
      uniforms.uOpacity.value = opacity;
    }

    // Publish scroll progress (one image cycle = 0..1) for the mini-map frame.
    const progress = (((current.current / cyclePx) % 1) + 1) % 1;
    store.setProgress(progress);
    if (Math.abs(frameRatio - lastRatio.current) > 1e-4) {
      lastRatio.current = frameRatio;
      store.setFrameRatio(frameRatio);
    }
  });

  return (
    <group>
      {items.map((item, i) => (
        <GalleryPlane
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          texture={item.texture}
          color={color}
          width={W}
          height={H}
          x={xCenter}
          viewportWidth={viewport.width}
          viewportHeight={viewport.height}
        />
      ))}
    </group>
  );
}
