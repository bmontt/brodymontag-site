import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import JourneyRoot from "@/components/journey/journey-root";
import Chapter from "@/components/journey/chapter";
import SiteNav from "@/components/nav";
import ProjectCard from "@/components/cards/project-card";
import SummaryTiles from "@/components/summary-tiles";
import FullBleed from "@/components/full-bleed";
import ExperienceCard from "@/components/cards/experience-card";
import StackGrid from "@/components/cards/stack-grid";
import { SectionLabel, SiteFooter } from "@/components/journey/section-bits";
import NextSection from "@/components/journey/next-section";
import WidgetSlide from "@/components/journey/widget-slide";
import { nowLines } from "@/lib/now";
import { flag } from "@/lib/flags";
import { getChapter } from "@/lib/chapters";
import { projects } from "@/lib/projects";
import { experience, stack } from "@/lib/stack-data";

// ── /software ─────────────────────────────────────────────────────────────────
// The tech half: projects, experience, stack. White-grey-black; the laser
// layer holds a white network behind the widgets (lib/director/laser.ts,
// "software"), re-wiring into each project's shape as it comes up.

/** "June 2025 — present" → "2025–now"; "2021 — 2025" → "2021–25" */
const years = (period: string) => {
  const [a, b] = period.split(" — ").map((x) => x.match(/\d{4}/)?.[0] ?? x);
  return b === "present" || !b ? `${a}–now` : a === b ? a : `${a}–${b.slice(2)}`;
};

/** a widget on alternating sides (wide screens); it slides in and out from
 *  its own side as you scroll (WidgetSlide), and the laser network reads it to
 *  take its project's shape and sink behind it (lib/director/software-figure.ts) */
function Alt({ n, id, stage, children }: { n: number; id?: string; stage?: string; children: React.ReactNode }) {
  const right = n % 2 === 1;
  return (
    <div id={id} data-slide={right ? "right" : "left"} data-stage-id={stage} className={`relative scroll-mt-28 md:w-[60%] ${right ? "md:self-end" : "md:self-start"}`}>
      {children}
    </div>
  );
}

export const metadata: Metadata = {
  title: "software",
  description: "Projects, experience and stack — machine learning, agentic systems, audio.",
  alternates: alternates("/software"),
};

export default function SoftwarePage() {
  const ch = getChapter("code")!;
  return (
    <JourneyRoot>
      <SiteNav />
      <WidgetSlide />
      <main id="journey">
        {/* ── code · work · CS ─────────────────────────────────────── */}
        <Chapter {...ch} opener={flag("openers") ? { back: "/", index: "01", title: "software", tone: "text-foreground", now: flag("now") ? nowLines().software : undefined } : undefined}>
          <div className="mx-auto flex max-w-6xl flex-col gap-16">
            {/* the overview before the detail: every title as a tile, edge to
                edge; pinned, they pour down into the cards below */}
            <FullBleed>
              <div className="mx-auto max-w-6xl px-6 md:px-12">
                <SummaryTiles
                  groups={[
                    { title: "projects", tiles: projects.map((p) => ({ label: p.name, href: `#project-${p.slug}`, meta: p.status === "wip" ? "in progress" : "live" })) },
                    { title: "experience", tiles: experience.map((e) => ({ label: e.org, href: `#role-${e.id}`, meta: years(e.period) })) },
                    { title: "stack", tiles: stack.map((c) => ({ label: c.label, href: "#stack", meta: `${c.items.length}` })) },
                  ]}
                />
              </div>
            </FullBleed>

            <div>
              <SectionLabel>projects</SectionLabel>
              {/* an orderly column, each card nudged sideways on a fixed
                  pattern so they don't sit in one rigid line */}
              <div className="flex flex-col gap-6">
                {projects.map((p, i) => (
                  <Alt key={p.id} n={i} id={`project-${p.slug}`} stage={`project:${p.id}`}>
                    <ProjectCard project={p} />
                  </Alt>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>experience</SectionLabel>
              <div className="flex flex-col gap-6">
                {experience.map((e, i) => (
                  <Alt key={e.id} n={projects.length + i} id={`role-${e.id}`}>
                    <ExperienceCard entry={e} />
                  </Alt>
                ))}
              </div>
            </div>

            <div id="stack" className="scroll-mt-28">
              <SectionLabel>stack</SectionLabel>
              <div className="flex flex-col gap-6">
                {stack.map((c, i) => (
                  <Alt key={c.label} n={projects.length + experience.length + i}>
                    <StackGrid categories={[c]} />
                  </Alt>
                ))}
              </div>
            </div>
          </div>
        </Chapter>
        {flag("next") && <NextSection href="/music" id="music" word="music" tone="text-shimmer" caption="rooms, records, the collective" />}
      </main>
      <SiteFooter />
    </JourneyRoot>
  );
}
