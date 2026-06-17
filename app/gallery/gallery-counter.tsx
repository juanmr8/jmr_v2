"use client";

/* ════════════════════════════════════════════════════════════
   GALLERY COUNTER · <active+1>/<total>, settled.
   Reads the Active Project view from the Gallery context and shows
   the zero-padded counter (e.g. 03/06). Re-renders the moment the
   Active Project changes as you scroll — the value is derived, not
   motion (the renderer dedupes to one update per project crossing).
════════════════════════════════════════════════════════════ */

import { px } from "../home-grid";
import { useActiveView } from "./gallery-context";

export function GalleryCounter() {
  const { counter } = useActiveView();

  return (
    <span className="t-ui" style={{ position: "absolute", top: px(16), right: "var(--marge-x)", color: "var(--color-ink)", zIndex: 1 }}>{counter}</span>
  );
}
