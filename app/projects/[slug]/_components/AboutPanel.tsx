import type { Project } from "../../data";

export default function AboutPanel({ project }: { project: Project }) {
  // Blend the whole block as one layer against the gallery. Below 760px it
  // spans the margins (full-width) instead of its fixed right-hand slot.
  return (
    <div className="pointer-events-none absolute top-1/2 right-[var(--marge-x)] z-[2] w-76 max-w-[26vw] text-right mix-blend-difference max-[760px]:left-[var(--marge-x)] max-[760px]:w-auto max-[760px]:max-w-none max-[760px]:text-left">
      <p className="font-lead m-0 mb-[1.15rem] animate-overlay-reveal text-base leading-[1.2] text-white mix-blend-difference [animation-delay:0.34s] max-[760px]:text-left">
        {project.about}
      </p>
      {project.siteUrl && (
        <a
          className="inline-block animate-overlay-reveal pointer-events-auto text-base text-white underline underline-offset-[3px] [animation-delay:0.42s]"
          href={project.siteUrl}
          target="_blank"
          rel="noreferrer"
        >
          Visit site
        </a>
      )}
    </div>
  );
}
