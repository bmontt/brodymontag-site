// A mermaid diagram drawn to SVG at build (lib/diagram.ts). The figure is one
// image to a screen reader (its alt sentence); the mermaid source stays one
// click away, as text, for anyone who wants the exact graph.

import { diagramSvg } from "@/lib/diagram";

export default function DiagramBlock({ id, mermaid, alt, caption }: { id: string; mermaid: string; alt: string; caption?: string }) {
  const { svg } = diagramSvg(mermaid, `dg-${id}`);
  return (
    <figure className="dblock diagram-block my-6">
      <div role="img" aria-label={alt} className="block-frame overflow-x-auto px-4 py-5" dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption className="mt-2 font-mono text-xs text-foreground/60">
        {caption}
        <details className="mt-1.5">
          <summary className="cursor-pointer select-none hover:text-foreground/85 transition-colors">mermaid source</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed text-foreground/70">{mermaid.trim()}</pre>
        </details>
      </figcaption>
    </figure>
  );
}
