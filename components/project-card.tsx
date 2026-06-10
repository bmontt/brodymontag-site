"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.div
      className="relative flex flex-col gap-4 rounded-sm border border-[oklch(0.15_0_0)] bg-[oklch(0.11_0_0)] p-6 transition-colors duration-300"
      whileHover={{
        y: -4,
        borderColor: "oklch(0.85 0.08 100 / 0.3)",
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-mono text-sm text-white/90">{project.name}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {project.status === "wip" && (
            <span className="rounded-full border border-yellow-400/30 px-2 py-0.5 text-[10px] uppercase tracking-widest text-yellow-400/70">
              in progress
            </span>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 transition-colors hover:text-white"
              aria-label={`View ${project.name} on GitHub`}
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed text-gray-400/90">{project.description}</p>
    </motion.div>
  );
}
