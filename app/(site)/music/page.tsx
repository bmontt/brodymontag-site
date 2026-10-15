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
import NextSection from "@/components/journey/next-section";
import { nowLines } from "@/lib/now";
import { flag } from "@/lib/flags";
import { getAllEntries, isFuture } from "@/lib/timeline";
import { releases } from "@/lib/releases-data";
import { content } from "@/lib/content";
import DeferredIframe from "@/components/deferred-iframe";
import PromoFilm from "@/components/promo-film";
import FullBleed from "@/components/full-bleed";

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
        <Chapter {...ch} figure opener={flag("openers") ? { back: "/", index: "02", title: "music", tone: "text-shimmer", now: flag("now") ? nowLines().music : undefined } : undefined}>
          <div className="flex flex-col gap-16">
            {/* untitled, edge to edge — the set film rises out of the background,
                with the artists supported right beneath it */}
            <div>
              <PromoFilm film={content.music.film} />
              {/* the artists supported: their own heading, then the logos edge to
                  edge like the film above, centered and larger */}
              <div className="mt-20">
                <h3 className="sr-only">{content.music.shows.supportedLabel}</h3>
                <FullBleed className="relative">
                  <div aria-hidden="true" data-laser-anchor="supported" className="pointer-events-none absolute inset-0" />
                  {/* the word stands behind the logos, towering and faint, and
                      rises into place as they scroll in: backing the artists,
                      which is what "support" means here (globals.css .backing-word) */}
                  <span aria-hidden="true" className="backing-word">
                    {content.music.shows.supportedLabel}
                  </span>
                  <div data-reveal className="relative flex flex-wrap items-center justify-center gap-x-8 gap-y-7 px-6 py-[clamp(1.5rem,5vw,4rem)] [--logo-scale:0.6] md:gap-x-14 md:gap-y-10 md:px-12 md:[--logo-scale:1]">
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
                          className="w-auto object-contain opacity-90"
                          style={{ height: `calc(${logoHeight(a.w / a.h)}px * var(--logo-scale))` }}
                          sizes="240px"
                        />
                      ) : (
                        // no logo file yet: a plain wordmark at the strip's cap height
                        <span
                          key={a.name}
                          title={a.name}
                          className="font-sans text-xl md:text-3xl font-medium uppercase leading-none tracking-[0.08em] text-foreground/70 transition-opacity duration-200 hover:text-foreground/95"
                        >
                          {a.name}
                        </span>
                      ),
                    )}
                  </div>
                </FullBleed>
              </div>
            </div>

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
                  <SectionLabel size="sm">latest tracks</SectionLabel>
                  <div className="pill-iridescent border border-white/8 overflow-hidden">
                    <DeferredIframe
                      title="SoundCloud"
                      width="100%"
                      height="120"
                      scrolling="no"
                      frameBorder="no"
                      allow="autoplay"
                      src={content.music.releases.soundcloudEmbedUrl}
                    />
                  </div>
                  <div className="mt-4 overflow-hidden rounded-xl">
                    <DeferredIframe
                      title="Spotify — Monty (US)"
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      src={content.music.releases.spotifyEmbedUrl}
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
        {flag("next") && <NextSection href="/about" id="epilogue" word="about me" tone="text-blend" caption="background, contact, the timeline" />}
      </main>
      <SiteFooter />
    </JourneyRoot>
  );
}
