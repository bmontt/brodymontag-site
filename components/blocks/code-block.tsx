// A pinned code excerpt: highlighted at build (lib/highlight.ts), numbered with
// the source's own line numbers, captioned with where it comes from. A public
// commit links to the exact lines; a private one says so instead.

import { getExcerpt } from "@/content/detail";
import { highlight } from "@/lib/highlight";

export default async function CodeBlock({ excerpt, lang, caption, highlight: marks }: { excerpt: string; lang: string; caption?: string; highlight?: number[] }) {
  const ex = getExcerpt(excerpt);
  const [first] = ex.source.lines;
  const html = await highlight(ex.code, lang, { firstLine: first, highlight: marks, label: `${ex.location}, code` });

  return (
    <figure className="dblock code-block my-6">
      <div className="block-frame overflow-hidden" style={{ ["--line-start" as string]: first - 1 }} dangerouslySetInnerHTML={{ __html: html }} />
      <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-mono text-xs text-foreground/60">
        {caption && <span>{caption}</span>}
        {ex.href ? (
          <a href={ex.href} target="_blank" rel="noopener noreferrer" className="hover:text-foreground/85 transition-colors">
            {ex.location} @ {ex.source.commit.slice(0, 7)}&nbsp;↗
          </a>
        ) : (
          <span>
            {ex.at} · {ex.location} · private repo
          </span>
        )}
      </figcaption>
    </figure>
  );
}
