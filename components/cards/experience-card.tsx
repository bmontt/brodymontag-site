// ── ExperienceCard ────────────────────────────────────────────────────────────
// A role as a widget: role, org (linked) and period, the one-line description,
// its first two highlights as floating sub-widgets (the rest behind "+N more",
// a native <details>), tags along the foot. The whole card links to the role's
// page (/experience/<id>) through a stretched-link overlay, as ProjectCard
// does, and like it does not prefetch; the org link and "+N more" sit above
// the overlay.
import Link from "next/link";
import type { ExperienceEntry } from "@/lib/stack-data";
import { BrandIcon, SubWidgets, TagRow, Widget, WidgetHead } from "@/components/widgets";

/** highlights shown before "+N more" */
const SHOWN = 2;

export default function ExperienceCard({ entry }: { entry: ExperienceEntry }) {
  return (
    <Widget link>
      <Link href={`/experience/${entry.id}`} prefetch={false} aria-label={`${entry.role} at ${entry.org}`} className="absolute inset-0 z-0 rounded-[18px]" />
      <div className="pointer-events-none relative">
        <WidgetHead
          icon={<BrandIcon src={entry.icon} size={entry.icon?.includes("fiserv") ? 14 : 20} />}
          title={
            <>
              {entry.role}
              <span className="ml-2 text-base text-foreground/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100">→</span>
            </>
          }
          right={<span>{entry.period}</span>}
          meta={
            <>
              {entry.href ? (
                <a
                  href={entry.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto relative z-10 transition-colors hover:text-foreground/85"
                >
                  {entry.org} ↗
                </a>
              ) : (
                entry.org
              )}
              &nbsp;·&nbsp;{entry.orgDetail}
            </>
          }
        />
        <p className="copy-sm">{entry.description}</p>
        {entry.highlights && <SubWidgets items={entry.highlights.slice(0, SHOWN)} />}
        {entry.highlights && entry.highlights.length > SHOWN && (
          <details className="group/more pointer-events-auto relative z-10 mt-2">
            <summary className="w-fit cursor-pointer list-none font-mono text-2xs text-foreground/60 transition-colors hover:text-foreground/90 [&::-webkit-details-marker]:hidden">
              <span className="group-open/more:hidden">+{entry.highlights.length - SHOWN} more ↓</span>
              <span className="hidden group-open/more:inline">less ↑</span>
            </summary>
            <SubWidgets items={entry.highlights.slice(SHOWN)} />
          </details>
        )}
        <TagRow tags={entry.tags} />
      </div>
    </Widget>
  );
}
