// ── section bits ──────────────────────────────────────────────────────────────
// Small server-rendered pieces shared by the section pages (software, music,
// about) and the site footer.

import { content } from "@/lib/content";

export type SupportedArtist = { name: string; logo?: string; w?: number; h?: number };

// logos are trimmed to their ink (no padding), then sized to equal visual area
// rather than equal height — a 7:1 wordmark and a 1.5:1 mark read as the same
// weight. 30px tall at 3:1; clamped so extremes stay legible.
export const logoHeight = (ratio: number) => Math.round(Math.min(46, Math.max(18, 30 * Math.sqrt(3 / ratio))));

export function AsciiRule({ className = "" }: { className?: string }) {
  return (
    <div className={`font-mono text-xs text-foreground/15 overflow-hidden whitespace-nowrap ${className}`}>
      {"─".repeat(300)}
    </div>
  );
}

// a transition point ([data-tp]): a shimmer draws out of it as it comes into
// view, and it drifts on its own plane (journey-controller.tsx)
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p data-scramble data-tp className="tp-line font-mono text-xs text-foreground/45 mb-4">{`// ${children}`}</p>;
}

export function SiteFooter() {
  return (
    <footer className="relative z-20 border-t border-white/5 px-6 py-8 md:px-12">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <p className="font-mono text-xs text-foreground/35">{content.meta.copyright}</p>
        <p className="font-mono text-xs text-foreground/35">{content.meta.domain}</p>
      </div>
    </footer>
  );
}
