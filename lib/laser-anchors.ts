// ── laser anchors ─────────────────────────────────────────────────────────────
// The laser figures live in the layout, not just behind it: a chapter marks the
// space its figure owns with an (empty) [data-laser-anchor="<id>"] element —
// usually a float the text wraps around (CSS shape-outside) — and the director
// places the figure inside that box every frame. Rects are read live (a
// handful of elements, read-only, once per frame) so pins, transforms and
// reflow are always honoured.

export interface AnchorRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const cache = new Map<string, HTMLElement | null>();

// The director asks for every page's anchors each frame; most aren't on the
// current page. A miss is remembered until the DOM's element tree changes
// (route, reveal), instead of a full-document query per frame per id.
let watching = false;
function watch() {
  if (watching || typeof MutationObserver === "undefined") return;
  watching = true;
  new MutationObserver(() => {
    for (const [id, el] of cache) if (el === null) cache.delete(id);
  }).observe(document.documentElement, { childList: true, subtree: true });
}

/** Viewport rect of an anchor, or null when absent / hidden (e.g. on phones). */
export function readAnchor(id: string): AnchorRect | null {
  if (typeof document === "undefined") return null;
  watch();
  let el = cache.get(id);
  if (el === null) return null; // known absent
  if (!el || !el.isConnected) {
    el = document.querySelector<HTMLElement>(`[data-laser-anchor="${id}"]`);
    cache.set(id, el);
    if (!el) return null;
  }
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}
