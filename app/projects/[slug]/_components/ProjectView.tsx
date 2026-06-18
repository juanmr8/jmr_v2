"use client";
import dynamic from "next/dynamic";
import { Fragment, useEffect, useRef } from "react";
import type { Project } from "../../data";
import { useScrollInput } from "./useScrollInput";
import { useGalleryStore } from "./useGalleryStore";
import MiniMap from "./MiniMap";
import AboutPanel from "./AboutPanel";
import ProjectNav from "./ProjectNav";
import { SiteMenuBar, SiteMenuMobileTop } from "../../../menu";

// Canvas is client-only (WebGL touches window) — never render it on the server.
const GalleryCanvas = dynamic(() => import("./GalleryCanvas"), { ssr: false });

interface Props {
  project: Project;
  prev: Project | null;
  next: Project | null;
}

export default function ProjectView({ project, prev, next }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Narrow hit-area div that sits over just the gallery slice. Only mouse-drag
  // starting inside this div moves the gallery — the rest of the page is inert.
  const dragRef = useRef<HTMLDivElement>(null);
  useScrollInput(rootRef, dragRef);

  // The overlays render only once *this* project's textures have mounted. Keying
  // off the slug means navigating never shows the previous project's overlays.
  const overlaysReady = useGalleryStore((s) => s.loadedSlug === project.slug);

  // Reset scroll offset when navigating between projects.
  useEffect(() => {
    useGalleryStore.getState().reset();
  }, [project.slug]);

  // `isolate` makes this its own blend group so the differenced overlays blend
  // against the gallery canvas (both live here) and nothing outside it.
  // `bg-white` is the opaque floor for that group: the WebGL canvas is
  // alpha:true, so without it the empty areas give `difference` nothing to
  // react to and white type would stay white instead of reading black.
  return (
    <div
      ref={rootRef}
      className="absolute inset-0 isolate   bg-white font-[neue-haas-grotesk-display] font-semibold text-[#141414]"
    >
		<div className="absolute top-[var(--header-height)] z-97 w-full h-px bg-neutral-50 mix-blend-difference"></div>
      {/* WebGL gallery fills the page; overlays sit above it. The nested
          <canvas> must stretch to fill regardless of its intrinsic size. */}
      <div className="absolute inset-0 z-[1] [&_canvas]:h-full! [&_canvas]:w-full!">
        <GalleryCanvas
          images={project.images}
          slug={project.slug}
          color={project.color}
        />
      </div>
      {/* Invisible hit area over just the gallery column slice so mouse drag
          only triggers there. Geometry mirrors GalleryColumn. */}
      <div
        ref={dragRef}
        className="absolute top-0 bottom-0 left-1/4 z-[1] w-[clamp(280px,22vw,460px)] cursor-grab"
      />

      {/* Shared menu chrome — persistent (not gated on the texture reveal) so
          the bar is there the instant the page mounts. Differenced against the
          gallery for legibility, matching the project overlays. The desktop
          grid bar swaps for the mobile logo+Contact bar at the 760px reflow. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] mix-blend-difference max-[760px]:hidden">
        <SiteMenuBar />
      </div>
      <div className="hidden max-[760px]:contents">
        <SiteMenuMobileTop />
      </div>

      {/* Keyed by slug so the overlay group remounts on every navigation,
          replaying the keyframe reveal even when the textures are cached. */}
      {overlaysReady && (
        <Fragment key={project.slug}>
          {/* Title — one blank line below the menu bar, left edge on --marge-x
              → flush with the j.mr logo. Blend lives on this positioned element
              (not a leaf) so the difference reads against the gallery canvas,
              the same trick the year uses. */}
          <h1
            className="pointer-events-none absolute left-[var(--marge-x)] top-1/2 z-[2] m-0 animate-overlay-reveal text-base leading-none text-white mix-blend-difference [animation-delay:0.06s]"
          >
            {project.title}
          </h1>

          {/* Mini-map — directly beneath the title. Kept separate from the title
              because the mini-map must NOT be differenced — it shows the real
              thumbnail colors. */}
          <div className="pointer-events-none absolute left-[var(--marge-x)] top-[calc(var(--header-height)_+_1rem)] z-[2]">
            <MiniMap images={project.images} color={project.color} />
          </div>

          {/* Year — directly under Contact; right edge on --marge-x → aligned
              with the Contact link (col 12). Blend lives on this region (not the
              leaf) so the difference sees the canvas as its backdrop. */}
          <div className="pointer-events-none absolute right-[var(--marge-x)] top-[calc(var(--header-height)_+_1rem)] z-[2] text-right mix-blend-difference">
            <span className="m-0 animate-overlay-reveal text-base leading-none text-white">
              {project.year}
            </span>
          </div>

          {/* About — vertically centred on the right, right edge on --marge-x. */}
          <AboutPanel project={project} />

          <ProjectNav prev={prev} next={next} />
        </Fragment>
      )}
    </div>
  );
}
