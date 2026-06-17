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
      className="absolute inset-0 isolate bg-white font-[neue-haas-grotesk-display] font-semibold text-[#141414]"
    >
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
          {/* Sit 16px below the fixed SiteHeader so the mini-map clears it. */}
          <div className="pointer-events-none absolute top-[calc(var(--header-height)+16px)] left-10 z-[2]">
            <MiniMap images={project.images} color={project.color} />
          </div>
          {/* Mirrors .topLeft's offset so the year lines up with the mini-map.
              Blend lives on this region (not the leaf) so the difference sees
              the canvas as its backdrop. */}
          <div className="pointer-events-none absolute top-[calc(var(--header-height)+16px)] right-10 z-[2] text-right mix-blend-difference">
            <span className="m-0 animate-overlay-reveal text-base leading-none text-white mix-blend-difference">
              {project.year}
            </span>
          </div>
          {/* Title + about share a wrapper so that below 760px they stack as
              one left-aligned column; on desktop the wrapper is `display:
              contents` and each keeps its own absolute placement. A positioned
              + z-indexed wrapper is its own stacking context, which would trap
              the children's blends — so below 760px the wrapper itself blends. */}
          <div className="contents max-[760px]:absolute max-[760px]:top-1/2 max-[760px]:left-10 max-[760px]:right-10 max-[760px]:z-[2] max-[760px]:flex max-[760px]:flex-col max-[760px]:mix-blend-difference">
            {/* Resting geometry stays put across load states so the title never
                reflows — only opacity/transform animate. */}
            <h1 className="relative top-1/2 z-[2] m-0 animate-overlay-reveal pl-8 text-base leading-none text-white mix-blend-difference [animation-delay:0.06s] max-[760px]:static max-[760px]:top-auto max-[760px]:mb-[1.15rem] max-[760px]:pl-0">
              {project.title}
            </h1>
            <AboutPanel project={project} />
          </div>

          <ProjectNav prev={prev} next={next} />
        </Fragment>
      )}
    </div>
  );
}
