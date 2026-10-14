/// <reference lib="webworker" />
// ── laser-2d worker ───────────────────────────────────────────────────────────
// The 2D tier's painter, off the main thread: the page runs the director (it
// reads layout) and posts each frame's packed uniforms; this evaluates every
// cell and draws the glyphs on the OffscreenCanvas the page handed over.
// Messages: init (canvas + the glyph font's faces) → ready | nofont,
// resize, title (mask), frame → done, lit → lit.

import { makeLaserUniforms } from "@/lib/ascii-engine/gl/laser-shader";
import { unpackLaser } from "@/lib/ascii-engine/laser-pack";
import { createLaserPainter, type TitleMask } from "@/lib/ascii-engine/laser-paint";

declare const self: DedicatedWorkerGlobalScope;

const u = makeLaserUniforms();
let painter: ReturnType<typeof createLaserPainter> | null = null;
let title: TitleMask | null = null;

self.onmessage = async (e: MessageEvent) => {
  const m = e.data;
  switch (m.type) {
    case "init": {
      const ctx = (m.canvas as OffscreenCanvas).getContext("2d");
      if (!ctx) return self.postMessage({ type: "nofont" });
      // the glyph font, loaded here too — the same faces as the page's
      const fonts = (self as unknown as { fonts?: FontFaceSet }).fonts;
      if (!fonts || typeof FontFace === "undefined") return self.postMessage({ type: "nofont" });
      try {
        const faces = (m.faces as { family: string; src: string; descriptors: FontFaceDescriptors }[]).map(
          (f) => new FontFace(f.family, f.src, f.descriptors),
        );
        for (const f of faces) fonts.add(f);
        // load just the faces that cover the glyphs it draws — by unicode-range,
        // as the page does — not every subset file of the font
        await fonts.load(`16px ${m.family}`, m.glyphs);
      } catch {
        return self.postMessage({ type: "nofont" });
      }
      painter = createLaserPainter(ctx, { textRendering: m.textRendering });
      self.postMessage({ type: "ready" });
      return;
    }
    case "resize":
      painter?.resize(m.w, m.h, m.dpr, m.family);
      return;
    case "title":
      title = m.mask;
      return;
    case "frame":
      if (painter) {
        unpackLaser(m.buf, u);
        painter.paint(u, m.time, m.bright, m.titled ? title : null);
      }
      self.postMessage({ type: "done" });
      return;
    case "lit":
      self.postMessage({ type: "lit", n: painter ? painter.lit() : -1 });
      return;
  }
};
