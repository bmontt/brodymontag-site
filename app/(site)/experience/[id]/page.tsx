// static: every role is prerendered at build (generateStaticParams). The same
// template as a project page (components/detail-page.tsx). Employer work shows
// public facts only: no code and no diagram of internal systems (docs/
// portfolio-style-plan.md §9).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { alternates } from "@/lib/canonical";
import DetailPage from "@/components/detail-page";
import { getDetail } from "@/content/detail";
import { experience } from "@/lib/stack-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return experience.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { alternates: alternates(`/experience/${id}`) };
}

export default async function ExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = experience.find((e) => e.id === id);

  if (!entry) notFound();

  // results, limits, what is not public and the sources, where a doc exists
  const detail = getDetail("experience", entry.id);

  return (
    <DetailPage
      kind="experience"
      title={entry.org}
      pill={{ text: entry.period, moving: /present/i.test(entry.period) }}
      rows={[
        { label: "role", value: entry.role },
        {
          label: "org",
          value: entry.href ? (
            <a href={entry.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent/80 transition-colors">
              {entry.org} · {entry.orgDetail}&nbsp;↗
            </a>
          ) : (
            `${entry.org} · ${entry.orgDetail}`
          ),
        },
        { label: "stack", value: entry.tags.join(" · ") },
        ...(detail ? [{ label: "checked", value: <time dateTime={detail.updated}>{detail.updated}</time> }] : []),
      ]}
      paragraphs={[entry.description]}
      points={entry.highlights && { heading: "my part", items: entry.highlights }}
      detail={detail}
    />
  );
}
