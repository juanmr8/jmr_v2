"use client";

/* ════════════════════════════════════════════════════════════
   LAB SHELL · one persistent surface, two routes.
   Lives in the /lab layout so navigating between the field (/lab)
   and a piece (/lab/[slug]) never remounts the canvas — the detail
   panel arrives as `children` and the field simply stays where it
   was (AD-129). The reduced-motion branch (matchMedia, resolved on
   the client) swaps the canvas for a natively-scrolling grid; both
   branches render the panel slot, and the null branch does too, so
   a deep link paints its detail from the first frame.
   While a piece is open the field is dimmed under the scrim and its
   input is locked; the renderer keeps ticking so residual glide
   settles in place. Scrim click and Esc close; a close animates the
   exit (PANEL_MS) and then navigates — history back when the piece
   was opened from the field, push /lab on a deep link, so the
   browser's own back button always behaves.
════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { SiteMenuBar, SiteMenuMobileTop } from "../menu";
import { LabCanvas } from "./lab-canvas";
import { LabGrid } from "./lab-grid";
import { LabNavProvider, PANEL_MS } from "./lab-nav";

/** The Lab's shell — the light surface the project detail pages use. The
    panel imports it too: one source for the surface color. */
export const SHELL_BG = "#e9e6df";

export function LabShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  // A [slug] child below the /lab layout means a piece is open.
  const open = useSelectedLayoutSegment() !== null;

  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Lock document scroll around the canvas surface (same restore discipline as
  // projects/layout.tsx) — and around an open panel on the reduced-motion
  // grid, so the document behind the scrim can't keep scrolling.
  useEffect(() => {
    if (reduced === null || (reduced && !open)) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [reduced, open]);

  // ── Close plumbing. `openedInApp` remembers whether the open piece was
  // entered from the field/grid (→ close is history back, returning to the
  // exact pan) or deep-linked (→ close pushes /lab). Refs mirror the live
  // values so the timer callback reads the moment it fires, not its closure.
  const openRef = useRef(open);
  openRef.current = open;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const openedInApp = useRef(false);
  const closingRef = useRef(false);
  const [closing, setClosing] = useState(false);

  // Route change lands (or the browser's back button skipped our exit):
  // the panel is gone, arm for the next open.
  useEffect(() => {
    if (open) return;
    closingRef.current = false;
    setClosing(false);
  }, [open]);

  const navigateOut = useCallback(() => {
    // The user may have already left via the browser's back button while the
    // exit was playing — a second back would overshoot out of the Lab.
    if (!openRef.current) return;
    const wasInApp = openedInApp.current;
    openedInApp.current = false;
    if (wasInApp) router.back();
    else router.push("/lab");
  }, [router]);

  const requestClose = useCallback(() => {
    if (!openRef.current || closingRef.current) return;
    if (reducedRef.current) {
      navigateOut();
      return;
    }
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(navigateOut, PANEL_MS);
  }, [navigateOut]);

  /** The field/grid opens a piece — in-app, so close can return via history. */
  const openPiece = useCallback(
    (href: string) => {
      openedInApp.current = true;
      router.push(href);
    },
    [router]
  );
  const markInApp = useCallback(() => {
    openedInApp.current = true;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  // ── One tree for all three branches (matchMedia unresolved / reduced /
  // canvas): the conditional slots render null rather than the branches
  // returning different shapes, so the panel slot keeps its child position
  // and a deep-linked panel never remounts (and never replays its entry)
  // when `reduced` resolves on the client.

  const root =
    reduced === true
      ? "relative isolate min-h-dvh"
      : reduced === false
        ? "fixed inset-0 isolate h-dvh w-screen touch-none overflow-hidden overscroll-none"
        : "fixed inset-0 isolate"; // unresolved — hold the frame, panel slot live

  return (
    <div className={root} style={{ background: SHELL_BG }}>
      {reduced === false && <LabCanvas locked={open} onOpenPiece={openPiece} />}
      {reduced === true && <LabGrid onOpen={markInApp} />}

      {/* Dim + lock the field while a piece is open; clicking the exposed
          field closes. Fades in on mount; on `closing` the entry animation
          drops so the exit transition can run from wherever the fade got to. */}
      {open && (
        <div
          aria-hidden
          onClick={requestClose}
          className={`fixed inset-0 z-[2] bg-[#141414]/25 transition-opacity motion-reduce:animate-none motion-reduce:transition-none ${
            closing ? "opacity-0" : "opacity-100"
          }`}
          style={{
            animation: closing ? "none" : `lab-scrim-in ${PANEL_MS}ms ease backwards`,
            transitionDuration: `${PANEL_MS}ms`,
          }}
        />
      )}

      <LabNavProvider value={{ closing, requestClose }}>{children}</LabNavProvider>

      {reduced !== null && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] mix-blend-difference max-[760px]:hidden">
            <SiteMenuBar activeLabel="Lab" />
          </div>
          <div className="hidden max-[760px]:contents">
            <SiteMenuMobileTop />
          </div>
        </>
      )}
    </div>
  );
}
