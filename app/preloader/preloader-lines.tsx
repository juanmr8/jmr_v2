"use client";

import { useEffect, useState } from "react";
import { lineTravel, sweepProgress } from "./preloader-layout";
import { COLOR } from "./preloader-presets";

/* ════════════════════════════════════════════════════════════
   PRELOADER LINES  ·  the homepage frame, drawn in during the run
   ─────────────────────────────────────────────────────────
   The homepage's three hairline rules already exist beneath the
   overlay (nav band bottom, mid divider, main column left). This
   layer re-draws them ON the stage as pure functions of `elapsed`:
   the top rule sweeps left→right across the main run, completing as
   the finale begins; the vertical rule and the mid divider depart on
   that same beat, travelling in from the extreme left / extreme bottom
   alongside the shapes. Geometry is measured once from the live DOM (the
   [data-home-line] markers — same pattern as the emergence window),
   so when the stage is destroyed the real borders continue the frame
   pixel-for-pixel.
════════════════════════════════════════════════════════════ */

type Frame = {
  /** y of the nav band's bottom rule (top edge of the 1px line). */
  navY: number;
  /** y of the mid divider at rest. */
  dividerY: number;
  /** x of the vertical rule at rest (left edge of the 1px line). */
  columnX: number;
  /** Bottom of <main> — the vertical rule's lower end. */
  mainBottom: number;
  /** Viewport height — where the mid divider sets out from. */
  viewH: number;
};

export function PreloaderLines({ elapsed, end }: { elapsed: number; end: number }) {
  const [frame, setFrame] = useState<Frame | null>(null);

  useEffect(() => {
    const nav = document.querySelector('main [data-home-line="nav"]');
    const divider = document.querySelector('main [data-home-line="divider"]');
    const column = document.querySelector('main [data-home-line="column"]');
    const main = document.querySelector("main");
    if (!nav || !divider || !column || !main) return;
    // −1 lands on the TOP edge of each element's 1px bottom border.
    setFrame({
      navY: nav.getBoundingClientRect().bottom - 1,
      dividerY: divider.getBoundingClientRect().bottom - 1,
      columnX: column.getBoundingClientRect().left,
      mainBottom: main.getBoundingClientRect().bottom,
      viewH: window.innerHeight,
    });
  }, []);

  if (!frame) return null;

  const sweep = sweepProgress(elapsed, end);
  const travel = lineTravel(elapsed, end);
  const rule = { position: "absolute", background: COLOR.line } as const;

  return (
    <>
      {/* Top rule: sweeps left→right where the (still hidden) menu's
          bottom border sits. scaleX(0) keeps it absent until departure. */}
      <div
        style={{
          ...rule,
          left: 0,
          top: frame.navY,
          width: "100%",
          height: 1,
          transform: `scaleX(${sweep})`,
          transformOrigin: "left",
        }}
      />
      {/* Vertical rule: parked at the extreme left edge, then travels to
          the main column's border position. Full resting extent throughout
          (below the nav band down to main's bottom). */}
      <div
        style={{
          ...rule,
          left: 0,
          top: frame.navY + 1,
          width: 1,
          height: frame.mainBottom - (frame.navY + 1),
          transform: `translateX(${frame.columnX * travel}px)`,
        }}
      />
      {/* Mid divider: parked at the extreme bottom edge, then travels up
          to its resting y between the two sections. */}
      <div
        style={{
          ...rule,
          left: 0,
          top: frame.viewH - 1,
          width: "100%",
          height: 1,
          transform: `translateY(${(frame.dividerY - (frame.viewH - 1)) * travel}px)`,
        }}
      />
    </>
  );
}
