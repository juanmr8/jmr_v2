import { notFound } from "next/navigation";
import { projects, getProject, getAdjacent } from "../data";
import ProjectView from "./_components/ProjectView";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default function ProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = getProject(params.slug);
  if (!project) notFound();

  const { prev, next } = getAdjacent(params.slug);
  return <ProjectView project={project} prev={prev} next={next} />;
}
