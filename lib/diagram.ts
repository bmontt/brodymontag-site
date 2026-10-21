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
    // under a hundredth of a pixel, and halves the SVG (attribute values
    // only, so a label such as "v1.2345" keeps its text)
    .replace(/="([^"]*)"/g, (m, v: string) => `="${v.replace(/(\d+\.\d\d)\d+/g, "$1")}"`)
    .replace(/text\s*\{\s*font-family:[^}]*\}/, `#${id} text { font-family: var(--font-mono); }`)
    .replace(/^(\s*)svg\s*\{/m, `$1#${id} {`)
    .replace(/(\s)id="([^"]+)"/g, `$1id="${id}-$2"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${id}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${id}-$1"`)
    .replace(
      /<svg([^>]*?)\swidth="[\d.]+"\sheight="[\d.]+"([^>]*?)style="/,
      // never wider than drawn; on a phone, never so narrow that the labels
      // stop being readable: the figure's wrapper scrolls instead
      `<svg$1$2id="${id}" aria-hidden="true" focusable="false" style="width:100%;height:auto;max-width:${width}px;min-width:${Math.min(width, 460)}px;`,
    );
  if (svg.includes("__font__") || svg.includes("fonts.googleapis")) throw new Error(`diagram ${id}: SVG post-processing missed the font rule`);
  return { svg: wire(svg), width };
}

// ── motion hooks ──────────────────────────────────────────────────────────────
// The diagram builds itself as it comes into view, the way a signal moves
// through it (detail.css .diagram-block): each node and edge gets its depth in
// the graph (--d, its breadth-first step from a source), each solid edge a
// normalized length (pathLength="1") so a dash can draw it, and a twin "pulse" edge on
// top carries a short pearl glint along the same points while it is on
// screen. All of it is attributes and CSS: the page ships no diagram script.
function wire(svg: string): string {
  const edges = [...svg.matchAll(/<polyline class="edge" data-from="([^"]+)" data-to="([^"]+)"[^>]*points="([^"]+)"/g)].map((m) => ({ from: m[1], to: m[2], points: m[3] }));
  // depth: breadth-first from the sources (nodes with no incoming edge), so an
  // edge that loops back to an earlier node does not push that node deeper
  const nodes = [...new Set(edges.flatMap((e) => [e.from, e.to]))];
  const into = new Set(edges.map((e) => e.to));
  const depth = new Map<string, number>();
  let queue = nodes.filter((n) => !into.has(n));
  if (!queue.length && nodes.length) queue = [nodes[0]];
  for (const n of queue) depth.set(n, 0);
  while (queue.length) {
    const next: string[] = [];
    for (const n of queue)
      for (const e of edges)
        if (e.from === n && !depth.has(e.to)) {
          depth.set(e.to, depth.get(n)! + 1);
          next.push(e.to);
        }
    queue = next;
  }
  const max = Math.max(0, ...depth.values());
  const d = (n: string) => depth.get(n) ?? 0;

  svg = svg
    // a solid edge draws itself with a dash, so it gets a unit length; a
    // dotted one keeps its own dash pattern and fades in instead
    .replace(/<polyline class="edge" data-from="([^"]+)"([^>]*?)data-style="([^"]+)"/g, (m, from: string, mid: string, style: string) =>
      `<polyline${style === "solid" ? ' pathLength="1"' : ""} style="--d:${d(from)}" class="edge" data-from="${from}"${mid}data-style="${style}"`)
    .replace(/<g class="edge-label" data-from="([^"]+)"/g, (m, from: string) => `<g style="--d:${d(from)}" class="edge-label" data-from="${from}"`)
    .replace(/<g class="node" data-id="([^"]+)"/g, (m, n: string) => `<g style="--d:${d(n)}" class="node" data-id="${n}"`);
  const pulses = edges
    .map((e, k) => `<polyline class="edge-pulse" pathLength="1" style="--d:${d(e.from)};--k:${k}" points="${e.points}" fill="none" />`)
    .join("\n");
  const at = svg.search(/<g style="--d:\d+" class="(edge-label|node)"/);
  if (at > 0 && pulses) svg = `${svg.slice(0, at)}${pulses}\n${svg.slice(at)}`;
  return svg.replace(/style="width:100%;/, `style="--n:${max};width:100%;`);
}
