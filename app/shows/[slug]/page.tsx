"use client";

import { notFound, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Nav from "@/components/nav";
import AsciiBg from "@/components/ascii-bg";
import BackLink from "@/components/back-link";
import { events } from "@/lib/brody-events";

const PHOTO_FILTER = "grayscale(1) brightness(0.72) contrast(1.12)";

function AsciiRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`font-mono text-xs text-foreground/12 overflow-hidden whitespace-nowrap ${className}`}
    >
      {"─".repeat(300)}
    </div>
  );
}

export default function ShowPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const event = events.find((e) => e.slug === slug);

  if (!event) notFound();

  const images = event.media.filter((m) => m.type === "image");

  return (
    <div className="relative min-h-screen bg-background">
      <AsciiBg subpage />
      <Nav />

      <main className="relative z-10 pt-32 px-6 md:px-12 pb-32">
        <div className="mx-auto max-w-3xl">
          <BackLink href="/#music" />

          {/* section header */}
          <motion.div
            className="mb-12 font-mono text-sm text-foreground/28 overflow-hidden whitespace-nowrap"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {`┌─ // show ${"─".repeat(120)}┐`}
          </motion.div>

          {/* headline row */}
          <motion.div
            className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 mb-2"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1
              className="font-sans font-light text-foreground/90"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
            >
              {event.venue}
            </h1>
            <span className="font-mono text-sm text-foreground/40">{event.date}</span>
          </motion.div>

          <motion.p
            className="font-mono text-sm text-foreground/50 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {event.city}
          </motion.p>

          <AsciiRule className="mb-8" />

          {/* metadata grid */}
          <motion.div
            className="flex flex-col gap-3 mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
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
              <div key={label} className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                <span className="font-mono text-xs text-foreground/38">{label}</span>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-foreground/70 hover:text-accent/80 transition-colors"
                  >
                    {value}&nbsp;↗
                  </a>
                ) : (
                  <span className="font-mono text-xs text-foreground/70">{value}</span>
                )}
              </div>
            ))}
          </motion.div>

          <AsciiRule className="mb-8" />

          {/* context */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <p className="font-sans text-base text-foreground/65 leading-relaxed mb-6">
              {event.context}
            </p>
            {event.setlistNote && (
              <p className="font-mono text-xs text-foreground/40 pl-3 border-l border-white/10">
                {event.setlistNote}
              </p>
            )}
          </motion.div>

          {/* images */}
          {images.length > 0 && (
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <AsciiRule className="mb-8" />
              <div
                className={`grid gap-3 ${images.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
              >
                {images.map((img, i) => (
                  <motion.img
                    key={i}
                    src={img.src}
                    alt=""
                    loading="lazy"
                    className="w-full object-cover border border-white/8"
                    style={{ filter: PHOTO_FILTER, maxHeight: "360px", objectFit: "cover" }}
                    whileHover={{
                      filter: "grayscale(0) brightness(1) contrast(1)",
                      borderColor: "rgba(255,255,255,0.18)",
                    }}
                    transition={{ duration: 0.4 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* links */}
          {event.links && event.links.length > 0 && (
            <motion.div
              className="mt-10 flex flex-wrap gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.55 }}
            >
              {event.links.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-foreground/40 hover:text-foreground/75 transition-colors"
                >
                  {label}&nbsp;↗
                </a>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <p className="font-mono text-xs text-foreground/28">© 2026 brody montag</p>
          <p className="font-mono text-xs text-foreground/28">brodymontag.com</p>
        </div>
      </footer>
    </div>
  );
}
