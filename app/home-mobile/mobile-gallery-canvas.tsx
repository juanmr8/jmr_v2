"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import MobileGalleryColumn from "./mobile-gallery-column";

// Perspective camera so the velocity-driven Z-bend warp is actually visible
// (orthographic would render the depth displacement invisibly). Mirrors the
// project-detail canvas; only the column behaviour differs.
export default function MobileGalleryCanvas() {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 8], fov: 45, near: 0.1, far: 100 }}
    >
      <Suspense fallback={null}>
        <MobileGalleryColumn />
      </Suspense>
    </Canvas>
  );
}
