// ── diagram ───────────────────────────────────────────────────────────────────
// Mermaid source → inline SVG at build time (beautiful-mermaid: pure
// TypeScript, no browser, no client JS). The SVG sits inline, so it needs
// fixes first:
//   · its <style> asks Google Fonts for the font and its selectors (`svg`,
//     `text`) would reach every SVG on the page: dropped. The palette, the
//     derived colors and the font are in detail.css (.diagram-block svg), once
//     for every diagram
//   · its ids (`arrowhead`, node ids) would collide between two diagrams: prefixed
//   · its paint attributes, the same on every node, label and edge: dropped,
//     for the same rules in detail.css (PAINT below)
// The page sends the SVG twice on a direct visit (the markup, and the RSC
// payload inline in the page), so every attribute it does not need is a cost.

import "server-only";
import { createHash } from "node:crypto";
import { renderMermaidSVG } from "beautiful-mermaid";

// beautiful-mermaid's <style> as detail.css copies it (its derived colors).
// A new version that writes another one fails the build here: copy its rules
// to detail.css (.diagram-block svg), then put the new hash here.
const STYLE_SHA256 = "df956571c0fa3f3546027d8504b0f9ee0ead78a6b297c0900e02b858da1aee30";

// The paint that detail.css gives each kind of element (:where(), so it sits
// where the attributes did: under every other rule). Each element must carry
// exactly these values, and loses them; a diagram that styles a node or an
// edge of its own fails the build instead of losing its style.
const PAINT = {
  edge: { fill: "none", stroke: "var(--_line)", "stroke-width": "1" },
  labelBox: { fill: "var(--bg)", stroke: "var(--_inner-stroke)", "stroke-width": "1" },
  labelText: { "text-anchor": "middle", "font-size": "11", "font-weight": "400", fill: "var(--_text-sec)" },
  shape: { fill: "var(--_node-fill)", stroke: "var(--_node-stroke)", "stroke-width": "0.75" },
  nodeText: { "text-anchor": "middle", "font-size": "13", "font-weight": "500", fill: "var(--_text)" },
};

// the variables detail.css defines for a diagram, and the motion's own
const VARS = /^--(_[\w-]+|bg|fg|d|k|n)$/;

export interface Diagram {
  svg: string;
  /** natural width in px: the figure never scales past it */
  width: number;
}

export function diagramSvg(mermaid: string, id: string): Diagram {
  let svg = renderMermaidSVG(mermaid, { transparent: true, font: "__font__" });
  const width = Math.ceil(Number(svg.match(/<svg[^>]*\bwidth="([\d.]+)"/)?.[1] ?? 640));

  const style = svg.match(/<style>[\s\S]*?<\/style>\s*/)?.[0] ?? "";
  const sha = createHash("sha256").update(style).digest("hex");
  if (sha !== STYLE_SHA256) throw new Error(`diagram ${id}: beautiful-mermaid wrote another <style> (sha256 ${sha}); copy its rules to detail.css:\n${style}`);

  const paint = (tag: string, kind: keyof typeof PAINT) => {
    for (const [k, v] of Object.entries(PAINT[kind])) {
      const m = tag.match(new RegExp(`\\s${k}="([^"]*)"`));
      if (m?.[1] !== v) throw new Error(`diagram ${id}: a ${kind} has ${k}=${m?.[1] ?? "(none)"}; detail.css gives every ${kind} ${v}`);
      tag = tag.replace(m[0], "");
    }
    return tag;
  };
  const group = (cls: string, shape: keyof typeof PAINT, label: keyof typeof PAINT) => (g: string) =>
    g.replace(/<(\w+)\b[^>]*>/g, (tag, name: string) => {
      if (name === "g" || name === "tspan") return tag;
      if (name === "text") return paint(tag, label);
      if (["rect", "polygon", "circle"].includes(name)) return paint(tag, shape);
      throw new Error(`diagram ${id}: a <${name}> in a ${cls}: detail.css has no paint for it`);
    });

  svg = svg
    .replace(style, "")
    // the palette in its style attribute: detail.css has the site's own
    .replace(/(<svg[^>]*?) style="(--[\w-]+:[^;"]+;?)*"/, "$1")
    .replace(/<polyline class="edge"[^>]*>/g, (tag) => paint(tag, "edge"))
    .replace(/<g class="node"[\s\S]*?<\/g>/g, group("node", "shape", "nodeText"))
    .replace(/<g class="edge-label"[\s\S]*?<\/g>/g, group("edge-label", "labelBox", "labelText"))
    // the layout engine writes 12–17 significant digits: two decimals is
    // under a hundredth of a pixel, and halves the SVG (attribute values
    // only, so a label such as "v1.2345" keeps its text); trailing zeros go
    .replace(/="([^"]*)"/g, (m, v: string) => `="${v.replace(/\d+\.\d+/g, (n) => n.replace(/(\.\d\d)\d+$/, "$1").replace(/\.?0+$/, ""))}"`)
    .replace(/(\s)id="([^"]+)"/g, `$1id="${id}-$2"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${id}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${id}-$1"`)
    .replace(
      /<svg xmlns="[^"]*"([^>]*?)\swidth="[\d.]+"\sheight="[\d.]+"/,
      // never wider than drawn; on a phone, never so narrow that the labels
      // stop being readable: the figure's wrapper scrolls instead
      `<svg$1 id="${id}" aria-hidden="true" focusable="false" style="width:100%;height:auto;max-width:${width}px;min-width:${Math.min(width, 460)}px"`,
    );
  if (svg.includes("__font__") || svg.includes("fonts.googleapis")) throw new Error(`diagram ${id}: SVG post-processing missed the font rule`);
  svg = wire(svg)
    // read by wire() only: the page needs none of them (detail.css reads data-style)
    .replace(/\sdata-(from|to|label|id|shape|arrow-start|arrow-end)="[^"]*"/g, "")
    // whitespace between elements draws nothing
    .replace(/>\s+</g, "><")
    .replace(/\s+\/>/g, "/>");
  for (const [, v] of svg.matchAll(/var\((--[\w-]+)/g)) if (!VARS.test(v)) throw new Error(`diagram ${id}: uses ${v}, which detail.css does not define for a diagram`);
  return { svg, width };
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
  // its paint (fill: none) is in detail.css .edge-pulse
  const pulses = edges
    .map((e, k) => `<polyline class="edge-pulse" pathLength="1" style="--d:${d(e.from)};--k:${k}" points="${e.points}"/>`)
    .join("\n");
  const at = svg.search(/<g style="--d:\d+" class="(edge-label|node)"/);
  if (at > 0 && pulses) svg = `${svg.slice(0, at)}${pulses}\n${svg.slice(at)}`;
  return svg.replace(/style="width:100%;/, `style="--n:${max};width:100%;`);
}
