import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LAB_PIECES, getLabPiece } from "../lab-data";
import { LabPanel } from "../lab-panel";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return LAB_PIECES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const piece = getLabPiece(slug);
  if (!piece) return {};
  return {
    title: `${piece.title} · Lab · j.mr`,
    description: piece.description ?? `${piece.title} — an experiment from the Lab.`,
  };
}

export default async function LabPiecePage({ params }: Props) {
  const { slug } = await params;
  const piece = getLabPiece(slug);
  if (!piece) notFound();

  // The page IS the panel: the field renders in the /lab layout's shell, so
  // this route contributes only the drawer that slides over it.
  return <LabPanel piece={piece} />;
}
