"use client";

import { motion } from "framer-motion";
import { FaSoundcloud, FaGithub, FaInstagram, FaSpotify } from "react-icons/fa";
import Nav from "@/components/nav";
import EventCard from "@/components/event-card";
import ProjectCard from "@/components/project-card";
import { events } from "@/lib/brody-events";
import { projects } from "@/lib/projects";

const ARTIST_LOGOS = [
  { src: "/artistLogos/biscits_logo.webp", alt: "Biscits" },
  { src: "/artistLogos/martin_ikin_logo.webp", alt: "Martin Ikin" },
  { src: "/artistLogos/ownboss_logo.webp", alt: "Ownboss" },
  { src: "/artistLogos/veggi.webp", alt: "Veggi" },
  { src: "/artistLogos/sidequest_logo.webp", alt: "Side Quest" },
  { src: "/artistLogos/jake_shore.webp", alt: "Jake Shore" },
  { src: "/artistLogos/madds_logo.webp", alt: "Madds" },
];

const SOCIALS = [
  { icon: FaSoundcloud, href: "https://soundcloud.com/brodymontag", label: "SoundCloud" },
  { icon: FaSpotify, href: "https://open.spotify.com/artist/3uIzwP6Ab6TgP61naHtDMO", label: "Spotify" },
  { icon: FaInstagram, href: "https://www.instagram.com/brodymontag", label: "Instagram" },
  { icon: FaGithub, href: "https://github.com/bmontt", label: "GitHub" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-12 text-xs uppercase tracking-widest text-yellow-400/60">{children}</p>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Background radial glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.85 0.08 100 / 0.06) 0%, transparent 60%)",
        }}
      />

      <Nav />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <h1
            className="font-light text-white"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
          >
            Brody Montag
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
            Monty&nbsp;(US)&nbsp;·&nbsp;Full Stack Engineer
          </p>
          <div className="mt-2 flex items-center gap-6">
            <a
              href="https://soundcloud.com/brodymontag"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SoundCloud"
              className="text-gray-500 transition-colors hover:text-white"
            >
              <FaSoundcloud className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/bmontt"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-gray-500 transition-colors hover:text-white"
            >
              <FaGithub className="h-5 w-5" />
            </a>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <div className="h-6 w-px bg-gradient-to-b from-transparent to-white/20" />
        </motion.div>
      </section>

      {/* ── Music ──────────────────────────────────────────────── */}
      <section id="music" className="relative z-10 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>Music</SectionLabel>

          <div className="flex flex-col gap-8">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              >
                <EventCard
                  title={event.title}
                  date={event.date}
                  description={event.description}
                  media={event.media}
                  isRightAligned={i % 2 !== 0}
                />
              </motion.div>
            ))}
          </div>

          {/* Supported artists */}
          <motion.div
            className="mt-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="mb-6 text-xs uppercase tracking-widest text-gray-600">Supported</p>
            <div className="flex flex-wrap items-center gap-6">
              {ARTIST_LOGOS.map(({ src, alt }) => (
                <motion.img
                  key={alt}
                  src={src}
                  alt={alt}
                  className="h-6 object-contain opacity-40 grayscale transition-all duration-300 hover:opacity-90 hover:grayscale-0"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
          </motion.div>

          {/* SoundCloud embed */}
          <motion.div
            className="mt-16 overflow-hidden rounded-sm border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <iframe
              title="SoundCloud"
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/brodymontag&color=%23ffffff&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false"
            />
          </motion.div>
        </div>
      </section>

      {/* ── Code ───────────────────────────────────────────────── */}
      <section id="code" className="relative z-10 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>Code</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </div>
          <motion.div
            className="mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <a
              href="https://github.com/bmontt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 transition-colors hover:text-white"
            >
              <FaGithub className="h-3.5 w-3.5" />
              github.com/bmontt
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────── */}
      <section id="about" className="relative z-10 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>About</SectionLabel>
          <div className="max-w-xl">
            <div className="mb-8 space-y-1 text-sm text-gray-400">
              <p>Full Stack Developer · Fiserv ML/AI team</p>
              <p>BS Computer Science + Machine Learning · University of Maryland, 2025</p>
              <p>Sigma Phi Delta · Basking Ridge, NJ</p>
            </div>
            <p className="text-base leading-relaxed text-gray-300/80">
              I build tools at the intersection of technology and music — audio ML pipelines,
              LLM agent systems, and the infrastructure for my own creative work. As Monty&nbsp;(US),
              I co-founded{" "}
              <a
                href="https://pbandjsounds.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 underline underline-offset-4 decoration-white/20 transition-colors hover:decoration-yellow-400/50"
              >
                PB&J Sounds
              </a>
              , an East Coast house collective and label, and hold a residency with{" "}
              <a
                href="https://www.instagram.com/beatprint__"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 underline underline-offset-4 decoration-white/20 transition-colors hover:decoration-yellow-400/50"
              >
                Beatprint
              </a>{" "}
              at Transmission DC. The engineering and the music aren&apos;t separate pursuits —
              the code serves the sets, and the sets inform the code.
            </p>

            <div className="mt-8 flex items-center gap-5">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────────── */}
      <section id="contact" className="relative z-10 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>Contact</SectionLabel>
          <p className="mb-10 text-3xl font-light text-white/90 md:text-4xl">
            Let&apos;s work together.
          </p>
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="text-xs uppercase tracking-widest text-gray-600 sm:w-24">Booking</span>
              <a
                href="mailto:brodymontag123@gmail.com"
                className="text-white/70 transition-colors hover:text-yellow-400/80"
              >
                brodymontag123@gmail.com
              </a>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="text-xs uppercase tracking-widest text-gray-600 sm:w-24">PB&amp;J Mgmt</span>
              <a
                href="mailto:pbandjmgmt@gmail.com"
                className="text-white/70 transition-colors hover:text-yellow-400/80"
              >
                pbandjmgmt@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="text-xs text-gray-700">© 2026 Brody Montag</p>
          <p className="text-xs text-gray-700">brodymontag.com</p>
        </div>
      </footer>
    </div>
  );
}
