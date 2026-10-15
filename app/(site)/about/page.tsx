import type { Metadata } from "next";
import JourneyRoot from "@/components/journey/journey-root";
import Chapter from "@/components/journey/chapter";
import SiteNav from "@/components/nav";
import Image from "next/image";
import TimelineSection from "@/components/journey/timeline-section";
import PresenceGrid from "@/components/journey/presence-grid";
import { AsciiRule, SectionLabel, SiteFooter } from "@/components/journey/section-bits";
import { renderInline } from "@/components/rich-text";
import { getChapter } from "@/lib/chapters";
import NextSection from "@/components/journey/next-section";
import { nowLines } from "@/lib/now";
import { flag } from "@/lib/flags";
import { content } from "@/lib/content";

// ── /about ────────────────────────────────────────────────────────────────────
// Where the halves meet: the about text (beside it the two signals orbit on a
// sheet of spacetime, fuse, and ring down), presence and contact, then the
// 2021 → now timeline as a coda — the same floor, level now, whose white and
// pearl rails converge (lib/director/laser.ts, "about"; about-scene.ts).

export const metadata: Metadata = {
  title: "about",
  description: "About Brody Montag — background, contact, and the timeline from 2021 to now.",
};

export default function AboutPage() {
  const ch = getChapter("epilogue")!;
  return (
    <JourneyRoot>
      <SiteNav />
      <main id="journey">
        {/* ── epilogue (about · contact · presence) ────────────────── */}
        <Chapter {...ch} opener={flag("openers") ? { back: "/", index: "03", title: "about me", tone: "text-blend", now: flag("now") ? nowLines().about : undefined } : undefined}>
          <div className="mx-auto flex max-w-5xl flex-col gap-20">
            {/* about */}
            <div className="flex items-start justify-between gap-12">
              <div className="min-w-0 flex-1">
                <div className="mb-10 flex flex-col gap-3" data-reveal>
                  {content.about.meta.map(({ label, value }, i) => (
                    <div key={i} className="grid gap-y-0.5 sm:grid-cols-[6.5rem_1fr] sm:items-baseline sm:gap-x-8">
                      <span className="font-mono text-xs text-foreground/60">{label}</span>
                      <span className="copy-sm">{value}</span>
                    </div>
                  ))}
                </div>

                {/* reading this carries you over the sheet toward the two
                    signals orbiting beside it (lib/director/about-scene.ts) */}
                <div data-laser-anchor="union" className="max-w-2xl [&>p+p]:mt-5">
                  {content.about.paragraphs.map((para, i) => (
                    <p
                      key={i}
                      data-reveal
                      className="copy"
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
                      className="font-mono text-xs text-foreground/60 hover:text-foreground/85 transition-colors"
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
                  className="pill-iridescent h-44 w-36 border border-white/10 object-cover object-top"
                  sizes="144px"
                />
                <p className="font-mono text-xs text-foreground/40">
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
                {/* the two signals fuse beside this line (lib/director/laser.ts) */}
                <span data-laser-anchor="together">{content.contact.headline}</span>
              </p>

              <div className="flex flex-col gap-4" data-reveal>
                {content.contact.items.map(({ label, value, href }) => (
                  <div key={label} className="grid gap-y-0.5 sm:grid-cols-[6.5rem_1fr] sm:gap-x-8">
                    <span className="font-mono text-xs text-foreground/60 pt-0.5">
                      {label}
                    </span>
                    <a
                      href={href}
                      className="font-mono text-sm text-foreground/85 hover:text-accent/85 transition-colors"
                    >
                      {value}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Chapter>

        {/* ── coda: the timeline, 2021 → now ───────────────────────── */}
        <TimelineSection />

        {flag("next") && <NextSection href="/" id="home" word="start over" tone="text-foreground" caption="back to the split" />}
      </main>
      <SiteFooter />
    </JourneyRoot>
  );
}
