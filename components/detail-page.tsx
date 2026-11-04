// ── DetailPage ────────────────────────────────────────────────────────────────
// The one template for a long-form page: a project (/projects/<slug>) or a
// role (/experience/<id>). Kind label, title and pill, metadata rows, the card
// copy, live figures where they exist, the key points, then the detail doc
// (content/detail) below a rule. Server component; the stage behind it is the
// persistent one in app/(site)/layout.tsx.

import type { ReactNode } from "react";
import { enterStyle } from "@/lib/enter";
import SiteNav from "@/components/nav";
import BackLink from "@/components/back-link";
import { AsciiRule, SECTION_HEADING, SECTION_SIZE } from "@/components/journey/section-bits";
import { StatWidgets, SubWidgets } from "@/components/widgets";
import DetailSections from "@/components/blocks/detail-sections";
import type { DetailDoc } from "@/content/detail/types";

export interface DetailPageProps {
  /** the label above the title: "project", "experience" */
  kind: string;
  title: string;
  /** the pill beside the title (a status word, a period); `moving` takes the accent */
  pill: { text: string; moving: boolean };
  /** label → value rows under the title */
  rows: { label: string; value: ReactNode }[];
  paragraphs: string[];
  stats?: { label: string; value: string; note?: string }[];
  statsAsOf?: string;
  /** the key points under their own heading ("highlights", "my part") */
  points?: { heading: string; items: string[] };
  detail?: DetailDoc;
  back?: string;
}

export default function DetailPage({ kind, title, pill, rows, paragraphs, stats, statsAsOf, points, detail, back = "/software" }: DetailPageProps) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* background: the persistent stage in app/(site)/layout.tsx */}
      <SiteNav />

      <main className="relative z-10 pt-32 px-6 md:px-12 pb-32">
        <div className="mx-auto max-w-3xl">
          <BackLink href={back} />

          {/* section header */}
          <p
            className={`enter mb-6 ${SECTION_HEADING} text-foreground/60`}
            style={{ ...enterStyle({ x: -12, dur: 0.6 }), fontSize: SECTION_SIZE.sm }}
          >
            {kind}
          </p>

          {/* headline row */}
          <div
            className="enter flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 mb-4"
            style={enterStyle({ y: 14, dur: 0.5, delay: 0.1 })}
          >
            <h1
              className="text-iridescent-stroke font-sans font-light text-foreground/90"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
            >
              {title}
            </h1>
            <span
              className={`font-mono text-xs px-2 py-0.5 border ${
                pill.moving ? "text-accent/75 border-accent/25" : "text-foreground/60 border-white/12"
              }`}
            >
              {pill.text}
            </span>
          </div>

          <AsciiRule className="text-foreground/28 mb-8" />

          {/* metadata */}
          <div
            className="enter flex flex-col gap-3 mb-10"
            style={enterStyle({ y: 10, dur: 0.45, delay: 0.25 })}
          >
            {rows.map((r) => (
              <div key={r.label} className="dmeta-row">
                <span>{r.label}</span>
                <span>{r.value}</span>
              </div>
            ))}
          </div>

          <AsciiRule className="text-foreground/28 mb-8" />

          {/* description */}
          <div
            className="enter flex flex-col gap-5 mb-12"
            style={enterStyle({ y: 10, dur: 0.5, delay: 0.35 })}
          >
            {paragraphs.map((para, i) => (
              <p
                key={i}
                className="copy"
              >
                {para}
              </p>
            ))}
          </div>

          <AsciiRule className="text-foreground/28 mb-8" />

          {/* live figures, where a page has them (a dated snapshot) */}
          {stats && (
            <div className="enter mb-14" style={enterStyle({ y: 10, dur: 0.5, delay: 0.4 })}>
              <h2 className={`mb-1 ${SECTION_HEADING}`} style={{ fontSize: SECTION_SIZE.sm }}>results</h2>
              {statsAsOf && <p className="font-mono text-xs text-foreground/55">as of {statsAsOf.toLowerCase()}</p>}
              <StatWidgets stats={stats} cols={4} />
            </div>
          )}

          {/* key points */}
          {points && points.items.length > 0 && (
            <div
              className="enter"
              style={enterStyle({ y: 10, dur: 0.5, delay: 0.45 })}
            >
              <h2 className={`mb-5 ${SECTION_HEADING}`} style={{ fontSize: SECTION_SIZE.sm }}>{points.heading}</h2>
              <SubWidgets items={points.items} />
            </div>
          )}

          {detail && (
            <>
              <AsciiRule className="text-foreground/28 mt-14 mb-10" />
              <DetailSections doc={detail} />
            </>
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <p className="font-mono text-xs text-foreground/42">© 2026 brody montag</p>
          <p className="font-mono text-xs text-foreground/42">brodymontag.com</p>
        </div>
      </footer>
    </div>
  );
}
