"use client";
import Link from "next/link";
import { galleryView } from "../gallery/gallery-logic";
import { useMobileGalleryStore } from "./mobile-gallery-store";

/* ════════════════════════════════════════════════════════════
   SET LAYER · the text over the gallery.
   Names the Active Project (left) and links to it (right). Reads
   only the discrete Active index from the store, so it re-renders
   once per Plane crossing — never per frame. `mix-blend-difference`
   keeps it legible over whichever Plane sits behind it.
════════════════════════════════════════════════════════════ */

export function MobileSetLayer() {
  const activeIndex = useMobileGalleryStore((s) => s.activeIndex);
  const { project, href } = galleryView(activeIndex);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[2] flex -translate-y-1/2 items-center justify-between gap-4 px-4 mix-blend-difference">
      {/* key on the index → the name re-mounts and fades on each crossing. */}
      <span key={activeIndex} className="animate-set-fade text-2xl leading-none text-white">
        {project.title}
      </span>

      <Link
        href={href}
        className="pointer-events-auto shrink-0 text-sm text-white underline underline-offset-4"
      >
        View project
      </Link>
    </div>
  );
}
