"use client";
import type { ReactNode } from "react";
import { useHomeMode } from "./use-home-mode";
import { RotateNotice } from "./rotate-notice";

/**
 * Picks the desktop or mobile home on the client, after `matchMedia` resolves —
 * or a rotate notice when the viewport is the wrong shape for either. Both homes
 * are passed as already-built elements, but only the chosen one is ever rendered,
 * so the other's WebGL canvas never mounts. Until the mode resolves, a neutral
 * charcoal placeholder holds the screen (no hydration flash).
 */
export function HomeRouter({
  desktop,
  mobile,
}: {
  desktop: ReactNode;
  mobile: ReactNode;
}) {
  const mode = useHomeMode();

  if (mode === null) {
    return <div style={{ height: "100svh", background: "var(--color-bg)" }} />;
  }
  if (mode === "rotate") return <RotateNotice />;

  return <>{mode === "mobile" ? mobile : desktop}</>;
}
