// ── ProjectCard ───────────────────────────────────────────────────────────────
// A project as a widget: name and status, the one-line description, its top
// three highlights as floating sub-widgets, tags along the foot. The whole card
// links to the detail page through a stretched-link overlay (no nested anchors:
// that was a hydration bug); the GitHub link sits above the overlay.
import Link from "next/link";
import { isMoving, statusLine, type Project } from "@/lib/projects";
import { BrandIcon, StatWidgets, SubWidgets, TagRow, Widget, WidgetHead } from "@/components/widgets";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Widget link>
      <Link href={`/projects/${project.slug}`} aria-label={project.name} className="absolute inset-0 z-0 rounded-[18px]" />
      <div className="pointer-events-none relative">
        <WidgetHead
          icon={<BrandIcon src={project.icon} size={project.id === "prism" ? 26 : 20} round={project.id === "prism"} />}
          title={
            <>
              {project.name}
              <span className="ml-2 text-base text-foreground/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100">→</span>
            </>
          }
          right={
            <>
              <span className={isMoving(project.status) ? "text-accent/85" : "text-foreground/55"}>{statusLine(project)}</span>
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto relative z-10 text-foreground/65 transition-colors hover:text-foreground/90"
                >
                  ↗ github
                </a>
              )}
            </>
          }
        />
        <p className="copy-sm">{project.description}</p>
        {project.stats ? (
          <>
            <StatWidgets stats={project.stats.slice(0, 3)} />
            {project.statsAsOf && <p className="mt-2 font-mono text-2xs text-foreground/50">as of {project.statsAsOf.toLowerCase()}</p>}
          </>
        ) : (
          <SubWidgets items={project.highlights.slice(0, 3)} cols={3} />
        )}
        <TagRow tags={project.tags} />
      </div>
    </Widget>
  );
}
