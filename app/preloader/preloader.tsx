"use client";

import { useEffect, useMemo, useState } from "react";
import { buildField, emergeProgress, outSpan, revealAt } from "./preloader-layout";
import { PreloaderField } from "./preloader-field";
import { PreloaderLines } from "./preloader-lines";
import { RailShape } from "./shapes";
import { PreloaderPlayer, usePlayerClock } from "./preloader-player";
import { BLINK, COLOR, EMERGE, LINES, PLAYER, PORTAL } from "./preloader-presets";

/* ════════════════════════════════════════════════════════════
   PRELOADER  ·  art-direction rig (full timeline + player)
   ─────────────────────────────────────────────────────────
   The root owns the field data and the clock; everything below renders
   as a pure function of `elapsed`, so the dev player can scrub/replay
   the whole timeline: in bloom → blink + decay → inward dissolve →
   finale (the centre pair exits up into its masks, staggered, while
   the artwork's two entities rise staggered from the emergence mask)
   → stage destroyed.

   The emergence window is measured from the live DOM — the homepage
   renders beneath this overlay, so the artwork rises exactly where the
   rail's /primitives.svg sits and the destroy is a seamless cut.

   Still to come: the real lifecycle (session flag, scroll lock,
   reduced-motion skip, handoff to the Gallery Intro) — which will
   replace the rig's display:none "destroy" with a real unmount.
════════════════════════════════════════════════════════════ */

type Rect = { left: number; top: number; width: number; height: number };

export function Preloader({ onComplete }: { onComplete?: (complete: boolean) => void }) {
  // Stable across renders (seeded) — the layout we art-direct against.
  const cells = useMemo(() => buildField(), []);

  // Timeline: in animation until the last cell lands, the blink phase,
  // the inward dissolve down to the Hero Pair, then the finale — the
  // pair's exit and the rail artwork's emergence, overlapping.
  const introEnd = useMemo(() => Math.max(...cells.map(revealAt)), [cells]);
  const portalStart = useMemo(
    () => introEnd + BLINK.duration + outSpan(cells) + PORTAL.hold,
    [cells, introEnd],
  );
  const emergeStart = portalStart + EMERGE.delay;
  const duration = Math.max(
    portalStart + PORTAL.stagger + PORTAL.duration,
    emergeStart + EMERGE.stagger + EMERGE.duration,
    portalStart + LINES.travel, // frame lines ride with the finale — hold until they land
  );

  const clock = usePlayerClock(duration);

  // The emergence window: the homepage rail's actual primitives image
  // beneath us, measured once on mount.
  const [railRect, setRailRect] = useState<Rect | null>(null);
  useEffect(() => {
    const img = document.querySelector('main img[src="/primitives.svg"]');
    if (!(img instanceof HTMLElement)) return;
    const r = img.getBoundingClientRect();
    setRailRect({ left: r.left, top: r.top, width: r.width, height: r.height });
  }, []);

  const emergeT = clock.elapsed - emergeStart;
  // Timeline complete: the stage goes away and the real homepage — whose
  // rail shows the identical artwork in the identical spot — takes over.
  const destroyed = clock.elapsed >= duration;

  // Report completion live, not latched: scrubbing the dev player back below
  // the end re-covers the home, and the consumer re-closes its reveal gate.
  useEffect(() => {
    onComplete?.(destroyed);
  }, [destroyed, onComplete]);

  return (
    <>
      <div
        data-preloader
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: COLOR.bg,
          overflow: "hidden",
          display: destroyed ? "none" : undefined,
        }}
      >
        {/* The homepage frame, drawn in during the run: the top rule sweeps
            across the main show, completing at portalStart; the vertical/mid
            rules DEPART on that beat, travelling in from the screen edges
            alongside the shapes' slide-up and rise. First in the stage, so
            the field and the emergence render above the lines. */}
        <PreloaderLines elapsed={clock.elapsed} end={portalStart} />
        <PreloaderField
          cells={cells}
          elapsed={clock.elapsed}
          introEnd={introEnd}
          portalStart={portalStart}
        />
        {/* The answering composition: the artwork's two entities rising
            out of the emergence mask, circle first, triangle after. The
            window IS the artwork's final rect; each layer starts fully
            below it and slides up to rest. */}
        {emergeT >= 0 && railRect && (
          <div data-emerge style={{ position: "absolute", ...railRect, overflow: "hidden" }}>
            {(["circle", "triangle"] as const).map((kind) => (
              <RailShape
                key={kind}
                kind={kind}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  transform: `translateY(${(1 - emergeProgress(kind, emergeT)) * 100}%)`,
                }}
              />
            ))}
          </div>
        )}
      </div>
      {PLAYER.enabled && <PreloaderPlayer clock={clock} />}
    </>
  );
}
