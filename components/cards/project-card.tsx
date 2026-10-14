// ── ProjectCard ───────────────────────────────────────────────────────────────
// A project as a widget: name and status, the one-line description, its top
// three highlights as floating sub-widgets, tags along the foot. The whole card
// links to the detail page through a stretched-link overlay (no nested anchors:
// that was a hydration bug); the GitHub link sits above the overlay.
import Link from "next/link";
import type { Project } from "@/lib/projects";
import { SubWidgets, TagRow, Widget, WidgetHead } from "@/components/widgets";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Widget link>
      <Link href={`/projects/${project.slug}`} aria-label={project.name} className="absolute inset-0 z-0 rounded-[18px]" />
      <div className="pointer-events-none relative">
        <WidgetHead
          title={
            <>
              {project.name}
              <span className="ml-2 text-base text-foreground/30 opacity-0 transition-opacity duration-150 group-hover:opacity-100">→</span>
            </>
          }
          right={
            <>
              <span className={project.status === "wip" ? "text-accent/85" : "text-foreground/40"}>{project.status === "wip" ? "in progress" : "live"}</span>
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto relative z-10 text-foreground/50 transition-colors hover:text-foreground/90"
                >
                  ↗ github
                </a>
              )}
            </>
          }
        />
        <p className="font-sans text-sm leading-relaxed text-foreground/65">{project.description}</p>
        <SubWidgets items={project.highlights.slice(0, 3)} cols={3} />
        <TagRow tags={project.tags} />
      </div>
    </Widget>
  );
}
