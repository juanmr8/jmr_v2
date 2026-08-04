import type { ReactNode } from "react";
import { LabShell } from "./lab-shell";

// The shell (canvas/grid + menu + scrim) lives in the LAYOUT so navigating
// between /lab and /lab/[slug] never remounts it — layouts persist across
// child navigations, which is what keeps the field in place while a piece's
// detail panel slides over it (AD-129). Children land in the shell's panel
// slot: null on /lab, the piece drawer on /lab/[slug].
export default function LabLayout({ children }: { children: ReactNode }) {
  return <LabShell>{children}</LabShell>;
}
