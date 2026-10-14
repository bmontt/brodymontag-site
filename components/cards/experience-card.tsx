// ── ExperienceCard ────────────────────────────────────────────────────────────
// A role as a widget: role, org (linked) and period, the one-line description,
// highlights as floating sub-widgets, tags along the foot.
import type { ExperienceEntry } from "@/lib/stack-data";
import { SubWidgets, TagRow, Widget, WidgetHead } from "@/components/widgets";

export default function ExperienceCard({ entry }: { entry: ExperienceEntry }) {
  return (
    <Widget>
      <WidgetHead
        title={entry.role}
        right={<span>{entry.period}</span>}
        meta={
          <>
            {entry.href ? (
              <a href={entry.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground/85">
                {entry.org} ↗
              </a>
            ) : (
              entry.org
            )}
            &nbsp;·&nbsp;{entry.orgDetail}
          </>
        }
      />
      <p className="font-sans text-sm leading-relaxed text-foreground/65">{entry.description}</p>
      {entry.highlights && <SubWidgets items={entry.highlights} />}
      <TagRow tags={entry.tags} />
    </Widget>
  );
}
