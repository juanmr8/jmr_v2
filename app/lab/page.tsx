import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lab · j.mr",
  description: "An infinite field of experiments — drag toward any corner.",
};

// The whole surface lives in the layout's LabShell (it must survive the
// /lab ↔ /lab/[slug] navigation); the field route itself has no panel.
export default function LabPage() {
  return null;
}
