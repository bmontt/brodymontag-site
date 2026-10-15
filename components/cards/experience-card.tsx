// ── ExperienceCard ────────────────────────────────────────────────────────────
// A role as a widget: role, org (linked) and period, the one-line description,
// highlights as floating sub-widgets, tags along the foot.
import type { ExperienceEntry } from "@/lib/stack-data";
import { BrandIcon, SubWidgets, TagRow, Widget, WidgetHead } from "@/components/widgets";

export default function ExperienceCard({ entry }: { entry: ExperienceEntry }) {
  return (
    <Widget className="group">
      <WidgetHead
        icon={<BrandIcon src={entry.icon} size={entry.icon?.includes("fiserv") ? 14 : 20} />}
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
      <p className="copy-sm">{entry.description}</p>
      {entry.highlights && <SubWidgets items={entry.highlights} />}
      <TagRow tags={entry.tags} />
    </Widget>
  );
}
