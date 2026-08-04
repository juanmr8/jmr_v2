"use client";

/* ════════════════════════════════════════════════════════════
   LAB NAV · the shell ↔ panel seam.
   The detail panel arrives as the [slug] route's children, so it
   can't take props from the shell — this context is the one bridge:
   the panel (and the shell's own scrim/Esc) ask to close, and read
   `closing` so drawer and scrim play the same exit together. How a
   close resolves (history back vs push /lab) is the shell's
   knowledge — it tracked whether the piece was opened in-app.
════════════════════════════════════════════════════════════ */

import { createContext, useContext } from "react";

/** One duration for the drawer's slide and the shell's exit timer, so the
    navigation fires exactly when the drawer finishes leaving. */
export const PANEL_MS = 400;

export interface LabNav {
  /** True while the exit animation runs — the drawer slides out, the scrim
      fades, and further close requests are ignored. */
  closing: boolean;
  /** Close the open piece: animates out, then navigates (back when the piece
      was opened from the field, push /lab on a deep link). */
  requestClose: () => void;
}

const LabNavContext = createContext<LabNav | null>(null);

export const LabNavProvider = LabNavContext.Provider;

export function useLabNav(): LabNav {
  const context = useContext(LabNavContext);
  if (!context) throw new Error("useLabNav must be used within the Lab shell");
  return context;
}
