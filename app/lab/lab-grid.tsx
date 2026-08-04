/* ════════════════════════════════════════════════════════════
   LAB GRID · the reduced-motion surface.
   Under prefers-reduced-motion the infinite pan would be a trap —
   free momentum, no landmarks, nothing the scrollbar can reach. So
   the Lab swaps the canvas for this: the same pieces as a plain
   document that scrolls natively. The staggered left offsets are
   derived from each piece's Cluster placement, so the organic
   scatter survives the fallback — derive, don't duplicate.
════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { px } from "../home-grid";
import { CLUSTER, LAB_PIECES, PLANE_COLOR, labPieceHref } from "./lab-data";

interface LabGridProps {
  /** A piece link was followed — lets the shell mark the open as in-app so
      closing the detail returns here via history. */
  onOpen?: () => void;
}

export function LabGrid({ onOpen }: LabGridProps) {
  return (
    <ul
      style={{
        listStyle: "none",
        paddingTop: `calc(var(--header-height) + ${px(40)})`,
        paddingBottom: px(80),
        paddingInline: "var(--marge-x)",
      }}
    >
      {LAB_PIECES.map((piece) => (
        <li
          key={piece.slug}
          style={{
            // Echo the Cluster placement: further right in the Cluster →
            // further right on the page, capped so every piece stays on it.
            marginLeft: `${(piece.rect.x / CLUSTER.w) * 30}%`,
            marginBottom: px(56),
            maxWidth: px(Math.min(piece.rect.w, 560)),
          }}
        >
          <Link
            href={labPieceHref(piece.slug)}
            // scroll={false}: "back/close returns to the gallery in place" —
            // without it the push scrolls this document to the top and the
            // grid loses its spot behind the panel.
            scroll={false}
            // Only an in-tab open is "in-app" (close = history back); a
            // modified click opens a new tab and must not mark this one.
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              onOpen?.();
            }}
            aria-label={`${piece.title} — open piece`}
            style={{ display: "block", textDecoration: "none" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- the canvas
                surface loads these same raw paths into WebGL textures; the
                fallback mirrors it 1:1 rather than re-encoding via next/image */}
            <img
              src={piece.image}
              alt={piece.title}
              loading="lazy"
              style={{
                width: "100%",
                background: PLANE_COLOR,
                aspectRatio: `${piece.rect.w} / ${piece.rect.h}`,
                objectFit: "cover",
              }}
            />
            <p className="t-ui" style={{ marginTop: px(8), color: "#6f6c66" }}>
              {piece.title}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
