// ── ReleaseCard — server card lifted from app/page.tsx (releases .map block) ──
import type { Release } from "@/lib/releases-data";

export default function ReleaseCard({ release }: { release: Release }) {
  return (
    <div>
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
  );
}
