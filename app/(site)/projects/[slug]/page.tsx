// static: every project is prerendered at build (generateStaticParams)
import type { Metadata } from "next";
import "./detail.css";
import { notFound } from "next/navigation";
import { alternates } from "@/lib/canonical";
import { enterStyle } from "@/lib/enter";
import SiteNav from "@/components/nav";
import BackLink from "@/components/back-link";
import { SECTION_HEADING, SECTION_SIZE } from "@/components/journey/section-bits";
import { StatWidgets, SubWidgets } from "@/components/widgets";
import DetailSections from "@/components/blocks/detail-sections";
import { getDetail } from "@/content/detail";
import { isMoving, projects, statusLine } from "@/lib/projects";

function AsciiRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`font-mono text-xs text-foreground/28 overflow-hidden whitespace-nowrap ${className}`}
    >
      {"─".repeat(300)}
    </div>
  );
}

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

  const paragraphs = project.longDescription.split("\n\n");
  // the long-form part (code, diagrams, decisions, results), where one exists
  const detail = getDetail("project", project.slug);

  return (
    <div className="relative min-h-screen bg-background">
      {/* background: the persistent stage in app/(site)/layout.tsx */}
      <SiteNav />

      <main className="relative z-10 pt-32 px-6 md:px-12 pb-32">
        <div className="mx-auto max-w-3xl">
          <BackLink href="/software" />

          {/* section header */}
          <p
            className={`enter mb-6 ${SECTION_HEADING} text-foreground/60`}
            style={{ ...enterStyle({ x: -12, dur: 0.6 }), fontSize: SECTION_SIZE.sm }}
          >
            project
          </p>

          {/* headline row */}
          <div
            className="enter flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 mb-4"
            style={enterStyle({ y: 14, dur: 0.5, delay: 0.1 })}
          >
            <h1
              className="text-iridescent-stroke font-sans font-light text-foreground/90"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
            >
              {project.name}
            </h1>
            <span
              className={`font-mono text-xs px-2 py-0.5 border ${
                isMoving(project.status)
                  ? "text-accent/75 border-accent/25"
                  : "text-foreground/60 border-white/12"
              }`}
            >
              {project.status}
            </span>
          </div>

          <AsciiRule className="mb-8" />

          {/* metadata */}
          <div
            className="enter flex flex-col gap-3 mb-10"
            style={enterStyle({ y: 10, dur: 0.45, delay: 0.25 })}
          >
            <div className="grid grid-cols-[6.5rem_1fr] gap-x-8">
              <span className="font-mono text-xs text-foreground/52">stack</span>
              <span className="font-mono text-xs text-foreground/80">
                {project.tags.map((t) => t.toLowerCase()).join(" · ")}
              </span>
            </div>
            <div className="grid grid-cols-[6.5rem_1fr] gap-x-8">
              <span className="font-mono text-xs text-foreground/52">status</span>
              <span className="font-mono text-xs text-foreground/80">
                {statusLine(project)}
                {project.statusNote && <> · {project.statusNote}</>}
              </span>
            </div>
            <div className="grid grid-cols-[6.5rem_1fr] gap-x-8">
              <span className="font-mono text-xs text-foreground/52">checked</span>
              <time dateTime={detail?.updated ?? project.updated} className="font-mono text-xs text-foreground/80">{detail?.updated ?? project.updated}</time>
            </div>
            {!project.githubUrl && (
              <div className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                <span className="font-mono text-xs text-foreground/52">source</span>
                <span className="font-mono text-xs text-foreground/80">private repo</span>
              </div>
            )}
            {project.githubUrl && (
              <div className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                <span className="font-mono text-xs text-foreground/52">source</span>
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-foreground/80 hover:text-accent/80 transition-colors"
                >
                  {project.githubUrl.replace("https://", "")}&nbsp;↗
                </a>
              </div>
            )}
          </div>

          <AsciiRule className="mb-8" />

          {/* description */}
          <div
            className="enter flex flex-col gap-5 mb-12"
            style={enterStyle({ y: 10, dur: 0.5, delay: 0.35 })}
          >
            {paragraphs.map((para, i) => (
              <p
                key={i}
                className="copy"
              >
                {para}
              </p>
            ))}
          </div>

          <AsciiRule className="mb-8" />

          {/* live figures, where a project has them (a dated snapshot) */}
          {project.stats && (
            <div className="enter mb-14" style={enterStyle({ y: 10, dur: 0.5, delay: 0.4 })}>
              <h2 className={`mb-1 ${SECTION_HEADING}`} style={{ fontSize: SECTION_SIZE.sm }}>results</h2>
              {project.statsAsOf && <p className="font-mono text-xs text-foreground/55">as of {project.statsAsOf.toLowerCase()}</p>}
              <StatWidgets stats={project.stats} cols={4} />
            </div>
          )}

          {/* highlights */}
          <div
            className="enter"
            style={enterStyle({ y: 10, dur: 0.5, delay: 0.45 })}
          >
            <h2 className={`mb-5 ${SECTION_HEADING}`} style={{ fontSize: SECTION_SIZE.sm }}>highlights</h2>
            <SubWidgets items={project.highlights} />
          </div>

          {detail && (
            <>
              <AsciiRule className="mt-14 mb-10" />
              <DetailSections doc={detail} />
            </>
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <p className="font-mono text-xs text-foreground/42">© 2026 brody montag</p>
          <p className="font-mono text-xs text-foreground/42">brodymontag.com</p>
        </div>
      </footer>
    </div>
  );
}
