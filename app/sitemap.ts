// ── sitemap.xml ───────────────────────────────────────────────────────────────
// Every indexable page on its canonical address (lib/canonical.ts): the landing
// page, the three sections, and each project, role and show — from the same data the
// routes are built from, so a new project or show is listed on the next build.
// lastModified is the build: a deploy is when the site changes.

import type { MetadataRoute } from "next";
import { content } from "@/lib/content";
import { projects } from "@/lib/projects";
import { experience } from "@/lib/stack-data";
import { events } from "@/lib/brody-events";

const ORIGIN = `https://${content.meta.domain}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${ORIGIN}${path}`,
    lastModified,
    priority,
  });
  return [
    page("", 1),
    page("/software", 0.8),
    page("/music", 0.8),
    page("/about", 0.8),
    ...projects.map((p) => page(`/projects/${p.slug}`, 0.5)),
    ...experience.map((e) => page(`/experience/${e.id}`, 0.5)),
    ...events.map((e) => page(`/shows/${e.slug}`, 0.5)),
  ];
}
