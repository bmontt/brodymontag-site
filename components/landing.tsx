"use client";

// ── landing ───────────────────────────────────────────────────────────────────
// The front door, split down the middle. The name types in; the rule under it
// carries the two signals — white (tech) on the left half, pearlescent (sound)
// on the right, meeting in the middle (the laser layer draws them on
// [data-laser-anchor="rule"]). Below: the two halves as big choices, software
// left and music right, and "about me" staggered beneath, where they meet.
// Hovering a choice wakes its figure behind it (the knot, the fans, the
// orbit — lib/director/laser.ts, "home"); picking one bursts it on the way out.

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import TypedHeading from "@/components/typed-heading";
import { ICONS } from "@/lib/platform-data";
import { content } from "@/lib/content";
import { glow } from "@/lib/glow";
import { useState } from "react";

const j = content.journey as Record<string, { heading: string }>;
const caption = (id: string) => j[id].heading.split(" — ").pop()!.replace(/\.$/, "");
const LINKS = content.hero.links.map((l) => ({ ...l, icon: ICONS[l.icon] }));

const OPTIONS = [
  { href: "/software", id: "software", label: "software", caption: caption("code"), tone: "text-foreground",
    place: "md:justify-self-start md:text-left", size: "clamp(3.25rem, 10vw, 9rem)" },
  { href: "/music", id: "music", label: "music", caption: caption("music"), tone: "text-shimmer",
    place: "md:justify-self-end md:text-right", size: "clamp(3.25rem, 10vw, 9rem)" },
  { href: "/about", id: "about", label: "about me", caption: caption("epilogue"), tone: "text-blend",
    place: "md:col-span-2 md:justify-self-center md:text-center", size: "clamp(2.6rem, 7.5vw, 6.75rem)" },
] as const;

export default function Landing() {
  const reduced = useReducedMotion();
  const [hoverLink, setHoverLink] = useState<string | null>(null);
  const rise = (i: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 28, filter: "blur(8px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { delay: 1.15 + i * 0.16, duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <main
      id="landing"
      className="relative z-20 flex min-h-dvh flex-col items-center justify-center px-6 py-24 md:px-12"
    >
      <h1
        className="text-iridescent-stroke text-center font-sans font-light text-foreground"
        style={{ fontSize: "clamp(2.6rem, 7vw, 6.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
      >
        <TypedHeading
          text={content.hero.name}
          typos={[
            { at: 2, wrong: "ad" },
            { at: 12, wrong: "e", noticeMs: 340 },
          ]}
          startDelay={150}
        />
      </h1>

      {/* the split rule — the laser layer draws the two signals here */}
      <div aria-hidden="true" data-laser-anchor="rule" className="my-8 h-8 w-full max-w-6xl md:my-12" />

      <nav aria-label="sections" className="landing-opts grid w-full max-w-6xl grid-cols-1 gap-y-10 md:grid-cols-2 md:gap-y-6">
        {OPTIONS.map((o, i) => (
          <motion.div key={o.id} className={`landing-opt ${o.place}`} {...rise(i)}>
            <Link
              href={o.href}
              data-stage-id={`nav:${o.id}`}
              data-laser-anchor={`opt-${o.id}`}
              className="group inline-block outline-none"
            >
              <span
                className={`block font-sans font-medium leading-[0.9] tracking-[-0.045em] transition-[letter-spacing] duration-500 group-hover:tracking-[-0.03em] group-focus-visible:tracking-[-0.03em] ${o.tone}`}
                style={{ fontSize: o.size }}
              >
                {o.label}
              </span>
              <span className="mt-3 block font-mono text-xs text-foreground/35 transition-colors duration-300 group-hover:text-foreground/70">
                {o.caption}
              </span>
            </Link>
          </motion.div>
        ))}
      </nav>

      <motion.div
        className="iri-cycle absolute bottom-8 flex items-center gap-5"
        initial={reduced ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9, duration: 0.8 }}
      >
        {LINKS.map(({ id, icon: Icon, href, label, glowRgb }) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            onMouseEnter={() => setHoverLink(id)}
            onMouseLeave={() => setHoverLink(null)}
            style={{
              color: hoverLink === id ? glow(glowRgb, 1) : "rgba(255,255,255,0.28)",
              transition: "color 0.25s ease",
            }}
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
      </motion.div>
    </main>
  );
}
