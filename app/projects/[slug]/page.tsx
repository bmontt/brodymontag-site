"use client";

import { notFound, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Nav from "@/components/nav";
import AsciiBg from "@/components/ascii-bg";
import BackLink from "@/components/back-link";
import { projects } from "@/lib/projects";

function AsciiRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`font-mono text-xs text-foreground/12 overflow-hidden whitespace-nowrap ${className}`}
    >
      {"─".repeat(300)}
    </div>
  );
}

export default function ProjectPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const project = projects.find((p) => p.slug === slug);

  if (!project) notFound();

  const paragraphs = project.longDescription.split("\n\n");

  return (
    <div className="relative min-h-screen bg-background">
      <AsciiBg subpage />
      <Nav />

      <main className="relative z-10 pt-32 px-6 md:px-12 pb-32">
        <div className="mx-auto max-w-3xl">
          <BackLink href="/#code" />

          {/* section header */}
          <motion.div
            className="mb-12 font-mono text-sm text-foreground/28 overflow-hidden whitespace-nowrap"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {`┌─ // project ${"─".repeat(120)}┐`}
          </motion.div>

          {/* headline row */}
          <motion.div
            className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 mb-4"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1
              className="font-sans font-light text-foreground/90"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
            >
              {project.name}
            </h1>
            <span
              className={`font-mono text-xs px-2 py-0.5 border ${
                project.status === "wip"
                  ? "text-accent/75 border-accent/25"
                  : "text-foreground/45 border-white/12"
              }`}
            >
              {project.status === "wip" ? "in progress" : "live"}
            </span>
          </motion.div>

          <AsciiRule className="mb-8" />

          {/* metadata */}
          <motion.div
            className="flex flex-col gap-3 mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
          >
            <div className="grid grid-cols-[6.5rem_1fr] gap-x-8">
              <span className="font-mono text-xs text-foreground/38">stack</span>
              <span className="font-mono text-xs text-foreground/70">
                {project.tags.map((t) => t.toLowerCase()).join(" · ")}
              </span>
            </div>
            {project.githubUrl && (
              <div className="grid grid-cols-[6.5rem_1fr] gap-x-8">
                <span className="font-mono text-xs text-foreground/38">source</span>
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-foreground/70 hover:text-accent/80 transition-colors"
                >
                  {project.githubUrl.replace("https://", "")}&nbsp;↗
                </a>
              </div>
            )}
          </motion.div>

          <AsciiRule className="mb-8" />

          {/* description */}
          <motion.div
            className="flex flex-col gap-5 mb-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            {paragraphs.map((para, i) => (
              <p
                key={i}
                className="font-sans text-base text-foreground/65 leading-relaxed"
              >
                {para}
              </p>
            ))}
          </motion.div>

          <AsciiRule className="mb-8" />

          {/* highlights */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <p className="font-mono text-xs text-foreground/35 mb-5">// highlights</p>
            <div className="flex flex-col gap-3">
              {project.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="font-mono text-xs text-foreground/28 mt-0.5 shrink-0">·</span>
                  <p className="font-sans text-sm text-foreground/62 leading-relaxed">{h}</p>
                </div>
              ))}
            </div>
          </motion.div>
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
