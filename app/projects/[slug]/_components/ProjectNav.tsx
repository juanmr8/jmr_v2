import Link from "next/link";
import type { Project } from "../../data";

const navLink =
  "pointer-events-auto text-inherit no-underline opacity-75 transition-opacity duration-300 ease-[ease] hover:opacity-100";

export default function ProjectNav({
  prev,
  next,
}: {
  prev: Project | null;
  next: Project | null;
}) {
  return (
    <nav className="pointer-events-none absolute right-10 bottom-10 left-10 z-[2] flex animate-overlay-reveal items-center justify-between text-base text-[#a0a0a0] mix-blend-difference [animation-delay:0.56s]">
      {prev ? (
        <Link href={`/projects/${prev.slug}`} className={navLink}>
          Prev Project
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={`/projects/${next.slug}`} className={navLink}>
          Next Project
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
