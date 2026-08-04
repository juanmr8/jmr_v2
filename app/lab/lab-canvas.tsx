"use client";

/* ════════════════════════════════════════════════════════════
   LAB CANVAS · the client island.
   Owns the lifecycle around the renderer seam and the DOM concerns
   it must not see: mount the <canvas>, measure the live pixel box,
   capture EVERY wheel event on the page (the Lab view is a locked
   full-height screen — all scroll drives the pan, never the
   document), and translate pointer gestures into drag calls. All
   drawing/motion lives behind the seam (lab-renderer).

   It also owns the piece links (AD-129), per ADR-0001: real DOM
   <a> elements over the planes, never an in-canvas hit-test. The
   Lab's twist on the Gallery's fixed anchors is a POOL — how many
   copies of a piece are visible varies with the pan (the field
   wraps), so anchors grow to the high-water mark and each frame
   borrows one per visible instance via the renderer's onFrame
   seam, mirroring the mesh pool inside the renderer.

   A gesture decides late whether it was a click or a drag: the
   pan only engages (and pointer capture only starts) once the
   pointer travels past a small slop, so an under-slop release
   lets the anchor's native click through — which we intercept
   into a client-side navigation so the /lab layout (and the pan)
   survive the route change.
════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import { CLUSTER, LAB_PIECES, PLANE_COLOR, labPieceHref } from "./lab-data";
import { createLabRenderer } from "./lab-renderer";

/** Pointer travel (px) below which a press-and-release reads as a click. */
const DRAG_SLOP = 6;
/** Hover label's offset from the pointer (px) — clear of the cursor glyph. */
const LABEL_DX = 14;
const LABEL_DY = 20;

interface LabCanvasProps {
  /** A piece is open: the pan is frozen for input (wheel/drag ignored, and the
      wheel's page-wide preventDefault lifts so the panel can scroll), while
      the render loop stays free to settle any residual glide. */
  locked: boolean;
  /** A piece link was clicked — the shell navigates (and remembers the open
      was in-app, so close can return via history). */
  onOpenPiece: (href: string) => void;
}

export function LabCanvas({ locked, onOpenPiece }: LabCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Anchor pool host + hover label, driven imperatively — never re-rendered.
  const overlayRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  // Live values in refs so the one-shot effect reads the current prop.
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const onOpenRef = useRef(onOpenPiece);
  onOpenRef.current = onOpenPiece;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const label = labelRef.current;
    if (!container || !canvas || !overlay || !label) return;

    // ── Anchor pool (ADR-0001). Grown to the visible high-water mark; each
    // frame every pool anchor takes one visible instance's rect and — only
    // when its piece changes — that piece's href/label. Extras hide.
    const anchors: HTMLAnchorElement[] = [];
    function ensureAnchors(n: number): void {
      while (anchors.length < n) {
        const a = document.createElement("a");
        // Never natively draggable: a press-and-pull must pan the field, not
        // pick the link up as an HTML5 drag (which cancels the pointer stream
        // and stalls the pan). webkit-user-drag covers Safari.
        a.draggable = false;
        a.style.cssText =
          "position:absolute;top:0;left:0;width:0;height:0;" +
          "transform-origin:top left;will-change:transform;cursor:pointer;" +
          "-webkit-user-drag:none";
        overlay!.appendChild(a);
        anchors.push(a);
      }
    }

    const renderer = createLabRenderer({
      canvas,
      pieces: LAB_PIECES.map((p) => ({ rect: p.rect, image: p.image })),
      cluster: CLUSTER,
      color: PLANE_COLOR,
      // Per-frame, no React: write each visible instance's rect straight to
      // its pool anchor, so links stay glued to the planes through pan,
      // glide, and the wrap's recycling.
      onFrame: (rects) => {
        ensureAnchors(rects.length);
        for (let k = 0; k < anchors.length; k++) {
          const a = anchors[k];
          if (k >= rects.length) {
            a.style.display = "none";
            continue;
          }
          const r = rects[k];
          a.style.display = "block";
          a.style.transform = `translate(${r.left}px, ${r.top}px)`;
          a.style.width = `${r.width}px`;
          a.style.height = `${r.height}px`;
          if (a.dataset.index !== String(r.index)) {
            a.dataset.index = String(r.index);
            const piece = LAB_PIECES[r.index];
            a.href = labPieceHref(piece.slug);
            a.setAttribute("aria-label", `${piece.title} — open piece`);
          }
        }
      },
    });

    const sync = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.resize(width, height);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(container);

    // Page-wide capture: the Lab is a single locked screen with nothing else
    // to scroll, so every wheel event belongs to the pan — both axes, so a
    // trackpad pans diagonally and a mouse wheel walks the field vertically.
    // Locked, the capture lifts entirely: the open panel scrolls natively.
    const onWheel = (e: WheelEvent) => {
      if (lockedRef.current) return;
      e.preventDefault();
      renderer.wheel(e.deltaX, e.deltaY);
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    // ── Hover label: the hovered piece's title, trailing the pointer. Pure
    // style writes — shown over an anchor, hidden on leave or once a drag
    // engages. Differenced like the menu so it reads on any piece.
    const hideLabel = () => {
      label.style.opacity = "0";
    };
    const onOver = (e: PointerEvent) => {
      const a = (e.target as Element).closest("a");
      if (!a || a.dataset.index === undefined) return;
      label.textContent = LAB_PIECES[Number(a.dataset.index)]?.title ?? "";
      label.style.opacity = "1";
    };
    const onOut = (e: PointerEvent) => {
      if ((e.target as Element).closest("a")) hideLabel();
    };
    overlay.addEventListener("pointerover", onOver);
    overlay.addEventListener("pointerout", onOut);

    // ── Drag with slop: pointer capture and the pan only engage past
    // DRAG_SLOP, so an under-slop release is a click — the browser fires it
    // on the anchor (nothing was captured), and the delegated handler below
    // turns it into a client-side navigation. Past the slop the capture
    // retargets pointer events (and any click) to the container, so no drag
    // ever navigates.
    let pressed = false;
    let dragging = false;
    let downX = 0;
    let downY = 0;
    let lastX = 0;
    let lastY = 0;
    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary || pressed || dragging || lockedRef.current) return;
      pressed = true;
      downX = lastX = e.clientX;
      downY = lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      if (pressed && !dragging) {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) >= DRAG_SLOP) {
          dragging = true;
          container.setPointerCapture(e.pointerId);
          container.style.cursor = "grabbing";
          // The grab owns the pointer: anchors stop claiming the cursor and
          // the label lets go.
          overlay.style.pointerEvents = "none";
          hideLabel();
          renderer.dragStart();
        }
      }
      if (dragging) renderer.dragMove(e.clientX - lastX, e.clientY - lastY);
      lastX = e.clientX;
      lastY = e.clientY;
      // Trail the pointer (container is inset:0 of the fixed shell, so client
      // coords are container coords).
      label.style.transform = `translate(${e.clientX + LABEL_DX}px, ${e.clientY + LABEL_DY}px)`;
    };
    const endDrag = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      if (dragging) {
        container.style.cursor = "grab";
        overlay.style.pointerEvents = "";
        renderer.dragEnd();
      }
      pressed = false;
      dragging = false;
    };
    // Belt and braces with the anchors' draggable=false: nothing in the field
    // may ever become a native drag payload.
    const onDragStart = (e: DragEvent) => e.preventDefault();
    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerup", endDrag);
    container.addEventListener("pointercancel", endDrag);
    container.addEventListener("dragstart", onDragStart);

    // A piece click: keep it client-side so the /lab layout (and the pan)
    // survive — but stand aside for modified clicks, so "open in new tab"
    // keeps working off the anchor's real href.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a");
      if (!a || a.dataset.index === undefined) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      const piece = LAB_PIECES[Number(a.dataset.index)];
      if (piece) onOpenRef.current(labPieceHref(piece.slug));
    };
    overlay.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("wheel", onWheel);
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerup", endDrag);
      container.removeEventListener("pointercancel", endDrag);
      container.removeEventListener("dragstart", onDragStart);
      overlay.removeEventListener("pointerover", onOver);
      overlay.removeEventListener("pointerout", onOut);
      overlay.removeEventListener("click", onClick);
      overlay.replaceChildren();
      observer.disconnect();
      renderer.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, cursor: "grab", touchAction: "none", userSelect: "none" }}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, display: "block" }} />
      {/* Anchor pool host (ADR-0001) — the <a>s are created and placed
          imperatively; see the effect. */}
      <div ref={overlayRef} style={{ position: "absolute", inset: 0 }} />
      {/* Hover label — differenced white like the menu, so it reads over the
          shell and over any piece. */}
      <div
        ref={labelRef}
        aria-hidden
        className="t-ui"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          color: "#fff",
          mixBlendMode: "difference",
          opacity: 0,
          transition: "opacity 120ms",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          willChange: "transform",
        }}
      />
    </div>
  );
}
