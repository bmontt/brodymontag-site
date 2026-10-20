// ── diagram ───────────────────────────────────────────────────────────────────
// Mermaid source → inline SVG at build time (beautiful-mermaid: pure
// TypeScript, no browser, no client JS). The SVG takes its colors from the
// page's tokens, so it needs three fixes before it can sit inline:
//   · its <style> asks Google Fonts for the font: dropped (the page has Geist Mono)
//   · its selectors (`svg`, `text`) would reach every SVG on the page: scoped to its id
//   · its ids (`arrowhead`, node ids) would collide between two diagrams: prefixed

import "server-only";
import { renderMermaidSVG } from "beautiful-mermaid";

// every derived color named here, so the site's own --muted / --border /
// --accent (other meanings) never leak into the diagram through var() fallbacks
const mix = (pct: number) => `color-mix(in srgb, var(--foreground) ${pct}%, var(--background))`;
const COLORS = {
  bg: "var(--background)",
  fg: "var(--foreground)",
  line: mix(50),
  accent: mix(85),
  muted: mix(72), // edge labels and group titles: stays above 4.5:1
  surface: mix(4),
  border: mix(28),
  transparent: true,
};

export interface Diagram {
  svg: string;
  /** natural width in px: the figure never scales past it */
  width: number;
}

export function diagramSvg(mermaid: string, id: string): Diagram {
  let svg = renderMermaidSVG(mermaid, { ...COLORS, font: "__font__" });
  const width = Math.ceil(Number(svg.match(/<svg[^>]*\bwidth="([\d.]+)"/)?.[1] ?? 640));

  svg = svg
    .replace(/^\s*@import url\([^)]*\);\s*$/m, "")
    // the layout engine writes 12–17 significant digits: two decimals is
    // under a hundredth of a pixel, and halves the SVG
    .replace(/(\d+\.\d\d)\d+/g, "$1")
    .replace(/text\s*\{\s*font-family:[^}]*\}/, `#${id} text { font-family: var(--font-mono); }`)
    .replace(/^(\s*)svg\s*\{/m, `$1#${id} {`)
    .replace(/(\s)id="([^"]+)"/g, `$1id="${id}-$2"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${id}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${id}-$1"`)
    .replace(
      /<svg([^>]*?)\swidth="[\d.]+"\sheight="[\d.]+"([^>]*?)style="/,
      `<svg$1$2id="${id}" aria-hidden="true" focusable="false" style="width:100%;height:auto;max-width:${width}px;`,
    );
  if (svg.includes("__font__") || svg.includes("fonts.googleapis")) throw new Error(`diagram ${id}: SVG post-processing missed the font rule`);
  return { svg, width };
}
