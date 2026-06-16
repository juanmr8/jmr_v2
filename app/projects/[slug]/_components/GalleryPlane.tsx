"use client";
import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./galleryShaders";

interface Props {
  texture: THREE.Texture;
  width: number; // world units
  height: number; // world units
  x: number; // world-space center x
  viewportWidth: number; // world units
  viewportHeight: number; // world units
}

// A single uniform-size plane. The column drives its position.y and uStrength
// imperatively each frame via the forwarded mesh ref.
const GalleryPlane = forwardRef<THREE.Mesh, Props>(function GalleryPlane(
  { texture, width, height, x, viewportWidth, viewportHeight },
  ref
) {
  const img = texture.image as HTMLImageElement;

  // Created once per texture; size-derived values are kept in sync below.
  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uImageSizes: { value: new THREE.Vector2(img.width, img.height) },
      uPlaneSizes: { value: new THREE.Vector2(width, height) },
      uViewportSizes: {
        value: new THREE.Vector2(viewportWidth, viewportHeight),
      },
      uStrength: { value: 0 },
      uOpacity: { value: 0 }, // starts hidden; the column fades it in on intro
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [texture]
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
