// ── ProjectCard — server card lifted from app/page.tsx (projects .map block) ──
// IMPORTANT: preserves the stretched-link overlay pattern that fixed a hydration bug.
import Link from "next/link";
import type { Project } from "@/lib/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group relative -mx-3 px-3 py-4 hover:bg-white/[0.025] transition-colors duration-150">
      {/* stretched link — covers the whole row without nesting anchors */}
      <Link
        href={`/projects/${project.slug}`}
        aria-label={project.name}
        className="absolute inset-0 z-0"
      />
      <div className="relative pointer-events-none flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-2.5">
        <span className="font-mono text-sm text-foreground/90 group-hover:text-foreground/98 transition-colors duration-150">
          {project.name}
          <span className="ml-2 text-foreground/28 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs">→</span>
        </span>
        <div className="flex flex-wrap items-center gap-5">
          <span className="font-mono text-xs text-muted-foreground">
            [{project.tags.join(" · ")}]
          </span>
          {project.status === "wip" && (
            <span className="font-mono text-xs text-accent/80">in progress</span>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-foreground/45 hover:text-foreground/85 transition-colors relative z-10 pointer-events-auto"
            >
              ↗ github
            </a>
          )}
        </div>
      </div>
      <p className="relative pointer-events-none font-sans text-sm text-foreground/60 leading-relaxed pl-3 border-l border-white/10">
        {project.description}
      </p>
    </div>
  );
}
