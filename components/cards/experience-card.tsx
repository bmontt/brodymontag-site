// ── ExperienceCard — server card lifted from app/page.tsx (experience .map block) ──
import type { ExperienceEntry } from "@/lib/stack-data";

export default function ExperienceCard({ entry }: { entry: ExperienceEntry }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-1.5">
        <span className="font-mono text-sm text-foreground/85">{entry.role}</span>
        <span className="font-mono text-xs text-foreground/40">{entry.period}</span>
      </div>
      <p className="font-mono text-xs text-foreground/45 mb-3">
        {entry.org}&nbsp;·&nbsp;{entry.orgDetail}
      </p>
      <p className="font-sans text-sm text-foreground/60 leading-relaxed pl-3 border-l border-white/10 mb-3">
        {entry.description}
      </p>
      <div className="flex flex-wrap gap-2 pl-3">
        {entry.tags.map((tag, i) => (
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
  );
}
