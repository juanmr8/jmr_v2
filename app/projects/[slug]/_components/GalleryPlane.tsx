"use client";
import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./galleryShaders";

interface Props {
  texture?: THREE.Texture; // omitted for flat-color placeholder planes
  color?: string; // flat fill used when there's no texture
  width: number; // world units
  height: number; // world units
  x: number; // world-space center x
  viewportWidth: number; // world units
  viewportHeight: number; // world units
}

// A single uniform-size plane. The column drives its position.y and uStrength
// imperatively each frame via the forwarded mesh ref. Renders a texture when
// given one, otherwise a flat `color` (projects without imagery yet).
const GalleryPlane = forwardRef<THREE.Mesh, Props>(function GalleryPlane(
  { texture, color, width, height, x, viewportWidth, viewportHeight },
  ref
) {
  const img = texture?.image as HTMLImageElement | undefined;

  // Created once per texture; size-derived values are kept in sync below.
  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture ?? null },
      uImageSizes: {
        value: new THREE.Vector2(img?.width ?? 1, img?.height ?? 1),
      },
      uColor: { value: new THREE.Color(color ?? "#000000") },
      uHasTexture: { value: texture ? 1 : 0 },
      uPlaneSizes: { value: new THREE.Vector2(width, height) },
      uViewportSizes: {
        value: new THREE.Vector2(viewportWidth, viewportHeight),
      },
      uStrength: { value: 0 },
      uOpacity: { value: 0 }, // starts hidden; the column fades it in on intro
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [texture, color]
  );

  // Keep size-derived uniforms current across resizes without recreating them.
  uniforms.uPlaneSizes.value.set(width, height);
  uniforms.uViewportSizes.value.set(viewportWidth, viewportHeight);

  return (
    <mesh ref={ref} position={[x, 0, 0]}>
      <planeGeometry args={[width, height, 20, 20]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
});

export default GalleryPlane;
