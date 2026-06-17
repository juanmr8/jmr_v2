"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import GalleryPlane from "../projects/[slug]/_components/GalleryPlane";
import { projects } from "../projects/data";
import { wrapIndex } from "../gallery/gallery-logic";
import { useMobileGalleryStore } from "./mobile-gallery-store";

/* ════════════════════════════════════════════════════════════
   MOBILE GALLERY COLUMN · vertical, input-only, looping.
   Forked from the project-detail GalleryColumn but: no ambient
   drift (it sits still until dragged), one Plane per Project (the
   whole set), magnetic settle on release, and an Active Project
   read off a reference line so the Set layer can name it.
════════════════════════════════════════════════════════════ */

// ── Tunables ── eyeball these first; aspect/anchor are the awkward ones.
const PLANE_WIDTH_PCT = 0.78;          // Plane width as a fraction of screen width
const PLANE_ASPECT = 4000 / 2766;      // landscape (source imagery); cover-fit, never distorts
const X_ANCHOR = 0.5;                  // Plane center across the width (0.5 = centered)
const GAP_PX = 14;                     // vertical gap between Planes, CSS px
const REFERENCE_LINE_PCT = 0.5;        // where a Plane becomes Active — centered
const MIN_SCALE = 0.9;                 // resting size of non-Active Planes (Active = 1.0)
const DRAG_LERP = 0.18;                // tight follow while dragging → bigger warp
const SETTLE_LERP = 0.12;              // ease toward the snapped rest on release
const WARP_BEND = 1.4;                 // max Z-bend amplitude, world units
const DRAG_BOOST = 2.4;                // warp/aberration multiplier while grabbing
const INTRO_SECONDS = 1.2;
const INTRO_SLIDE = 2.0;               // Planes swept during the intro
const INTRO_WARP = 1.6;                // warp multiplier vs WARP_BEND, intro only

// 1×1 transparent PNG — only used if no Project has imagery yet, so useTexture
// always gets a non-empty list (it can't be called conditionally).
const TRANSPARENT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function MobileGalleryColumn() {
  const { size, viewport } = useThree();

  // One Plane per Project: its first frame, or a flat color for image-less
  // Projects. Load only the real URLs (useTexture suspends on whatever it gets),
  // then map textures back onto their Project index.
  const planeUrls = useMemo(() => projects.map((p) => p.images[0] ?? null), []);
  const loadList = useMemo(
    () => planeUrls.filter((u): u is string => !!u),
    [planeUrls]
  );
  const loaded = useTexture(loadList.length ? loadList : [TRANSPARENT]) as THREE.Texture[];
  loaded.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace));
  const textures = useMemo(() => {
    let k = 0;
    return planeUrls.map((u) => (u ? loaded[k++] : null));
  }, [planeUrls, loaded]);

  const frameCount = projects.length;

  // CSS px → world units at the z=0 focal plane.
  const pxToWorld = viewport.width / size.width;

  const planeWpx = THREE.MathUtils.clamp(size.width * PLANE_WIDTH_PCT, 240, 560);
  const planeHpx = planeWpx / PLANE_ASPECT;
  const W = planeWpx * pxToWorld;
  const H = planeHpx * pxToWorld;
  const gap = GAP_PX * pxToWorld;
  const step = H + gap;
  const stepPx = planeHpx + GAP_PX;

  // Plane center x and the Active reference line in world Y.
  const xCenter = -viewport.width / 2 + viewport.width * X_ANCHOR;
  const yLine = viewport.height * (0.5 - REFERENCE_LINE_PCT);
  // Same line expressed in CSS px from the top-anchored offset, for snapping.
  const yLinePx = size.height * (0.5 - REFERENCE_LINE_PCT);

  // Duplicate the set enough to fill the column without gaps, then loop.
  const baseStack = frameCount * step;
  const reps = Math.max(2, Math.ceil((viewport.height * 2) / baseStack));
  const count = frameCount * reps;
  const totalH = count * step;

  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        texture: textures[i % frameCount] ?? undefined,
        color: projects[i % frameCount].color,
        baseY: -i * step,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, step, frameCount, textures]
  );

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const current = useRef(0);         // lerped offset, CSS px
  const intro = useRef(0);           // 0 → 1
  const wasDragging = useRef(false);
  const lastActive = useRef(-1);
  const reduced = useRef(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => (reduced.current = mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  useFrame((_, delta) => {
    const store = useMobileGalleryStore.getState();
    const dragging = store.isDragging;
    const dt = Math.min(delta, 1 / 30);

    // Magnetic settle: on the release edge, snap the target so exactly one Plane
    // lands on the reference line. k counts Planes from the line.
    if (wasDragging.current && !dragging) {
      const k = Math.round((store.targetOffset - yLinePx) / stepPx);
      store.setOffset(k * stepPx + yLinePx);
    }
    wasDragging.current = dragging;

    const target = store.targetOffset;
    const prev = current.current;
    const lerp = dragging ? DRAG_LERP : SETTLE_LERP;
    current.current = reduced.current
      ? target
      : THREE.MathUtils.lerp(current.current, target, lerp);

    intro.current = reduced.current
      ? 1
      : Math.min(1, intro.current + dt / INTRO_SECONDS);
    const introT = easeOut(intro.current);
    const opacity = introT;
    const introWarp = WARP_BEND * INTRO_WARP * (1 - introT);
    const introOffset = -step * INTRO_SLIDE * (1 - introT);

    const offsetWorld = current.current * pxToWorld + introOffset;
    const velNorm = (current.current - prev) / size.height;
    const scrollStrength = THREE.MathUtils.clamp(
      velNorm * WARP_BEND,
      -WARP_BEND,
      WARP_BEND
    );
    const boost = dragging ? DRAG_BOOST : 1;
    const strength = reduced.current ? 0 : scrollStrength * boost + introWarp;

    for (let i = 0; i < items.length; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      const raw = items[i].baseY + offsetWorld;
      const wrapped =
        ((((raw + totalH / 2) % totalH) + totalH) % totalH) - totalH / 2;
      mesh.position.y = wrapped;

      // Scale up as a Plane nears the reference line: full size on the line,
      // easing down to MIN_SCALE one step away and holding there. Distance is
      // measured in steps so spacing changes don't change the falloff.
      const d = Math.min(Math.abs(wrapped - yLine) / step, 1);
      const t = easeOut(1 - d);
      const scale = MIN_SCALE + (1 - MIN_SCALE) * t;
      mesh.scale.set(scale, scale, 1);

      const uniforms = (mesh.material as THREE.ShaderMaterial).uniforms;
      uniforms.uStrength.value = strength;
      uniforms.uOpacity.value = opacity;
    }

    // Active Project = the Plane on the reference line, deduped to one set per
    // crossing so the Set layer re-renders only when the name actually changes.
    const activeFloat = (current.current * pxToWorld - yLine) / step;
    const active = wrapIndex(Math.round(activeFloat), frameCount);
    if (active !== lastActive.current) {
      lastActive.current = active;
      store.setActive(active);
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
          color={item.color}
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
