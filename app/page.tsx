"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, AnimatePresence, useReducedMotion } from "framer-motion";
import Nav from "@/components/nav";
import AsciiBg from "@/components/ascii-bg";
import Typewriter from "@/components/typewriter";
import TypedHeading from "@/components/typed-heading";
import PlatformCard from "@/components/platform-card";
import { TabBar } from "@/components/section-tabs";
import { events } from "@/lib/brody-events";
import { projects } from "@/lib/projects";
import { platforms, ICONS } from "@/lib/platform-data";
import { releases } from "@/lib/releases-data";
import { stack, experience } from "@/lib/stack-data";
import { content } from "@/lib/content";
import { renderInline } from "@/components/rich-text";

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

// typing duration: subtitle length × 55ms charDelay + 1600ms start delay
const LINKS_APPEAR = (content.hero.subtitle.length * 55 + 1600) / 1000 + 0.4;

// hero links: copy from content.json, icon key resolved to its component
const HERO_LINKS = content.hero.links.map((l) => ({ ...l, icon: ICONS[l.icon] }));

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

          {/* elevator pitch — persona summary with traveling shimmer */}
          <motion.p
            className="mt-12 max-w-xl font-mono text-xs leading-relaxed text-shimmer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: LINKS_APPEAR + 0.5, duration: 0.8 }}
          >
            {content.hero.elevatorPitch}
          </motion.p>
        </motion.div>
      </section>

      {/* ── Presence ─────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20 md:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeader label={content.sections.presence} />
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
          <SectionHeader label={content.sections.music} />

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
                <span className="text-foreground/25">{content.music.shows.supportedLabel}&nbsp;&nbsp;</span>
                {content.music.shows.supportedArtists}
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
                      {release.tags.map((t, i) => (
                        <span
                          key={t}
                          className="pill-iridescent font-mono text-xs text-foreground/35 border border-white/8 px-2 py-0.5"
                          style={{ animationDelay: `${-((i * 1.53) % 4.2)}s` }}
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
                  <div className="pill-iridescent border border-white/8 overflow-hidden">
                    <iframe
                      title="SoundCloud"
                      width="100%"
                      height="120"
                      scrolling="no"
                      frameBorder="no"
                      allow="autoplay"
                      src={content.music.releases.soundcloudEmbedUrl}
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
                  <p className="font-mono text-sm text-foreground/85 mb-4">{content.music.collective.name}</p>
                  <div className="flex flex-col gap-3 pl-3 border-l border-white/10">
                    {(content.music.collective.meta as { label: string; value: string; href?: string }[]).map(({ label, value, href }) => (
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
                  {(content.music.collective.affiliations as { label: string; value: string; href?: string; note: string }[]).map((aff) => (
                      <div key={aff.label} className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                        <span className="font-mono text-xs text-foreground/45 pt-0.5">{aff.label}</span>
                        <div>
                          {aff.href ? (
                            <a
                              href={aff.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-foreground/75 hover:text-accent/80 transition-colors"
                            >
                              {aff.value}&nbsp;↗
                            </a>
                          ) : (
                            <p className="font-mono text-xs text-foreground/75">{aff.value}</p>
                          )}
                          <p className="font-mono text-xs text-foreground/30 mt-0.5">{aff.note}</p>
                        </div>
                      </div>
                  ))}
                </div>

                <AsciiRule />

                {/* Scene */}
                <div>
                  <p className="font-mono text-xs text-foreground/35 mb-3">scene</p>
                  <p className="font-mono text-xs text-foreground/55 leading-relaxed">
                    {content.music.collective.scene}
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
          <SectionHeader label={content.sections.code} />

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
          <SectionHeader label={content.sections.about} />

          <div className="flex items-start justify-between gap-12">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-3 mb-10">
                {content.about.meta.map(({ label, value }, i) => (
                  <div key={i} className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                    <span className="font-mono text-xs text-foreground/45">{label}</span>
                    <span className="font-mono text-xs text-foreground/75">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-5 max-w-xl">
                {content.about.paragraphs.map((para, i) => (
                  <motion.p
                    key={i}
                    className="font-sans text-base text-foreground/65 leading-relaxed"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.55, delay: i * 0.07 }}
                  >
                    {renderInline(para)}
                  </motion.p>
                ))}
              </div>

              <AsciiRule className="my-10" />

              <motion.div
                className="flex flex-wrap items-center gap-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                {content.about.socials.map(({ href, label }) => (
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
                className="pill-iridescent w-36 h-44 object-cover object-top border border-white/10"
                style={{ filter: PHOTO_FILTER }}
                sizes="144px"
              />
              <p className="font-mono text-xs text-foreground/25">{content.about.photoCaption}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────── */}
      <section id="contact" className="relative z-10 px-6 md:px-12 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <SectionHeader label={content.sections.contact} />

          <motion.p
            className="font-sans text-3xl md:text-4xl font-light text-foreground/85 mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {content.contact.headline}
          </motion.p>

          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {content.contact.items.map(({ label, value, href }) => (
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
          <p className="font-mono text-xs text-foreground/35">{content.meta.copyright}</p>
          <p className="font-mono text-xs text-foreground/35">{content.meta.domain}</p>
        </div>
      </footer>
    </div>
  );
}
