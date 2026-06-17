"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import GalleryColumn from "./GalleryColumn";

interface Props {
  images: string[];
  slug: string;
  color: string; // flat fill for placeholder projects (no images yet)
}

// Perspective camera so the velocity-driven Z-bend warp is actually visible
// (an orthographic projection would render the depth displacement invisibly).
export default function GalleryCanvas({ images, slug, color }: Props) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 8], fov: 45, near: 0.1, far: 100 }}
    >
      <Suspense fallback={null}>
        {/* key={slug} forces fresh textures/refs when navigating projects. */}
        <GalleryColumn key={slug} images={images} slug={slug} color={color} />
      </Suspense>
    </Canvas>
  );
}
