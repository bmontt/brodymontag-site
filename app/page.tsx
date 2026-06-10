"use client";

import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
      className="mb-12 font-mono text-sm text-foreground/30 overflow-hidden whitespace-nowrap"
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {`┌─ // ${label} ${"─".repeat(120)}┐`}
    </motion.div>
  );
}

function AsciiRule({ className = "" }: { className?: string }) {
  return (
    <div className={`font-mono text-xs text-foreground/15 overflow-hidden whitespace-nowrap ${className}`}>
      {"─".repeat(300)}
    </div>
  );
}

const PHOTO_FILTER = "grayscale(1) brightness(0.72) contrast(1.12)";

const SOCIALS = [
  { icon: FaSoundcloud, href: "https://soundcloud.com/brodymontag",                      label: "soundcloud ↗" },
  { icon: FaSpotify,   href: "https://open.spotify.com/artist/3uIzwP6Ab6TgP61naHtDMO", label: "spotify ↗"    },
  { icon: FaInstagram, href: "https://www.instagram.com/brodymontag",                    label: "instagram ↗"  },
  { icon: FaGithub,    href: "https://github.com/bmontt",                                label: "github ↗"     },
];

const MUSIC_META = [
  { label: "collective", value: "pb&j sounds",                                href: "https://pbandjsounds.com"          },
  { label: "residency",  value: "beatprint at transmission dc"                                                          },
  { label: "release",    value: '"when a fire starts to burn" (oct 2025)',     href: "https://soundcloud.com/brodymontag" },
  { label: "listening",  value: "soundcloud.com/brodymontag",                  href: "https://soundcloud.com/brodymontag" },
  { label: "supported",  value: "biscits · martin ikin · ownboss · veggi · side quest · jake shore · madds"             },
];

const ABOUT_META = [
  { label: "role",      value: "full stack developer · fiserv ml/ai team"              },
  { label: "education", value: "bs computer science + ml · university of maryland, 2025" },
  { label: "",          value: "sigma phi delta · basking ridge, nj"                    },
];

const CONTACT_ITEMS = [
  { label: "booking",   value: "brodymontag123@gmail.com", href: "mailto:brodymontag123@gmail.com" },
  { label: "pb&j mgmt", value: "pbandjmgmt@gmail.com",     href: "mailto:pbandjmgmt@gmail.com"     },
];

// typing duration: 38 chars × 55ms + 1600ms start delay
const LINKS_APPEAR = (38 * 55 + 1600) / 1000 + 0.4;

// ── Page ─────────────────────────────────────────────────────────────

export default function Home() {
  const [typingComplete, setTypingComplete] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 700], [0, -80]);

  return (
    <div className="relative min-h-screen bg-background">
      <AsciiBg />
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative z-10 flex min-h-screen flex-col justify-center px-6 md:px-12">
        {/* Parallax wrapper */}
        <motion.div style={{ y: heroY }} className="mx-auto w-full max-w-5xl">

          <motion.h1
            className="font-sans font-light text-foreground"
            style={{ fontSize: "clamp(2.6rem, 7vw, 6.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            Brody Montag<span className="cursor-blink">▋</span>
          </motion.h1>

          {/* Rule draws left → right */}
          <motion.div
            className="my-6 font-mono text-xs text-foreground/20 overflow-hidden whitespace-nowrap"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.0, delay: 0.7, ease: "easeInOut" }}
          >
            {"─".repeat(300)}
          </motion.div>

          {/* Typewriter → pulse */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.01 }}
          >
            <motion.span
              className="font-mono text-sm"
              animate={typingComplete ? { color: ["#d4a500", "#c9a800", "#d4a500"] } : { color: "#d4a50099" }}
              transition={{ duration: 2.5, repeat: typingComplete ? Infinity : 0, ease: "easeInOut" }}
            >
              &gt;
            </motion.span>
            {typingComplete ? (
              <span className="font-mono text-sm subtitle-pulse">
                full stack developer · dj/producer
              </span>
            ) : (
              <span className="font-mono text-sm text-muted-foreground">
                <Typewriter
                  text="full stack developer · dj/producer"
                  charDelay={55}
                  startDelay={1600}
                  onComplete={() => setTypingComplete(true)}
                />
              </span>
            )}
          </motion.div>

          {/* Links */}
          <motion.div
            className="mt-8 flex items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: LINKS_APPEAR }}
          >
            {[
              { href: "https://soundcloud.com/brodymontag", label: "soundcloud ↗" },
              { href: "https://github.com/bmontt",          label: "github ↗"     },
            ].map(({ href, label }) => (
              <a
                key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs text-foreground/45 transition-colors hover:text-foreground/85"
              >
                {label}
              </a>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Music ────────────────────────────────────────────────── */}
      <section id="music" className="relative z-10 px-6 md:px-12 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionHeader label="music" />

          {/* Gig timeline */}
          <div className="flex flex-col gap-5">
            {events.map((event, i) => {
              const firstImage = event.media.find((m) => m.type === "image");
              return (
                <motion.div
                  key={event.id}
                  className="grid grid-cols-[6.5rem_1fr] gap-x-8 items-start"
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <span className="font-mono text-xs text-muted-foreground/70 pt-0.5 shrink-0">
                    {event.date.toLowerCase()}
                  </span>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="font-mono text-sm text-foreground/85 leading-snug">
                        {event.title.toLowerCase()}
                      </p>
                      {event.description && (
                        <p className="font-mono text-xs text-muted-foreground mt-0.5">
                          {event.description.toLowerCase()}
                        </p>
                      )}
                    </div>
                    {firstImage && (
                      <motion.img
                        src={firstImage.src}
                        alt=""
                        loading="lazy"
                        className="hidden sm:block shrink-0 h-12 w-16 object-cover border border-white/8"
                        style={{ filter: PHOTO_FILTER }}
                        whileHover={{ filter: "grayscale(0) brightness(1) contrast(1)", borderColor: "rgba(255,255,255,0.2)" }}
                        transition={{ duration: 0.4 }}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <AsciiRule className="my-10" />

          {/* Music metadata */}
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {MUSIC_META.map(({ label, value, href }) => (
              <div key={label} className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                <span className="font-mono text-xs text-foreground/45">{label}</span>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-xs text-foreground/70 hover:text-accent/85 transition-colors">
                    {value} ↗
                  </a>
                ) : (
                  <span className="font-mono text-xs text-foreground/70">{value}</span>
                )}
              </div>
            ))}
          </motion.div>

          {/* SoundCloud player */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-mono text-xs text-foreground/30 mb-3">// latest tracks</p>
            <div className="border border-white/8 overflow-hidden">
              <iframe
                title="SoundCloud"
                width="100%"
                height="120"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/brodymontag&color=%23d4a500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false"
              />
            </div>
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
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-2.5">
                  <span className="font-mono text-sm text-foreground/90">{project.name}</span>
                  <div className="flex flex-wrap items-center gap-5">
                    <span className="font-mono text-xs text-muted-foreground">
                      [{project.tags.join(" · ")}]
                    </span>
                    {project.status === "wip" && (
                      <span className="font-mono text-xs text-accent/80">in progress</span>
                    )}
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-xs text-foreground/45 hover:text-foreground/85 transition-colors">
                        ↗ github
                      </a>
                    )}
                  </div>
                </div>
                <p className="font-sans text-sm text-foreground/60 leading-relaxed pl-3 border-l border-white/10">
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

          <div className="flex items-start justify-between gap-12">
            {/* Left: metadata + bio + socials */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-3 mb-10">
                {ABOUT_META.map(({ label, value }, i) => (
                  <div key={i} className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                    <span className="font-mono text-xs text-foreground/45">{label}</span>
                    <span className="font-mono text-xs text-foreground/75">{value}</span>
                  </div>
                ))}
              </div>

              <motion.p
                className="font-sans text-base text-foreground/65 leading-relaxed max-w-xl"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                I build tools at the intersection of technology and music — audio ML pipelines,
                LLM agent systems, and the infrastructure for my own creative work. As Monty&nbsp;(US),
                I co-founded{" "}
                <a href="https://pbandjsounds.com" target="_blank" rel="noopener noreferrer"
                  className="text-foreground/85 underline underline-offset-4 decoration-white/20 hover:decoration-accent/50 transition-colors">
                  PB&J Sounds
                </a>
                , an East Coast house collective and label, and hold a residency with{" "}
                <a href="https://www.instagram.com/beatprint__" target="_blank" rel="noopener noreferrer"
                  className="text-foreground/85 underline underline-offset-4 decoration-white/20 hover:decoration-accent/50 transition-colors">
                  Beatprint
                </a>{" "}
                at Transmission DC. The engineering and the music aren&apos;t separate pursuits —
                the code serves the sets, and the sets inform the code.
              </motion.p>

              <AsciiRule className="my-10" />

              <motion.div
                className="flex flex-wrap items-center gap-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                {SOCIALS.map(({ href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-xs text-foreground/45 hover:text-foreground/85 transition-colors">
                    {label}
                  </a>
                ))}
              </motion.div>
            </div>

            {/* Right: profile photo (desktop only) */}
            <motion.div
              className="hidden md:flex flex-col items-end gap-2 shrink-0"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <img
                src="/brody.optimized.webp"
                alt="Brody Montag"
                className="w-36 h-44 object-cover object-top border border-white/10"
                style={{ filter: PHOTO_FILTER }}
              />
              <p className="font-mono text-xs text-foreground/25">monty (us)</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────── */}
      <section id="contact" className="relative z-10 px-6 md:px-12 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionHeader label="contact" />

          <motion.p
            className="font-sans text-3xl md:text-4xl font-light text-foreground/85 mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Let&apos;s work together.
          </motion.p>

          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {CONTACT_ITEMS.map(({ label, value, href }) => (
              <div key={label} className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                <span className="font-mono text-xs text-foreground/45 pt-0.5">{label}</span>
                <a href={href}
                  className="font-mono text-sm text-foreground/75 hover:text-accent/85 transition-colors">
                  {value}
                </a>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="font-mono text-xs text-foreground/35">© 2026 brody montag</p>
          <p className="font-mono text-xs text-foreground/35">brodymontag.com</p>
        </div>
      </footer>
    </div>
  );
}
