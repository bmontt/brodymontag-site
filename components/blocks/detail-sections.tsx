// ── detail sections ───────────────────────────────────────────────────────────
// Renders a DetailDoc (content/detail) below a page's card copy: one heading
// per section, then its blocks. Server components; the only client code is
// BlockMotion, which wraps them and starts each block's motion as it comes
// into view (the motion itself is CSS: ./detail.css, loaded with this file, so
// a project page and an experience page both get it).
// Every block reads complete without it.

import type { CSSProperties, ReactNode } from "react";
import "./detail.css";
import { renderInline } from "@/components/rich-text";
import { SECTION_HEADING, SECTION_SIZE } from "@/components/journey/section-bits";
import type { Block, DetailDoc } from "@/content/detail/types";
import BlockMotion from "./block-motion";
import CodeBlock from "./code-block";
import DiagramBlock from "./diagram-block";
import FigureBlock from "./figures";

const label = "font-mono text-xs text-foreground/60";
const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** text that resolves from glyphs when its block comes in (block-motion.tsx) */
function Decode({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span data-decode={text} data-decode-delay={delay}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" data-decode-shown="">
        {text}
      </span>
    </span>
  );
}

/** short figures decode; long text fades in with its row */
const decodable = (s: string) => s.length <= 26;

function Table({ b }: { b: Extract<Block, { type: "table" }> }) {
  return (
    <figure data-motion="" className="dblock dtable my-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          {b.caption && <caption className={`mb-2 text-left ${label}`}>{b.caption}</caption>}
          <thead>
            <tr className="dtable-head text-left">
              {b.columns.map((c) => (
                <th key={c} scope="col" className="py-2 pr-6 font-normal text-foreground/60">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r, i) => (
              <tr key={i} style={at(i)} className="border-b border-white/8 align-top">
                {r.map((c, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="py-2 pr-6 text-left font-normal text-foreground/85">{c}</th>
                  ) : (
                    <td key={j} className={`py-2 pr-6 text-foreground/80 ${decodable(c) ? "whitespace-nowrap" : ""}`}>
                      {decodable(c) && j > 1 ? <Decode text={c} delay={150 + i * 120 + j * 90} /> : c}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(b.method || b.asOf) && (
        <figcaption className={`dtable-foot mt-2 ${label}`}>
          {b.method && <>method: {b.method}</>}
          {b.method && b.asOf && " · "}
          {b.asOf && <>as of <time dateTime={b.asOf}>{b.asOf}</time></>}
        </figcaption>
      )}
    </figure>
  );
}

function Decision({ b, n }: { b: Extract<Block, { type: "decision" }>; n: number }) {
  return (
    <article data-motion="" className="dblock ddecision my-8">
      <p className={`ddecision-meta ${label}`} style={at(0)}>
        <span className="font-mono text-foreground/60">decision {String(n).padStart(2, "0")}</span>
        <span aria-hidden="true" className="mx-2 text-foreground/30">·</span>
        <span className={`dstamp dstamp-${b.status}`}>{b.status}</span>
        <span aria-hidden="true" className="mx-2 text-foreground/30">·</span>
        <time dateTime={b.date}>{b.date}</time>
      </p>
      <h3 className="ddecision-title copy mt-1.5 font-medium text-foreground/95" style={at(1)}>{b.title}</h3>
      <dl className="mt-3 grid gap-y-2 sm:grid-cols-[6.5rem_1fr] sm:gap-x-8">
        {(
          [
            ["context", b.context],
            ["decision", b.decision],
            ["cost", b.cost.join(" ")],
          ] as const
        ).map(([k, v], i) => (
          <div key={k} className="ddecision-row contents" style={at(i + 2)}>
            <dt className={`${label} pt-0.5`}>{k}</dt>
            <dd className="copy-sm">{v}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

/** "Done: the port (2026-08-19)" → a mark on the status track */
const STATUS_MARKS = [
  { re: /^done:\s*/i, kind: "done", word: "done" },
  { re: /^blocked:\s*/i, kind: "blocked", word: "blocked" },
  { re: /^next:\s*/i, kind: "next", word: "next" },
] as const;

function StatusTrack({ items, caption }: { items: string[]; caption?: string }) {
  return (
    <div data-motion="" className="dblock dstatus my-5">
      {caption && <p className={`mb-3 ${label}`}>{caption}</p>}
      <ol className="dstatus-track">
        {items.map((t, i) => {
          const m = STATUS_MARKS.find((s) => s.re.test(t));
          const body = m ? t.replace(m.re, "") : t;
          return (
            <li key={i} className={`dstatus-item dstatus-${m?.kind ?? "note"}`} style={at(i)}>
              <span aria-hidden="true" className="dstatus-mark" />
              {m && <span className={`dstatus-word ${label}`}>{m.word}</span>}
              <span className="copy-sm block">{renderInline(body)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function render(b: Block, n: { decision: number }): ReactNode {
  switch (b.type) {
    case "prose":
      return <p data-motion="" className="dprose copy my-4">{renderInline(b.text)}</p>;
    case "code":
      return <CodeBlock excerpt={b.excerpt} lang={b.lang} caption={b.caption} highlight={b.highlight} />;
    case "diagram":
      return <DiagramBlock id={b.id} mermaid={b.mermaid} alt={b.alt} caption={b.caption} />;
    case "figure":
      return <FigureBlock name={b.name} alt={b.alt} caption={b.caption} />;
    case "table":
      return <Table b={b} />;
    case "decision":
      return <Decision b={b} n={++n.decision} />;
    case "callout":
      if (b.kind === "status") return <StatusTrack items={b.items} caption={b.caption} />;
      return (
        <div data-motion="" className={`dblock dcallout dcallout-${b.kind} my-4`}>
          {b.caption && <p className={`mb-2 ${label}`}>{b.caption}</p>}
          <ul className="flex flex-col gap-1.5">
            {b.items.map((t, i) => (
              <li key={i} className="dcallout-item copy-sm flex gap-3" style={at(i)}>
                <span aria-hidden="true" className="dcallout-dash font-mono text-foreground/45">─</span>
                <span>{renderInline(t)}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "commits":
      return (
        <ol data-motion="" className="dblock dlinks my-4 flex flex-col gap-1 font-mono text-xs text-foreground/75">
          {b.items.map((c, i) => (
            <li key={c.sha} style={at(i)}>
              <time dateTime={c.date} className="text-foreground/60">{c.date}</time> {c.sha.slice(0, 7)} {c.subject}
            </li>
          ))}
        </ol>
      );
    case "links":
      return (
        <ul data-motion="" className="dblock dlinks my-4 flex flex-col gap-2">
          {b.items.map((l, i) => (
            <li key={l.href} style={at(i)}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="dlink font-mono text-sm text-foreground/80 hover:text-accent/85 transition-colors">
                <span>{l.label}</span>&nbsp;<span aria-hidden="true" className="dlink-arrow">↗</span>
              </a>
            </li>
          ))}
        </ul>
      );
  }
}

const slug = (h: string) => `sec-${h.replace(/\W+/g, "-")}`;

export default function DetailSections({ doc }: { doc: DetailDoc }) {
  const n = { decision: 0 };
  return (
    <BlockMotion className="detail-sections flex flex-col gap-12">
      {doc.sections.map((s) => (
        <section key={s.heading} aria-labelledby={slug(s.heading)}>
          <h2 id={slug(s.heading)} data-motion="" data-decode={s.heading} className={`dsec-head mb-4 ${SECTION_HEADING}`} style={{ fontSize: SECTION_SIZE.sm }}>
            <span className="sr-only">{s.heading}</span>
            <span aria-hidden="true" data-decode-shown="">
              {s.heading}
            </span>
          </h2>
          {s.blocks.map((b) => (
            <div key={b.id}>{render(b, n)}</div>
          ))}
        </section>
      ))}
    </BlockMotion>
  );
}
