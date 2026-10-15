// ── section bits ──────────────────────────────────────────────────────────────
// Small server-rendered pieces shared by the section pages (software, music,
// about) and the site footer.

import { content } from "@/lib/content";

export type SupportedArtist = { name: string; logo?: string; w?: number; h?: number };

// logos are trimmed to their ink (no padding), then sized to equal visual area
// rather than equal height — a 7:1 wordmark and a 1.5:1 mark read as the same
// weight. 46px tall at 3:1; clamped so extremes stay legible.
export const logoHeight = (ratio: number) => Math.round(Math.min(72, Math.max(28, 46 * Math.sqrt(3 / ratio))));

export function AsciiRule({ className = "" }: { className?: string }) {
  return (
    <div className={`font-mono text-xs text-foreground/30 overflow-hidden whitespace-nowrap ${className}`}>
      {"─".repeat(300)}
    </div>
  );
}

// A subsection's heading: a smaller cut of the chapter headings (bold white
// Neue Haas, tight tracking). A transition point ([data-tp]): it slides in
// from the page's left edge and rests in line (journey-controller.tsx).
// "sm" for a heading inside a subsection (latest tracks, highlights).
export const SECTION_HEADING = "font-sans font-medium leading-[0.95] tracking-[-0.04em] text-foreground";
export const SECTION_SIZE = { md: "clamp(1.75rem, 3.6vw, 2.75rem)", sm: "clamp(1.2rem, 2.2vw, 1.6rem)" } as const;

export function SectionLabel({ children, size = "md" }: { children: React.ReactNode; size?: keyof typeof SECTION_SIZE }) {
  return (
    <h3 data-tp className={`tp-accent relative ${SECTION_HEADING} ${size === "md" ? "mb-6" : "mb-4"}`} style={{ fontSize: SECTION_SIZE[size] }}>
      {children}
    </h3>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-20 border-t border-white/5 px-6 py-8 md:px-12">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <p className="font-mono text-xs text-foreground/50">{content.meta.copyright}</p>
        <p className="font-mono text-xs text-foreground/50">{content.meta.domain}</p>
      </div>
    </footer>
  );
}
