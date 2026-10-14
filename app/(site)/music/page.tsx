import type { Metadata } from "next";
import JourneyRoot from "@/components/journey/journey-root";
import Chapter from "@/components/journey/chapter";
import SiteNav from "@/components/nav";
import Image from "next/image";
import EntryCard from "@/components/journey/entry-card";
import ReleaseCard from "@/components/cards/release-card";
import CollectiveCard from "@/components/cards/collective-card";
import { SectionLabel, SiteFooter, logoHeight, type SupportedArtist } from "@/components/journey/section-bits";
import { getChapter } from "@/lib/chapters";
import { getAllEntries, isFuture } from "@/lib/timeline";
import { releases } from "@/lib/releases-data";
import { content } from "@/lib/content";

// ── /music ────────────────────────────────────────────────────────────────────
// The sound half: shows, supported artists, releases, the collective. The
// pearlescent scale; the laser layer raises shimmering fans in the gutter
// (lib/director/laser.ts, "music").

export const metadata: Metadata = {
  title: "music",
  description: "Monty (US) — shows, releases and the PB&J Sounds collective.",
};

export default function MusicPage() {
  const ch = getChapter("music")!;
  const shows = getAllEntries().filter((e) => e.kind === "show");
  const pastShows = [...shows.filter((e) => !isFuture(e))].reverse(); // newest first
  const upcomingShows = shows.filter((e) => isFuture(e));
  return (
    <JourneyRoot>
      <SiteNav />
      <main id="journey">
        {/* ── music ─────────────────────────────────────────────────── */}
        <Chapter {...ch} figure>
          <div className="flex flex-col gap-16">
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
                  <div key={e.id} data-reveal data-stage-id={`show:${e.id}`}>
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
                {(content.music.shows.supportedArtists as SupportedArtist[]).map((a) =>
                  a.logo && a.w && a.h ? (
                    <Image
                      key={a.name}
                      src={`/artistLogos/${a.logo}.webp`}
                      alt={a.name}
                      title={a.name}
                      width={a.w}
                      height={a.h}
                      loading="lazy"
                      className="w-auto object-contain opacity-50 transition-opacity duration-200 hover:opacity-95"
                      style={{ height: logoHeight(a.w / a.h) }}
                      sizes="160px"
                    />
                  ) : (
                    // no logo file yet: a plain wordmark at the strip's cap height
                    <span
                      key={a.name}
                      title={a.name}
                      className="font-sans text-xl font-medium uppercase leading-none tracking-[0.08em] text-foreground/50 transition-opacity duration-200 hover:text-foreground/95"
                    >
                      {a.name}
                    </span>
                  ),
                )}
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
      </main>
      <SiteFooter />
    </JourneyRoot>
  );
}
