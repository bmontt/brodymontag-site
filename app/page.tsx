"use client";

import { motion } from "framer-motion";
import { FaSoundcloud, FaGithub, FaInstagram, FaSpotify } from "react-icons/fa";
import Nav from "@/components/nav";
import AsciiBg from "@/components/ascii-bg";
import Typewriter from "@/components/typewriter";
import { events } from "@/lib/brody-events";
import { projects } from "@/lib/projects";

// ── Helpers ──────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <motion.div
      className="mb-12 font-mono text-sm text-foreground/20 overflow-hidden whitespace-nowrap"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {`┌─ // ${label} ${"─".repeat(120)}┐`}
    </motion.div>
  );
}

function AsciiRule({ className = "" }: { className?: string }) {
  return (
    <div className={`font-mono text-xs text-foreground/8 overflow-hidden whitespace-nowrap ${className}`}>
      {"─".repeat(300)}
    </div>
  );
}

const SOCIALS = [
  { icon: FaSoundcloud, href: "https://soundcloud.com/brodymontag", label: "soundcloud ↗" },
  { icon: FaSpotify,   href: "https://open.spotify.com/artist/3uIzwP6Ab6TgP61naHtDMO", label: "spotify ↗" },
  { icon: FaInstagram, href: "https://www.instagram.com/brodymontag", label: "instagram ↗" },
  { icon: FaGithub,    href: "https://github.com/bmontt", label: "github ↗" },
];

const MUSIC_META = [
  { label: "collective", value: "pb&j sounds",                         href: "https://pbandjsounds.com" },
  { label: "residency",  value: "beatprint at transmission dc" },
  { label: "release",    value: '"when a fire starts to burn" (oct 2025)', href: "https://soundcloud.com/brodymontag" },
  { label: "listening",  value: "soundcloud.com/brodymontag",           href: "https://soundcloud.com/brodymontag" },
  { label: "supported",  value: "biscits · martin ikin · ownboss · veggi · side quest · jake shore · madds" },
];

const ABOUT_META = [
  { label: "role",      value: "full stack developer · fiserv ml/ai team" },
  { label: "education", value: "bs computer science + ml · university of maryland, 2025" },
  { label: "",          value: "sigma phi delta · basking ridge, nj" },
];

const CONTACT_ITEMS = [
  { label: "booking",   value: "brodymontag123@gmail.com", href: "mailto:brodymontag123@gmail.com" },
  { label: "pb&j mgmt", value: "pbandjmgmt@gmail.com",     href: "mailto:pbandjmgmt@gmail.com" },
];

// Approx chars in typewriter text × 55ms + start delay 1600ms
const ICON_DELAY = (38 * 55 + 1600) / 1000 + 0.3;

// ── Page ─────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background">
      <AsciiBg />
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative z-10 flex min-h-screen flex-col justify-center px-6 md:px-12">
        <div className="mx-auto w-full max-w-5xl">

          {/* Name */}
          <motion.h1
            className="font-sans font-light text-foreground"
            style={{ fontSize: "clamp(2.6rem, 7vw, 6.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Brody Montag<span className="cursor-blink">▋</span>
          </motion.h1>

          {/* Animated ASCII rule */}
          <motion.div
            className="my-6 font-mono text-xs text-foreground/15 overflow-hidden whitespace-nowrap"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.9, delay: 0.7, ease: "easeInOut" }}
          >
            {"─".repeat(300)}
          </motion.div>

          {/* Typewriter line */}
          <motion.p
            className="font-mono text-sm text-muted-foreground/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.01 }}
          >
            <span className="text-accent/50 mr-2">&gt;</span>
            <Typewriter text="full stack developer · dj/producer" charDelay={55} startDelay={1600} />
          </motion.p>

          {/* Links */}
          <motion.div
            className="mt-8 flex items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: ICON_DELAY }}
          >
            <a
              href="https://soundcloud.com/brodymontag"
              target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs text-foreground/25 transition-colors hover:text-foreground/80"
            >
              soundcloud ↗
            </a>
            <a
              href="https://github.com/bmontt"
              target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs text-foreground/25 transition-colors hover:text-foreground/80"
            >
              github ↗
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Music ────────────────────────────────────────────────── */}
      <section id="music" className="relative z-10 px-6 md:px-12 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionHeader label="music" />

          {/* Gig timeline */}
          <div className="flex flex-col gap-5">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                className="grid grid-cols-[6.5rem_1fr] gap-x-8"
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
              >
                <span className="font-mono text-xs text-muted-foreground/40 pt-px">
                  {event.date.toLowerCase()}
                </span>
                <div>
                  <p className="font-mono text-sm text-foreground/80 leading-snug">
                    {event.title.toLowerCase()}
                  </p>
                  {event.description && (
                    <p className="font-mono text-xs text-muted-foreground/40 mt-0.5">
                      {event.description.toLowerCase()}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <AsciiRule className="my-10" />

          {/* Music metadata */}
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {MUSIC_META.map(({ label, value, href }) => (
              <div key={label} className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                <span className="font-mono text-xs text-muted-foreground/30">{label}</span>
                {href ? (
                  <a
                    href={href} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-xs text-foreground/55 hover:text-accent/75 transition-colors"
                  >
                    {value} ↗
                  </a>
                ) : (
                  <span className="font-mono text-xs text-foreground/55">{value}</span>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Code ─────────────────────────────────────────────────── */}
      <section id="code" className="relative z-10 px-6 md:px-12 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionHeader label="code" />

          <div className="flex flex-col gap-10">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                {/* Name + tags + link row */}
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-2">
                  <span className="font-mono text-sm text-foreground/85">{project.name}</span>
                  <div className="flex flex-wrap items-center gap-5">
                    <span className="font-mono text-xs text-muted-foreground/35">
                      [{project.tags.join(" · ")}]
                    </span>
                    {project.status === "wip" && (
                      <span className="font-mono text-xs text-accent/55">in progress</span>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank" rel="noopener noreferrer"
                        className="font-mono text-xs text-muted-foreground/35 hover:text-foreground/75 transition-colors"
                      >
                        ↗ github
                      </a>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="font-sans text-sm text-muted-foreground/60 leading-relaxed pl-3 border-l border-white/8">
                  {project.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────── */}
      <section id="about" className="relative z-10 px-6 md:px-12 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionHeader label="about" />

          {/* Metadata */}
          <div className="flex flex-col gap-3 mb-10">
            {ABOUT_META.map(({ label, value }, i) => (
              <div key={i} className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                <span className="font-mono text-xs text-muted-foreground/30">{label}</span>
                <span className="font-mono text-xs text-foreground/65">{value}</span>
              </div>
            ))}
          </div>

          {/* Bio */}
          <motion.p
            className="font-sans text-base text-foreground/65 leading-relaxed max-w-2xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            I build tools at the intersection of technology and music — audio ML pipelines,
            LLM agent systems, and the infrastructure for my own creative work. As Monty&nbsp;(US),
            I co-founded{" "}
            <a
              href="https://pbandjsounds.com" target="_blank" rel="noopener noreferrer"
              className="text-foreground/85 underline underline-offset-4 decoration-white/20 hover:decoration-accent/50 transition-colors"
            >
              PB&J Sounds
            </a>
            , an East Coast house collective and label, and hold a residency with{" "}
            <a
              href="https://www.instagram.com/beatprint__" target="_blank" rel="noopener noreferrer"
              className="text-foreground/85 underline underline-offset-4 decoration-white/20 hover:decoration-accent/50 transition-colors"
            >
              Beatprint
            </a>{" "}
            at Transmission DC. The engineering and the music aren&apos;t separate pursuits —
            the code serves the sets, and the sets inform the code.
          </motion.p>

          <AsciiRule className="my-10" />

          {/* Socials */}
          <motion.div
            className="flex flex-wrap items-center gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {SOCIALS.map(({ href, label }) => (
              <a
                key={label}
                href={href} target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs text-foreground/25 hover:text-foreground/75 transition-colors"
              >
                {label}
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────── */}
      <section id="contact" className="relative z-10 px-6 md:px-12 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionHeader label="contact" />

          <p className="font-sans text-3xl md:text-4xl font-light text-foreground/80 mb-12">
            Let&apos;s work together.
          </p>

          <div className="flex flex-col gap-4">
            {CONTACT_ITEMS.map(({ label, value, href }) => (
              <div key={label} className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                <span className="font-mono text-xs text-muted-foreground/30 pt-0.5">{label}</span>
                <a
                  href={href}
                  className="font-mono text-sm text-foreground/65 hover:text-accent/80 transition-colors"
                >
                  {value}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="font-mono text-xs text-foreground/20">© 2026 brody montag</p>
          <p className="font-mono text-xs text-foreground/20">brodymontag.com</p>
        </div>
      </footer>
    </div>
  );
}
