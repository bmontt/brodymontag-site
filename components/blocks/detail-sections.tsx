// ── detail sections ───────────────────────────────────────────────────────────
// Renders a DetailDoc (content/detail) below a page's card copy: one heading
// per section, then its blocks. Server components only; nothing here ships JS.

import type { ReactNode } from "react";
import { renderInline } from "@/components/rich-text";
import { SECTION_HEADING, SECTION_SIZE } from "@/components/journey/section-bits";
import type { Block, DetailDoc } from "@/content/detail/types";
import CodeBlock from "./code-block";
import DiagramBlock from "./diagram-block";

const label = "font-mono text-xs text-foreground/60";

function Table({ b }: { b: Extract<Block, { type: "table" }> }) {
  return (
    <figure className="dblock my-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          {b.caption && <caption className={`mb-2 text-left ${label}`}>{b.caption}</caption>}
          <thead>
            <tr className="border-b border-white/15 text-left">
              {b.columns.map((c) => (
                <th key={c} scope="col" className="py-2 pr-6 font-normal text-foreground/60">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r, i) => (
              <tr key={i} className="border-b border-white/8 align-top">
                {r.map((c, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="py-2 pr-6 text-left font-normal text-foreground/85">{c}</th>
                  ) : (
                    <td key={j} className="whitespace-nowrap py-2 pr-6 text-foreground/80">{c}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(b.method || b.asOf) && (
        <figcaption className={`mt-2 ${label}`}>
          {b.method && <>method: {b.method}</>}
          {b.method && b.asOf && " · "}
          {b.asOf && <>as of <time dateTime={b.asOf}>{b.asOf}</time></>}
        </figcaption>
      )}
    </figure>
  );
}

function Decision({ b }: { b: Extract<Block, { type: "decision" }> }) {
  return (
    <article className="dblock my-6 border-l border-white/20 pl-5">
      <h3 className="copy font-medium text-foreground/95">{b.title}</h3>
      <p className={`mt-1 ${label}`}>
        {b.status} · <time dateTime={b.date}>{b.date}</time>
      </p>
      <dl className="mt-3 grid gap-y-2 sm:grid-cols-[6.5rem_1fr] sm:gap-x-8">
        <dt className={`${label} pt-0.5`}>context</dt>
        <dd className="copy-sm">{b.context}</dd>
        <dt className={`${label} pt-0.5`}>decision</dt>
        <dd className="copy-sm">{b.decision}</dd>
        <dt className={`${label} pt-0.5`}>cost</dt>
        <dd className="copy-sm">{b.cost.join(" ")}</dd>
      </dl>
    </article>
  );
}

function render(b: Block): ReactNode {
  switch (b.type) {
    case "prose":
      return <p className="copy my-4">{renderInline(b.text)}</p>;
    case "code":
      return <CodeBlock excerpt={b.excerpt} lang={b.lang} caption={b.caption} highlight={b.highlight} />;
    case "diagram":
      return <DiagramBlock id={b.id} mermaid={b.mermaid} alt={b.alt} caption={b.caption} />;
    case "table":
      return <Table b={b} />;
    case "decision":
      return <Decision b={b} />;
    case "callout":
      return (
        <div className="dblock my-4">
          {b.caption && <p className={`mb-2 ${label}`}>{b.caption}</p>}
          <ul className="flex flex-col gap-1.5">
            {b.items.map((t, i) => (
              <li key={i} className="copy-sm flex gap-3">
                <span aria-hidden="true" className="font-mono text-foreground/45">─</span>
                <span>{renderInline(t)}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "commits":
      return (
        <ol className="dblock my-4 flex flex-col gap-1 font-mono text-xs text-foreground/75">
          {b.items.map((c) => (
            <li key={c.sha}>
              <time dateTime={c.date} className="text-foreground/60">{c.date}</time> {c.sha.slice(0, 7)} {c.subject}
            </li>
          ))}
        </ol>
      );
    case "links":
      return (
        <ul className="dblock my-4 flex flex-col gap-2">
          {b.items.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-foreground/80 hover:text-accent/85 transition-colors">
                {l.label}&nbsp;↗
              </a>
            </li>
          ))}
        </ul>
      );
  }
}

export default function DetailSections({ doc }: { doc: DetailDoc }) {
  return (
    <div className="flex flex-col gap-12">
      {doc.sections.map((s) => (
        <section key={s.heading} aria-labelledby={`sec-${s.heading.replace(/\W+/g, "-")}`}>
          <h2 id={`sec-${s.heading.replace(/\W+/g, "-")}`} className={`mb-4 ${SECTION_HEADING}`} style={{ fontSize: SECTION_SIZE.sm }}>
            {s.heading}
          </h2>
          {s.blocks.map((b) => (
            <div key={b.id}>{render(b)}</div>
          ))}
        </section>
      ))}
    </div>
  );
}
