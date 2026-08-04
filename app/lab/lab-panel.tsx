"use client";

/* ════════════════════════════════════════════════════════════
   LAB PANEL · a piece's detail drawer (AD-129).
   Rendered by the /lab/[slug] page into the shell's panel slot: a
   right-hand drawer (~40% on desktop, full-width at the 760px
   reflow) on the project-detail shell surface, sliding in over the
   dimmed field. Entry is a mount keyframe (fill backwards, so the
   class owns the transform once it ends); exit is the `closing`
   class transition, timed by the shell to PANEL_MS so navigation
   fires exactly as the drawer finishes leaving. Reduced motion
   drops both — the drawer just appears and disappears.
   Shows what the piece has: title always, description and live
   link only where they exist.
════════════════════════════════════════════════════════════ */

import type { LabPiece } from "./lab-data";
import { PANEL_MS, useLabNav } from "./lab-nav";
import { SHELL_BG } from "./lab-shell";

const EASE = "cubic-bezier(0.33, 1, 0.68, 1)"; // easeOutCubic — the Lab's settle

export function LabPanel({ piece }: { piece: LabPiece }) {
  const { closing, requestClose } = useLabNav();

  return (
    <aside
      aria-label={`${piece.title} — piece detail`}
      className={`fixed inset-y-0 right-0 z-[3] w-[clamp(480px,40vw,640px)] overflow-y-auto border-l border-[#141414]/15 transition-transform max-[760px]:w-full max-[760px]:border-l-0 motion-reduce:animate-none motion-reduce:transition-none ${
        closing ? "translate-x-full" : "translate-x-0"
      }`}
      style={{
        background: SHELL_BG,
        // Dropped once `closing` — a still-running entry keyframe would
        // otherwise re-target to the new class transform and snap the drawer
        // out; without it the exit transition runs from wherever entry got to.
        animation: closing ? "none" : `lab-panel-in ${PANEL_MS}ms ${EASE} backwards`,
        transitionDuration: `${PANEL_MS}ms`,
        transitionTimingFunction: EASE,
      }}
    >
      <div className="flex min-h-full flex-col px-[var(--marge-x)] pt-[calc(var(--header-height)+2rem)] pb-12 text-[#141414]">
        <button
          type="button"
          onClick={requestClose}
          className="t-ui cursor-pointer self-end border-none bg-transparent p-0 text-inherit underline-offset-[3px] hover:underline"
        >
          Close
        </button>

        <h1 className="t-ui m-0 mt-[4.5rem]">{piece.title}</h1>

        {piece.description && (
          <p className="t-ui m-0 mt-[1.15rem] max-w-[36ch] text-[#6f6c66]">
            {piece.description}
          </p>
        )}

        {piece.live && (
          <a
            className="t-ui mt-[1.15rem] self-start underline underline-offset-[3px]"
            href={piece.live}
            target="_blank"
            rel="noreferrer"
          >
            Visit live ↗
          </a>
        )}
      </div>
    </aside>
  );
}
