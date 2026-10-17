// static: every show is prerendered at build (generateStaticParams)
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { alternates } from "@/lib/canonical";
import Image from "next/image";
import { enterStyle } from "@/lib/enter";
import SiteNav from "@/components/nav";
import BackLink from "@/components/back-link";
import { SECTION_HEADING, SECTION_SIZE } from "@/components/journey/section-bits";
import { events } from "@/lib/brody-events";


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
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { alternates: alternates(`/shows/${slug}`) };
}

export default async function ShowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = events.find((e) => e.slug === slug);

  if (!event) notFound();

  const images = event.media.filter((m) => m.type === "image");

  return (
    <div className="theme-sound relative min-h-screen bg-background">
      {/* background: the persistent stage in app/(site)/layout.tsx */}
      <SiteNav />

      <main className="relative z-10 pt-32 px-6 md:px-12 pb-32">
        <div className="mx-auto max-w-3xl">
          <BackLink href="/music" />

          {/* section header */}
          <p
            className={`enter mb-6 ${SECTION_HEADING} text-foreground/60`}
            style={{ ...enterStyle({ x: -12, dur: 0.6 }), fontSize: SECTION_SIZE.sm }}
          >
            show
          </p>

          {/* headline row */}
          <div
            className="enter flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 mb-2"
            style={enterStyle({ y: 14, dur: 0.5, delay: 0.1 })}
          >
            <h1
              className="text-iridescent-stroke font-sans font-light text-foreground/90"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
            >
              {event.venue}
            </h1>
            <span className="font-mono text-sm text-foreground/55">{event.date}</span>
          </div>

          <p
            className="enter font-mono text-sm text-foreground/65 mb-10"
            style={enterStyle({ dur: 0.4, delay: 0.2 })}
          >
            {event.city}
          </p>

          <AsciiRule className="mb-8" />

          {/* metadata grid */}
          <div
            className="enter flex flex-col gap-3 mb-10"
            style={enterStyle({ y: 10, dur: 0.45, delay: 0.25 })}
          >
            {[
              { label: "format",    value: event.format                          },
              ...(event.headliners?.length
                ? [{ label: "headliner", value: event.headliners.join(" · ") }]
                : []),
              ...(event.promoter
                ? [{
                    label: "promoter",
                    value: event.promoter,
                    href: event.promoterUrl,
                  }]
                : []),
            ].map(({ label, value, href }: { label: string; value: string; href?: string }) => (
              <div key={label} className="grid grid-cols-[6.5rem_1fr] items-baseline gap-x-8">
                <span className="font-mono text-xs text-foreground/52">{label}</span>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="copy-sm hover:text-accent/80 transition-colors"
                  >
                    {value}&nbsp;<span aria-hidden="true" className="font-mono opacity-60">↗</span>
                  </a>
                ) : (
                  <span className="copy-sm">{value}</span>
                )}
              </div>
            ))}
          </div>

          <AsciiRule className="mb-8" />

          {/* context */}
          <div
            className="enter"
            style={enterStyle({ y: 10, dur: 0.5, delay: 0.35 })}
          >
            <p className="copy mb-6">
              {event.context}
            </p>
            {event.setlistNote && (
              <p className="copy-sm pl-3 border-l border-white/10">
                {event.setlistNote}
              </p>
            )}
          </div>

          {/* images */}
          {images.length > 0 && (
            <div
              className="enter mt-12"
              style={enterStyle({ y: 10, dur: 0.5, delay: 0.45 })}
            >
              <AsciiRule className="mb-8" />
              <div
                className={`grid gap-3 ${images.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
              >
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="photo-hover relative w-full overflow-hidden border border-white/8"
                    style={{ maxHeight: "360px", aspectRatio: "16/9" }}
                  >
                    <Image
                      src={img.src}
                      alt=""
                      fill
                      loading="lazy"
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* links */}
          {event.links && event.links.length > 0 && (
            <div
              className="enter mt-10 flex flex-wrap gap-6"
              style={enterStyle({ dur: 0.4, delay: 0.55 })}
            >
              {event.links.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-foreground/55 hover:text-foreground/75 transition-colors"
                >
                  {label}&nbsp;↗
                </a>
              ))}
            </div>
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
