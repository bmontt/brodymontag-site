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

const cache = new Map<string, HTMLElement>();

/** Viewport rect of an anchor, or null when absent / hidden (e.g. on phones). */
export function readAnchor(id: string): AnchorRect | null {
  if (typeof document === "undefined") return null;
  let el = cache.get(id);
  if (!el || !el.isConnected) {
    el = document.querySelector<HTMLElement>(`[data-laser-anchor="${id}"]`) ?? undefined;
    if (!el) {
      cache.delete(id);
      return null;
    }
    cache.set(id, el);
  }
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}
