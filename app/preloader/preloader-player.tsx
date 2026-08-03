"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { PLAYER } from "./preloader-presets";

/* ════════════════════════════════════════════════════════════
   PRELOADER PLAYER  ·  dev-only transport bar for art direction
   ─────────────────────────────────────────────────────────
   The clock (usePlayerClock) is the single source of time: a rAF loop
   advances `elapsed` while playing, clamped to the phase's duration.
   Everything below the Preloader root renders as a pure function of
   that time, which is what makes scrubbing possible at all.

   The bar: restart · play/pause · scrubber · time readout · speeds.
   Scrubbing pauses playback so you can study a single frame.
   Gated by PLAYER.enabled; not part of the shipped Preloader.
════════════════════════════════════════════════════════════ */

export type PlayerClock = {
  /** Seconds into the phase — the value the whole field renders from. */
  elapsed: number;
  duration: number;
  playing: boolean;
  speed: number;
  setSpeed: (s: number) => void;
  /** Jump to a time (pauses, for frame-by-frame study). */
  scrub: (t: number) => void;
  /** Play/pause; playing again from the end restarts. */
  toggle: () => void;
  restart: () => void;
};

export function usePlayerClock(duration: number): PlayerClock {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  // Reduced-motion: skip straight to the settled end state, no playback.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setElapsed(duration);
      setPlaying(false);
    }
  }, [duration]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      if (last == null) last = now;
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setElapsed((e) => Math.min(duration, e + dt));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, duration]);

  // Auto-pause on reaching the end (so the play button becomes "replay").
  useEffect(() => {
    if (playing && elapsed >= duration) setPlaying(false);
  }, [playing, elapsed, duration]);

  return {
    elapsed,
    duration,
    playing,
    speed,
    setSpeed,
    scrub: (t) => {
      setPlaying(false);
      setElapsed(Math.min(duration, Math.max(0, t)));
    },
    toggle: () => {
      if (!playing && elapsed >= duration) setElapsed(0);
      setPlaying((p) => !p);
    },
    restart: () => {
      setElapsed(0);
      setPlaying(true);
    },
  };
}

const button: CSSProperties = {
  background: "none",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: 4,
  color: "inherit",
  font: "inherit",
  padding: "3px 7px",
  cursor: "pointer",
};

export function PreloaderPlayer({ clock }: { clock: PlayerClock }) {
  const { elapsed, duration, playing, speed } = clock;

  return (
    <div
      data-preloader-player
      style={{
        // Sibling of the stage (not a child) so it survives the destroy —
        // you can scrub back into the timeline from the settled homepage.
        position: "fixed",
        zIndex: 10000,
        right: 16,
        bottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 6,
        background: "rgba(0,0,0,0.72)",
        color: "#fff",
        font: "11px/1 monospace",
      }}
    >
      <button style={button} onClick={clock.restart} title="Restart">
        ⟲
      </button>
      <button style={button} onClick={clock.toggle} title={playing ? "Pause" : "Play"}>
        {playing ? "❚❚" : "▶"}
      </button>
      <input
        type="range"
        min={0}
        max={duration}
        step={0.01}
        value={elapsed}
        onChange={(e) => clock.scrub(e.currentTarget.valueAsNumber)}
        style={{ width: 160, accentColor: "#fff" }}
        aria-label="Timeline"
      />
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {elapsed.toFixed(2)} / {duration.toFixed(2)}s
      </span>
      {PLAYER.speeds.map((s) => (
        <button
          key={s}
          style={{
            ...button,
            borderColor: s === speed ? "#fff" : "rgba(255,255,255,0.3)",
            opacity: s === speed ? 1 : 0.6,
          }}
          onClick={() => clock.setSpeed(s)}
        >
          {s}×
        </button>
      ))}
    </div>
  );
}
