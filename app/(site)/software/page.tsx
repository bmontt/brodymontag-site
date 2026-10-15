import type { Metadata } from "next";
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
import { nowLines } from "@/lib/now";
import { flag } from "@/lib/flags";
import { getChapter } from "@/lib/chapters";
import { projects } from "@/lib/projects";
import { experience, stack } from "@/lib/stack-data";

// ── /software ─────────────────────────────────────────────────────────────────
// The tech half: projects, experience, stack. White-grey-black; the laser
// layer holds a white knot in the gutter (lib/director/laser.ts, "software").

/** "June 2025 — present" → "2025–now"; "2021 — 2025" → "2021–25" */
const years = (period: string) => {
  const [a, b] = period.split(" — ").map((x) => x.match(/\d{4}/)?.[0] ?? x);
  return b === "present" || !b ? `${a}–now` : a === b ? a : `${a}–${b.slice(2)}`;
};

/** sideways nudges (% of the column) for the project cards, repeating */
const SHIFT = [0, 6, 2, 8, 1, 5, 3, 7];

export const metadata: Metadata = {
  title: "software",
  description: "Projects, experience and stack — machine learning, agentic systems, audio.",
};

export default function SoftwarePage() {
  const ch = getChapter("code")!;
  return (
    <JourneyRoot>
      <SiteNav />
      <main id="journey">
        {/* ── code · work · CS ─────────────────────────────────────── */}
        <Chapter {...ch} figure opener={flag("openers") ? { back: "/", index: "01", title: "software", tone: "text-foreground", now: flag("now") ? nowLines().software : undefined } : undefined}>
          <div className="flex flex-col gap-16">
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
              <div className="flex flex-col gap-5">
                {projects.map((p, i) => (
                  <div
                    key={p.id}
                    id={`project-${p.slug}`}
                    data-reveal
                    data-stage-id={`project:${p.id}`}
                    className="scroll-mt-28 w-[92%] sm:w-[90%]"
                    style={{ marginLeft: `${SHIFT[i % SHIFT.length]}%` }}
                  >
                    <ProjectCard project={p} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>experience</SectionLabel>
              <div className="flex flex-col gap-4">
                {experience.map((e) => (
                  <div key={e.id} id={`role-${e.id}`} data-reveal className="scroll-mt-28">
                    <ExperienceCard entry={e} />
                  </div>
                ))}
              </div>
            </div>

            <div id="stack" data-reveal className="scroll-mt-28">
              <SectionLabel>stack</SectionLabel>
              <StackGrid />
            </div>
          </div>
        </Chapter>
        {flag("next") && <NextSection href="/music" id="music" word="music" tone="text-shimmer" caption="rooms, records, the collective" />}
      </main>
      <SiteFooter />
    </JourneyRoot>
  );
}
