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
export function WidgetHead({ title, right, meta }: { title: ReactNode; right?: ReactNode; meta?: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
        <h4 className="font-sans text-xl font-medium leading-tight tracking-[-0.02em] text-foreground md:text-2xl">{title}</h4>
        {right && <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-foreground/45">{right}</div>}
      </div>
      {meta && <p className="mt-1.5 font-mono text-xs text-foreground/45">{meta}</p>}
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
          className="subwidget px-3.5 py-2.5 font-sans text-[13px] leading-snug text-foreground/75"
          style={{ animationDelay: `${-((i * 1.9) % 7)}s`, marginTop: i % 2 === 1 ? 6 : 0 }}
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
        <span key={t} className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[11px] text-foreground/50">
          {t}
        </span>
      ))}
    </div>
  );
}
