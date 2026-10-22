// static: every project is prerendered at build (generateStaticParams)
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { alternates } from "@/lib/canonical";
import DetailPage from "@/components/detail-page";
import { getDetail } from "@/content/detail";
import { isMoving, projects, statusLine } from "@/lib/projects";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { alternates: alternates(`/projects/${slug}`) };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) notFound();

  // the long-form part (code, diagrams, decisions, results), where one exists
  const detail = getDetail("project", project.slug);
  const checked = detail?.updated ?? project.updated;

  return (
    <DetailPage
      kind="project"
      title={project.name}
      pill={{ text: project.status, moving: isMoving(project.status) }}
      rows={[
        { label: "stack", value: project.tags.map((t) => t.toLowerCase()).join(" · ") },
        {
          label: "status",
          value: (
            <>
              {statusLine(project)}
              {project.statusNote && <> · {project.statusNote}</>}
            </>
          ),
        },
        { label: "checked", value: <time dateTime={checked}>{checked}</time> },
        {
          label: "source",
          value: project.githubUrl ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent/80 transition-colors"
            >
              {project.githubUrl.replace("https://", "")}&nbsp;↗
            </a>
          ) : (
            "private repo"
          ),
        },
      ]}
      paragraphs={project.longDescription.split("\n\n")}
      stats={project.stats}
      statsAsOf={project.statsAsOf}
      points={{ heading: "highlights", items: project.highlights }}
      detail={detail}
    />
  );
}
