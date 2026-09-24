// ── hero-chapter ──────────────────────────────────────────────────────────────
// "use client" — has typing state, framer-motion parallax, hover state.
// Lifted verbatim from app/page.tsx hero section (lines ~115-209).
// Wraps in <section data-chapter id="hero"> at z-20 (reading layer).
//
// Parallax: framer-motion useScroll / useReducedMotion kept as-is.
// heroY: drops to 0 when prefersReducedMotion is true.

"use client";

import { useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Typewriter from "@/components/typewriter";
import TypedHeading from "@/components/typed-heading";
import { ICONS } from "@/lib/platform-data";
import { content } from "@/lib/content";

// ── constants ─────────────────────────────────────────────────────────────────

// typing duration: subtitle length × 55ms charDelay + 1600ms start delay
const LINKS_APPEAR = (content.hero.subtitle.length * 55 + 1600) / 1000 + 0.4;

// hero links: copy from content.json, icon key resolved to its component
const HERO_LINKS = content.hero.links.map((l) => ({ ...l, icon: ICONS[l.icon] }));

// ── component ─────────────────────────────────────────────────────────────────

export default function HeroChapter() {
  const [typingComplete, setTypingComplete] = useState(false);
  const [hoveredHeroLink, setHoveredHeroLink] = useState<string | null>(null);

  const prefersReducedMotion = useReducedMotion();

  const { scrollY } = useScroll();
  const heroYParallax = useTransform(scrollY, [0, 700], [0, -80]);
  const heroY = prefersReducedMotion ? 0 : heroYParallax;

  return (
    <section
      data-chapter
      id="hero"
      className="relative z-20 flex min-h-screen flex-col justify-center px-6 md:px-12"
    >
      <motion.div style={{ y: heroY }} className="relative mx-auto w-full max-w-5xl">

        <h1
          className="text-iridescent-stroke font-sans font-light text-foreground"
          style={{ fontSize: "clamp(2.6rem, 7vw, 6.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
        >
          <TypedHeading
            text={content.hero.name}
            typos={[
              { at: 2, wrong: "ad" },                // "Br" → "Bra" → "Brad" → (notices) → "Bra" → "Br" → "Bro"
              { at: 12, wrong: "e", noticeMs: 340 }, // "Montag" → "Montage" → (beat) → "Montag"
            ]}
            startDelay={150}
          />
        </h1>

        <motion.div
          className="my-6 font-mono text-xs text-foreground/20 overflow-hidden whitespace-nowrap"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.0, delay: 0.7, ease: "easeInOut" }}
        >
          {"─".repeat(300)}
        </motion.div>

        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.01 }}
        >
          <motion.span
            className="font-mono text-sm"
            animate={
              typingComplete
                ? { color: ["#d4a500", "#c9a800", "#d4a500"] }
                : { color: "#d4a50099" }
            }
            transition={{ duration: 2.5, repeat: typingComplete ? Infinity : 0, ease: "easeInOut" }}
          >
            &gt;
          </motion.span>
          {typingComplete ? (
            <span className="font-mono text-sm subtitle-pulse">
              {content.hero.subtitle}
            </span>
          ) : (
            <span className="font-mono text-sm text-muted-foreground">
              <Typewriter
                text={content.hero.subtitle}
                charDelay={55}
                startDelay={1600}
                onComplete={() => setTypingComplete(true)}
              />
            </span>
          )}
        </motion.div>

        <motion.div
          className="mt-8 flex items-center gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: LINKS_APPEAR }}
        >
          {HERO_LINKS.map(({ id, icon: Icon, href, label, glowRgb }) => (
            <a
              key={id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              onMouseEnter={() => setHoveredHeroLink(id)}
              onMouseLeave={() => setHoveredHeroLink(null)}
              style={{
                color: hoveredHeroLink === id ? `rgb(${glowRgb})` : "rgba(255,255,255,0.28)",
                transition: "color 0.25s ease",
              }}
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </motion.div>

        {/* elevator pitch — persona summary */}
        <motion.p
          className="mt-12 max-w-xl font-mono text-xs leading-relaxed text-foreground/55"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: LINKS_APPEAR + 0.5, duration: 0.8 }}
        >
          {content.hero.elevatorPitch}
        </motion.p>
      </motion.div>
    </section>
  );
}
