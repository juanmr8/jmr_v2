import type { Metadata } from "next";
import { LabView } from "./lab-view";

export const metadata: Metadata = {
  title: "Lab · j.mr",
  description: "An infinite field of experiments — drag toward any corner.",
};

export default function LabPage() {
  return <LabView />;
}
