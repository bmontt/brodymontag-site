import type { Metadata } from "next";
import JourneyRoot from "@/components/journey/journey-root";
import Chapter from "@/components/journey/chapter";
import SiteNav from "@/components/nav";
import ProjectCard from "@/components/cards/project-card";
import ExperienceCard from "@/components/cards/experience-card";
import StackGrid from "@/components/cards/stack-grid";
import { SectionLabel, SiteFooter } from "@/components/journey/section-bits";
import NextSection from "@/components/journey/next-section";
import { nowLines } from "@/lib/now";
import { flag } from "@/lib/flags";
import { getChapter } from "@/lib/chapters";
import { projects } from "@/lib/projects";
import { experience } from "@/lib/stack-data";

// ── /software ─────────────────────────────────────────────────────────────────
// The tech half: projects, experience, stack. White-grey-black; the laser
// layer holds a white knot in the gutter (lib/director/laser.ts, "software").

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
        <Chapter {...ch} figure opener={flag("openers") ? { index: "01", title: "software", tone: "text-foreground", now: flag("now") ? nowLines().software : undefined } : undefined}>
          <div className="flex flex-col gap-16">
            <div>
              <SectionLabel>projects</SectionLabel>
              <div className="flex flex-col gap-2">
                {projects.map((p) => (
                  <div key={p.id} data-reveal data-stage-id={`project:${p.id}`}>
                    <ProjectCard project={p} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>experience</SectionLabel>
              <div className="flex flex-col gap-10">
                {experience.map((e) => (
                  <div key={e.id} data-reveal>
                    <ExperienceCard entry={e} />
                  </div>
                ))}
              </div>
            </div>

            <div data-reveal>
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
