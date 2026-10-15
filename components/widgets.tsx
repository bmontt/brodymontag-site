// ── widgets ───────────────────────────────────────────────────────────────────
// Panels for text-heavy content (projects, experience, stack, about), with the
// key points broken out as floating sub-widgets. Server components; the
// styling is in globals.css (.widget, .subwidget).

import type { ReactNode } from "react";
import { renderInline } from "@/components/rich-text";

export function Widget({ children, className = "", link = false }: { children: ReactNode; className?: string; link?: boolean }) {
  return <div className={`widget ${link ? "widget-link group" : ""} p-5 md:p-6 ${className}`}>{children}</div>;
}

/** a widget's title row: a name, then anything aligned to the right */
export function WidgetHead({ title, right, meta, icon }: { title: ReactNode; right?: ReactNode; meta?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
        <h4 className="flex items-center gap-2.5 font-sans text-xl font-medium leading-tight tracking-[-0.02em] text-foreground md:text-2xl">
          {icon}
          <span>{title}</span>
        </h4>
        {right && <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-foreground/60">{right}</div>}
      </div>
      {meta && <p className="mt-1.5 font-mono text-xs text-foreground/60">{meta}</p>}
    </div>
  );
}

/** the key points: small cards in a staggered grid, each drifting on its own beat */
export function SubWidgets({ items, cols = 2 }: { items: string[]; cols?: 2 | 3 }) {
  if (!items.length) return null;
  return (
    <ul className={`mt-4 grid gap-2.5 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {items.map((t, i) => (
        <li
          key={i}
          className={`subwidget px-3.5 py-2.5 copy-sm leading-snug ${i % 2 === 1 ? "sm:mt-1.5" : ""}`}
          style={{ animationDelay: `${-((i * 1.9) % 7)}s` }}
        >
          {renderInline(t)}
        </li>
      ))}
    </ul>
  );
}

/** tags as quiet pills along a widget's foot */
export function TagRow({ tags }: { tags: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span key={t} className="pill pointer-events-auto relative cursor-default rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-2xs text-foreground/65">
          {t}
        </span>
      ))}
    </div>
  );
}

/** figures as sub-widgets: a large number, its label, a quiet note */
export function StatWidgets({ stats, cols = 3 }: { stats: { label: string; value: string; note?: string }[]; cols?: 2 | 3 | 4 }) {
  if (!stats.length) return null;
  const grid = cols === 4 ? "grid-cols-2 sm:grid-cols-4" : cols === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2";
  return (
    <ul className={`mt-4 grid gap-2.5 ${grid}`}>
      {stats.map((s, i) => (
        <li
          key={s.label}
          className={`subwidget px-3.5 py-3 ${i % 2 === 1 ? "sm:mt-1.5" : ""}`}
          style={{ animationDelay: `${-((i * 1.9) % 7)}s` }}
        >
          <p className="font-sans text-xl font-medium leading-none tracking-[-0.02em] text-foreground tabular-nums md:text-2xl">{s.value}</p>
          <p className="mt-1.5 font-mono text-2xs text-foreground/70">{s.label}</p>
          {s.note && <p className="mt-0.5 font-sans text-xs leading-snug text-foreground/65">{s.note}</p>}
        </li>
      ))}
    </ul>
  );
}

/** a small brand or project mark beside a title: decorative (the title names it),
 *  always in full color (globals.css .brand-icon) */
export function BrandIcon({ src, size = 20, round = false }: { src?: string; size?: number; round?: boolean }) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`brand-icon inline-block shrink-0 align-[-0.15em] ${round ? "rounded-md" : ""}`}
      style={{ height: size, width: src.includes("fiserv") ? "auto" : size, objectFit: "contain" }}
    />
  );
}
