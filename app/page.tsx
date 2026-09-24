// ── home ──────────────────────────────────────────────────────────────────────
// Server component. The journey is organized by THEME, then closes on a
// chronological coda:
//   hero → code (projects · experience · stack)
//        → music (gigs · upcoming · releases · collective)
//        → timeline (horizontal year-by-year, re-surfacing everything)
//        → epilogue (about · contact · presence)
// A client shell (JourneyRoot → Vessel + TimelineNav + JourneyController) wraps
// the server-rendered chapters; only hero/vessel/nav/controller/presence are
// client. Entry wrappers carry `data-reveal`; the controller animates them.

import Image from "next/image";
import JourneyRoot from "@/components/journey/journey-root";
import Chapter from "@/components/journey/chapter";
import HeroChapter from "@/components/journey/hero-chapter";
import TimelineSection from "@/components/journey/timeline-section";
import EntryCard from "@/components/journey/entry-card";
import ProjectCard from "@/components/cards/project-card";
import ExperienceCard from "@/components/cards/experience-card";
import ReleaseCard from "@/components/cards/release-card";
import CollectiveCard from "@/components/cards/collective-card";
import StackGrid from "@/components/cards/stack-grid";
import PresenceGrid from "@/components/journey/presence-grid";
import { getChapter } from "@/lib/chapters";
import { getAllEntries, isFuture } from "@/lib/timeline";
import { projects } from "@/lib/projects";
import { experience } from "@/lib/stack-data";
import { releases } from "@/lib/releases-data";
import { content } from "@/lib/content";
import { renderInline } from "@/components/rich-text";

// ── local helpers (server) ─────────────────────────────────────────────────────

const ch = (id: string) => getChapter(id)!;

function AsciiRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`font-mono text-xs text-foreground/15 overflow-hidden whitespace-nowrap ${className}`}
    >
      {"─".repeat(300)}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p data-scramble className="font-mono text-xs text-iridescent-dim mb-4">{`// ${children}`}</p>
  );
}

// ── page ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const shows = getAllEntries().filter((e) => e.kind === "show");
  const pastShows = [...shows.filter((e) => !isFuture(e))].reverse(); // newest first
  const upcomingShows = shows.filter((e) => isFuture(e));

  return (
    <JourneyRoot>
      <main id="journey">
        {/* ── hero ─────────────────────────────────────────────────── */}
        <HeroChapter />

        {/* ── code · work · CS ─────────────────────────────────────── */}
        <Chapter {...ch("code")}>
          <div className="mx-auto flex max-w-5xl flex-col gap-16">
            <div>
              <SectionLabel>projects</SectionLabel>
              <div className="flex flex-col gap-2">
                {projects.map((p) => (
                  <div key={p.id} data-reveal>
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

        {/* ── music ─────────────────────────────────────────────────── */}
        <Chapter {...ch("music")}>
          <div className="mx-auto flex max-w-5xl flex-col gap-16">
            {upcomingShows.length > 0 && (
              <div data-reveal>
                <SectionLabel>next up</SectionLabel>
                <div className="flex flex-col gap-1">
                  {upcomingShows.map((e) => (
                    <EntryCard key={e.id} entry={e} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <SectionLabel>gigs</SectionLabel>
              <div className="flex flex-col gap-1">
                {pastShows.map((e) => (
                  <div key={e.id} data-reveal>
                    <EntryCard entry={e} />
                  </div>
                ))}
              </div>
              {/* supported these artists — credit strip */}
              <div
                data-reveal
                className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5"
              >
                <span className="font-mono text-xs text-foreground/25 shrink-0">
                  {content.music.shows.supportedLabel}
                </span>
                {content.music.shows.supportedArtists.map(({ name, logo }) => (
                  <Image
                    key={logo}
                    src={`/artistLogos/${logo}.webp`}
                    alt={name}
                    title={name}
                    width={140}
                    height={48}
                    loading="lazy"
                    className="h-8 w-auto object-contain opacity-50 hover:opacity-95 transition-opacity duration-200"
                    sizes="140px"
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>releases</SectionLabel>
              <div className="flex flex-col gap-10">
                {releases.map((r) => (
                  <div key={r.id} data-reveal>
                    <ReleaseCard release={r} />
                  </div>
                ))}
                <div data-reveal>
                  <p data-scramble className="font-mono text-xs text-iridescent-dim mb-3">// latest tracks</p>
                  <div className="pill-iridescent border border-white/8 overflow-hidden">
                    <iframe
                      title="SoundCloud"
                      width="100%"
                      height="120"
                      scrolling="no"
                      frameBorder="no"
                      allow="autoplay"
                      src={content.music.releases.soundcloudEmbedUrl}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div data-reveal>
              <SectionLabel>collective</SectionLabel>
              <CollectiveCard />
            </div>
          </div>
        </Chapter>

        {/* ── timeline (horizontal year-by-year) ───────────────────── */}
        <TimelineSection />

        {/* ── epilogue (about · contact · presence) ────────────────── */}
        <Chapter {...ch("epilogue")}>
          <div className="mx-auto flex max-w-5xl flex-col gap-20">
            {/* about */}
            <div className="flex items-start justify-between gap-12">
              <div className="min-w-0 flex-1">
                <div className="mb-10 flex flex-col gap-3" data-reveal>
                  {content.about.meta.map(({ label, value }, i) => (
                    <div key={i} className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                      <span className="font-mono text-xs text-foreground/45">{label}</span>
                      <span className="font-mono text-xs text-foreground/75">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex max-w-xl flex-col gap-5">
                  {content.about.paragraphs.map((para, i) => (
                    <p
                      key={i}
                      data-reveal
                      className="font-sans text-base text-foreground/65 leading-relaxed"
                    >
                      {renderInline(para)}
                    </p>
                  ))}
                </div>

                <AsciiRule className="my-10" />

                <div className="flex flex-wrap items-center gap-8" data-reveal>
                  {content.about.socials.map(({ href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-foreground/45 hover:text-foreground/85 transition-colors"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              <div
                data-reveal
                className="hidden shrink-0 flex-col items-end gap-2 md:flex"
              >
                <Image
                  src="/brody.optimized.webp"
                  alt="Brody Montag"
                  width={144}
                  height={176}
                  loading="lazy"
                  className="pill-iridescent h-44 w-36 border border-white/10 object-cover object-top grayscale brightness-[0.72] contrast-[1.12]"
                  sizes="144px"
                />
                <p className="font-mono text-xs text-foreground/25">
                  {content.about.photoCaption}
                </p>
              </div>
            </div>

            {/* presence */}
            <div data-reveal>
              <SectionLabel>presence</SectionLabel>
              <PresenceGrid />
            </div>

            {/* contact */}
            <div>
              <p
                data-reveal
                className="text-iridescent mb-12 font-sans text-3xl font-light md:text-4xl"
              >
                {content.contact.headline}
              </p>

              <div className="flex flex-col gap-4" data-reveal>
                {content.contact.items.map(({ label, value, href }) => (
                  <div key={label} className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                    <span className="font-mono text-xs text-foreground/45 pt-0.5">
                      {label}
                    </span>
                    <a
                      href={href}
                      className="font-mono text-sm text-foreground/75 hover:text-accent/85 transition-colors"
                    >
                      {value}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Chapter>

        {/* ── footer ───────────────────────────────────────────────── */}
        <footer className="relative z-20 border-t border-white/5 px-6 py-8 md:px-12">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <p className="font-mono text-xs text-foreground/35">{content.meta.copyright}</p>
            <p className="font-mono text-xs text-foreground/35">{content.meta.domain}</p>
          </div>
        </footer>
      </main>
    </JourneyRoot>
  );
}
