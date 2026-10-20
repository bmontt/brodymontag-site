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

/** a card in a two-up row (wide screens; one column on phones): it slides in
 *  and out from its own column's side as you scroll and holds there
 *  (WidgetSlide), and the laser network reads it to take its project's shape
 *  and sink behind it (lib/director/software-figure.ts). Both cards in a row
 *  stretch to one height. */
function Pair({ n, id, stage, children }: { n: number; id?: string; stage?: string; children: React.ReactNode }) {
  return (
    <div id={id} data-slide={n % 2 === 1 ? "right" : "left"} data-pair="" data-stage-id={stage} className="relative min-w-0 scroll-mt-28 [&>*]:h-full">
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
                    { title: "projects", tiles: projects.map((p) => ({ label: p.name, href: `#project-${p.slug}`, meta: p.status })) },
                    { title: "experience", tiles: experience.map((e) => ({ label: e.org, href: `#role-${e.id}`, meta: years(e.period) })) },
                    { title: "stack", tiles: stack.map((c) => ({ label: c.label, href: "#stack", meta: `${c.items.length}` })) },
                  ]}
                />
              </div>
            </FullBleed>

            <div>
              <SectionLabel>projects</SectionLabel>
              {/* two to a row on wide screens, one column on phones */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {projects.map((p, i) => (
                  <Pair key={p.id} n={i} id={`project-${p.slug}`} stage={`project:${p.id}`}>
                    <ProjectCard project={p} />
                  </Pair>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>experience</SectionLabel>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {experience.map((e, i) => (
                  <Pair key={e.id} n={i} id={`role-${e.id}`}>
                    <ExperienceCard entry={e} />
                  </Pair>
                ))}
              </div>
            </div>

            <div id="stack" className="scroll-mt-28">
              <SectionLabel>stack</SectionLabel>
              {/* the whole stack slides in as one block, three across */}
              <div data-slide="left" className="relative">
                <StackGrid />
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
