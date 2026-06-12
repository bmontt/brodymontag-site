"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, AnimatePresence, useReducedMotion } from "framer-motion";
import { FaSoundcloud, FaGithub, FaInstagram, FaSpotify, FaLinkedinIn } from "react-icons/fa";
import Nav from "@/components/nav";
import AsciiBg from "@/components/ascii-bg";
import Typewriter from "@/components/typewriter";
import TypedHeading from "@/components/typed-heading";
import PlatformCard from "@/components/platform-card";
import { TabBar } from "@/components/section-tabs";
import { events } from "@/lib/brody-events";
import { projects } from "@/lib/projects";
import { platforms } from "@/lib/platform-data";
import { releases } from "@/lib/releases-data";
import { stack, experience } from "@/lib/stack-data";

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
    <div
      className={`font-mono text-xs text-foreground/15 overflow-hidden whitespace-nowrap ${className}`}
    >
      {"─".repeat(300)}
    </div>
  );
}

function TabPanel({
  tabKey,
  children,
}: {
  tabKey: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.18, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Constants ─────────────────────────────────────────────────────────

const PHOTO_FILTER = "grayscale(1) brightness(0.72) contrast(1.12)";

const SOCIALS = [
  { icon: FaSoundcloud, href: "https://soundcloud.com/brodymontag",                      label: "soundcloud ↗" },
  { icon: FaSpotify,    href: "https://open.spotify.com/artist/3uIzwP6Ab6TgP61naHtDMO", label: "spotify ↗"    },
  { icon: FaInstagram,  href: "https://www.instagram.com/brodymontag",                   label: "instagram ↗"  },
  { icon: FaGithub,     href: "https://github.com/bmontt",                               label: "github ↗"     },
];

const ABOUT_META = [
  { label: "role",      value: "full stack developer · fiserv ml/ai team"               },
  { label: "music",     value: "monty (us) · pb&j sounds cofounder · beatprint resident" },
  { label: "education", value: "bs computer science + ml · university of maryland, 2025" },
  { label: "",          value: "sigma phi delta · ridge high '21"                        },
  { label: "based",     value: "new jersey → washington, dc"                             },
];

const CONTACT_ITEMS = [
  { label: "booking",   value: "brodymontag123@gmail.com", href: "mailto:brodymontag123@gmail.com" },
  { label: "pb&j mgmt", value: "pbandjmgmt@gmail.com",     href: "mailto:pbandjmgmt@gmail.com"     },
];

const MUSIC_TABS = [
  { id: "shows",      label: "shows"      },
  { id: "releases",   label: "releases"   },
  { id: "collective", label: "collective" },
] as const;
type MusicTab = (typeof MUSIC_TABS)[number]["id"];

const CODE_TABS = [
  { id: "projects",   label: "projects"   },
  { id: "stack",      label: "stack"      },
  { id: "experience", label: "experience" },
] as const;
type CodeTab = (typeof CODE_TABS)[number]["id"];

const COLLECTIVE_META: { label: string; value: string; href?: string }[] = [
  { label: "co-founders", value: "peter gomes · jack humphreys · brody montag" },
  { label: "booking",     value: "pbandjmgmt@gmail.com", href: "mailto:pbandjmgmt@gmail.com" },
  { label: "website",     value: "pbandjsounds.com",     href: "https://pbandjsounds.com"    },
  { label: "genres",      value: "deep house · minimal · uk house · disco"                  },
];

// typing duration: 38 chars × 55ms + 1600ms start delay
const LINKS_APPEAR = (38 * 55 + 1600) / 1000 + 0.4;

const HERO_LINKS = [
  { id: "sc", icon: FaSoundcloud,  href: "https://soundcloud.com/brodymontag",                      label: "soundcloud", glowRgb: "255, 85, 0"    },
  { id: "gh", icon: FaGithub,      href: "https://github.com/bmontt",                               label: "github",     glowRgb: "210, 210, 210" },
  { id: "sp", icon: FaSpotify,     href: "https://open.spotify.com/artist/3uIzwP6Ab6TgP61naHtDMO", label: "spotify",    glowRgb: "29, 185, 84"   },
  { id: "ig", icon: FaInstagram,   href: "https://www.instagram.com/brodymontag",                   label: "instagram",  glowRgb: "193, 53, 132"  },
  { id: "li", icon: FaLinkedinIn,  href: "https://www.linkedin.com/in/brody-montag",                label: "linkedin",   glowRgb: "0, 119, 181"   },
];

// ── Page ─────────────────────────────────────────────────────────────

export default function Home() {
  const [typingComplete, setTypingComplete] = useState(false);
  const [hoveredHeroLink, setHoveredHeroLink] = useState<string | null>(null);
  const [musicTab, setMusicTab] = useState<MusicTab>("shows");
  const [codeTab, setCodeTab] = useState<CodeTab>("projects");

  const prefersReducedMotion = useReducedMotion();

  const { scrollY } = useScroll();
  const heroYParallax = useTransform(scrollY, [0, 700], [0, -80]);
  const heroY = prefersReducedMotion ? 0 : heroYParallax;

  return (
    <div className="relative min-h-screen bg-background">
      <AsciiBg />
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative z-10 flex min-h-screen flex-col justify-center px-6 md:px-12">
        <motion.div style={{ y: heroY }} className="relative mx-auto w-full max-w-5xl">

          {/* soft scrim — dims the animation behind the hero content for legibility */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-y-10 -inset-x-4 md:-inset-x-12"
            style={{
              zIndex: -1,
              background:
                "radial-gradient(ellipse 70% 86% at 30% 50%, rgba(19,22,27,0.72), rgba(19,22,27,0.45) 45%, transparent 78%)",
            }}
          />

          <h1
            className="font-sans font-light text-foreground"
            style={{ fontSize: "clamp(2.6rem, 7vw, 6.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
          >
            <TypedHeading
              text="Brody Montag"
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

          {/* elevator pitch — persona summary with traveling shimmer */}
          <motion.p
            className="mt-12 max-w-xl font-mono text-xs leading-relaxed text-shimmer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: LINKS_APPEAR + 0.5, duration: 0.8 }}
          >
            a software engineer specializing in machine learning and agentic systems — and,
            performing as monty (us), a producer and dj with credits up to the #1-ranked club
            in the country. one aim across both: technology in service of sound.
          </motion.p>
        </motion.div>
      </section>

      {/* ── Presence ─────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20 md:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeader label="presence" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {platforms.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
              >
                <PlatformCard
                  name={p.name}
                  handle={p.handle}
                  href={p.href}
                  icon={p.icon}
                  glowRgb={p.glowRgb}
                  stat={p.stat}
                  details={p.details}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Music ────────────────────────────────────────────────── */}
      <section id="music" className="relative z-10 px-6 md:px-12 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionHeader label="music" />

          <TabBar
            tabs={[...MUSIC_TABS]}
            active={musicTab}
            onChange={(id) => setMusicTab(id as MusicTab)}
            layoutId="music-tab-indicator"
          />

          {/* shows */}
          {musicTab === "shows" && (
            <TabPanel tabKey="shows">
              <div className="flex flex-col gap-1">
                {events.map((event, i) => {
                  const firstImage = event.media.find((m) => m.type === "image");
                  return (
                    <Link key={event.id} href={`/shows/${event.slug}`} className="group block">
                      <motion.div
                        className="grid grid-cols-[6.5rem_1fr] gap-x-8 items-start -mx-3 px-3 py-2.5 hover:bg-white/[0.025] transition-colors duration-150"
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
                            <p className="font-mono text-sm text-foreground/85 group-hover:text-foreground/95 leading-snug transition-colors duration-150">
                              {event.title.toLowerCase()}
                              <span className="ml-2 text-foreground/28 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs">→</span>
                            </p>
                            {event.description && (
                              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                                {event.description.toLowerCase()}
                              </p>
                            )}
                          </div>
                          {firstImage && (
                            <motion.div
                              className="hidden sm:block shrink-0 h-12 w-16 overflow-hidden border border-white/8"
                              style={{ filter: PHOTO_FILTER }}
                              whileHover={{
                                filter: "grayscale(0) brightness(1) contrast(1)",
                                borderColor: "rgba(255,255,255,0.2)",
                              }}
                              transition={{ duration: 0.4 }}
                            >
                              <Image
                                src={firstImage.src}
                                alt=""
                                width={128}
                                height={96}
                                loading="lazy"
                                className="h-full w-full object-cover"
                                sizes="64px"
                              />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>

              <AsciiRule className="mt-10" />

              <div className="mt-8 font-mono text-xs text-foreground/35">
                <span className="text-foreground/25">supported&nbsp;&nbsp;</span>
                biscits · martin ikin · ownboss · veggi · side quest · jake shore · madds
              </div>
            </TabPanel>
          )}

          {/* releases */}
          {musicTab === "releases" && (
            <TabPanel tabKey="releases">
              <div className="flex flex-col gap-10">
                {releases.map((release) => (
                  <div key={release.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-4 mb-2">
                      <span className="font-mono text-sm text-foreground/85">
                        {release.title}
                      </span>
                      <span className="font-mono text-xs text-foreground/35">
                        {release.date} · {release.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {release.tags.map((t) => (
                        <span
                          key={t}
                          className="font-mono text-xs text-foreground/35 border border-white/8 px-2 py-0.5"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    {release.description && (
                      <p className="font-sans text-sm text-foreground/55 leading-relaxed pl-3 border-l border-white/10 mb-4">
                        {release.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-6">
                      {release.links.map(({ platform, href }) => (
                        <a
                          key={platform}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-foreground/50 hover:text-accent/80 transition-colors"
                        >
                          {platform}&nbsp;↗
                        </a>
                      ))}
                    </div>
                  </div>
                ))}

                <AsciiRule />

                <div>
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
                </div>
              </div>
            </TabPanel>
          )}

          {/* collective */}
          {musicTab === "collective" && (
            <TabPanel tabKey="collective">
              <div className="flex flex-col gap-10">
                {/* PB&J Sounds */}
                <div>
                  <p className="font-mono text-sm text-foreground/85 mb-4">pb&amp;j sounds</p>
                  <div className="flex flex-col gap-3 pl-3 border-l border-white/10">
                    {COLLECTIVE_META.map(({ label, value, href }) => (
                      <div key={label} className="grid grid-cols-[7rem_1fr] gap-x-6">
                        <span className="font-mono text-xs text-foreground/35">{label}</span>
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
                  </div>
                </div>

                <AsciiRule />

                {/* Affiliations */}
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                    <span className="font-mono text-xs text-foreground/45 pt-0.5">beatprint</span>
                    <div>
                      <a
                        href="https://www.instagram.com/beatprint__"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-foreground/75 hover:text-accent/80 transition-colors"
                      >
                        residency · transmission dc&nbsp;↗
                      </a>
                      <p className="font-mono text-xs text-foreground/30 mt-0.5">since jan 2026</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                    <span className="font-mono text-xs text-foreground/45 pt-0.5">club glow</span>
                    <div>
                      <p className="font-mono text-xs text-foreground/75">dj / ambassador · dmv</p>
                      <p className="font-mono text-xs text-foreground/30 mt-0.5">since feb 2024</p>
                    </div>
                  </div>
                </div>

                <AsciiRule />

                {/* Scene */}
                <div>
                  <p className="font-mono text-xs text-foreground/35 mb-3">scene</p>
                  <p className="font-mono text-xs text-foreground/55 leading-relaxed">
                    dnb in the dmv · no djs left behind · delusionville afters · mirari presents
                  </p>
                </div>
              </div>
            </TabPanel>
          )}
        </div>
      </section>

      {/* ── Code ─────────────────────────────────────────────────── */}
      <section id="code" className="relative z-10 px-6 md:px-12 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionHeader label="code" />

          <TabBar
            tabs={[...CODE_TABS]}
            active={codeTab}
            onChange={(id) => setCodeTab(id as CodeTab)}
            layoutId="code-tab-indicator"
          />

          {/* projects */}
          {codeTab === "projects" && (
            <TabPanel tabKey="projects">
              <div className="flex flex-col gap-2">
                {projects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    className="group relative -mx-3 px-3 py-4 hover:bg-white/[0.025] transition-colors duration-150"
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.45, delay: i * 0.07 }}
                  >
                    {/* stretched link — covers the whole row without nesting anchors */}
                    <Link
                      href={`/projects/${project.slug}`}
                      aria-label={project.name}
                      className="absolute inset-0 z-0"
                    />
                    <div className="relative pointer-events-none flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-2.5">
                      <span className="font-mono text-sm text-foreground/90 group-hover:text-foreground/98 transition-colors duration-150">
                        {project.name}
                        <span className="ml-2 text-foreground/28 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs">→</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-5">
                        <span className="font-mono text-xs text-muted-foreground">
                          [{project.tags.join(" · ")}]
                        </span>
                        {project.status === "wip" && (
                          <span className="font-mono text-xs text-accent/80">in progress</span>
                        )}
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-foreground/45 hover:text-foreground/85 transition-colors relative z-10 pointer-events-auto"
                          >
                            ↗ github
                          </a>
                        )}
                      </div>
                    </div>
                    <p className="relative pointer-events-none font-sans text-sm text-foreground/60 leading-relaxed pl-3 border-l border-white/10">
                      {project.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </TabPanel>
          )}

          {/* stack */}
          {codeTab === "stack" && (
            <TabPanel tabKey="stack">
              <div className="flex flex-col gap-8">
                {stack.map((category) => (
                  <div key={category.label}>
                    <p className="font-mono text-xs text-foreground/35 mb-3">{category.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {category.items.map((item, i) => (
                        <span
                          key={item}
                          className="pill-iridescent font-mono text-xs text-foreground/70 border border-white/10 px-3 py-1 hover:text-foreground/90 transition-colors"
                          style={{ animationDelay: `${-((i * 1.37) % 4.2)}s` }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabPanel>
          )}

          {/* experience */}
          {codeTab === "experience" && (
            <TabPanel tabKey="experience">
              <div className="flex flex-col gap-10">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-1.5">
                      <span className="font-mono text-sm text-foreground/85">{exp.role}</span>
                      <span className="font-mono text-xs text-foreground/40">{exp.period}</span>
                    </div>
                    <p className="font-mono text-xs text-foreground/45 mb-3">
                      {exp.org}&nbsp;·&nbsp;{exp.orgDetail}
                    </p>
                    <p className="font-sans text-sm text-foreground/60 leading-relaxed pl-3 border-l border-white/10 mb-3">
                      {exp.description}
                    </p>
                    <div className="flex flex-wrap gap-2 pl-3">
                      {exp.tags.map((tag, i) => (
                        <span
                          key={tag}
                          className="pill-iridescent font-mono text-xs text-foreground/30 border border-white/8 px-2 py-0.5"
                          style={{ animationDelay: `${-((i * 1.71) % 4.2)}s` }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabPanel>
          )}
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────── */}
      <section id="about" className="relative z-10 px-6 md:px-12 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionHeader label="about" />

          <div className="flex items-start justify-between gap-12">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-3 mb-10">
                {ABOUT_META.map(({ label, value }, i) => (
                  <div key={i} className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                    <span className="font-mono text-xs text-foreground/45">{label}</span>
                    <span className="font-mono text-xs text-foreground/75">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-5 max-w-xl">
                <motion.p
                  className="font-sans text-base text-foreground/65 leading-relaxed"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: 0 }}
                >
                  I grew up in New Jersey splitting time between making things and performing them —
                  two halves that never felt separate. Before I wrote a line of code I was a
                  competitive ice hockey player and a classically trained musician: piano, oboe,
                  viola, drums. What held my attention was always the building, whether the result
                  was a song, a system, or a set.
                </motion.p>

                <motion.p
                  className="font-sans text-base text-foreground/65 leading-relaxed"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: 0.07 }}
                >
                  I started producing at ten on GarageBand and moved to FL Studio two years later.
                  Early on I made rap and hip-hop beats for local artists; then dance music
                  reorganized how I heard everything. Now I produce and DJ as Monty&nbsp;(US) — warm
                  basslines, crisp percussion, a UK- and minimal-leaning take on house and tech
                  house — and I&apos;ve opened and closed for artists I grew up listening to across
                  DC, Baltimore, and New York.
                </motion.p>

                <motion.p
                  className="font-sans text-base text-foreground/65 leading-relaxed"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: 0.14 }}
                >
                  I studied Computer Science at the University of Maryland, where I gravitated toward
                  audio engineering, signal processing, and machine learning — including
                  research-grade work on auditory signals. Today I&apos;m a full-stack developer on
                  the ML/AI team at Fiserv. The thesis behind nearly everything I build holds steady:
                  technology in service of music. Most projects I take on solve a problem I have as
                  an artist — a setlist optimizer, audio-analysis pipelines, the tooling that runs my
                  own workflow.
                </motion.p>

                <motion.p
                  className="font-sans text-base text-foreground/65 leading-relaxed"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: 0.21 }}
                >
                  With two close friends I co-founded{" "}
                  <a
                    href="https://pbandjsounds.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/85 underline underline-offset-4 decoration-white/20 hover:decoration-accent/50 transition-colors"
                  >
                    PB&amp;J Sounds
                  </a>
                  , an East Coast collective and label built around underground house, and I hold a
                  residency with{" "}
                  <a
                    href="https://www.instagram.com/beatprint__"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/85 underline underline-offset-4 decoration-white/20 hover:decoration-accent/50 transition-colors"
                  >
                    Beatprint
                  </a>{" "}
                  at Transmission DC. My investment is in the grassroots side of this scene — small
                  rooms, real crowds, music you have to dig for — and in owning the whole stack that
                  supports it, from the label&apos;s website to the software that prepares my sets.
                </motion.p>

                <motion.p
                  className="font-sans text-base text-foreground/65 leading-relaxed"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: 0.28 }}
                >
                  Lately my focus has been agentic AI and local-first systems: running models on my
                  own hardware, building small fleets of agents, and writing the architecture down
                  before the code. I work for craft, rigor, and ownership — understanding something
                  well enough to build it myself, and building it well enough to trust it on stage or
                  in production.
                </motion.p>

                <motion.p
                  className="font-sans text-base text-foreground/65 leading-relaxed"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: 0.35 }}
                >
                  Right now, music is the priority. Production is the work that compounds — it drives
                  the long-term growth and the bookings that follow — so most of my creative energy
                  lives in the studio and the next room I&apos;m trying to play. The direction I care
                  most about pulls both halves together: machine learning and signal processing
                  applied to sound — deep learning, on-device and edge models, the territory companies
                  like Dolby, Bose, and Sony work in — aimed at live performance and the tools
                  producers use to make records. I want to build the instruments and systems that
                  change how DJs play and how records get made. The engineering and the music were
                  never two separate careers to me. They&apos;re one practice: the code serves the
                  sets, and the sets inform the code.
                </motion.p>
              </div>

              <AsciiRule className="my-10" />

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
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-foreground/45 hover:text-foreground/85 transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </motion.div>
            </div>

            <motion.div
              className="hidden md:flex flex-col items-end gap-2 shrink-0"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <Image
                src="/brody.optimized.webp"
                alt="Brody Montag"
                width={144}
                height={176}
                loading="lazy"
                className="w-36 h-44 object-cover object-top border border-white/10"
                style={{ filter: PHOTO_FILTER }}
                sizes="144px"
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
                <a
                  href={href}
                  className="font-mono text-sm text-foreground/75 hover:text-accent/85 transition-colors"
                >
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
