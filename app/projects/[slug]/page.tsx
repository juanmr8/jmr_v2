import { notFound } from "next/navigation";
import { projects, getProject, getAdjacent } from "../data";
import ProjectView from "./_components/ProjectView";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const { prev, next } = getAdjacent(slug);
  return <ProjectView project={project} prev={prev} next={next} />;
}
